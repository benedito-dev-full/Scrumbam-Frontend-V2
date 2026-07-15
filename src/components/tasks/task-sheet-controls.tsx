"use client";

import { useState } from "react";

import { STATUS_CONFIG, PRIO_CONFIG } from "@/components/lists/config";
import { useTeams } from "@/hooks/use-teams";
import type { TaskPriority, V3Intention } from "@/lib/types/api";

export type StatusVisual =
  | "backlog"
  | "pronto"
  | "em-progresso"
  | "concluido"
  | "falhou"
  | "atrasado";

export const INTENTION_TO_VISUAL: Record<V3Intention, StatusVisual> = {
  INBOX: "backlog",
  READY: "pronto",
  EXECUTING: "em-progresso",
  DONE: "concluido",
  FAILED: "falhou",
};

export const VISUAL_TO_INTENTION: Record<StatusVisual, V3Intention> = {
  backlog: "INBOX",
  pronto: "READY",
  "em-progresso": "EXECUTING",
  concluido: "DONE",
  falhou: "FAILED",
  atrasado: "INBOX",
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  URGENT: "Urgente",
};

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  LOW: "#60a5fa",
  MEDIUM: "#fbbf24",
  HIGH: "#f97316",
  URGENT: "#ef4444",
};

export function formatarData(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso.slice(0, 10) + "T12:00:00");
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function diasUntilDate(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(iso.slice(0, 10) + "T12:00:00");
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

export function corData(iso: string | null | undefined): string {
  const dias = diasUntilDate(iso);
  if (dias === null) return "var(--muted-foreground)";
  if (dias < 0) return "#fbbf24";
  if (dias === 0) return "#7c5cff";
  return "var(--muted-foreground)";
}

export function IcArrowLeft({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function IcChevDown({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function IcCalendar({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function IcFlag({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 21V4" />
      <path d="M5 4h13l-2 4 2 4H5" />
    </svg>
  );
}

export function IcPlus({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IcCheck({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

export function StatusSelect({
  value,
  onChange,
}: {
  value: StatusVisual;
  onChange: (v: StatusVisual) => void;
}) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[value];
  const StatusIcon = cfg.Icon;
  const allStatuses: StatusVisual[] = [
    "backlog",
    "pronto",
    "em-progresso",
    "concluido",
    "falhou",
  ];

  const pillBg: Record<StatusVisual, string> = {
    backlog: "rgba(107,114,128,0.15)",
    pronto: "rgba(59,130,246,0.15)",
    "em-progresso": "rgba(124,92,255,0.18)",
    concluido: "rgba(16,185,129,0.15)",
    falhou: "rgba(239,68,68,0.15)",
    atrasado: "rgba(245,158,11,0.15)",
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 6,
          background: pillBg[value],
          border: "1px solid var(--border)",
          color: cfg.iconColor,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: ".5px",
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        <StatusIcon size={12} />
        {cfg.label}
        <IcChevDown size={11} />
      </button>
      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 1 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              zIndex: 2,
              background: "var(--card)",
              border: "1px solid #2e2e38",
              borderRadius: 8,
              padding: 4,
              minWidth: 160,
              boxShadow: "0 8px 24px rgba(0,0,0,.4)",
            }}
          >
            {allStatuses.map((s) => {
              const c = STATUS_CONFIG[s];
              const Icon = c.Icon;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    onChange(s);
                    setOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: 5,
                    background: s === value ? "rgba(124,92,255,0.12)" : "none",
                    border: 0,
                    color: c.iconColor,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    if (s !== value)
                      e.currentTarget.style.background = "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    if (s !== value) e.currentTarget.style.background = "none";
                  }}
                >
                  <Icon size={12} />
                  <span style={{ color: "var(--foreground)" }}>{c.label}</span>
                  {s === value && (
                    <span style={{ marginLeft: "auto", color: "#7c5cff" }}>
                      <IcCheck size={11} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export function PrioridadeSelect({
  value,
  onChange,
}: {
  value: TaskPriority | null;
  onChange: (v: TaskPriority | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const allPrios: TaskPriority[] = ["URGENT", "HIGH", "MEDIUM", "LOW"];

  const prioColor = value ? PRIORITY_COLOR[value] : null;
  const prioLabel = value ? PRIORITY_LABEL[value] : null;

  const PRIO_MAP: Record<TaskPriority, keyof typeof PRIO_CONFIG> = {
    URGENT: "urgente",
    HIGH: "alta",
    MEDIUM: "media",
    LOW: "baixa",
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 6,
          background: "var(--card)",
          border: "1px solid #2e2e38",
          color: prioColor ?? "var(--muted-foreground)",
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        <IcFlag size={12} />
        <span style={{ color: prioColor ?? "var(--muted-foreground)" }}>
          {prioLabel ?? "Sem prioridade"}
        </span>
        <IcChevDown size={11} />
      </button>
      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 1 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              zIndex: 2,
              background: "var(--card)",
              border: "1px solid #2e2e38",
              borderRadius: 8,
              padding: 4,
              minWidth: 150,
              boxShadow: "0 8px 24px rgba(0,0,0,.4)",
            }}
          >
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "7px 10px",
                borderRadius: 5,
                background: value === null ? "rgba(124,92,255,0.12)" : "none",
                border: 0,
                color: "var(--muted-foreground)",
                fontSize: 12,
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                if (value !== null)
                  e.currentTarget.style.background = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                if (value !== null) e.currentTarget.style.background = "none";
              }}
            >
              <IcFlag size={12} />
              <span style={{ color: "var(--foreground)" }}>Sem prioridade</span>
              {value === null && (
                <span style={{ marginLeft: "auto", color: "#7c5cff" }}>
                  <IcCheck size={11} />
                </span>
              )}
            </button>
            {allPrios.map((p) => {
              const visualKey = PRIO_MAP[p];
              const c = PRIO_CONFIG[visualKey];
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    onChange(p);
                    setOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: 5,
                    background: p === value ? "rgba(124,92,255,0.12)" : "none",
                    border: 0,
                    color: c.color,
                    fontSize: 12,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    if (p !== value)
                      e.currentTarget.style.background = "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    if (p !== value) e.currentTarget.style.background = "none";
                  }}
                >
                  <IcFlag size={12} />
                  <span style={{ color: "var(--foreground)" }}>{c.label}</span>
                  {p === value && (
                    <span style={{ marginLeft: "auto", color: "#7c5cff" }}>
                      <IcCheck size={11} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export function TeamSelect({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const { data: teams = [] } = useTeams();
  const assignedTeam = teams.find((t) => t.id === value) ?? null;

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 6,
          background: "var(--card)",
          border: "1px solid #2e2e38",
          color: assignedTeam ? "var(--foreground)" : "var(--muted-foreground)",
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        {assignedTeam ? (
          <>
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: assignedTeam.color ?? "var(--muted-foreground)",
                flexShrink: 0,
              }}
            />
            <span style={{ color: "var(--foreground)" }}>
              {assignedTeam.nome}
            </span>
          </>
        ) : (
          <span style={{ color: "var(--muted-foreground)" }}>Sem time</span>
        )}
        <IcChevDown size={11} />
      </button>
      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 1 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              zIndex: 2,
              background: "var(--card)",
              border: "1px solid #2e2e38",
              borderRadius: 8,
              padding: 4,
              minWidth: 180,
              boxShadow: "0 8px 24px rgba(0,0,0,.4)",
            }}
          >
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "7px 10px",
                borderRadius: 5,
                background: value === null ? "rgba(124,92,255,0.12)" : "none",
                border: 0,
                color: "var(--muted-foreground)",
                fontSize: 12,
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                if (value !== null)
                  e.currentTarget.style.background = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                if (value !== null) e.currentTarget.style.background = "none";
              }}
            >
              <span style={{ color: "var(--foreground)" }}>Sem time</span>
              {value === null && (
                <span style={{ marginLeft: "auto", color: "#7c5cff" }}>
                  <IcCheck size={11} />
                </span>
              )}
            </button>
            {teams.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => {
                  onChange(team.id);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: 5,
                  background:
                    team.id === value ? "rgba(124,92,255,0.12)" : "none",
                  border: 0,
                  color: "var(--foreground)",
                  fontSize: 12,
                  cursor: "pointer",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  if (team.id !== value)
                    e.currentTarget.style.background = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  if (team.id !== value)
                    e.currentTarget.style.background = "none";
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: team.color ?? "var(--muted-foreground)",
                    flexShrink: 0,
                  }}
                />
                <span>{team.nome}</span>
                {team.id === value && (
                  <span style={{ marginLeft: "auto", color: "#7c5cff" }}>
                    <IcCheck size={11} />
                  </span>
                )}
              </button>
            ))}
            {teams.length === 0 && (
              <span
                style={{
                  display: "block",
                  padding: "7px 10px",
                  fontSize: 12,
                  color: "var(--muted-foreground)",
                }}
              >
                Nenhum time disponível
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function PropRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "130px 1fr",
        alignItems: "center",
        padding: "6px 0",
        gap: 12,
      }}
    >
      <span
        style={{
          fontSize: 12,
          color: "var(--muted-foreground)",
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}
