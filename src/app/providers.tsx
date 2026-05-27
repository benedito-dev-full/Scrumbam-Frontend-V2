"use client";

import { useState, useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/lib/stores/auth";
import { PreferencesSync } from "@/components/shell/preferences-sync";

export function Providers({ children }: { children: React.ReactNode }) {
  // Hidrata o store manualmente — necessário porque persist usa skipHydration: true.
  // Sem isso, o store inicia vazio mesmo que haja dados salvos no sessionStorage.
  useEffect(() => {
    useAuthStore.persist.rehydrate();
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
