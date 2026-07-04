"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ColumnDef } from "@/lib/types/table-fields";
import { colWidth } from "./columns";

/** Largura minima que uma coluna pode assumir no resize (nunca colapsa). */
export const MIN_COL_W = 60;

/** Prefixo da chave de localStorage — sufixada pelo id da lista. */
const STORAGE_PREFIX = "groups-view:colwidths:";

type WidthMap = Record<string, number>;

/**
 * Retorno do hook de larguras de coluna redimensionaveis.
 *
 * - `effectiveWidth(c)` — largura efetiva de uma coluna (override custom quando
 *   existe, senao o default de `colWidth`). Fonte UNICA de largura consumida
 *   pelo colgroup, pelo header e pelo calculo da largura total da tabela.
 * - `setColumnWidth(key, w)` — grava a largura (em px) de uma coluna. Aplica o
 *   minimo `MIN_COL_W`. Persiste no localStorage (por lista).
 */
export interface ColumnWidthsApi {
  effectiveWidth: (c: ColumnDef) => number;
  setColumnWidth: (key: string, width: number) => void;
}

function storageKey(listId?: string): string | null {
  if (!listId) return null;
  return `${STORAGE_PREFIX}${listId}`;
}

/**
 * Carrega o mapa persistido de larguras de coluna do localStorage.
 * Defensivo: JSON corrompido / valores invalidos jamais quebram a tela — na
 * duvida devolve `{}` (tudo cai no default de `colWidth`).
 */
function loadWidths(listId?: string): WidthMap {
  const k = storageKey(listId);
  if (!k || typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(k);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: WidthMap = {};
    for (const [key, val] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof val === "number" && Number.isFinite(val) && val > 0) {
        out[key] = Math.max(MIN_COL_W, Math.round(val));
      }
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Gerencia as larguras customizadas das colunas da tabela principal de uma
 * lista, com persistencia em localStorage (chave por lista). Quando `listId`
 * e ausente, degrada para modo apenas-sessao (nada persiste), sem quebrar.
 *
 * @param listId - Id da lista (projectId). Compoe a chave de localStorage.
 */
export function useColumnWidths(listId?: string): ColumnWidthsApi {
  // Carrega de forma preguicosa no mount; re-carrega quando a lista muda.
  const [widths, setWidths] = useState<WidthMap>(() => loadWidths(listId));

  // Ao trocar de lista, recarrega o mapa persistido daquela lista.
  const listRef = useRef(listId);
  useEffect(() => {
    if (listRef.current !== listId) {
      listRef.current = listId;
      setWidths(loadWidths(listId));
    }
  }, [listId]);

  const persist = useCallback(
    (next: WidthMap) => {
      const k = storageKey(listId);
      if (!k || typeof window === "undefined") return;
      try {
        window.localStorage.setItem(k, JSON.stringify(next));
      } catch {
        // localStorage indisponivel (quota/modo privado) — degrada em silencio.
      }
    },
    [listId],
  );

  const setColumnWidth = useCallback(
    (key: string, width: number) => {
      const w = Math.max(MIN_COL_W, Math.round(width));
      setWidths((prev) => {
        if (prev[key] === w) return prev;
        const next = { ...prev, [key]: w };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const effectiveWidth = useCallback(
    (c: ColumnDef): number => widths[c.key] ?? colWidth(c),
    [widths],
  );

  return useMemo(
    () => ({ effectiveWidth, setColumnWidth }),
    [effectiveWidth, setColumnWidth],
  );
}
