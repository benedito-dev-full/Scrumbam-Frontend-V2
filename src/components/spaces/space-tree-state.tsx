"use client";

import { useCallback, useState } from "react";
import type { Active } from "@dnd-kit/core";

import type { DProjectDto } from "@/lib/types/api";

const STORAGE_KEY = "scrumban:sidebar:expanded";

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadExpandedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return new Set(parsed as string[]);
  } catch {
    // ignora parse error
  }
  return new Set();
}

function saveExpandedIds(ids: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // ignora erros de cota
  }
}

// ─── Hook de estado de colapso ────────────────────────────────────────────────

export function useExpandedState() {
  const [expanded, setExpanded] = useState<Set<string>>(loadExpandedIds);

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      saveExpandedIds(next);
      return next;
    });
  }, []);

  // Expande sem alternar — usado após mover um item por DnD para revelar
  // onde ele caiu, sem o risco de fechar um nó que já estava aberto.
  const expand = useCallback((id: string) => {
    setExpanded((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      saveExpandedIds(next);
      return next;
    });
  }, []);

  const isExpanded = useCallback(
    (id: string) => expanded.has(id),
    [expanded],
  );

  return { isExpanded, toggle, expand };
}

// ─── Validação de drop (hierarquia ADR-V2-051) ─────────────────────────────────

/**
 * Decide se o item arrastado pode ser solto sobre `target`, espelhando as
 * regras de hierarquia do backend (sem chamar a API):
 * - LIST (-352)   → aceita FOLDER (-351) ou SPACE (-350) como destino
 * - FOLDER (-351) → aceita apenas SPACE (-350) como destino
 *
 * Rejeita soltar sobre si mesmo ou sobre o pai atual (movimento nulo).
 */
export function canDropOn(active: Active | null, target: DProjectDto): boolean {
  const dragged = active?.data.current?.project as DProjectDto | undefined;
  if (!dragged) return false;
  if (dragged.id === target.id) return false;
  if (dragged.idPai === target.id) return false;
  if (dragged.idClasse === "-352") {
    return target.idClasse === "-351" || target.idClasse === "-350";
  }
  if (dragged.idClasse === "-351") {
    return target.idClasse === "-350";
  }
  return false;
}

// ─── Hook de inline rename ────────────────────────────────────────────────────

/**
 * Gerencia o estado de edição inline de um item.
 * Confirma com Enter ou blur; cancela com Escape.
 */
