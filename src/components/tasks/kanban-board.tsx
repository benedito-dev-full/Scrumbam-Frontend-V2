'use client';

// ─── Externos ─────────────────────────────────────────────────────────────────
import React from 'react';

// ─── Internos ─────────────────────────────────────────────────────────────────
import { useTasksByProject } from '@/hooks/use-tasks';
import {
  KANBAN_COLUMNS,
  intentionToColumn,
  isOverdue,
  priorityToColor,
} from '@/lib/mappers/task-status.mapper';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
import type { KanbanColumnConfig } from '@/lib/mappers/task-status.mapper';
import type { TaskResponseDto, V3Intention } from '@/lib/types/api';

// ─── KanbanBoard ──────────────────────────────────────────────────────────────

/**
 * Quadro Kanban V3 com 5 colunas conectadas ao backend.
 *
 * Agrupa tasks por V3 Intention via `intentionToColumn()`.
 * Tasks com `dueDate` no passado em estados não-terminais exibem badge "atrasado".
 *
 * @param projectId - ID do DProject (List, idClasse=-352) cujas tasks serão exibidas.
 *
 * @example
 * ```tsx
 * <KanbanBoard projectId={selectedList.id} />
 * ```
 */
export function KanbanBoard({ projectId }: { projectId: string }) {
  const { data: tasks = [], isLoading } = useTasksByProject(projectId);

  if (isLoading) return <KanbanSkeleton />;

  return (
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
          />
        );
      })}
    </div>
  );
}

// ─── KanbanColumn ─────────────────────────────────────────────────────────────

function KanbanColumn({
  config,
  tasks,
}: {
  config: KanbanColumnConfig;
  tasks: TaskResponseDto[];
}) {
  return (
    <div className="flex w-[280px] shrink-0 flex-col gap-2">
      {/* Header da coluna */}
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

      {/* Cards */}
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-[12px] text-muted-foreground">
            Nenhuma task
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TaskCard ─────────────────────────────────────────────────────────────────

function TaskCard({ task }: { task: TaskResponseDto }) {
  const overdue = isOverdue(task.dueDate, task.status as V3Intention);
  const prioColor = priorityToColor(task.priority);

  return (
    <div className="cursor-pointer rounded-lg border border-border bg-card p-3 shadow-sm transition-colors hover:border-border/80 hover:bg-muted/30">
      {/* Identifier + prioridade */}
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-mono text-[11px] text-muted-foreground">
          {task.identifier}
        </span>
        {task.priority && (
          <span
            className="size-1.5 rounded-full"
            style={{ background: prioColor }}
            title={task.priority}
          />
        )}
      </div>

      {/* Título */}
      <p className="text-[13px] leading-snug text-foreground">{task.title}</p>

      {/* dueDate + badge atrasado */}
      {task.dueDate && (
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className={cn(
              'text-[11px]',
              overdue ? 'font-medium text-red-400' : 'text-muted-foreground',
            )}
          >
            {overdue && '⚠ '}
            {new Date(task.dueDate).toLocaleDateString('pt-BR', {
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
