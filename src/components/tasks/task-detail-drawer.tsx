'use client';

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { X, Calendar } from 'lucide-react';

// ─── Internos ─────────────────────────────────────────────────────────────────
import { useTask, useUpdateTask, useUpdateTaskStatus } from '@/hooks/use-tasks';
import {
  KANBAN_COLUMNS,
  priorityToLabel,
  priorityToColor,
  isOverdue,
} from '@/lib/mappers/task-status.mapper';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
import type { V3Intention } from '@/lib/types/api';

// ─── Constantes ───────────────────────────────────────────────────────────────

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

/** Mapeia coluna Kanban → V3 Intention primária para o PATCH de status. */
const COLUMN_TO_INTENTION: Record<string, string> = {
  backlog: 'INBOX',
  ready: 'READY',
  'em-progresso': 'EXECUTING',
  concluido: 'DONE',
  falhou: 'FAILED',
};

// ─── TaskDetailDrawer ─────────────────────────────────────────────────────────

/**
 * Drawer lateral de detalhe e edição inline de uma DTask V2.
 *
 * Abre via slide da direita ao clicar em um TaskCard no KanbanBoard.
 * Campos editáveis: título (double-click), status, prioridade, dueDate, descrição.
 * Todas as edições fazem PATCH imediato no backend via useUpdateTask/useUpdateTaskStatus.
 *
 * @param taskId    - ID da DTask a exibir.
 * @param projectId - ID do DProject (List) para invalidação do cache.
 * @param onClose   - Callback para fechar o drawer.
 *
 * @example
 * ```tsx
 * <TaskDetailDrawer taskId={selectedId} projectId={listId} onClose={() => setSelectedId(null)} />
 * ```
 */
export function TaskDetailDrawer({
  taskId,
  projectId,
  onClose,
}: {
  taskId: string;
  projectId: string;
  onClose: () => void;
}) {
  const { data: task, isLoading } = useTask(taskId);
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTask();
  const { mutate: updateStatus } = useUpdateTaskStatus();

  if (isLoading) {
    return (
      <DrawerShell onClose={onClose}>
        <DrawerSkeleton />
      </DrawerShell>
    );
  }

  if (!task) return null;

  const overdue = isOverdue(task.dueDate, task.status as V3Intention);

  return (
    <DrawerShell onClose={onClose}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-border p-4">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <span className="font-mono text-[11px] text-muted-foreground">{task.identifier}</span>
          <EditableTitle
            value={task.nome}
            onSave={(titulo) => updateTask({ id: taskId, projectId, dto: { titulo } })}
            disabled={isUpdating}
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-0.5 shrink-0 rounded p-1 hover:bg-muted"
          aria-label="Fechar"
        >
          <X className="size-4 text-muted-foreground" />
        </button>
      </div>

      {/* Campos */}
      <div className="flex flex-col gap-4 overflow-y-auto p-4">
        {/* Status */}
        <Field label="Status">
          <StatusPicker
            current={task.status}
            onChange={(status) => updateStatus({ id: taskId, status, projectId })}
          />
        </Field>

        {/* Prioridade */}
        <Field label="Prioridade">
          <PriorityPicker
            current={task.priority}
            onChange={(priority) => updateTask({ id: taskId, projectId, dto: { priority } })}
          />
        </Field>

        {/* Data de entrega */}
        <Field label="Data de entrega">
          <div className="flex items-center gap-2">
            <Calendar className="size-3.5 text-muted-foreground" />
            <input
              type="date"
              defaultValue={task.dueDate ? task.dueDate.slice(0, 10) : ''}
              className={cn(
                'bg-transparent text-[13px] outline-none',
                overdue ? 'text-red-400' : 'text-foreground',
              )}
              onChange={(e) => {
                const val = e.target.value;
                updateTask({ id: taskId, projectId, dto: { dueDate: val || null } });
              }}
            />
            {overdue && (
              <span className="rounded-sm bg-red-500/15 px-1.5 py-px text-[10px] font-medium text-red-400">
                atrasado
              </span>
            )}
          </div>
        </Field>

        {/* Descrição */}
        <Field label="Descrição">
          <EditableTextarea
            value={task.description ?? ''}
            placeholder="Adicionar descrição..."
            onSave={(descricao) => updateTask({ id: taskId, projectId, dto: { descricao } })}
            disabled={isUpdating}
          />
        </Field>
      </div>
    </DrawerShell>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function DrawerShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-[420px] flex-col border-l border-border bg-background shadow-2xl">
        {children}
      </div>
    </>
  );
}

function DrawerSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="h-6 w-32 animate-pulse rounded bg-muted" />
      <div className="h-4 w-full animate-pulse rounded bg-muted" />
      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function EditableTitle({
  value,
  onSave,
  disabled,
}: {
  value: string;
  onSave: (v: string) => void;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <input
        autoFocus
        className="w-full rounded bg-transparent px-1 text-[15px] font-semibold outline-none ring-1 ring-ring"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (draft.trim() && draft !== value) onSave(draft.trim());
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') {
            setEditing(false);
            setDraft(value);
          }
        }}
        disabled={disabled}
      />
    );
  }

  return (
    <h2
      className="cursor-text text-[15px] font-semibold text-foreground hover:text-primary"
      onDoubleClick={() => setEditing(true)}
      title="Double-click para editar"
    >
      {value}
    </h2>
  );
}

function EditableTextarea({
  value,
  placeholder,
  onSave,
  disabled,
}: {
  value: string;
  placeholder?: string;
  onSave: (v: string) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(value);

  return (
    <textarea
      rows={3}
      className="w-full resize-none rounded-md border border-border bg-muted/20 px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== value) onSave(draft);
      }}
      disabled={disabled}
    />
  );
}

function StatusPicker({
  current,
  onChange,
}: {
  current: string;
  onChange: (s: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {KANBAN_COLUMNS.map((col) => {
        const intention = COLUMN_TO_INTENTION[col.id];
        const isActive =
          current === intention ||
          (col.id === 'em-progresso' && (current === 'EXECUTING' || current === 'VALIDATING')) ||
          (col.id === 'concluido' &&
            ['DONE', 'VALIDATED', 'CANCELLED', 'DISCARDED'].includes(current));

        return (
          <button
            key={col.id}
            type="button"
            onClick={() => onChange(intention)}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors',
              isActive
                ? 'border-transparent text-white'
                : 'border-border text-muted-foreground hover:border-border/60 hover:text-foreground',
            )}
            style={isActive ? { background: col.color } : {}}
          >
            <span
              className="size-1.5 rounded-full"
              style={{ background: isActive ? 'white' : col.color }}
            />
            {col.label}
          </button>
        );
      })}
    </div>
  );
}

function PriorityPicker({
  current,
  onChange,
}: {
  current?: string;
  onChange: (p: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PRIORITIES.map((p) => {
        const isActive = current === p;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={cn(
              'rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors',
              isActive
                ? 'border-transparent text-white'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
            style={isActive ? { background: priorityToColor(p) } : {}}
          >
            {priorityToLabel(p)}
          </button>
        );
      })}
    </div>
  );
}
