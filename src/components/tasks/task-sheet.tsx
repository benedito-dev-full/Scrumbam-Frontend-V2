"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Trash2 } from "lucide-react";

import { CommentsPanel } from "@/components/comments/CommentsPanel";
import { STATUS_CONFIG, PRIO_CONFIG } from "@/components/lists/config";
import { DeleteTaskDialog } from "@/components/tasks/delete-task-dialog";
import { useUpdateTask, useUpdateTaskStatus } from "@/hooks/use-tasks";
import { useTeams } from "@/hooks/use-teams";
import { CommentTargetType } from "@/lib/types/comment";
import type {
  TaskResponseDto,
  V3Intention,
  TaskPriority,
} from "@/lib/types/api";

/* ─── Mapeamentos V3Intention ↔ StatusVisual ──────────────────────────────── */

type StatusVisual =
  | "backlog"
  | "pronto"
  | "em-progresso"
  | "concluido"
  | "falhou"
  | "atrasado";

const INTENTION_TO_VISUAL: Record<V3Intention, StatusVisual> = {
  INBOX: "backlog",
  READY: "pronto",
  EXECUTING: "em-progresso",
  VALIDATING: "em-progresso",
  DONE: "concluido",
  VALIDATED: "concluido",
  FAILED: "falhou",
  CANCELLED: "concluido",
  DISCARDED: "concluido",
};

const VISUAL_TO_INTENTION: Record<StatusVisual, V3Intention> = {
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

/* ─── Tipos internos ──────────────────────────────────────────────────────── */

interface TaskSheetProps {
  task: TaskResponseDto | null;
  onClose: () => void;
}

interface SubtarefaItem {
  id: string;
  nome: string;
  concluida: boolean;
}

/* ─── Helpers de formatação ───────────────────────────────────────────────── */

function formatarData(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso.slice(0, 10) + "T12:00:00");
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function diasUntilDate(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(iso.slice(0, 10) + "T12:00:00");
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

function corData(iso: string | null | undefined): string {
  const dias = diasUntilDate(iso);
  if (dias === null) return "var(--muted-foreground)";
  if (dias < 0) return "#fbbf24";
  if (dias === 0) return "#7c5cff";
  return "var(--muted-foreground)";
}

/* ─── Ícones internos do sheet ────────────────────────────────────────────── */

function IcArrowLeft({ size = 16 }: { size?: number }) {
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

function IcDots({ size = 16 }: { size?: number }) {
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
      <circle cx="5" cy="12" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <circle cx="19" cy="12" r="1.2" fill="currentColor" />
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

function IcCalendar({ size = 14 }: { size?: number }) {
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

function IcPlus({ size = 13 }: { size?: number }) {
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

function IcCheck({ size = 12 }: { size?: number }) {
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

/* ─── Sub-componentes das seções ──────────────────────────────────────────── */

function StatusSelect({
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

function PrioridadeSelect({
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

  /* Mapeia backend priority para a config de PRIO_CONFIG (visual da main) */
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

/**
 * Seletor dropdown para atribuição de time em TaskSheet.
 * Renderizado com estilos inline; abre menu flutuante ao clique.
 * @param value - ID do time selecionado, ou null
 * @param onChange - Callback invocado ao selecionar ou remover time
 */
function TeamSelect({
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
            {/* Sem time */}
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
            {/* Lista de times */}
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

function PropRow({
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

/* ─── Componente principal ────────────────────────────────────────────────── */

export function TaskSheet({ task, onClose }: TaskSheetProps) {
  const updateTask = useUpdateTask();
  const updateStatus = useUpdateTaskStatus();

  const [nome, setNome] = useState("");
  const [editandoNome, setEditandoNome] = useState(false);
  const [statusVisual, setStatusVisual] = useState<StatusVisual>("backlog");
  const [prioridade, setPrioridade] = useState<TaskPriority | null>(null);
  const [dataVencimento, setDataVencimento] = useState<string | null>(null);
  const [editandoData, setEditandoData] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [novaSubtarefa, setNovaSubtarefa] = useState("");
  const [subtarefas, setSubtarefas] = useState<SubtarefaItem[]>([]);
  const [visivel, setVisivel] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [assigneeTeamId, setAssigneeTeamId] = useState<string | null>(null);

  const tituloInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (task) {
      const id = setTimeout(() => {
        setNome(task.nome);
        setStatusVisual(INTENTION_TO_VISUAL[task.status] ?? "backlog");
        setPrioridade((task.priority as TaskPriority) ?? null);
        setDataVencimento(task.dueDate ?? null);
        setDescricao(task.description ?? "");
        setNovaSubtarefa("");
        setEditandoNome(false);
        setEditandoData(false);
        setSubtarefas([]);
        setAssigneeTeamId(task.assigneeTeamId ?? null);
      }, 0);
      requestAnimationFrame(() => setVisivel(true));
      return () => clearTimeout(id);
    } else {
      const hideId = setTimeout(() => setVisivel(false), 0);
      return () => clearTimeout(hideId);
    }
  }, [task]);

  useEffect(() => {
    if (!task) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [task, onClose]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [descricao]);

  useEffect(() => {
    if (editandoNome) {
      tituloInputRef.current?.focus();
      tituloInputRef.current?.select();
    }
  }, [editandoNome]);

  const confirmarNome = useCallback(() => {
    setEditandoNome(false);
    if (!task) return;
    const novoNome = nome.trim() || task.nome;
    setNome(novoNome);
    if (novoNome !== task.nome) {
      updateTask.mutate({
        id: task.id,
        projectId: task.projectId,
        dto: { titulo: novoNome },
      });
    }
  }, [nome, task, updateTask]);

  const handleStatusChange = useCallback(
    (v: StatusVisual) => {
      if (!task) return;
      setStatusVisual(v);
      const intention = VISUAL_TO_INTENTION[v];
      updateStatus.mutate({
        id: task.id,
        status: intention,
        projectId: task.projectId,
      });
    },
    [task, updateStatus],
  );

  const handlePrioridadeChange = useCallback(
    (v: TaskPriority | null) => {
      if (!task) return;
      setPrioridade(v);
      updateTask.mutate({
        id: task.id,
        projectId: task.projectId,
        dto: { priority: v ?? undefined },
      });
    },
    [task, updateTask],
  );

  const handleDueDateChange = useCallback(
    (val: string | null) => {
      if (!task) return;
      setDataVencimento(val);
      updateTask.mutate({
        id: task.id,
        projectId: task.projectId,
        dto: { dueDate: val },
      });
    },
    [task, updateTask],
  );

  const handleAssigneeTeamChange = useCallback(
    (teamId: string | null) => {
      if (!task) return;
      setAssigneeTeamId(teamId);
      updateTask.mutate({
        id: task.id,
        projectId: task.projectId,
        dto: { assigneeTeamId: teamId },
      });
    },
    [task, updateTask],
  );

  const adicionarSubtarefa = useCallback(() => {
    const texto = novaSubtarefa.trim();
    if (!texto) return;
    setSubtarefas((prev) => [
      ...prev,
      { id: `sub-new-${Date.now()}`, nome: texto, concluida: false },
    ]);
    setNovaSubtarefa("");
  }, [novaSubtarefa]);

  const toggleSubtarefa = useCallback((id: string) => {
    setSubtarefas((prev) =>
      prev.map((s) => (s.id === id ? { ...s, concluida: !s.concluida } : s)),
    );
  }, []);

  if (!task) return null;

  // Estado terminal (DONE/FAILED) = histórico. activeExecution zumbi não
  // bloqueia ações em tasks já encerradas.
  const isTerminalStatus = task.status === "DONE" || task.status === "FAILED";
  const lockDelete = Boolean(task.activeExecution) && !isTerminalStatus;

  const dataTexto = formatarData(dataVencimento);
  const dataCor = corData(dataVencimento);
  const diasRestantes = diasUntilDate(dataVencimento);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 998,
          background: "rgba(0,0,0,0.45)",
          opacity: visivel ? 1 : 0,
          transition: "opacity .22s ease",
        }}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes da tarefa: ${nome}`}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
          width: 560,
          maxWidth: "90vw",
          background: "var(--card)",
          borderLeft: "1px solid #26262d",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 40px rgba(0,0,0,.5)",
          transform: visivel ? "translateX(0)" : "translateX(100%)",
          transition: "transform .24s cubic-bezier(.22,.68,0,1.08)",
        }}
      >
        {/* ── Header fixo ──────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            height: 48,
            flexShrink: 0,
            borderBottom: "1px solid #1f1f27",
          }}
        >
          <button
            type="button"
            aria-label="Fechar painel"
            onClick={onClose}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: 0,
              color: "var(--muted-foreground)",
              fontSize: 12,
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: 5,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--foreground)";
              e.currentTarget.style.background = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--muted-foreground)";
              e.currentTarget.style.background = "none";
            }}
          >
            <IcArrowLeft size={15} />
            Fechar
          </button>

          <span
            style={{
              fontSize: 12,
              color: "var(--muted-foreground)",
              fontWeight: 500,
              letterSpacing: ".5px",
            }}
          >
            {task.identifier.toUpperCase()}
          </span>

          <button
            type="button"
            aria-label="Mais ações"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 30,
              height: 30,
              borderRadius: 6,
              background: "none",
              border: 0,
              color: "var(--muted-foreground)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--foreground)";
              e.currentTarget.style.background = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--muted-foreground)";
              e.currentTarget.style.background = "none";
            }}
          >
            <IcDots size={16} />
          </button>
        </div>

        {/* ── Body scrollável ──────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 40px" }}>
          {/* Título editável inline */}
          <div style={{ marginBottom: 24 }}>
            {editandoNome ? (
              <input
                ref={tituloInputRef}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onBlur={confirmarNome}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmarNome();
                  if (e.key === "Escape") {
                    setNome(task.nome);
                    setEditandoNome(false);
                  }
                }}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid #7c5cff",
                  color: "var(--foreground)",
                  fontSize: 20,
                  fontWeight: 700,
                  outline: "none",
                  padding: "2px 0",
                  fontFamily: "inherit",
                }}
              />
            ) : (
              <h2
                role="button"
                tabIndex={0}
                onClick={() => setEditandoNome(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setEditandoNome(true);
                }}
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--foreground)",
                  margin: 0,
                  cursor: "text",
                  lineHeight: 1.35,
                  padding: "2px 0",
                }}
                title="Clique para editar o título"
              >
                {nome}
              </h2>
            )}
          </div>

          {/* Seção de Propriedades */}
          <section
            style={{
              background: "var(--card)",
              borderRadius: 10,
              border: "1px solid #26262d",
              padding: "12px 16px",
              marginBottom: 24,
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--muted-foreground)",
                letterSpacing: ".7px",
                textTransform: "uppercase",
                margin: "0 0 10px",
              }}
            >
              Propriedades
            </p>

            <PropRow label="Status">
              <StatusSelect
                value={statusVisual}
                onChange={handleStatusChange}
              />
            </PropRow>

            <div
              style={{
                height: 1,
                background: "var(--accent)",
                margin: "4px 0",
              }}
            />

            <PropRow label="Prioridade">
              <PrioridadeSelect
                value={prioridade}
                onChange={handlePrioridadeChange}
              />
            </PropRow>

            <div
              style={{
                height: 1,
                background: "var(--accent)",
                margin: "4px 0",
              }}
            />

            <div
              style={{
                height: 1,
                background: "var(--accent)",
                margin: "4px 0",
              }}
            />

            <PropRow label="Time responsável">
              <TeamSelect
                value={assigneeTeamId}
                onChange={handleAssigneeTeamChange}
              />
            </PropRow>

            <div
              style={{
                height: 1,
                background: "var(--accent)",
                margin: "4px 0",
              }}
            />

            <PropRow label="Vencimento">
              {editandoData ? (
                <input
                  type="date"
                  autoFocus
                  defaultValue={dataVencimento ?? ""}
                  onChange={(e) => {
                    const val = e.target.value || null;
                    handleDueDateChange(val);
                  }}
                  onBlur={() => setEditandoData(false)}
                  style={{
                    background: "var(--card)",
                    border: "1px solid #7c5cff",
                    borderRadius: 6,
                    color: "var(--foreground)",
                    fontSize: 12,
                    padding: "3px 8px",
                    outline: "none",
                    colorScheme: "dark",
                  }}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditandoData(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: dataCor,
                    fontSize: 12,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.75";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  <IcCalendar size={13} />
                  {dataTexto || (
                    <span style={{ color: "var(--muted-foreground)" }}>
                      Sem data
                    </span>
                  )}
                  {diasRestantes !== null && diasRestantes < 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#fbbf24",
                        letterSpacing: ".5px",
                      }}
                    >
                      ATRASADO {Math.abs(diasRestantes)}D
                    </span>
                  )}
                  {diasRestantes === 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#7c5cff",
                        letterSpacing: ".5px",
                      }}
                    >
                      HOJE
                    </span>
                  )}
                </button>
              )}
            </PropRow>
          </section>

          {/* Seção Descrição */}
          <section style={{ marginBottom: 28 }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--muted-foreground)",
                margin: "0 0 8px",
              }}
            >
              Descrição
            </p>
            <textarea
              ref={textareaRef}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Adicione uma descrição..."
              rows={3}
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "var(--card)",
                border: "1px solid #26262d",
                borderRadius: 8,
                color: "var(--foreground)",
                fontSize: 13,
                padding: "10px 12px",
                outline: "none",
                resize: "none",
                lineHeight: 1.6,
                fontFamily: "inherit",
                minHeight: 80,
                transition: "border-color .15s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#7c5cff";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
              }}
            />
          </section>

          {/* Seção Subtarefas */}
          <section style={{ marginBottom: 28 }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--muted-foreground)",
                margin: "0 0 8px",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Subtarefas
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "var(--muted-foreground)",
                  background: "var(--accent)",
                  borderRadius: 4,
                  padding: "1px 6px",
                }}
              >
                {subtarefas.length}
              </span>
            </p>

            {subtarefas.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                {subtarefas.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "7px 10px",
                      borderRadius: 6,
                      background: "var(--card)",
                      border: "1px solid #22222a",
                      marginBottom: 4,
                    }}
                  >
                    <button
                      type="button"
                      aria-label={
                        s.concluida
                          ? "Desmarcar subtarefa"
                          : "Marcar subtarefa como concluída"
                      }
                      onClick={() => toggleSubtarefa(s.id)}
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        flexShrink: 0,
                        background: s.concluida ? "#7c5cff" : "transparent",
                        border: `1.5px solid ${s.concluida ? "#7c5cff" : "#3d3d4a"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      {s.concluida && <IcCheck size={10} />}
                    </button>
                    <span
                      style={{
                        fontSize: 13,
                        color: s.concluida
                          ? "var(--muted-foreground)"
                          : "var(--foreground)",
                        textDecoration: s.concluida ? "line-through" : "none",
                      }}
                    >
                      {s.nome}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "var(--card)",
                border: "1px solid #26262d",
                borderRadius: 8,
                padding: "6px 10px",
              }}
            >
              <IcPlus size={13} />
              <input
                type="text"
                value={novaSubtarefa}
                onChange={(e) => setNovaSubtarefa(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") adicionarSubtarefa();
                }}
                placeholder="Adicionar subtarefa..."
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: "var(--foreground)",
                  fontSize: 13,
                  fontFamily: "inherit",
                }}
              />
            </div>
          </section>

          {/* Seção Atividade / Comentários */}
          <section>
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--muted-foreground)",
                margin: "0 0 10px",
              }}
            >
              Atividade
            </p>
            <CommentsPanel
              targetType={CommentTargetType.TASK}
              targetId={task.id}
            />
          </section>

          {/* Ação destrutiva — excluir task */}
          <section
            style={{
              marginTop: 32,
              paddingTop: 20,
              borderTop: "1px solid #1f1f27",
            }}
          >
            <button
              type="button"
              disabled={lockDelete}
              onClick={() => setDeleteOpen(true)}
              title={
                lockDelete
                  ? "Não é possível excluir enquanto há execução ativa"
                  : undefined
              }
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                background: "rgba(239,68,68,0.10)",
                border: "1px solid rgba(239,68,68,0.30)",
                color: "#f87171",
                fontSize: 13,
                fontWeight: 600,
                cursor: lockDelete ? "not-allowed" : "pointer",
                opacity: lockDelete ? 0.5 : 1,
                transition: "background-color .15s",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                if (!lockDelete) {
                  e.currentTarget.style.background = "rgba(239,68,68,0.20)";
                }
              }}
              onMouseLeave={(e) => {
                if (!lockDelete) {
                  e.currentTarget.style.background = "rgba(239,68,68,0.10)";
                }
              }}
            >
              <Trash2 size={14} />
              Excluir task
            </button>
          </section>
        </div>
      </div>

      <DeleteTaskDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        task={task}
        onSuccess={onClose}
      />
    </>
  );
}
