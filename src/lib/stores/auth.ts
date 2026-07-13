import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AUTH_STORAGE_KEY } from "@/lib/auth/storage-keys";
import { publishLogout, publishTokens } from "@/lib/auth/session-sync";
import type { UserDto } from "@/lib/types/api";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserDto | null;
  isLoading: boolean;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: UserDto) => void;
  clearSession: () => void;
  setLoading: (loading: boolean) => void;
}

// ─── Storage SSR-safe ─────────────────────────────────────────────────────────

/**
 * Migração ONE-SHOT `sessionStorage` → `localStorage` (F2, item 2.1).
 *
 * REQUISITO DO DEPLOY: **ninguém pode ser deslogado pela mudança de storage**.
 * Quem estiver com o app aberto no momento do deploy tem a sessão apenas no
 * `sessionStorage` da aba. No primeiro boot com o código novo, copiamos a chave
 * para o `localStorage` ANTES de qualquer leitura do `persist` — a sessão
 * sobrevive intacta. Quem recarregar em uma aba nova (sem `sessionStorage`) cai
 * no bootstrap defensivo do `providers.tsx`: refresh silencioso, não logout.
 *
 * É one-shot por construção: só copia quando o `localStorage` está VAZIO para a
 * chave. Uma sessão mais nova no `localStorage` nunca é sobrescrita por um
 * resíduo de `sessionStorage`.
 */
function migrateSessionToLocalStorage(): void {
  try {
    if (localStorage.getItem(AUTH_STORAGE_KEY) !== null) return;
    const legacy = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (legacy === null) return;
    localStorage.setItem(AUTH_STORAGE_KEY, legacy);
  } catch {
    // Storage indisponível (modo privado exótico / quota) — degrada em
    // silêncio. O bootstrap defensivo cobre o caso.
  }
}

/**
 * Storage que usa `localStorage` no cliente e um no-op no servidor.
 *
 * POR QUE `localStorage` E NÃO `sessionStorage`:
 * o gate de rota é o cookie `scrumbam_auth` (escopo NAVEGADOR) enquanto os
 * tokens ficavam em `sessionStorage` (escopo ABA). Em uma aba nova o cookie
 * existia e o token não → o proxy autorizava a entrada, nenhuma query disparava
 * (`enabled: !!accessToken`), nenhum 401 acontecia, nenhum logout ocorria: o
 * "estado zumbi" (avatar `?`, zero projeto, para sempre).
 *
 * BASE NORMATIVA (draft-ietf-oauth-browser-based-apps, o BCP de SPAs):
 * `sessionStorage` e `localStorage` têm **exatamente a mesma** exposição a XSS
 * — ambos são same-origin e legíveis por JS; um XSS que lê um lê o outro. A
 * troca **não é regressão de segurança**, é correção de ESCOPO (aba →
 * navegador), que é precisamente onde estava o bug. O alvo arquitetural
 * (cookie httpOnly via BFF, onde o token nunca toca o JS) é a Fase 5 do plano;
 * o BCP recomenda o BFF, não `sessionStorage`.
 *
 * Necessário porque o store usa `skipHydration` — o cliente hidrata
 * manualmente via useEffect no `providers.tsx`.
 */
const storage = createJSONStorage(() => {
  if (typeof window !== "undefined") {
    migrateSessionToLocalStorage();
    return localStorage;
  }
  // No-op SSR-safe
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
});

// ─── Store ────────────────────────────────────────────────────────────────────

/**
 * Store de autenticação global.
 *
 * Persiste tokens em `localStorage` (escopo NAVEGADOR — sobrevive a aba nova) e
 * mantém um cookie `scrumbam_auth=1` para leitura pelo proxy do Next.js 16
 * (proteção de rotas). Storage e cookie passam a ter o MESMO escopo — era a
 * divergência entre eles que produzia o estado zumbi.
 *
 * @example
 * const token = useAuthStore((s) => s.accessToken);
 * const { setTokens, clearSession } = useAuthStore.getState();
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isLoading: false,

      /**
       * Salva os tokens no store, seta o cookie de sessão e propaga o novo par
       * para as demais abas do navegador (BroadcastChannel).
       * O cookie é lido pelo proxy.ts para proteção de rotas no SSR.
       */
      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
        // Guard SSR: document só existe no cliente
        if (typeof document !== "undefined") {
          const secure =
            process.env.NODE_ENV === "production" ? "; Secure" : "";
          document.cookie = `scrumbam_auth=1; path=/; SameSite=Lax${secure}`;
        }
        publishTokens(accessToken, refreshToken);
      },

      /**
       * Salva os dados do usuário autenticado no store.
       */
      setUser: (user) => set({ user }),

      /**
       * Limpa toda a sessão — tokens, usuário — remove o cookie, apaga o
       * resíduo legado de `sessionStorage` e desloga as demais abas.
       * Chamado no logout e quando o refresh token expira/é revogado.
       */
      clearSession: () => {
        set({ accessToken: null, refreshToken: null, user: null });
        // Guard SSR: document só existe no cliente
        if (typeof document !== "undefined") {
          document.cookie =
            "scrumbam_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
        // O `persist` limpa o localStorage; o sessionStorage é resíduo da
        // migração e precisa morrer junto — senão um boot futuro poderia
        // "ressuscitar" a sessão que acabamos de encerrar.
        try {
          sessionStorage.removeItem(AUTH_STORAGE_KEY);
        } catch {
          // storage indisponível — nada a limpar.
        }
        publishLogout();
      },

      /**
       * Controla estado de loading durante operações de auth (login, refresh).
       */
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage,
      // Cliente hidrata manualmente via useEffect no providers.tsx.
      // Sem skipHydration, o store teria valores stale no primeiro render
      // (hydration mismatch entre server e client).
      skipHydration: true,
    },
  ),
);

// ─── Selectors ────────────────────────────────────────────────────────────────

/**
 * Selector derivado — retorna true se o usuário tem accessToken.
 *
 * @example
 * const isAuthenticated = useIsAuthenticated();
 */
export const useIsAuthenticated = () => useAuthStore((s) => !!s.accessToken);
