"use client";

import React, { useEffect, useState } from "react";
import { GripVertical, Lock } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import {
  IcCaret,
  IcCheck,
  IcChat,
  IcGitFork,
  IcPending,
  IcPlus,
} from "@/components/lists/icons";
import { STATUS_CONFIG } from "@/components/lists/config";
import {
  useUpdateTask,
  useUpdateTaskStatus,
  useCreateTask,
  useSubtasks,
} from "@/hooks/use-tasks";
import { AI_ASSIGNEE_ID, useTaskExecution } from "@/hooks/use-task-execution";
import { useTeams } from "@/hooks/use-teams";
import {
  isOverdue,
  priorityToColor,
  priorityToLabel,
} from "@/lib/mappers/task-status.mapper";
import type {
  TaskResponseDto,
  TaskPriority,
  V3Intention,
} from "@/lib/types/api";
import type { ProjectMemberDto } from "@/hooks/use-members";
import type { SubtarefasMode, StatusVisualKey } from "../_lib/list-view-types";
import { ClaudeAvatar } from "./claude-avatar";

// ─── Ícones inline das células ────────────────────────────────────────────────
function IcCalendarInline({
  size = 13,
  color = "var(--muted-foreground)",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function IcUserInline({
  size = 13,
  color = "var(--muted-foreground)",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function IcFlagInline({ size, color }: { size: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M3 2v12M3 2h8l-2 3.5L11 9H3"
        stroke={color ?? "currentColor"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Helpers de estilo para dropdowns inline ─────────────────────────────────
function dropItemStyle(color: string): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "7px 10px",
    borderRadius: 5,
    background: "none",
    border: 0,
    cursor: "pointer",
    color,
    fontSize: 12,
    textAlign: "left" as const,
  };
}

function assigneeItemStyle(color: string): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "6px 10px",
    borderRadius: 6,
    background: "none",
    border: 0,
    cursor: "pointer",
    color,
    fontSize: 13,
    textAlign: "left" as const,
    transition: "background .1s",
  };
}

// ─── Mapeamentos para dropdowns inline ───────────────────────────────────────
const INTENTION_TO_VISUAL_ROW: Record<V3Intention, StatusVisualKey> = {
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

const VISUAL_TO_INTENTION_ROW: Record<StatusVisualKey, V3Intention> = {
  backlog: "INBOX",
  pronto: "READY",
  "em-progresso": "EXECUTING",
  concluido: "DONE",
  falhou: "FAILED",
  atrasado: "INBOX",
};

const PRIO_VISUAL_MAP: Record<TaskPriority, keyof typeof PRIO_CONFIG_MAP> = {
  URGENT: "urgente",
  HIGH: "alta",
  MEDIUM: "media",
  LOW: "baixa",
};
const PRIO_CONFIG_MAP = {
  urgente: { label: "Urgente", color: "#ef4444" },
  alta: { label: "Alta", color: "#f59e0b" },
  media: { label: "Média", color: "#60a5fa" },
  baixa: { label: "Baixa", color: "var(--muted-foreground)" },
};
const VISUAL_TO_BACKEND_PRIO: Record<
  keyof typeof PRIO_CONFIG_MAP,
  TaskPriority
> = {
  urgente: "URGENT",
  alta: "HIGH",
  media: "MEDIUM",
  baixa: "LOW",
};
const ALL_STATUS_VISUAL_ROW: StatusVisualKey[] = [
  "backlog",
  "pronto",
  "em-progresso",
  "concluido",
  "falhou",
];
const ALL_PRIO_VISUAL_ROW = Object.keys(
  PRIO_CONFIG_MAP,
) as (keyof typeof PRIO_CONFIG_MAP)[];

// ─── TaskRow adaptado para dados reais do backend ────────────────────────────
export function TaskRowBackend({
  task,
  onOpenTask,
  members,
  depth = 0,
  subtarefasMode,
}: {
  task: TaskResponseDto;
  onOpenTask: (t: TaskResponseDto) => void;
  members: ProjectMemberDto[];
  depth?: number;
  subtarefasMode?: SubtarefasMode;
}) {
  const updateTask = useUpdateTask();
  const updateStatus = useUpdateTaskStatus();
  const createTask = useCreateTask();
  const { data: teams = [] } = useTeams();

  const [hovered, setHovered] = useState(false);
  const [openCell, setOpenCell] = useState<
    "status" | "prioridade" | "responsavel" | null
  >(null);
  const [editandoData, setEditandoData] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [newSubtaskName, setNewSubtaskName] = useState("");

  // TODO: refatorar para derivar expandido do subtarefasMode sem useEffect.
  // Preservado como-está nesta iteração para limitar escopo do fix de tasks
  // terminais (mudança não relacionada ao bug original deste effect).
  useEffect(() => {
    if (subtarefasMode === "expandidas") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpanded(true);
    } else if (subtarefasMode === "recolhidas") {
      setExpanded(false);
      setAddingSubtask(false);
      setNewSubtaskName("");
    }
  }, [subtarefasMode]);

  const { data: subtasks = [], isLoading: loadingSubtasks } = useSubtasks(
    task.id,
    expanded,
  );

  const overdue = isOverdue(task.dueDate, task.status as V3Intention);
  const prioColor = priorityToColor(task.priority);
  const prioLabel = priorityToLabel(task.priority);
  const statusVisual: StatusVisualKey = overdue
    ? "atrasado"
    : (INTENTION_TO_VISUAL_ROW[task.status as V3Intention] ?? "backlog");
  const statusCfg = STATUS_CONFIG[statusVisual];
  const StatusIcon = statusCfg.Icon;

  const isAiAssignee = task.assigneeId === AI_ASSIGNEE_ID;
  const {
    execution: aiExecution,
    startExecution: startAiExecution,
    isSubmitting: isAiSubmitting,
  } = useTaskExecution(task.id, task.projectId);
  const assignee =
    task.assigneeId && !isAiAssignee
      ? members.find((m) => m.userId === task.assigneeId)
      : null;
  const assigneeInitials = assignee
    ? assignee.nome
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : null;
  const assigneeTeam =
    !assignee && !isAiAssignee && task.assigneeTeamId
      ? teams.find((t) => t.id === task.assigneeTeamId)
      : null;

  const dateLabel = task.dueDate
    ? new Date(task.dueDate.slice(0, 10) + "T12:00:00").toLocaleDateString(
        "pt-BR",
        { day: "2-digit", month: "short" },
      )
    : null;

  const tdStyle: React.CSSProperties = {
    borderBottom: "1px solid #1f1f25",
    background: hovered ? "var(--accent)" : "transparent",
    transition: "background .1s",
  };

  function closeDropdown() {
    setOpenCell(null);
  }

  // Defense-in-depth: mesmo que as UI fechem o dropdown quando isLocked,
  // gatekeep nos handlers garante que cliques rápidos ou bugs visuais
  // não disparem mutation em task travada pela execução IA.
  function handleStatusChange(sv: StatusVisualKey) {
    closeDropdown();
    if (isLocked) return;
    updateStatus.mutate({
      id: task.id,
      status: VISUAL_TO_INTENTION_ROW[sv],
      projectId: task.projectId,
    });
  }

  function handlePrioChange(p: keyof typeof PRIO_CONFIG_MAP | null) {
    closeDropdown();
    if (isLocked) return;
    updateTask.mutate({
      id: task.id,
      projectId: task.projectId,
      dto: { priority: p ? VISUAL_TO_BACKEND_PRIO[p] : undefined },
    });
  }

  function handleDateChange(val: string | null) {
    setEditandoData(false);
    if (isLocked) return;
    updateTask.mutate({
      id: task.id,
      projectId: task.projectId,
      dto: { dueDate: val },
    });
  }

  function handleAssigneeChange(memberId: string | null) {
    closeDropdown();
    if (isLocked) return;
    updateTask.mutate({
      id: task.id,
      projectId: task.projectId,
      dto: { assigneeId: memberId, assigneeTeamId: null },
    });
  }

  function handleTeamChange(teamId: string | null) {
    closeDropdown();
    if (isLocked) return;
    updateTask.mutate({
      id: task.id,
      projectId: task.projectId,
      dto: { assigneeTeamId: teamId, assigneeId: null },
    });
  }

  const currentPrioVisual = task.priority
    ? PRIO_VISUAL_MAP[task.priority as TaskPriority]
    : null;
  const indent = 8 + depth * 30;
  // Estado terminal (DONE/FAILED) = histórico: sem botão Executar, sem badge,
  // sem bloqueio. Task acabada não exige ação nem trava UI mesmo que haja
  // DPedido pendente (zumbi).
  const isTerminalStatus = task.status === "DONE" || task.status === "FAILED";

  // Lock UI — `activeExecution` é a verdade canônica do backend (DPedido
  // -300..-304 com baixado=false e dados.taskId=task.id). Suprimido em
  // estado terminal.
  const isLocked = !isTerminalStatus && task.activeExecution != null;
  const lockTitle = isLocked
    ? "Em execução pela IA — aguarde a conclusão para editar"
    : undefined;
  const isDraggable = depth === 0 && !isLocked;
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging: isBeingDragged,
  } = useDraggable({
    id: task.id,
    disabled: !isDraggable,
  });

  function handleAddSubtask() {
    const nome = newSubtaskName.trim();
    if (!nome) return;
    createTask.mutate(
      { titulo: nome, idProject: task.projectId, idPai: task.id },
      {
        onSuccess: () => {
          setNewSubtaskName("");
          setAddingSubtask(false);
          setExpanded(true);
        },
      },
    );
  }

  return (
    <>
      <tr
        ref={isDraggable ? setDragRef : undefined}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ cursor: "default", opacity: isBeingDragged ? 0.4 : 1 }}
      >
        {/* Handle de drag — só em tasks raiz */}
        <td style={{ ...tdStyle, width: 24, padding: 0 }}>
          {isDraggable && (
            <div
              {...listeners}
              {...attributes}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "calc(var(--row-h) - 4px)",
                cursor: "grab",
                color: hovered ? "var(--muted-foreground)" : "transparent",
                transition: "color .15s",
              }}
            >
              <GripVertical size={13} />
            </div>
          )}
        </td>
        {/* Nome — clique no título abre TaskSheet */}
        <td style={{ ...tdStyle, padding: "0 10px 0 0" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: "calc(var(--row-h) - 4px)",
              paddingLeft: indent,
            }}
          >
            {/* Caret — sempre caret. No hover expande + abre input; fora do hover só expande/recolhe */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (hovered && !expanded) {
                  setExpanded(true);
                  setAddingSubtask(true);
                } else {
                  // recolher: cancela input pendente
                  if (expanded) {
                    setAddingSubtask(false);
                    setNewSubtaskName("");
                  }
                  setExpanded((v) => !v);
                }
              }}
              style={{
                width: 16,
                height: 16,
                flexShrink: 0,
                background: "none",
                border: 0,
                color: hovered
                  ? "var(--foreground)"
                  : "var(--muted-foreground)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
                transition: "transform .15s, color .1s",
              }}
            >
              <IcCaret size={10} />
            </button>
            <span
              style={{
                color: statusCfg.iconColor,
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <StatusIcon size={13} />
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={() => onOpenTask(task)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onOpenTask(task);
              }}
              style={{
                fontSize: 13,
                color: "var(--foreground)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
              title="Abrir detalhes"
            >
              {task.nome}
            </span>
            {task.idPai && <IcGitFork size={12} />}
            {/* Lock badge — task com execução IA ativa fica read-only */}
            {isLocked && (
              <span
                title={lockTitle}
                aria-label={lockTitle}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 7px",
                  borderRadius: 4,
                  background: "rgba(124,92,255,0.18)",
                  color: "#cfc1ff",
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                  flexShrink: 0,
                }}
              >
                <Lock size={10} />
                {task.activeExecution?.status === "awaiting_approval"
                  ? "aprovar"
                  : "executando"}
              </span>
            )}
            {/* Botão Executar — só em tasks atribuídas ao Claude, sem lock
                ativo e fora de estado terminal (concluído/falhou é histórico) */}
            {isAiAssignee && !isLocked && !isTerminalStatus && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  startAiExecution();
                }}
                disabled={isAiSubmitting || !!aiExecution}
                title={
                  aiExecution
                    ? `Status: ${aiExecution.status}`
                    : "Executar com Claude"
                }
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 9px",
                  borderRadius: 6,
                  border: "1px solid rgba(34,197,94,0.35)",
                  cursor: "pointer",
                  background: "rgba(34,197,94,0.18)",
                  color: "#86efac",
                  fontSize: 11,
                  fontWeight: 600,
                  flexShrink: 0,
                  transition: "background .15s, border-color .15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(34,197,94,0.32)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(34,197,94,0.55)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(34,197,94,0.18)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(34,197,94,0.35)";
                }}
              >
                <svg
                  width="9"
                  height="10"
                  viewBox="0 0 9 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M1 1.5L8 5L1 8.5V1.5Z" fill="#86efac" />
                </svg>
                Executar
              </button>
            )}
            {/* "+" no final da célula Nome, antes de Responsável — só no hover */}
            {hovered && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(true);
                  setAddingSubtask(true);
                }}
                title="Adicionar subtarefa"
                style={{
                  marginLeft: "auto",
                  flexShrink: 0,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  border: 0,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--foreground)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#7c5cff";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "var(--accent)";
                }}
              >
                <IcPlus size={11} />
              </button>
            )}
          </div>
        </td>

        {/* Responsável — dropdown inline com membros reais */}
        <td style={{ ...tdStyle, padding: "0 10px", position: "relative" }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenCell(openCell === "responsavel" ? null : "responsavel");
            }}
            style={{
              background: "none",
              border: 0,
              cursor: "pointer",
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
            title="Alterar responsável"
          >
            {isAiAssignee ? (
              <>
                <ClaudeAvatar size={22} />
                <span
                  style={{ fontSize: 12, color: "#d97757", fontWeight: 600 }}
                >
                  Claude
                </span>
              </>
            ) : assignee ? (
              <>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: "var(--accent)",
                    color: "#d8ccff",
                    fontSize: 9,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {assigneeInitials}
                </span>
                <span style={{ fontSize: 12, color: "var(--foreground)" }}>
                  {assignee.nome.split(" ")[0]}
                </span>
              </>
            ) : assigneeTeam ? (
              <>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: assigneeTeam.color ?? "var(--muted-foreground)",
                  }}
                />
                <span style={{ fontSize: 12, color: "var(--foreground)" }}>
                  {assigneeTeam.nome}
                </span>
              </>
            ) : (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  color: "var(--muted-foreground)",
                }}
              >
                <IcUserInline size={13} color="var(--muted-foreground)" />
                <span style={{ fontSize: 12 }}>Atribuir</span>
              </span>
            )}
          </button>
          {openCell === "responsavel" && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 100 }}
                onClick={closeDropdown}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  zIndex: 101,
                  background: "var(--card)",
                  border: "1px solid #2e2e38",
                  borderRadius: 10,
                  padding: "6px",
                  minWidth: 220,
                  maxHeight: 320,
                  overflowY: "auto",
                  boxShadow: "0 12px 32px rgba(0,0,0,.6)",
                }}
              >
                <button
                  type="button"
                  onClick={() => handleAssigneeChange(null)}
                  style={{
                    ...assigneeItemStyle("var(--muted-foreground)"),
                    gap: 10,
                  }}
                >
                  <IcUserInline size={14} color="var(--muted-foreground)" />
                  <span style={{ color: "var(--foreground)" }}>
                    Sem responsável
                  </span>
                  {!task.assigneeId && <IcCheck size={12} />}
                </button>
                {members.map((m) => {
                  const initials = m.nome
                    .split(" ")
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase();
                  const isSelected = task.assigneeId === m.userId;
                  return (
                    <button
                      key={m.userId}
                      type="button"
                      onClick={() => handleAssigneeChange(m.userId)}
                      style={{
                        ...assigneeItemStyle("var(--foreground)"),
                        gap: 8,
                        background: isSelected
                          ? "rgba(124,92,255,0.14)"
                          : "none",
                      }}
                    >
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          flexShrink: 0,
                          background: "var(--accent)",
                          color: "#d8ccff",
                          fontSize: 11,
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {initials}
                      </span>
                      <span style={{ flex: 1, fontSize: 13 }}>{m.nome}</span>
                      {isSelected && <IcCheck size={12} />}
                    </button>
                  );
                })}
                <div
                  style={{ borderTop: "1px solid #2e2e38", margin: "6px 4px" }}
                />
                <button
                  type="button"
                  onClick={() => handleAssigneeChange(AI_ASSIGNEE_ID)}
                  style={{
                    ...assigneeItemStyle("#d97757"),
                    gap: 8,
                    background:
                      task.assigneeId === AI_ASSIGNEE_ID
                        ? "rgba(217,119,87,0.14)"
                        : "none",
                  }}
                >
                  <ClaudeAvatar size={20} />
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: "#d97757",
                      fontWeight: 600,
                    }}
                  >
                    Claude
                  </span>
                  {task.assigneeId === AI_ASSIGNEE_ID && <IcCheck size={12} />}
                </button>
                {/* Seção Times */}
                {teams.length > 0 && (
                  <>
                    <div
                      style={{
                        borderTop: "1px solid #2e2e38",
                        margin: "6px 4px",
                      }}
                    />
                    <span
                      style={{
                        display: "block",
                        padding: "2px 12px 4px",
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--muted-foreground)",
                      }}
                    >
                      Times
                    </span>
                    {teams.map((team) => {
                      const isTeamSelected = task.assigneeTeamId === team.id;
                      return (
                        <button
                          key={team.id}
                          type="button"
                          onClick={() =>
                            handleTeamChange(isTeamSelected ? null : team.id)
                          }
                          style={{
                            ...assigneeItemStyle("var(--foreground)"),
                            gap: 8,
                            background: isTeamSelected
                              ? "rgba(124,92,255,0.14)"
                              : "none",
                          }}
                        >
                          <span
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              flexShrink: 0,
                              background:
                                team.color ?? "var(--muted-foreground)",
                            }}
                          />
                          <span style={{ flex: 1, fontSize: 13 }}>
                            {team.nome}
                          </span>
                          {isTeamSelected && <IcCheck size={12} />}
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            </>
          )}
        </td>

        {/* Data de vencimento — ícone de calendário quando vazia */}
        <td style={{ ...tdStyle, padding: "0 10px", position: "relative" }}>
          {editandoData ? (
            <input
              type="date"
              autoFocus
              defaultValue={task.dueDate?.slice(0, 10) ?? ""}
              onChange={(e) => handleDateChange(e.target.value || null)}
              onBlur={() => setEditandoData(false)}
              style={{
                background: "var(--card)",
                border: "1px solid #7c5cff",
                borderRadius: 5,
                color: "var(--foreground)",
                fontSize: 12,
                padding: "2px 6px",
                outline: "none",
                colorScheme: "dark",
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditandoData(true)}
              style={{
                background: "none",
                border: 0,
                cursor: "pointer",
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
              title="Alterar data"
            >
              {dateLabel ? (
                <span
                  style={{
                    fontSize: 12,
                    color: overdue ? "#fbbf24" : "var(--muted-foreground)",
                  }}
                >
                  {overdue && "⚠ "}
                  {dateLabel}
                </span>
              ) : (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <IcCalendarInline size={13} color="var(--muted-foreground)" />
                  <span
                    style={{ fontSize: 12, color: "var(--muted-foreground)" }}
                  >
                    Definir data
                  </span>
                </span>
              )}
            </button>
          )}
        </td>

        {/* Prioridade — ícone de bandeira quando vazia */}
        <td style={{ ...tdStyle, padding: "0 10px", position: "relative" }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenCell(openCell === "prioridade" ? null : "prioridade");
            }}
            style={{
              background: "none",
              border: 0,
              cursor: "pointer",
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
            title="Alterar prioridade"
          >
            {task.priority ? (
              <>
                <IcFlagInline size={12} color={prioColor} />
                <span style={{ fontSize: 12, color: prioColor }}>
                  {prioLabel}
                </span>
              </>
            ) : (
              <span
                style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
              >
                <IcFlagInline size={12} color="var(--muted-foreground)" />
                <span
                  style={{ fontSize: 12, color: "var(--muted-foreground)" }}
                >
                  Definir
                </span>
              </span>
            )}
          </button>
          {openCell === "prioridade" && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 100 }}
                onClick={closeDropdown}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 2px)",
                  left: 0,
                  zIndex: 101,
                  background: "var(--card)",
                  border: "1px solid #2e2e38",
                  borderRadius: 8,
                  padding: 4,
                  minWidth: 150,
                  boxShadow: "0 8px 24px rgba(0,0,0,.5)",
                }}
              >
                <button
                  type="button"
                  onClick={() => handlePrioChange(null)}
                  style={dropItemStyle("var(--muted-foreground)")}
                >
                  <IcFlagInline size={12} color="var(--muted-foreground)" />
                  <span style={{ color: "var(--foreground)" }}>
                    Sem prioridade
                  </span>
                  {!task.priority && <IcCheck size={11} />}
                </button>
                {ALL_PRIO_VISUAL_ROW.map((p) => {
                  const cfg = PRIO_CONFIG_MAP[p];
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePrioChange(p)}
                      style={dropItemStyle(cfg.color)}
                    >
                      <IcFlagInline size={12} color={cfg.color} />
                      <span style={{ color: "var(--foreground)" }}>
                        {cfg.label}
                      </span>
                      {currentPrioVisual === p && <IcCheck size={11} />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </td>

        {/* Status — ícone do status atual + dropdown */}
        <td style={{ ...tdStyle, padding: "0 10px", position: "relative" }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenCell(openCell === "status" ? null : "status");
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: "none",
              border: 0,
              cursor: "pointer",
              padding: 0,
              color: statusCfg.iconColor,
              fontSize: 12,
              fontWeight: 600,
            }}
            title="Alterar status"
          >
            <StatusIcon size={12} />
            <span>{statusCfg.label}</span>
          </button>
          {openCell === "status" && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 100 }}
                onClick={closeDropdown}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 2px)",
                  left: 0,
                  zIndex: 101,
                  background: "var(--card)",
                  border: "1px solid #2e2e38",
                  borderRadius: 8,
                  padding: 4,
                  minWidth: 160,
                  boxShadow: "0 8px 24px rgba(0,0,0,.5)",
                }}
              >
                {ALL_STATUS_VISUAL_ROW.map((sv) => {
                  const cfg = STATUS_CONFIG[sv];
                  const Icon = cfg.Icon;
                  const isSelected = statusVisual === sv;
                  return (
                    <button
                      key={sv}
                      type="button"
                      onClick={() => handleStatusChange(sv)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: 5,
                        background: isSelected
                          ? "rgba(124,92,255,0.12)"
                          : "none",
                        border: 0,
                        cursor: "pointer",
                        textAlign: "left" as const,
                        color: cfg.iconColor,
                        fontSize: 12,
                      }}
                    >
                      <Icon size={12} />
                      <span style={{ color: "var(--foreground)" }}>
                        {cfg.label}
                      </span>
                      {isSelected && <IcCheck size={11} />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </td>

        {/* Comentários */}
        <td
          style={{
            ...tdStyle,
            textAlign: "center",
            color: "var(--muted-foreground)",
          }}
        >
          <IcChat size={13} />
        </td>

        {/* Ações */}
        <td style={{ ...tdStyle }} />
      </tr>

      {/* Subtarefas — lazy, recursivas */}
      {expanded && (
        <>
          {loadingSubtasks && (
            <tr>
              <td
                colSpan={7}
                style={{
                  padding: "6px 0 6px",
                  paddingLeft: indent + 22,
                  color: "var(--muted-foreground)",
                  fontSize: 12,
                  borderBottom: "1px solid #1f1f25",
                }}
              >
                Carregando...
              </td>
            </tr>
          )}
          {subtasks.map((sub) => (
            <TaskRowBackend
              key={sub.id}
              task={sub}
              onOpenTask={onOpenTask}
              members={members}
              depth={depth + 1}
              subtarefasMode={subtarefasMode}
            />
          ))}
          {/* Linha de adicionar subtarefa */}
          {addingSubtask ? (
            <tr>
              <td
                colSpan={7}
                style={{ borderBottom: "1px solid #1f1f25", padding: 0 }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    height: 34,
                    paddingLeft: indent + 22,
                  }}
                >
                  <span
                    style={{
                      color: "var(--muted-foreground)",
                      flexShrink: 0,
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    <IcPending size={13} />
                  </span>
                  <input
                    autoFocus
                    value={newSubtaskName}
                    onChange={(e) => setNewSubtaskName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddSubtask();
                      if (e.key === "Escape") {
                        setAddingSubtask(false);
                        setNewSubtaskName("");
                      }
                    }}
                    placeholder="Nome da subtarefa..."
                    style={{
                      flex: 1,
                      background: "none",
                      border: "none",
                      outline: "none",
                      color: "var(--foreground)",
                      fontSize: 13,
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    disabled={createTask.isPending || !newSubtaskName.trim()}
                    style={{
                      background: "none",
                      border: 0,
                      color: "#7c5cff",
                      cursor: "pointer",
                      fontSize: 12,
                      padding: "0 8px",
                    }}
                  >
                    {createTask.isPending ? "..." : "Salvar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingSubtask(false);
                      setNewSubtaskName("");
                    }}
                    style={{
                      background: "none",
                      border: 0,
                      color: "var(--muted-foreground)",
                      cursor: "pointer",
                      fontSize: 12,
                      padding: "0 8px",
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </td>
            </tr>
          ) : (
            <tr>
              <td colSpan={7} style={{ borderBottom: "1px solid #1f1f25" }}>
                <button
                  type="button"
                  onClick={() => setAddingSubtask(true)}
                  style={{
                    background: "none",
                    border: 0,
                    cursor: "pointer",
                    paddingLeft: indent + 22,
                    height: 30,
                    width: "100%",
                    textAlign: "left",
                    color: "var(--muted-foreground)",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <IcPlus size={11} />
                  Adicionar subtarefa
                </button>
              </td>
            </tr>
          )}
        </>
      )}
    </>
  );
}
