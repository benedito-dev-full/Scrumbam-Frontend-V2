"use client";

import React, { useEffect, useState } from "react";
import { GripVertical, Lock } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import {
  IcCaret,
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
import { WorkSessionBadge } from "@/components/tasks/work-session-badge";
import { TakeoverConfirmDialog } from "@/components/tasks/takeover-confirm-dialog";
import { useWorkCollisionGuard } from "@/hooks/use-work-collision-guard";
import { useTeams } from "@/hooks/use-teams";
import { isOverdue } from "@/lib/mappers/task-status.mapper";
import type { TaskResponseDto, V3Intention } from "@/lib/types/api";
import type { ProjectMemberDto } from "@/hooks/use-members";
import {
  LIST_SHOW_STATUS_COLUMN,
  LIST_COL_COUNT,
} from "../_lib/list-view-types";
import type { SubtarefasMode, StatusVisualKey } from "../_lib/list-view-types";
import {
  INTENTION_TO_VISUAL_ROW,
  TaskAssigneeCell,
  TaskDueDateCell,
  TaskPriorityCell,
  TaskStatusCell,
  VISUAL_TO_BACKEND_PRIO,
  VISUAL_TO_INTENTION_ROW,
  type PriorityVisualKey,
} from "./task-row-backend-cells";

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
  const { run, dialogProps } = useWorkCollisionGuard();

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
      ? (members.find((m) => m.userId === task.assigneeId) ?? null)
      : null;
  const assigneeTeam =
    !assignee && !isAiAssignee && task.assigneeTeamId
      ? (teams.find((t) => t.id === task.assigneeTeamId) ?? null)
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
    const intention = VISUAL_TO_INTENTION_ROW[sv];
    const doIt = () =>
      updateStatus.mutate({
        id: task.id,
        status: intention,
        projectId: task.projectId,
      });
    // Guarda só ao ENTRAR em EXECUTING; sair (DONE/FAILED) não pergunta.
    if (intention === "EXECUTING") run(task, doIt);
    else doIt();
  }

  function handlePrioChange(p: PriorityVisualKey | null) {
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
    run(task, () =>
      updateTask.mutate({
        id: task.id,
        projectId: task.projectId,
        dto: { assigneeId: memberId, assigneeTeamId: null },
      }),
    );
  }

  function handleTeamChange(teamId: string | null) {
    closeDropdown();
    if (isLocked) return;
    run(task, () =>
      updateTask.mutate({
        id: task.id,
        projectId: task.projectId,
        dto: { assigneeTeamId: teamId, assigneeId: null },
      }),
    );
  }

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
      {/* Task #795: guard de colisão de trabalho humano (mover→EXECUTING /
          reatribuir responsável). Portaliza para body — seguro dentro da
          <tbody>. */}
      <TakeoverConfirmDialog {...dialogProps} />
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
            {/* Task #794: "em trabalho por Fulano" — renderiza apenas em
                EXECUTING com workSession ativa (o componente decide). */}
            <WorkSessionBadge task={task} />
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

        <TaskAssigneeCell
          task={task}
          members={members}
          teams={teams}
          isOpen={openCell === "responsavel"}
          assignee={assignee}
          assigneeTeam={assigneeTeam}
          tdStyle={tdStyle}
          onToggle={() =>
            setOpenCell(openCell === "responsavel" ? null : "responsavel")
          }
          onClose={closeDropdown}
          onAssigneeChange={handleAssigneeChange}
          onTeamChange={handleTeamChange}
        />
        <TaskDueDateCell
          dueDate={task.dueDate}
          overdue={overdue}
          editing={editandoData}
          tdStyle={tdStyle}
          onStartEdit={() => setEditandoData(true)}
          onStopEdit={() => setEditandoData(false)}
          onDateChange={handleDateChange}
        />
        <TaskPriorityCell
          priority={task.priority}
          isOpen={openCell === "prioridade"}
          tdStyle={tdStyle}
          onToggle={() =>
            setOpenCell(openCell === "prioridade" ? null : "prioridade")
          }
          onClose={closeDropdown}
          onPriorityChange={handlePrioChange}
        />
        {/* A Lista agrupa sempre por status, entao esta celula so repetia a
            pilula do grupo em que a linha ja estava. Ver
            LIST_SHOW_STATUS_COLUMN. */}
        {LIST_SHOW_STATUS_COLUMN && (
          <TaskStatusCell
            statusVisual={statusVisual}
            isOpen={openCell === "status"}
            tdStyle={tdStyle}
            onToggle={() =>
              setOpenCell(openCell === "status" ? null : "status")
            }
            onClose={closeDropdown}
            onStatusChange={handleStatusChange}
          />
        )}
        {/* Comentários — só no hover da linha.
            Antes o balao aparecia em TODA linha, e o TaskResponseDto nao traz
            contagem de comentarios: nao havia como mostrar "3". Ou seja, uma
            coluna inteira ocupada por um icone que nao informava nada. Como
            afordancia de clique, o hover basta. */}
        <td
          style={{
            ...tdStyle,
            textAlign: "center",
            color: hovered ? "var(--muted-foreground)" : "transparent",
            transition: "color .12s",
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
                colSpan={LIST_COL_COUNT}
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
                colSpan={LIST_COL_COUNT}
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
              <td
                colSpan={LIST_COL_COUNT}
                style={{ borderBottom: "1px solid #1f1f25" }}
              >
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
