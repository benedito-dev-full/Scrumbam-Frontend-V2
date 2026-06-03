"use client";

// --- Externos -------------------------------------------------------------
import { useState } from "react";
import { X, Calendar, Lock, Trash2 } from "lucide-react";

// --- Internos -------------------------------------------------------------
import { useTask, useUpdateTask, useUpdateTaskStatus } from "@/hooks/use-tasks";
import { DeleteTaskDialog } from "@/components/tasks/delete-task-dialog";
import { TaskTimerPanel } from "@/components/tasks/task-timer-panel";
import { AI_ASSIGNEE_ID } from "@/hooks/use-task-execution";
import { isOverdue } from "@/lib/mappers/task-status.mapper";
import { cn } from "@/lib/utils";
import { AssigneePicker } from "./task-detail-drawer-assignment";
import { AiExecutionPanel } from "./task-detail-drawer-ai";
import {
  DrawerShell,
  DrawerSkeleton,
  EditableTitle,
  Field,
  EditableTextarea,
  PriorityPicker,
  StatusPicker,
} from "./task-detail-drawer-fields";

// --- Types ---------------------------------------------------------------
import type { V3Intention } from "@/lib/types/api";

// â”€â”€â”€ TaskDetailDrawer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Drawer lateral de detalhe e ediÃ§Ã£o inline de uma DTask V2.
 *
 * Abre via slide da direita ao clicar em um TaskCard no KanbanBoard.
 * Campos editÃ¡veis: tÃ­tulo (double-click), status, prioridade, dueDate, descriÃ§Ã£o.
 * Todas as ediÃ§Ãµes fazem PATCH imediato no backend via useUpdateTask/useUpdateTaskStatus.
 *
 * @param taskId    - ID da DTask a exibir.
 * @param projectId - ID do DProject (List) para invalidaÃ§Ã£o do cache.
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
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <DrawerShell onClose={onClose}>
        <DrawerSkeleton />
      </DrawerShell>
    );
  }

  if (!task) return null;

  const overdue = isOverdue(task.dueDate, task.status as V3Intention);
  // Estado terminal (DONE/FAILED) = histÃ³rico: nenhum lock, badge ou botÃ£o
  // de execuÃ§Ã£o. Task acabada nÃ£o exige aÃ§Ã£o na UI mesmo que haja DPedido
  // pendente (zumbi).
  const isTerminalStatus = task.status === "DONE" || task.status === "FAILED";
  // Lock UI â€” `activeExecution` Ã© a verdade canÃ´nica do backend.
  // Suprimido em estado terminal.
  const isLocked = !isTerminalStatus && task.activeExecution != null;
  const lockTitle = isLocked
    ? "Em execuÃ§Ã£o pela IA â€” aguarde a conclusÃ£o para editar"
    : undefined;
  const deleteDisabledTitle = isLocked
    ? "NÃ£o Ã© possÃ­vel excluir enquanto hÃ¡ execuÃ§Ã£o ativa"
    : undefined;

  return (
    <DrawerShell onClose={onClose}>
      <DeleteTaskDialog
        task={task}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={onClose}
      />
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-border p-4">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-muted-foreground">
              {task.identifier}
            </span>
            {isLocked && (
              <span
                title={lockTitle}
                className="inline-flex items-center gap-1 rounded-sm bg-violet-500/15 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-violet-300"
              >
                <Lock className="size-2.5" />
                {task.activeExecution?.status === "awaiting_approval"
                  ? "aguardando aprovaÃ§Ã£o"
                  : "em execuÃ§Ã£o pela IA"}
              </span>
            )}
          </div>
          <EditableTitle
            value={task.nome}
            onSave={(titulo) =>
              updateTask({ id: taskId, projectId, dto: { titulo } })
            }
            disabled={isUpdating || isLocked}
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
      <div className="flex flex-col gap-[var(--section-gap)] overflow-y-auto p-4">
        {/* Status */}
        <Field label="Status">
          <StatusPicker
            current={task.status}
            disabled={isLocked}
            onChange={(status) =>
              updateStatus({ id: taskId, status, projectId })
            }
          />
        </Field>

        {/* Prioridade */}
        <Field label="Prioridade">
          <PriorityPicker
            current={task.priority}
            disabled={isLocked}
            onChange={(priority) =>
              updateTask({ id: taskId, projectId, dto: { priority } })
            }
          />
        </Field>

        {/* Data limite */}
        <Field label="Data limite">
          <div className="flex items-center gap-2" title={lockTitle}>
            <Calendar className="size-3.5 text-muted-foreground" />
            <input
              type="date"
              defaultValue={task.dueDate ? task.dueDate.slice(0, 10) : ""}
              disabled={isLocked}
              className={cn(
                "bg-transparent text-[13px] outline-none",
                overdue ? "text-red-400" : "text-foreground",
                isLocked && "cursor-not-allowed opacity-60",
              )}
              onChange={(e) => {
                const val = e.target.value;
                updateTask({
                  id: taskId,
                  projectId,
                  dto: { dueDate: val || null },
                });
              }}
            />
            {overdue && (
              <span className="rounded-sm bg-red-500/15 px-1.5 py-px text-[10px] font-medium text-red-400">
                atrasado
              </span>
            )}
          </div>
        </Field>

        {/* DescriÃ§Ã£o */}
        <Field label="DescriÃ§Ã£o">
          <EditableTextarea
            value={task.description ?? ""}
            placeholder="Adicionar descriÃ§Ã£o..."
            onSave={(descricao) =>
              updateTask({ id: taskId, projectId, dto: { descricao } })
            }
            disabled={isUpdating || isLocked}
          />
        </Field>

        {/* ResponsÃ¡vel + Time (picker unificado) */}
        <Field label="ResponsÃ¡vel">
          <AssigneePicker
            projectId={projectId}
            current={task.assigneeId ?? null}
            currentTeamId={task.assigneeTeamId ?? null}
            disabled={isLocked}
            onChange={(id) =>
              updateTask({ id: taskId, projectId, dto: { assigneeId: id } })
            }
            onTeamChange={(teamId) =>
              updateTask({
                id: taskId,
                projectId,
                dto: { assigneeTeamId: teamId },
              })
            }
          />
        </Field>

        {/* Tempo de trabalho â€” timer manual por usuÃ¡rio (ADR-V2-057). */}
        <Field label="Tempo de trabalho">
          <TaskTimerPanel
            taskId={taskId}
            projectId={projectId}
            timer={task.timer}
          />
        </Field>

        {/* ExecuÃ§Ã£o IA â€” sÃ³ em tasks com responsÃ¡vel IA e nÃ£o-terminais.
            ConcluÃ­do/Falhou = histÃ³rico, sem aÃ§Ã£o de execuÃ§Ã£o. */}
        {task.assigneeId === AI_ASSIGNEE_ID && !isTerminalStatus && (
          <AiExecutionPanel
            taskId={taskId}
            taskName={task.nome}
            projectId={projectId}
          />
        )}
      </div>

      {/* Footer â€” aÃ§Ã£o destrutiva */}
      <div className="mt-auto border-t border-border p-4">
        <button
          type="button"
          disabled={isLocked}
          onClick={() => setDeleteOpen(true)}
          title={deleteDisabledTitle}
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] font-semibold text-red-400 transition-colors",
            isLocked ? "cursor-not-allowed opacity-50" : "hover:bg-red-500/20",
          )}
        >
          <Trash2 className="size-3.5" />
          Excluir task
        </button>
      </div>
    </DrawerShell>
  );
}
