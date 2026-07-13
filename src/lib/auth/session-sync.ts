/**
 * Sincronização de sessão ENTRE ABAS (F2 — item 2.4).
 *
 * Problema: a sessão vive no `localStorage` (escopo NAVEGADOR), mas o estado
 * Zustand vive em memória (escopo ABA). Sem sincronização:
 *
 *   - a aba A rotaciona o refresh token → a aba B continua com o par ANTIGO em
 *     memória → a aba B tenta refresh com um token já rotacionado;
 *   - a aba A faz logout → a aba B continua "logada" com tokens já revogados.
 *
 * Solução: um `BroadcastChannel` publica (a) o novo par de tokens e (b) o
 * logout para todas as abas do mesmo navegador. Onde `BroadcastChannel` não
 * existe (Safari antigo, WebViews), caímos no evento `storage` — que o próprio
 * `localStorage` dispara nas OUTRAS abas quando a chave muda.
 *
 * NOTA: isto é defesa em profundidade, não a defesa primária. O backend já é
 * idempotente no refresh (ADR-V2-062: grace window de 60 s + mesma resposta
 * para requests concorrentes). Mesmo que a propagação falhe, ninguém é
 * deslogado — a corrida degrada para "dois refreshes benignos".
 */

import { AUTH_STORAGE_KEY } from "@/lib/auth/storage-keys";

/** Nome do canal — um por origin, compartilhado por todas as abas. */
const CHANNEL_NAME = "scrumbam-auth-sync";

type AuthSyncMessage =
  | { type: "tokens"; accessToken: string; refreshToken: string }
  | { type: "logout" };

let channel: BroadcastChannel | null = null;
let initialized = false;

/**
 * Guarda de eco: quando estamos APLICANDO uma mensagem recebida de outra aba,
 * o store chama `setTokens`/`clearSession`, que por sua vez chamariam
 * `publish*` — e a mensagem voltaria a circular. Este flag corta o loop.
 */
let applyingRemote = false;

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;
  if (typeof BroadcastChannel === "undefined") return null;
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

/** Publica o novo par de tokens para as demais abas. No-op em SSR/fallback. */
export function publishTokens(accessToken: string, refreshToken: string): void {
  if (applyingRemote) return;
  getChannel()?.postMessage({
    type: "tokens",
    accessToken,
    refreshToken,
  } satisfies AuthSyncMessage);
}

/** Publica o logout para as demais abas (requisito ASVS de terminação global). */
export function publishLogout(): void {
  if (applyingRemote) return;
  getChannel()?.postMessage({ type: "logout" } satisfies AuthSyncMessage);
}

async function applyRemote(msg: AuthSyncMessage): Promise<void> {
  const { useAuthStore } = await import("@/lib/stores/auth");
  applyingRemote = true;
  try {
    if (msg.type === "tokens") {
      useAuthStore.getState().setTokens(msg.accessToken, msg.refreshToken);
      return;
    }
    // logout em qualquer aba desloga TODAS as abas.
    useAuthStore.getState().clearSession();
    if (
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login")
    ) {
      window.location.href = "/login";
    }
  } finally {
    applyingRemote = false;
  }
}

/**
 * Liga a sincronização entre abas. Idempotente — pode ser chamado em todo
 * mount do `Providers` (o React StrictMode monta duas vezes em dev).
 *
 * @example
 * useEffect(() => { initSessionSync(); }, []);
 */
export function initSessionSync(): void {
  if (typeof window === "undefined" || initialized) return;
  initialized = true;

  const ch = getChannel();
  if (ch) {
    ch.onmessage = (event: MessageEvent<AuthSyncMessage>) => {
      void applyRemote(event.data);
    };
    return;
  }

  // ─── Fallback sem BroadcastChannel ──────────────────────────────────────
  // O evento `storage` dispara nas OUTRAS abas quando a chave persistida muda.
  // Cobre exatamente os dois casos: rotação de tokens e logout.
  window.addEventListener("storage", (event) => {
    if (event.key !== AUTH_STORAGE_KEY) return;
    void (async () => {
      const { useAuthStore } = await import("@/lib/stores/auth");
      applyingRemote = true;
      try {
        await Promise.resolve(useAuthStore.persist.rehydrate());
        const { accessToken } = useAuthStore.getState();
        if (
          !accessToken &&
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/login")
        ) {
          window.location.href = "/login";
        }
      } finally {
        applyingRemote = false;
      }
    })();
  });
}
