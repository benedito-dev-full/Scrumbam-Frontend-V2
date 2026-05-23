import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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
 * Storage que usa sessionStorage no cliente e um no-op no servidor.
 * Necessário porque o store usa skipHydration — o cliente hidrata
 * manualmente via useEffect no providers.tsx.
 */
const storage = createJSONStorage(() => {
  if (typeof window !== "undefined") {
    return sessionStorage;
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
 * Persiste tokens em sessionStorage (tab-scoped) e mantém um cookie
 * `scrumbam_auth=1` para leitura pelo proxy do Next.js 16 (proteção de rotas).
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
       * Salva os tokens no store e seta o cookie de sessão.
       * O cookie é lido pelo proxy.ts para proteção de rotas no SSR.
       */
      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
        // Guard SSR: document só existe no cliente
        if (typeof document !== "undefined") {
          const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
          document.cookie = `scrumbam_auth=1; path=/; SameSite=Lax${secure}`;
        }
      },

      /**
       * Salva os dados do usuário autenticado no store.
       */
      setUser: (user) => set({ user }),

      /**
       * Limpa toda a sessão — tokens, usuário — e remove o cookie.
       * Chamado no logout e quando o refresh token expira.
       */
      clearSession: () => {
        set({ accessToken: null, refreshToken: null, user: null });
        // Guard SSR: document só existe no cliente
        if (typeof document !== "undefined") {
          document.cookie =
            "scrumbam_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
      },

      /**
       * Controla estado de loading durante operações de auth (login, refresh).
       */
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: "scrumbam-auth",
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
export const useIsAuthenticated = () =>
  useAuthStore((s) => !!s.accessToken);
