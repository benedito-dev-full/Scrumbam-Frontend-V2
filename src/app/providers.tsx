"use client";

import { useState, useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/lib/stores/auth";
import { performRefresh } from "@/lib/auth/refresh";
import { initSessionSync } from "@/lib/auth/session-sync";
import { hasAuthCookie, reportAuthZombie } from "@/lib/telemetry";
import { PreferencesSync } from "@/components/shell/preferences-sync";

/**
 * BOOTSTRAP DEFENSIVO DE SESSÃO (F2 — item 2.2).
 *
 * Invariante que este código impõe: **nunca mais pode existir estado zumbi.**
 * Zumbi = cookie `scrumbam_auth=1` presente (escopo NAVEGADOR, é o que o
 * `proxy.ts` usa para liberar a rota) MAS `accessToken` ausente. Nesse estado,
 * toda query tem gate `enabled: !!accessToken` → nenhum request sai → nenhum
 * 401 → nenhum logout: o app fica DENTRO, VAZIO, para sempre.
 *
 * A migração para `localStorage` (2.1) elimina a causa. Este bootstrap é o
 * CINTO: mesmo que o storage falhe, esteja corrompido, seja limpo por
 * extensão/quota ou que a migração one-shot não rode, aqui o estado zumbi é
 * resolvido em uma de duas direções — **jamais permanece**:
 *
 *   tem refresh token → refresh silencioso → sessão restaurada (sem logout)
 *   não tem / falhou  → clearSession() + /login (logout honesto, não zumbi)
 *
 * O beacon da F0 (`reportAuthZombie`) continua sendo emitido ANTES da
 * recuperação — é ele que prova, no dashboard, que o contador foi a zero.
 */
async function bootstrapSession(): Promise<void> {
  await Promise.resolve(useAuthStore.persist.rehydrate());

  const { accessToken, refreshToken } = useAuthStore.getState();
  if (accessToken || !hasAuthCookie()) return;

  // F0 — mede o zumbi (o `hadRefreshToken` separa o recuperável do puro).
  reportAuthZombie(!!refreshToken);

  try {
    const token = await performRefresh();
    if (token) return; // sessão restaurada silenciosamente
  } catch {
    // 401/erro de rede no refresh — cai no logout honesto abaixo.
  }

  useAuthStore.getState().clearSession();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Hidrata o store manualmente — necessário porque persist usa skipHydration: true.
  // Sem isso, o store inicia vazio mesmo que haja dados salvos no localStorage.
  useEffect(() => {
    initSessionSync(); // propaga tokens e logout entre abas (2.4)
    void bootstrapSession();
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      storageKey="scrumbam-theme"
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delay={250}>
          <PreferencesSync>{children}</PreferencesSync>
        </TooltipProvider>
        <Toaster richColors closeButton position="bottom-right" />
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
