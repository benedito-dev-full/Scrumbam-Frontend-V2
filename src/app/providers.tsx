"use client";

import { useState, useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/lib/stores/auth";
import { hasAuthCookie, reportAuthZombie } from "@/lib/telemetry";
import { PreferencesSync } from "@/components/shell/preferences-sync";

export function Providers({ children }: { children: React.ReactNode }) {
  // Hidrata o store manualmente — necessário porque persist usa skipHydration: true.
  // Sem isso, o store inicia vazio mesmo que haja dados salvos no sessionStorage.
  useEffect(() => {
    void Promise.resolve(useAuthStore.persist.rehydrate()).then(() => {
      // F0 — BEACON DE ESTADO ZUMBI (não muda nenhum comportamento).
      //
      // Zumbi = cookie `scrumbam_auth=1` presente (escopo NAVEGADOR) MAS
      // `accessToken` ausente após a reidratação (escopo ABA). É o sintoma A:
      // o app se julga logado, mas nenhuma query dispara (`enabled: !!accessToken`),
      // logo nenhum 401 acontece e nenhum logout ocorre — o usuário fica preso
      // num app vazio, e o backend NUNCA fica sabendo. Aqui apenas CONTAMOS.
      //
      // A correção (localStorage + refresh silencioso no boot) é a FASE 2.
      // Depois dela, `frontend.auth_zombie` deve ir a ZERO.
      const { accessToken, refreshToken } = useAuthStore.getState();
      if (!accessToken && hasAuthCookie()) {
        reportAuthZombie(!!refreshToken);
      }
    });
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
