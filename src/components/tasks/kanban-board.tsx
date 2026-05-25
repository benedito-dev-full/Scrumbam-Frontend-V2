'use client';

// ─── Externos ─────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
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
} from '@dnd-kit/core';
import { useQueryClient } from '@tanstack/react-query';

// ─── Internos ─────────────────────────────────────────────────────────────────
import { useTasksByProject, useUpdateTaskStatus } from '@/hooks/use-tasks';
import {
  KANBAN_COLUMNS,
  intentionToColumn,
  isOverdue,
  priorityToColor,
} from '@/lib/mappers/task-status.mapper';
import { qk } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import { TaskDetailDrawer } from '@/components/tasks/task-detail-drawer';

// ─── Types ────────────────────────────────────────────────────────────────────
import type { KanbanColumnConfig } from '@/lib/mappers/task-status.mapper';
import type { TaskResponseDto, V3Intention } from '@/lib/types/api';

// ─── Coluna → intention canônica (primeira da lista = status ao dropar) ────────
const COLUMN_TO_INTENTION: Record<string, V3Intention> = {
  backlog:        'INBOX',
  ready:          'READY',
  'em-progresso': 'EXECUTING',
  concluido:      'DONE',
  falhou:         'FAILED',
};

// ─── KanbanBoard ──────────────────────────────────────────────────────────────

export function KanbanBoard({
  projectId,
  onSelectTask,
}: {
  projectId: string;
  onSelectTask?: (taskId: string) => void;
}) {
  const { data: tasks = [], isLoading } = useTasksByProject(projectId);
  const updateStatus = useUpdateTaskStatus();
  const queryClient = useQueryClient();
  const [activeTask, setActiveTask] = useState<TaskResponseDto | null>(null);
  const [internalSelectedTaskId, setInternalSelectedTaskId] = useState<string | null>(null);

  const isControlled = onSelectTask !== undefined;
  const handleSelectTask = isControlled ? onSelectTask : setInternalSelectedTaskId;

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
        onError: () => {
          // Rollback: revalida a query do backend
          void queryClient.invalidateQueries({ queryKey: qk.tasks.byProject(projectId) });
        },
      },
    );
  }

  if (isLoading) return <KanbanSkeleton />;

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex h-full gap-3 overflow-x-auto p-4">
          {KANBAN_COLUMNS.map((col) => {
            const colTasks = tasks.filter(
              (t) => intentionToColumn(t.status as V3Intention) === col.id,
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
        <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
          {activeTask && <TaskCard task={activeTask} onClick={() => {}} isDragOverlay />}
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
        <span className="size-2.5 rounded-full" style={{ background: config.color }} />
        <span className="text-[13px] font-semibold text-foreground">{config.label}</span>
        <span className="ml-auto text-[12px] text-muted-foreground">{tasks.length}</span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[80px] flex-col gap-2 rounded-xl p-1 transition-colors',
          isOver && 'bg-muted/40 ring-1 ring-border',
          isDragging && !isOver && 'bg-muted/10',
        )}
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={() => onSelectTask(task.id)} />
        ))}
        {tasks.length === 0 && !isDragging && (
          <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-[12px] text-muted-foreground">
            Nenhuma task
          </div>
        )}
        {tasks.length === 0 && isDragging && (
          <div className={cn(
            'rounded-lg border border-dashed px-3 py-6 text-center text-[12px] transition-colors',
            isOver
              ? 'border-violet-500/60 bg-violet-500/10 text-violet-400'
              : 'border-border text-muted-foreground',
          )}>
            {isOver ? 'Soltar aqui' : 'Arraste para cá'}
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
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  const overdue = isOverdue(task.dueDate, task.status as V3Intention);
  const prioColor = priorityToColor(task.priority);

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      {...(isDragOverlay ? {} : { ...listeners, ...attributes })}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      className={cn(
        'cursor-grab rounded-lg border border-border bg-card p-3 shadow-sm transition-all active:cursor-grabbing',
        isDragging && !isDragOverlay && 'opacity-40',
        isDragOverlay && 'rotate-1 shadow-xl ring-1 ring-violet-500/40',
        !isDragging && !isDragOverlay && 'hover:border-border/80 hover:bg-muted/30',
      )}
    >
      {/* Identifier + prioridade */}
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-mono text-[11px] text-muted-foreground">{task.identifier}</span>
        {task.priority && (
          <span
            className="size-1.5 rounded-full"
            style={{ background: prioColor }}
            title={task.priority}
          />
        )}
      </div>

      {/* Título */}
      <p className="text-[13px] leading-snug text-foreground">{task.nome}</p>

      {/* dueDate + badge atrasado */}
      {task.dueDate && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className={cn('text-[11px]', overdue ? 'font-medium text-red-400' : 'text-muted-foreground')}>
            {overdue && '⚠ '}
            {new Date(task.dueDate!.slice(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
            })}
          </span>
          {overdue && (
            <span className="rounded-sm bg-red-500/15 px-1 py-px text-[10px] font-medium text-red-400">
              atrasado
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── KanbanSkeleton ───────────────────────────────────────────────────────────

function KanbanSkeleton() {
  return (
    <div className="flex h-full gap-3 overflow-x-auto p-4">
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
