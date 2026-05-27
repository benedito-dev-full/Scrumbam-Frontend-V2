"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useUserPreferences } from "@/hooks/use-user-preferences";

/**
 * Sincroniza `appearance.theme` e `appearance.density` carregados do
 * backend (`GET /auth/me`) com o DOM e o next-themes.
 *
 * - `theme`: ao primeiro carregamento, se diferir do `next-themes` atual,
 *   aplica o tema do servidor (uma única vez por sessão — depois respeita
 *   alterações locais do usuário).
 * - `density`: aplica `<html data-density="...">` para os tokens CSS
 *   em globals.css entrarem em vigor.
 *
 * Renderizado dentro do Providers, após o QueryClientProvider e o
 * ThemeProvider — depende de ambos.
 */
export function PreferencesSync({ children }: { children: React.ReactNode }) {
  const { preferences, isLoading } = useUserPreferences();
  const { theme, setTheme } = useTheme();
  const themeSyncedRef = useRef(false);

  // Density → <html data-density="...">
  useEffect(() => {
    if (isLoading) return;
    if (typeof document === "undefined") return;
    const density = preferences.appearance.density ?? "normal";
    if (density === "normal") {
      document.documentElement.removeAttribute("data-density");
    } else {
      document.documentElement.setAttribute("data-density", density);
    }
  }, [isLoading, preferences.appearance.density]);

  // Theme do server → next-themes (apenas uma vez por sessão).
  // V2 hoje só usa "light"/"dark" (enableSystem={false}); se backend
  // mandar "system" caímos para o default do ThemeProvider.
  useEffect(() => {
    if (isLoading || themeSyncedRef.current) return;
    const serverTheme = preferences.appearance.theme;
    if (serverTheme && serverTheme !== "system" && serverTheme !== theme) {
      setTheme(serverTheme);
    }
    themeSyncedRef.current = true;
  }, [isLoading, preferences.appearance.theme, theme, setTheme]);

  return <>{children}</>;
}
