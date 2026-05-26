"use client";

import { useEffect } from "react";

import type { PlannerView } from "@/lib/types/planner-event";

import { stepDate } from "../_lib/date";

/**
 * Navega entre periodos via setas do teclado (ArrowLeft / ArrowRight).
 *
 * Ignorado quando o foco esta em input, textarea ou elemento editavel,
 * para nao conflitar com edicao de texto.
 */
export function useKeyboardNavigation(
  view: PlannerView,
  cursorDate: Date,
  onCursorChange: (date: Date) => void,
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
      const dir = e.key === "ArrowRight" ? 1 : -1;
      onCursorChange(stepDate(view, cursorDate, dir as 1 | -1));
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [view, cursorDate, onCursorChange]);
}
