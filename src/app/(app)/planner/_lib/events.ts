import { isSameDay } from "date-fns";

import type { PlannerEvent, PlannerEventColor } from "@/lib/types/planner-event";

import { HOUR_RANGE } from "./date";

/** Eventos pontuais (com hora) que comecam neste dia. */
export function getTimedEventsForDay(events: PlannerEvent[], date: Date): PlannerEvent[] {
  return events.filter((e) => !e.allDay && isSameDay(new Date(e.start), date));
}

/** Eventos all-day que ocorrem neste dia. */
export function getAllDayEventsForDay(events: PlannerEvent[], date: Date): PlannerEvent[] {
  return events.filter((e) => e.allDay && isSameDay(new Date(e.start), date));
}

/** Todos os eventos (timed + all-day) que tocam o dia. */
export function getEventsForDay(events: PlannerEvent[], date: Date): PlannerEvent[] {
  return events.filter((e) => isSameDay(new Date(e.start), date));
}

/**
 * Calcula a posicao vertical (em %) de um evento pontual dentro da
 * faixa de horas das views Dia/Semana.
 *
 * Retorna null se o evento estiver totalmente fora da faixa exibida.
 */
export function getEventPosition(event: PlannerEvent): { top: number; height: number } | null {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const startMin = start.getHours() * 60 + start.getMinutes();
  const endMin = end.getHours() * 60 + end.getMinutes();

  const rangeStart = HOUR_RANGE.start * 60;
  const rangeEnd = HOUR_RANGE.end * 60;
  const rangeSpan = rangeEnd - rangeStart;

  if (endMin <= rangeStart || startMin >= rangeEnd) return null;

  const clampedStart = Math.max(startMin, rangeStart);
  const clampedEnd = Math.min(endMin, rangeEnd);

  return {
    top: ((clampedStart - rangeStart) / rangeSpan) * 100,
    height: Math.max(2, ((clampedEnd - clampedStart) / rangeSpan) * 100),
  };
}

/**
 * Mapa de cor -> classes Tailwind. Centralizar aqui garante que o
 * Tailwind detecte as classes em tempo de build (evita strings dinamicas).
 */
export const EVENT_COLOR_CLASSES: Record<PlannerEventColor, string> = {
  blue: "bg-blue-500/15 text-blue-100 border-l-blue-500",
  violet: "bg-violet-500/15 text-violet-100 border-l-violet-500",
  emerald: "bg-emerald-500/15 text-emerald-100 border-l-emerald-500",
  amber: "bg-amber-500/15 text-amber-100 border-l-amber-500",
  rose: "bg-rose-500/15 text-rose-100 border-l-rose-500",
  slate: "bg-slate-500/15 text-slate-100 border-l-slate-500",
};

/** Variante "pilula" (compacta) usada na MonthView. */
export const EVENT_PILL_CLASSES: Record<PlannerEventColor, string> = {
  blue: "bg-blue-500/20 text-blue-200",
  violet: "bg-violet-500/20 text-violet-200",
  emerald: "bg-emerald-500/20 text-emerald-200",
  amber: "bg-amber-500/20 text-amber-200",
  rose: "bg-rose-500/20 text-rose-200",
  slate: "bg-slate-500/20 text-slate-200",
};
