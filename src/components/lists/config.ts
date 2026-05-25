import React from "react";
import {
  IcProgress, IcPending, IcBlocked, IcLate, IcDone,
} from "./icons";
import type { Prioridade, StatusTarefa } from "@/lib/types/tarefa";

/* ─── Configuração visual de status e prioridades ────────────────────────── */

export type StatusConfig = {
  label: string;
  iconColor: string;
  Icon: (p: { size?: number }) => React.ReactElement;
  order: number;
};

export const STATUS_CONFIG: Record<StatusTarefa, StatusConfig> = {
  backlog:        { label: "BACKLOG",       iconColor: "#6b7280", Icon: IcPending,  order: 1 },
  pronto:         { label: "PRONTO",        iconColor: "#3b82f6", Icon: IcPending,  order: 2 },
  "em-progresso": { label: "EM PROGRESSO",  iconColor: "#7c5cff", Icon: IcProgress, order: 3 },
  concluido:      { label: "CONCLUÍDO",     iconColor: "#10b981", Icon: IcDone,     order: 4 },
  falhou:         { label: "FALHOU",        iconColor: "#ef4444", Icon: IcBlocked,  order: 5 },
  atrasado:       { label: "ATRASADO",      iconColor: "#f59e0b", Icon: IcLate,     order: 6 },
};

export const PRIO_CONFIG: Record<NonNullable<Prioridade>, { label: string; color: string }> = {
  urgente: { label: "Urgente", color: "#ef4444" },
  alta:    { label: "Alta",    color: "#f59e0b" },
  media:   { label: "Média",   color: "#60a5fa" },
  baixa:   { label: "Baixa",   color: "#71717a" },
};

/** Estilo das pills de status — usado tanto no header do grupo quanto inline na linha */
export const GROUP_PILL_STYLE: Record<StatusTarefa, { bg: string; color: string }> = {
  backlog:        { bg: "#2a2a31", color: "#d4d4dc"  },
  pronto:         { bg: "#1e2d40", color: "#93c5fd"  },
  "em-progresso": { bg: "#7c5cff", color: "#fff"     },
  concluido:      { bg: "#0d2e1e", color: "#6ee7b7"  },
  falhou:         { bg: "#3d1212", color: "#fca5a5"  },
  atrasado:       { bg: "#3a2800", color: "#fcd34d"  },
};

export const INLINE_PILL_STYLE = GROUP_PILL_STYLE;
