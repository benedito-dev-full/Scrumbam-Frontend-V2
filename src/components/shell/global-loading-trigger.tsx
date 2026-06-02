"use client";

import { useEffect } from "react";
import { useIsFetching } from "@tanstack/react-query";

import { useContentLoadingStore } from "@/lib/stores/content-loading";

/**
 * Só mostra o loader se o carregamento real passar deste tempo — evita flash
 * em navegações rápidas / dados em cache.
 */
const LOADER_DELAY_MS = 400;

/**
 * Aciona o overlay de carregamento automaticamente quando há um carregamento
 * REAL em andamento (e só então).
 *
 * Conta apenas queries em primeira carga: `status === "pending"` (ainda sem
 * dados), de fato buscando (`fetchStatus === "fetching"`) e com a tela ativa
 * (`observers > 0`). Refetch de fundo (ex.: polling do sino) tem `status
 * "success"` e é IGNORADO — não dispara loader.
 *
 * Com cache quente a query resolve instantânea → nada aparece. Em tela pesada
 * / cache frio que passe de `LOADER_DELAY_MS`, a animação entra e some quando
 * os dados chegam.
 */
export function GlobalLoadingTrigger() {
  const show = useContentLoadingStore((s) => s.show);
  const hide = useContentLoadingStore((s) => s.hide);

  const loadingCount = useIsFetching({
    predicate: (q) =>
      q.state.status === "pending" &&
      q.state.fetchStatus === "fetching" &&
      q.getObserversCount() > 0,
  });

  useEffect(() => {
    if (loadingCount > 0) {
      const t = setTimeout(show, LOADER_DELAY_MS);
      return () => clearTimeout(t);
    }
    hide();
  }, [loadingCount, show, hide]);

  return null;
}
