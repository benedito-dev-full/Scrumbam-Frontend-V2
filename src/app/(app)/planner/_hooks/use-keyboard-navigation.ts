"use client";

import { useEffect } from "react";

import type { PlannerView } from "@/lib/types/planner-event";

/**
 * Navega entre periodos via setas do teclado (ArrowLeft / ArrowRight).
 *
 * Usa `navigateTo` do useDragNavigation para acionar o mesmo snap
 * animado do drag — efeito consistente independente de como o usuario navega.
 * Ignorado quando o foco esta em input, textarea ou elemento editavel.
 */
export function useKeyboardNavigation(
  view: PlannerView,
  _cursorDate: Date,
  navigateTo: (dir: 1 | -1) => void,
) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) return;

      e.preventDefault();
      navigateTo(e.key === "ArrowRight" ? 1 : -1);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [navigateTo]);
}
