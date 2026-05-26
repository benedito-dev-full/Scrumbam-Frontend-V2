import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";

import type { PlannerView } from "@/lib/types/planner-event";

/** Faixa de horas (linhas) exibida nas views Dia e Semana. */
export const HOUR_RANGE = { start: 10, end: 23 } as const;

/**
 * Retorna os 7 dias da semana que contem `base`, comecando no domingo.
 */
export function getWeekDates(base: Date): Date[] {
  const start = startOfWeek(base, { weekStartsOn: 0 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/**
 * Retorna a matriz semanal (5 ou 6 linhas x 7 dias) do mes corrente,
 * preenchendo com dias dos meses adjacentes nas pontas.
 */
export function getMonthGrid(base: Date): Date[][] {
  const start = startOfWeek(startOfMonth(base), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(base), { weekStartsOn: 0 });
  const weeks: Date[][] = [];
  let cursor = start;
  while (cursor <= end) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(cursor, i)));
    cursor = addDays(cursor, 7);
  }
  return weeks;
}

/**
 * Aplica o passo de navegacao (prev/next) conforme a view ativa.
 */
export function stepDate(view: PlannerView, base: Date, dir: 1 | -1): Date {
  if (view === "day") return addDays(base, dir);
  if (view === "week") return addWeeks(base, dir);
  if (view === "month") return addMonths(base, dir);
  return addYears(base, dir);
}

/**
 * Label de periodo exibido na toolbar — varia conforme a view.
 *
 * - Dia:    "qua, 26 de maio de 2026"
 * - Semana: "maio 2026"  (mes do primeiro dia da semana)
 * - Mes:    "maio 2026"
 */
export function formatPeriodLabel(view: PlannerView, date: Date): string {
  if (view === "day") {
    return format(date, "EEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  }
  if (view === "week") {
    return format(getWeekDates(date)[0], "MMMM yyyy", { locale: ptBR });
  }
  if (view === "year") {
    return format(date, "yyyy");
  }
  return format(date, "MMMM yyyy", { locale: ptBR });
}

export { isSameDay, isSameMonth, isToday };
