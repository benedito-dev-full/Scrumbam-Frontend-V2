/**
 * Refresh de sessão — ponto ÚNICO de rotação de token no frontend (F2, itens
 * 2.3 e 2.4).
 *
 * Três consumidores compartilham esta função:
 *   1. o interceptor de 401 (`lib/api.ts`);
 *   2. o bootstrap defensivo do boot (`app/providers.tsx`);
 *   3. (futuro) qualquer fluxo que precise revalidar a sessão.
 *
 * Serialização em DOIS níveis:
 *   - **por aba**: `inFlight` (uma única promise por aba);
 *   - **por navegador**: **Web Locks API** (`navigator.locks.request`). Sem
 *     isso, N abas disparam N refreshes com o MESMO refresh token — que é
 *     exatamente a corrida que o backend interpretava como replay e punia com
 *     revoke da sessão inteira (sintoma B1 do incidente).
 *
 * Onde `navigator.locks` não existe (Safari < 15.4, WebViews antigas), o lock
 * degrada para no-op: continua valendo a serialização por aba, e o backend
 * cobre o resto (ADR-V2-062 — grace window de 60 s + idempotência: dois
 * refreshes concorrentes com o mesmo token recebem a MESMA resposta e a sessão
 * NÃO é revogada). Ou seja: a ausência de Web Locks degrada a performance
 * (um request extra), nunca a correção.
 */

import axios from "axios";

/** Nome do lock — escopo origin, compartilhado por todas as abas. */
const REFRESH_LOCK = "scrumbam-auth-refresh";

/** Promise em voo NESTA aba (evita N refreshes simultâneos no mesmo tab). */
let inFlight: Promise<string | null> | null = null;

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

type LockGrantedCallback<T> = () => Promise<T>;
interface LockManagerLike {
  request<T>(name: string, cb: LockGrantedCallback<T>): Promise<T>;
}

/**
 * Executa `fn` sob o lock global do navegador quando a Web Locks API existe.
 * Fallback gracioso: executa direto (a serialização por aba continua valendo).
 */
async function withBrowserLock<T>(fn: LockGrantedCallback<T>): Promise<T> {
  if (typeof navigator === "undefined") return fn();
  const locks = (navigator as Navigator & { locks?: LockManagerLike }).locks;
  if (!locks || typeof locks.request !== "function") return fn();
  return locks.request(REFRESH_LOCK, fn);
}

async function doRefresh(): Promise<string | null> {
  const { useAuthStore } = await import("@/lib/stores/auth");

  // Token conhecido ANTES de entrar na fila do lock.
  const tokenBeforeLock = useAuthStore.getState().refreshToken;

  return withBrowserLock(async () => {
    const state = useAuthStore.getState();

    // Enquanto esperávamos o lock, OUTRA aba pode ter rotacionado e propagado
    // o novo par via BroadcastChannel. Nesse caso não há nada a fazer: já
    // temos um access token novo em mãos.
    if (
      state.refreshToken &&
      tokenBeforeLock &&
      state.refreshToken !== tokenBeforeLock &&
      state.accessToken
    ) {
      return state.accessToken;
    }

    // GUARD (2.3a): sem refresh token, NÃO chamamos o endpoint. Antes, o
    // interceptor mandava `{ refreshToken: undefined }`, o backend respondia
    // 401 e o próprio frontend se auto-deslogava — inclusive na aba nova, onde
    // o storage estava vazio por definição.
    if (!state.refreshToken) return null;

    // Instância crua (sem os interceptors) — senão o 401 do refresh
    // reentraria no interceptor de refresh.
    const { api } = await import("@/lib/api");
    const baseURL = api.defaults.baseURL ?? "";

    const { data } = await axios.post<RefreshResponse>(
      `${baseURL}/auth/refresh`,
      { refreshToken: state.refreshToken },
      { headers: { "Content-Type": "application/json" } },
    );

    // `setTokens` persiste no localStorage E publica o novo par para as
    // demais abas (BroadcastChannel).
    useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  });
}

/**
 * Rotaciona a sessão e devolve o novo access token.
 *
 * @returns novo access token, ou `null` quando não há refresh token para usar
 *          (sessão vazia — o chamador deve deslogar).
 * @throws  o erro HTTP do `POST /auth/refresh` quando o backend recusa
 *          (401 TOKEN_INVALID / TOKEN_EXPIRED / SESSION_REVOKED ...).
 *
 * @example
 * const token = await performRefresh();
 * if (!token) { clearSession(); redirect('/login'); }
 */
export function performRefresh(): Promise<string | null> {
  if (inFlight) return inFlight;
  inFlight = doRefresh().finally(() => {
    inFlight = null;
  });
  return inFlight;
}
