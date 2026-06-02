"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { useContentLoadingStore } from "@/lib/stores/content-loading";

/** Duração do loader exibido ao trocar de aba/rota. */
const NAV_LOADER_MS = 550;

/**
 * Dispara o overlay de carregamento ao trocar de rota (aba).
 *
 * Observa `usePathname` e, a cada mudança (ignorando o primeiro render),
 * mostra o loader por um curto período — uma transição de marca consistente
 * entre telas. Não dispara em mudança apenas de querystring (filtros).
 */
export function NavigationLoader() {
  const pathname = usePathname();
  const show = useContentLoadingStore((s) => s.show);
  const hide = useContentLoadingStore((s) => s.hide);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    show();
    const t = setTimeout(hide, NAV_LOADER_MS);
    return () => clearTimeout(t);
  }, [pathname, show, hide]);

  return null;
}
