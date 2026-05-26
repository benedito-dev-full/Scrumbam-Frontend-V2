'use client';

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { X, Calendar, Bot, Play, ChevronDown, CheckCircle2, AlertCircle, Loader2, User } from 'lucide-react';

// ─── Internos ─────────────────────────────────────────────────────────────────
import { useTask, useUpdateTask, useUpdateTaskStatus } from '@/hooks/use-tasks';
import {
  KANBAN_COLUMNS,
  priorityToLabel,
  priorityToColor,
  isOverdue,
} from '@/lib/mappers/task-status.mapper';
import { cn } from '@/lib/utils';
import {
  useTaskExecution,
  detectTaskType,
  TASK_TYPE_LABELS,
  TASK_TYPE_COLORS,
  AI_ASSIGNEE_ID,
} from '@/hooks/use-task-execution';
import { useProjectMembers } from '@/hooks/use-members';

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

        {/* Responsável */}
        <Field label="Responsável">
          <AssigneePicker
            projectId={projectId}
            current={task.assigneeId ?? null}
            onChange={(id) => updateTask({ id: taskId, projectId, dto: { assigneeId: id } })}
          />
        </Field>

        {/* Execução IA — só aparece quando responsável = IA */}
        {task.assigneeId === AI_ASSIGNEE_ID && (
          <AiExecutionPanel taskId={taskId} taskName={task.nome} />
        )}
      </div>
    </DrawerShell>
  );
}

// ─── AssigneePicker ───────────────────────────────────────────────────────────

function AssigneePicker({
  projectId,
  current,
  onChange,
}: {
  projectId: string;
  current: string | null;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const { data: members = [] } = useProjectMembers(projectId);

  const isAi = current === AI_ASSIGNEE_ID;
  const assignedMember = members.find((m) => m.userId === current) ?? null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-[13px] transition-colors hover:border-ring/60"
      >
        {isAi ? (
          <div className="flex items-center gap-2">
            <div className="flex size-5 items-center justify-center rounded-full bg-violet-500/15">
              <Bot className="size-3 text-violet-400" />
            </div>
            <span className="font-medium text-foreground">IA</span>
            <span className="rounded-full bg-violet-500/10 px-1.5 py-px text-[10px] font-semibold text-violet-400">
              automático
            </span>
          </div>
        ) : assignedMember ? (
          <div className="flex items-center gap-2">
            <div className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
              {assignedMember.nome.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium text-foreground">{assignedMember.nome}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">Sem responsável</span>
        )}
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border bg-popover shadow-lg">
          <div className="flex flex-col gap-0.5 p-1">
            {/* Opção IA */}
            <button
              type="button"
              onClick={() => { onChange(AI_ASSIGNEE_ID); setOpen(false); }}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-muted',
                isAi && 'bg-violet-500/10',
              )}
            >
              <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-violet-500/15">
                <Bot className="size-3 text-violet-400" />
              </div>
              <div className="flex flex-1 flex-col">
                <span className="font-semibold text-foreground">IA</span>
                <span className="text-[11px] text-muted-foreground">Executar automaticamente</span>
              </div>
              {isAi && <span className="size-1.5 rounded-full bg-violet-400" />}
            </button>

            {/* Divisor */}
            {members.length > 0 && <div className="my-1 border-t border-border" />}

            {/* Membros do projeto */}
            {members.map((m) => (
              <button
                key={m.userId}
                type="button"
                onClick={() => { onChange(m.userId); setOpen(false); }}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-muted',
                  current === m.userId && 'bg-muted',
                )}
              >
                <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                  {m.nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="font-medium text-foreground">{m.nome}</span>
                  {m.cargo && (
                    <span className="text-[11px] text-muted-foreground">{m.cargo}</span>
                  )}
                </div>
                {current === m.userId && <span className="size-1.5 rounded-full bg-foreground/40" />}
              </button>
            ))}

            {/* Remover */}
            {current && (
              <>
                <div className="my-1 border-t border-border" />
                <button
                  type="button"
                  onClick={() => { onChange(null); setOpen(false); }}
                  className="flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-[12px] text-muted-foreground transition-colors hover:bg-muted"
                >
                  <User className="size-3.5" />
                  Remover responsável
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AiExecutionPanel ─────────────────────────────────────────────────────────

function AiExecutionPanel({ taskId, taskName }: { taskId: string; taskName: string }) {
  const { execution, startExecution, clearExecution } = useTaskExecution(taskId);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const taskType = detectTaskType(taskName);
  const typeColor = TASK_TYPE_COLORS[taskType];
  const typeLabel = TASK_TYPE_LABELS[taskType];
  const isRunning = execution?.status === 'running';
  const isDone = execution?.status === 'done';
  const isFailed = execution?.status === 'failed';

  return (
    <>
      <div className="flex flex-col gap-2.5 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3.5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Bot className="size-3.5 text-violet-400" />
          <span className="text-[12px] font-semibold text-violet-300">Execução IA</span>
          <span
            className="rounded-full px-1.5 py-px text-[10px] font-semibold"
            style={{ background: `${typeColor}20`, color: typeColor }}
          >
            {typeLabel}
          </span>
        </div>

        {/* Estado */}
        {isRunning && (
          <div className="flex items-center gap-2 rounded-lg bg-violet-500/10 px-3 py-2.5">
            <Loader2 className="size-3.5 shrink-0 animate-spin text-violet-400" />
            <span className="text-[12px] text-violet-300">Agente processando a task...</span>
          </div>
        )}

        {isDone && (
          <div className="flex flex-col gap-2 rounded-lg border border-green-500/20 bg-green-500/5 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 shrink-0 text-green-400" />
              <span className="text-[12px] font-semibold text-green-300">Concluído</span>
              {execution.finishedAt && (
                <span className="ml-auto text-[11px] text-muted-foreground">
                  {new Date(execution.finishedAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
            {execution.output && (
              <p className="text-[12px] leading-relaxed text-muted-foreground">{execution.output}</p>
            )}
            <button
              type="button"
              onClick={clearExecution}
              className="self-start text-[11px] text-muted-foreground underline hover:text-foreground"
            >
              Limpar
            </button>
          </div>
        )}

        {isFailed && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5">
            <AlertCircle className="size-3.5 shrink-0 text-red-400" />
            <span className="text-[12px] text-red-300">Execução falhou</span>
            <button
              type="button"
              onClick={clearExecution}
              className="ml-auto text-[11px] text-muted-foreground underline hover:text-foreground"
            >
              Limpar
            </button>
          </div>
        )}

        {/* Botão executar */}
        {!execution && (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-3 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-violet-500"
          >
            <Play className="size-3.5" />
            Executar com IA
          </button>
        )}

        {isDone && (
          <button
            type="button"
            onClick={() => { clearExecution(); setConfirmOpen(true); }}
            className="flex items-center justify-center gap-2 rounded-lg border border-violet-500/30 px-3 py-2 text-[12px] text-violet-400 transition-colors hover:bg-violet-500/10"
          >
            <Play className="size-3.5" />
            Executar novamente
          </button>
        )}
      </div>

      {confirmOpen && (
        <AiConfirmModal
          taskName={taskName}
          taskType={taskType}
          onConfirm={() => { setConfirmOpen(false); startExecution(); }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}

// ─── AiConfirmModal ───────────────────────────────────────────────────────────

function AiConfirmModal({
  taskName,
  taskType,
  onConfirm,
  onCancel,
}: {
  taskName: string;
  taskType: ReturnType<typeof detectTaskType>;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const typeColor = TASK_TYPE_COLORS[taskType];
  const typeLabel = TASK_TYPE_LABELS[taskType];

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed left-1/2 top-1/2 z-[61] w-full max-w-[400px] -translate-x-1/2 -translate-y-1/2 px-4"
      >
        <div className="rounded-2xl border border-border bg-background shadow-2xl">
          <div className="border-b border-border p-5">
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-violet-500/10">
              <Bot className="size-5 text-violet-400" />
            </div>
            <h2 className="text-[16px] font-bold text-foreground">Confirmar execução</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              O agente do projeto vai executar esta task automaticamente.
            </p>
          </div>

          <div className="p-5">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Task
                </span>
                <span className="truncate text-[13px] font-medium text-foreground">{taskName}</span>
              </div>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: `${typeColor}20`, color: typeColor }}
              >
                {typeLabel}
              </span>
            </div>
          </div>

          <div className="flex gap-2 border-t border-border p-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-border py-2.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-violet-600 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-violet-500"
            >
              <Play className="size-3.5" />
              Executar
            </button>
          </div>
        </div>
      </div>
    </>
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
