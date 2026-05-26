import type { PlannerEvent } from "@/lib/types/planner-event";

/**
 * Eventos mock do Planner, ancorados na semana de 24/05/2026 a 30/05/2026.
 *
 * Hoje (na data congelada do projeto) eh terca-feira 26/05/2026. A lista
 * cobre os 3 modos (Dia / Semana / Mes) com variedade de cor, duracao e
 * dia da semana — incluindo um all-day e um evento curto. Substitua por
 * dados reais quando o endpoint de Planner existir.
 */
export const mockPlannerEvents: PlannerEvent[] = [
  {
    id: "pe-001",
    title: "Daily standup",
    start: "2026-05-25T09:00:00",
    end: "2026-05-25T09:30:00",
    color: "blue",
    source: "manual",
  },
  {
    id: "pe-002",
    title: "Review de sprint 14",
    start: "2026-05-26T14:00:00",
    end: "2026-05-26T15:30:00",
    color: "violet",
    source: "sprint",
  },
  {
    id: "pe-003",
    title: "1:1 com Mariana",
    start: "2026-05-26T16:00:00",
    end: "2026-05-26T16:45:00",
    color: "emerald",
    source: "manual",
  },
  {
    id: "pe-004",
    title: "Refatorar autenticacao",
    start: "2026-05-27T10:00:00",
    end: "2026-05-27T12:00:00",
    color: "amber",
    source: "task",
  },
  {
    id: "pe-005",
    title: "Holiday — Corpus Christi",
    start: "2026-05-28T00:00:00",
    end: "2026-05-28T23:59:59",
    color: "rose",
    allDay: true,
    source: "manual",
  },
  {
    id: "pe-006",
    title: "Planning sprint 15",
    start: "2026-05-29T13:00:00",
    end: "2026-05-29T15:00:00",
    color: "blue",
    source: "sprint",
  },
];
