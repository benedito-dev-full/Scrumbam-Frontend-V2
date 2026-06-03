"use client";

import React from "react";
import {
  BarChart2,
  Briefcase,
  Clock,
  Footprints,
  LayoutGrid,
  Users,
} from "lucide-react";

export type TabId =
  | "visao-geral"
  | "analiticos"
  | "prioridades"
  | "equipe"
  | "de-pe"
  | "carga"
  | "planilha";

export const TABS: { id: TabId; label: string; color?: string }[] = [
  { id: "visao-geral", label: "Visão geral" },
  { id: "analiticos", label: "Dados analíticos", color: "#3b82f6" },
  { id: "prioridades", label: "Prioridades", color: "#e74c3c" },
  { id: "equipe", label: "Equipe", color: "#a855f7" },
  { id: "de-pe", label: "De pé", color: "#a855f7" },
  { id: "carga", label: "Carga de trabalho", color: "#22c55e" },
  { id: "planilha", label: "Planilha de horas", color: "#f59e0b" },
];

export const TAB_ICONS: Record<TabId, React.ReactNode> = {
  "visao-geral": <LayoutGrid size={13} strokeWidth={1.8} />,
  analiticos: <BarChart2 size={13} strokeWidth={1.8} />,
  prioridades: <span style={{ fontSize: 11 }}>⚑</span>,
  equipe: <Users size={13} strokeWidth={1.8} />,
  "de-pe": <Footprints size={13} strokeWidth={1.8} />,
  carga: <Briefcase size={13} strokeWidth={1.8} />,
  planilha: <Clock size={13} strokeWidth={1.8} />,
};

/* ══════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════ */

export function avatarColor(str: string) {
  const colors = [
    "#e74c3c",
    "#3498db",
    "#2ecc71",
    "#9b59b6",
    "#f59e0b",
    "#e91e63",
    "#1abc9c",
    "#e67e22",
  ];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

export function getInitials(nome: string) {
  return nome.trim().charAt(0).toUpperCase();
}

/* ══════════════════════════════════════════════════════════════════
   POPOVER ADICIONAR MEMBRO
══════════════════════════════════════════════════════════════════ */

