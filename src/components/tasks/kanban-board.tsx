"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import { Play, Bot, Loader2, User, Lock, Trash2 } from "lucide-react";

// ─── Internos ─────────────────────────────────────────────────────────────────
import { useTasksByProject, useUpdateTaskStatus } from "@/hooks/use-tasks";
import {
  KANBAN_COLUMNS,
  intentionToColumn,
  isOverdue,
  priorityToColor,
} from "@/lib/mappers/task-status.mapper";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { TaskDetailDrawer } from "@/components/tasks/task-detail-drawer";
import { DeleteTaskDialog } from "@/components/tasks/delete-task-dialog";
import { useTaskExecution, AI_ASSIGNEE_ID } from "@/hooks/use-task-execution";
import { useTeams } from "@/hooks/use-teams";

// ─── Types ────────────────────────────────────────────────────────────────────
import type { KanbanColumnConfig } from "@/lib/mappers/task-status.mapper";
import type { TaskResponseDto, V3Intention } from "@/lib/types/api";

// ─── Coluna → intention canônica (primeira da lista = status ao dropar) ────────
const COLUMN_TO_INTENTION: Record<string, V3Intention> = {
  backlog: "INBOX",
  ready: "READY",
  "em-progresso": "EXECUTING",
  concluido: "DONE",
  falhou: "FAILED",
};

// ─── KanbanBoard ──────────────────────────────────────────────────────────────

export function KanbanBoard({
  projectId,
  tasks: tasksProp,
  onSelectTask,
}: {
  projectId: string;
  tasks?: TaskResponseDto[];
  onSelectTask?: (taskId: string) => void;
}) {
  const { data: fetchedTasks = [], isLoading } = useTasksByProject(
    tasksProp === undefined ? projectId : null,
  );
  const tasks = tasksProp ?? fetchedTasks;

  const updateStatus = useUpdateTaskStatus();
  const queryClient = useQueryClient();
  const [activeTask, setActiveTask] = useState<TaskResponseDto | null>(null);
  const [internalSelectedTaskId, setInternalSelectedTaskId] = useState<
    string | null
  >(null);

  const isControlled = onSelectTask !== undefined;
  const handleSelectTask = isControlled
    ? onSelectTask
    : setInternalSelectedTaskId;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const targetCol = over.id as string;
    const newIntention = COLUMN_TO_INTENTION[targetCol];
    if (!newIntention) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Lock UI — task com execução IA ativa não pode mover. Defense-in-depth
    // contra drag pelo teclado: `useDraggable({ disabled })` já bloqueia
    // pointer, mas o handler também rejeita silenciosamente.
    if (task.activeExecution) return;

    // Já está na coluna certa — não fazer nada
    if (intentionToColumn(task.status as V3Intention) === targetCol) return;

    // Atualização otimista — move o card imediatamente na UI
    queryClient.setQueryData<TaskResponseDto[]>(
      qk.tasks.byProject(projectId),
      (prev) =>
        prev?.map((t) =>
          t.id === taskId ? { ...t, status: newIntention } : t,
        ) ?? [],
    );

    // Persiste no backend
    updateStatus.mutate(
      { id: taskId, status: newIntention, projectId },
      {
        onSuccess: () => {
          // Revalida para garantir sincronia com a lista
          void queryClient.invalidateQueries({
            queryKey: qk.tasks.byProject(projectId),
          });
        },
        onError: () => {
          // Rollback
          void queryClient.invalidateQueries({
            queryKey: qk.tasks.byProject(projectId),
          });
        },
      },
    );
  }

  if (isLoading) return <KanbanSkeleton />;

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-full gap-[calc(var(--row-gap)+4px)] overflow-x-auto p-4">
          {KANBAN_COLUMNS.map((col) => {
            const colTasks = tasks.filter(
              (t) =>
                !t.idPai &&
                intentionToColumn(t.status as V3Intention) === col.id,
            );
            return (
              <KanbanColumn
                key={col.id}
                config={col}
                tasks={colTasks}
                onSelectTask={handleSelectTask}
                isDragging={activeTask !== null}
              />
            );
          })}
        </div>

        {/* Card "fantasma" seguindo o cursor durante o drag */}
        <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
          {activeTask && (
            <TaskCard task={activeTask} onClick={() => {}} isDragOverlay />
          )}
        </DragOverlay>
      </DndContext>

      {!isControlled && internalSelectedTaskId !== null && (
        <TaskDetailDrawer
          taskId={internalSelectedTaskId}
          projectId={projectId}
          onClose={() => setInternalSelectedTaskId(null)}
        />
      )}
    </>
  );
}

// ─── KanbanColumn ─────────────────────────────────────────────────────────────

function KanbanColumn({
  config,
  tasks,
  onSelectTask,
  isDragging,
}: {
  config: KanbanColumnConfig;
  tasks: TaskResponseDto[];
  onSelectTask: (id: string) => void;
  isDragging: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: config.id });

  return (
    <div className="flex w-[280px] shrink-0 flex-col gap-2">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <span
          className="size-2.5 rounded-full"
          style={{ background: config.color }}
        />
        <span className="text-[13px] font-semibold text-foreground">
          {config.label}
        </span>
        <span className="ml-auto text-[12px] text-muted-foreground">
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[80px] flex-col gap-[var(--row-gap)] rounded-xl p-1 transition-colors",
          isOver && "bg-muted/40 ring-1 ring-border",
          isDragging && !isOver && "bg-muted/10",
        )}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => onSelectTask(task.id)}
          />
        ))}
        {tasks.length === 0 && !isDragging && (
          <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-[12px] text-muted-foreground">
            Nenhuma task
          </div>
        )}
        {tasks.length === 0 && isDragging && (
          <div
            className={cn(
              "rounded-lg border border-dashed px-3 py-6 text-center text-[12px] transition-colors",
              isOver
                ? "border-violet-500/60 bg-violet-500/10 text-violet-400"
                : "border-border text-muted-foreground",
            )}
          >
            {isOver ? "Soltar aqui" : "Arraste para cá"}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TaskCard ─────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onClick,
  isDragOverlay = false,
}: {
  task: TaskResponseDto;
  onClick: () => void;
  isDragOverlay?: boolean;
}) {
  // Estado terminal (DONE/FAILED) = histórico: sem botão Executar, sem badge
  // de execução, sem bloqueio — mesmo que haja DPedido pendente no banco
  // (DPedidos zumbis de testes ou execuções anteriores não afetam UI final).
  const isTerminalStatus = task.status === "DONE" || task.status === "FAILED";

  // Lock UI — `activeExecution` é a verdade canônica vinda do backend
  // (DPedido idClasse=-300..-304 com baixado=false e dados.taskId=task.id).
  // Suprimido quando task está em estado terminal.
  const isLocked = !isTerminalStatus && task.activeExecution != null;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    disabled: isLocked,
  });
  const overdue = isOverdue(task.dueDate, task.status as V3Intention);
  const prioColor = priorityToColor(task.priority);
  const isAiAssigned = task.assigneeId === AI_ASSIGNEE_ID;
  const { execution, startExecution } = useTaskExecution(
    task.id,
    task.projectId,
  );
  // Fallback para clients que ainda olham o store local — o backend sempre
  // tem a verdade quando recarregar a página.
  const isRunning = isLocked || execution?.status === "running";
  const isDone = execution?.status === "done";
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      {...(isDragOverlay || isLocked ? {} : { ...listeners, ...attributes })}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      title={
        isLocked
          ? "Em execução pela IA — aguarde a conclusão para editar"
          : undefined
      }
      className={cn(
        "group relative rounded-lg border border-border bg-card p-[calc(var(--row-py)+2px)] shadow-sm transition-all",
        isLocked
          ? "cursor-not-allowed opacity-60"
          : "cursor-grab active:cursor-grabbing",
        isDragging && !isDragOverlay && "opacity-40",
        isDragOverlay && "rotate-1 shadow-xl ring-1 ring-violet-500/40",
        !isDragging &&
          !isDragOverlay &&
          !isLocked &&
          "hover:border-border/80 hover:bg-muted/30",
        isAiAssigned && isRunning && "border-violet-500/30 bg-violet-500/5",
        isAiAssigned && isDone && !isLocked && "border-green-500/20",
      )}
    >
      {/* Lixeira no hover — só aparece quando não está em execução */}
      {!isLocked && !isDragOverlay && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setDeleteOpen(true);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          title="Excluir task"
          aria-label="Excluir task"
          className="absolute right-1.5 top-1.5 z-10 rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}

      {/* Dialog de confirmação — controlado por `deleteOpen` */}
      <DeleteTaskDialog
        task={task}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />

      {/* Identifier + prioridade + cadeado */}
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-mono text-[11px] text-muted-foreground">
          {task.identifier}
        </span>
        <div className="flex items-center gap-1.5">
          {isLocked && (
            <span
              title="Em execução pela IA"
              aria-label="Em execução pela IA"
              className="flex items-center gap-1 rounded-sm bg-violet-500/15 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-violet-300"
            >
              <Lock className="size-2.5" />
              {task.activeExecution?.status === "awaiting_approval"
                ? "aprovar"
                : "executando"}
            </span>
          )}
          {task.priority && (
            <span
              className="size-1.5 rounded-full"
              style={{ background: prioColor }}
              title={task.priority}
            />
          )}
        </div>
      </div>

      {/* Título */}
      <p className="text-[13px] leading-snug text-foreground">{task.nome}</p>

      {/* dueDate + badge atrasado */}
      {task.dueDate && (
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className={cn(
              "text-[11px]",
              overdue ? "font-medium text-red-400" : "text-muted-foreground",
            )}
          >
            {overdue && "⚠ "}
            {new Date(
              task.dueDate!.slice(0, 10) + "T12:00:00",
            ).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
            })}
          </span>
          {overdue && (
            <span className="rounded-sm bg-red-500/15 px-1 py-px text-[10px] font-medium text-red-400">
              atrasado
            </span>
          )}
        </div>
      )}

      {/* Footer: IA assignee + botão executar — apenas em tasks não-terminais */}
      {isAiAssigned && !isTerminalStatus && (
        <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2">
          <div className="flex items-center gap-1.5">
            <div className="flex size-4 items-center justify-center rounded-full bg-violet-500/15">
              <Bot className="size-2.5 text-violet-400" />
            </div>
            <span className="text-[11px] text-violet-400">IA</span>
            {(isRunning || isDone) && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-px text-[9px] font-bold",
                  isRunning && "bg-violet-500/15 text-violet-400",
                  isDone && "bg-green-500/15 text-green-400",
                )}
              >
                {isRunning ? "executando" : "concluído"}
              </span>
            )}
          </div>

          {!execution && !isLocked && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                startExecution();
              }}
              title="Executar com IA"
              className="flex items-center gap-1 rounded-md bg-violet-600/80 px-2 py-1 text-[11px] font-semibold text-white opacity-0 transition-all hover:bg-violet-500 group-hover:opacity-100"
            >
              <Play className="size-2.5" />
              Executar
            </button>
          )}

          {isRunning && (
            <Loader2 className="size-3.5 animate-spin text-violet-400" />
          )}
        </div>
      )}

      {/* Footer: responsável humano */}
      {task.assigneeId && !isAiAssigned && (
        <div className="mt-2.5 flex items-center gap-1.5 border-t border-border pt-2">
          <div className="flex size-4 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-foreground">
            <User className="size-2.5 text-muted-foreground" />
          </div>
          <span className="text-[11px] text-muted-foreground">Atribuído</span>
        </div>
      )}

      {/* Footer: time responsável */}
      {task.assigneeTeamId && <TeamBadge teamId={task.assigneeTeamId} />}
    </div>
  );
}

// ─── TeamBadge ────────────────────────────────────────────────────────────────

/**
 * Exibe badge do time responsável (assigneeTeamId) no footer do TaskCard.
 * Carrega dados do time via `useTeams()` e renderiza nome + cor.
 * @param teamId - ID do time a exibir
 */
function TeamBadge({ teamId }: { teamId: string }) {
  const { data: teams = [] } = useTeams();
  const team = teams.find((t) => t.id === teamId);
  if (!team) return null;
  return (
    <div className="mt-1.5 flex items-center gap-1.5 border-t border-border pt-1.5">
      <span
        className="size-2 rounded-full"
        style={{ background: team.color ?? "var(--muted-foreground)" }}
      />
      <span className="text-[11px] text-muted-foreground">{team.nome}</span>
    </div>
  );
}

// ─── KanbanSkeleton ───────────────────────────────────────────────────────────

function KanbanSkeleton() {
  return (
    <div className="flex h-full gap-[calc(var(--row-gap)+4px)] overflow-x-auto p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex w-[280px] shrink-0 flex-col gap-2">
          <div className="h-5 w-24 animate-pulse rounded bg-muted" />
          {[1, 2].map((j) => (
            <div key={j} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ))}
    </div>
  );
}
