"use client";

import React, { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpen, Bug, GitPullRequest, Sparkle, Wrench } from "lucide-react";

import { PRIO_CONFIG } from "@/components/lists/config";
import type { TaskPriority, TaskType, V3Intention } from "@/lib/types/api";

export type StatusVisual =
  | "backlog"
  | "pronto"
  | "em-progresso"
  | "concluido"
  | "falhou"
  | "atrasado";

export const VISUAL_TO_INTENTION: Record<StatusVisual, V3Intention> = {
  backlog: "INBOX",
  pronto: "READY",
  "em-progresso": "EXECUTING",
  concluido: "DONE",
  falhou: "FAILED",
  atrasado: "INBOX",
};

export const VISUAL_TO_BACKEND_PRIO: Record<
  keyof typeof PRIO_CONFIG,
  TaskPriority
> = {
  urgente: "URGENT",
  alta: "HIGH",
  media: "MEDIUM",
  baixa: "LOW",
};

export const ALL_STATUS_VISUAL: StatusVisual[] = [
  "backlog",
  "pronto",
  "em-progresso",
  "concluido",
  "falhou",
];

export const ALL_PRIO_VISUAL = Object.keys(
  PRIO_CONFIG,
) as (keyof typeof PRIO_CONFIG)[];

export const TASK_TYPE_OPTIONS: Array<{
  value: TaskType;
  label: string;
  Icon: typeof Sparkle;
  color: string;
}> = [
  { value: "FEATURE", label: "Feature", Icon: Sparkle, color: "#a78bfa" },
  { value: "BUG", label: "Bug", Icon: Bug, color: "#f87171" },
  { value: "IMPROVEMENT", label: "Melhoria", Icon: Wrench, color: "#60a5fa" },
  { value: "REVIEW", label: "Revisao", Icon: GitPullRequest, color: "#34d399" },
  { value: "EXPLAIN", label: "Doc", Icon: BookOpen, color: "#fbbf24" },
];

export function DropdownPortal({
  triggerRef,
  portalRef,
  children,
}: {
  triggerRef: React.RefObject<HTMLElement | null>;
  portalRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left });
  }, [triggerRef]);

  return createPortal(
    <div
      ref={portalRef}
      style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 99999 }}
    >
      {children}
    </div>,
    document.body,
  );
}

export const docActionStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  height: 34,
  padding: "0 8px",
  borderRadius: 6,
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#a1a1aa",
  fontSize: 13,
  textAlign: "left",
  transition: "background 100ms, color 100ms",
};

export const docItemHover = {
  onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = "var(--border)";
    e.currentTarget.style.color = "#d4d4d4";
  },
  onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = "none";
    e.currentTarget.style.color = "#a1a1aa";
  },
};

export const chipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  height: 28,
  padding: "0 10px",
  borderRadius: 6,
  border: "1px solid var(--border)",
  background: "var(--border)",
  cursor: "pointer",
  color: "#c4c4cc",
  fontSize: 12,
  transition: "background 120ms",
};

export const propChipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  height: 28,
  padding: "0 11px",
  borderRadius: 6,
  border: "1px solid var(--border)",
  background: "var(--border)",
  cursor: "pointer",
  color: "#6b6b74",
  fontSize: 12,
  transition: "background 120ms, color 120ms, border-color 120ms",
};

export const dropdownStyle: React.CSSProperties = {
  background: "#1a1a1a",
  border: "1px solid var(--border)",
  borderRadius: 8,
  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
  minWidth: 160,
  padding: "4px",
  display: "flex",
  flexDirection: "column",
  gap: 1,
};

export const dropdownItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "7px 10px",
  borderRadius: 5,
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#c4c4c4",
  fontSize: 13,
  width: "100%",
  textAlign: "left",
  transition: "background 100ms",
};

export const itemHover = {
  onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = "var(--border)";
  },
  onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background =
      e.currentTarget.dataset.selected === "1" ? "var(--border)" : "none";
  },
};
