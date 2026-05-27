"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useState } from "react";
import {
  X,
  Calendar,
  Bot,
  Play,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Users,
  Lock,
  Trash2,
} from "lucide-react";

// ─── Internos ─────────────────────────────────────────────────────────────────
import { useTask, useUpdateTask, useUpdateTaskStatus } from "@/hooks/use-tasks";
import { DeleteTaskDialog } from "@/components/tasks/delete-task-dialog";
import {
  KANBAN_COLUMNS,
  priorityToLabel,
  priorityToColor,
  isOverdue,
} from "@/lib/mappers/task-status.mapper";
import { cn } from "@/lib/utils";
import {
  useTaskExecution,
  detectTaskType,
  TASK_TYPE_LABELS,
  TASK_TYPE_COLORS,
  AI_ASSIGNEE_ID,
} from "@/hooks/use-task-execution";
import { useProjectMembers } from "@/hooks/use-members";
import { useTeams } from "@/hooks/use-teams";

// ─── Types ────────────────────────────────────────────────────────────────────
import type { V3Intention } from "@/lib/types/api";

// ─── Constantes ───────────────────────────────────────────────────────────────

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

/** Mapeia coluna Kanban → V3 Intention primária para o PATCH de status. */
const COLUMN_TO_INTENTION: Record<string, string> = {
  backlog: "INBOX",
  ready: "READY",
  "em-progresso": "EXECUTING",
  concluido: "DONE",
  falhou: "FAILED",
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
  // Estado terminal (DONE/FAILED) = histórico: nenhum lock, badge ou botão
  // de execução. Task acabada não exige ação na UI mesmo que haja DPedido
  // pendente (zumbi).
  const isTerminalStatus = task.status === "DONE" || task.status === "FAILED";
  // Lock UI — `activeExecution` é a verdade canônica do backend.
  // Suprimido em estado terminal.
  const isLocked = !isTerminalStatus && task.activeExecution != null;
  const lockTitle = isLocked
    ? "Em execução pela IA — aguarde a conclusão para editar"
    : undefined;
  const deleteDisabledTitle = isLocked
    ? "Não é possível excluir enquanto há execução ativa"
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
                  ? "aguardando aprovação"
                  : "em execução pela IA"}
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
      <div className="flex flex-col gap-4 overflow-y-auto p-4">
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

        {/* Data de entrega */}
        <Field label="Data de entrega">
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

        {/* Descrição */}
        <Field label="Descrição">
          <EditableTextarea
            value={task.description ?? ""}
            placeholder="Adicionar descrição..."
            onSave={(descricao) =>
              updateTask({ id: taskId, projectId, dto: { descricao } })
            }
            disabled={isUpdating || isLocked}
          />
        </Field>

        {/* Responsável + Time (picker unificado) */}
        <Field label="Responsável">
          <AssigneePicker
            projectId={projectId}
            current={task.assigneeId ?? null}
            currentTeamId={task.assigneeTeamId ?? null}
            disabled={isLocked}
            onChange={(id) =>
              updateTask({ id: taskId, projectId, dto: { assigneeId: id } })
            }
            onTeamChange={(teamId) =>
              updateTask({ id: taskId, projectId, dto: { assigneeTeamId: teamId } })
            }
          />
        </Field>

        {/* Execução IA — só em tasks com responsável IA e não-terminais.
            Concluído/Falhou = histórico, sem ação de execução. */}
        {task.assigneeId === AI_ASSIGNEE_ID && !isTerminalStatus && (
          <AiExecutionPanel
            taskId={taskId}
            taskName={task.nome}
            projectId={projectId}
          />
        )}
      </div>

      {/* Footer — ação destrutiva */}
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

// ─── AssigneePicker ───────────────────────────────────────────────────────────

function AssigneePicker({
  projectId,
  current,
  currentTeamId = null,
  onChange,
  onTeamChange,
  disabled = false,
}: {
  projectId: string;
  current: string | null;
  currentTeamId?: string | null;
  onChange: (id: string | null) => void;
  onTeamChange?: (id: string | null) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { data: members = [] } = useProjectMembers(projectId);
  const { data: teams = [] } = useTeams();

  const isAi = current === AI_ASSIGNEE_ID;
  const assignedMember = members.find((m) => m.userId === current) ?? null;
  const assignedTeam = teams.find((t) => t.id === currentTeamId) ?? null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
        }}
        disabled={disabled}
        title={
          disabled ? "Em execução pela IA — não é possível alterar" : undefined
        }
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-[13px] transition-colors",
          disabled ? "cursor-not-allowed opacity-60" : "hover:border-ring/60",
        )}
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
            <span className="font-medium text-foreground">
              {assignedMember.nome}
            </span>
          </div>
        ) : assignedTeam ? (
          <div className="flex items-center gap-2">
            <span
              className="size-5 shrink-0 rounded-full"
              style={{ background: assignedTeam.color ?? "var(--muted-foreground)" }}
            />
            <span className="font-medium text-foreground">{assignedTeam.nome}</span>
            <span className="rounded-full bg-muted px-1.5 py-px text-[10px] text-muted-foreground">
              time
            </span>
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
              onClick={() => {
                onChange(AI_ASSIGNEE_ID);
                setOpen(false);
              }}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-muted",
                isAi && "bg-violet-500/10",
              )}
            >
              <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-violet-500/15">
                <Bot className="size-3 text-violet-400" />
              </div>
              <div className="flex flex-1 flex-col">
                <span className="font-semibold text-foreground">IA</span>
                <span className="text-[11px] text-muted-foreground">
                  Executar automaticamente
                </span>
              </div>
              {isAi && <span className="size-1.5 rounded-full bg-violet-400" />}
            </button>

            {/* Divisor */}
            {members.length > 0 && (
              <div className="my-1 border-t border-border" />
            )}

            {/* Membros do projeto */}
            {members.map((m) => (
              <button
                key={m.userId}
                type="button"
                onClick={() => {
                  onChange(m.userId);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-muted",
                  current === m.userId && "bg-muted",
                )}
              >
                <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                  {m.nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="font-medium text-foreground">{m.nome}</span>
                  {m.cargo && (
                    <span className="text-[11px] text-muted-foreground">
                      {m.cargo}
                    </span>
                  )}
                </div>
                {current === m.userId && (
                  <span className="size-1.5 rounded-full bg-foreground/40" />
                )}
              </button>
            ))}

            {/* Seção Times */}
            {teams.length > 0 && (
              <>
                <div className="my-1 border-t border-border" />
                <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Times
                </p>
                {teams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => {
                      // Selecionar um time limpa o responsável individual (e vice-versa)
                      onChange(null);
                      onTeamChange?.(currentTeamId === team.id ? null : team.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-muted",
                      currentTeamId === team.id && "bg-muted",
                    )}
                  >
                    <span
                      className="size-5 shrink-0 rounded-full"
                      style={{ background: team.color ?? "var(--muted-foreground)" }}
                    />
                    <span className="font-medium text-foreground">{team.nome}</span>
                    {currentTeamId === team.id && (
                      <span className="ml-auto size-1.5 rounded-full bg-foreground/40" />
                    )}
                  </button>
                ))}
              </>
            )}

            {/* Remover */}
            {(current || currentTeamId) && (
              <>
                <div className="my-1 border-t border-border" />
                <button
                  type="button"
                  onClick={() => {
                    onChange(null);
                    onTeamChange?.(null);
                    setOpen(false);
                  }}
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

// ─── TeamPicker ───────────────────────────────────────────────────────────────

/**
 * Seletor dropdown para atribuição de time a uma task (assigneeTeamId).
 * Carrega lista de times via `useTeams()`, permite selecionar ou remover.
 * @param current - ID do time atualmente atribuído, ou null se nenhum
 * @param onChange - Callback invocado quando team é selecionado ou removido
 * @param disabled - Se true, desabilita a seleção (ex: task em execução)
 */
function TeamPicker({
  current,
  onChange,
  disabled = false,
}: {
  current: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { data: teams = [] } = useTeams();
  const assignedTeam = teams.find((t) => t.id === current) ?? null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
        }}
        disabled={disabled}
        title={
          disabled ? "Em execução pela IA — não é possível alterar" : undefined
        }
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-[13px] transition-colors",
          disabled ? "cursor-not-allowed opacity-60" : "hover:border-ring/60",
        )}
      >
        {assignedTeam ? (
          <div className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ background: assignedTeam.color ?? "var(--muted-foreground)" }}
            />
            <span className="font-medium text-foreground">{assignedTeam.nome}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Users className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Sem time</span>
          </div>
        )}
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border bg-popover shadow-lg">
          <div className="flex flex-col gap-0.5 p-1">
            {/* Times disponíveis */}
            {teams.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => {
                  onChange(team.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-muted",
                  current === team.id && "bg-muted",
                )}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: team.color ?? "var(--muted-foreground)" }}
                />
                <div className="flex flex-1 flex-col">
                  <span className="font-medium text-foreground">{team.nome}</span>
                  {team.memberCount !== undefined && (
                    <span className="text-[11px] text-muted-foreground">
                      {team.memberCount} membro{team.memberCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {current === team.id && (
                  <span className="size-1.5 rounded-full bg-foreground/40" />
                )}
              </button>
            ))}

            {teams.length === 0 && (
              <span className="px-2.5 py-2 text-[12px] text-muted-foreground">
                Nenhum time disponível
              </span>
            )}

            {/* Remover time */}
            {current && (
              <>
                <div className="my-1 border-t border-border" />
                <button
                  type="button"
                  onClick={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-[12px] text-muted-foreground transition-colors hover:bg-muted"
                >
                  <Users className="size-3.5" />
                  Remover time
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

function AiExecutionPanel({
  taskId,
  taskName,
  projectId,
}: {
  taskId: string;
  taskName: string;
  projectId: string;
}) {
  const { execution, startExecution, clearExecution, isSubmitting } =
    useTaskExecution(taskId, projectId);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const taskType = detectTaskType(taskName);
  const typeColor = TASK_TYPE_COLORS[taskType];
  const typeLabel = TASK_TYPE_LABELS[taskType];
  const isRunning =
    execution?.status === "running" ||
    execution?.status === "awaiting_approval" ||
    isSubmitting;
  const isDone = execution?.status === "done";
  const isFailed = execution?.status === "failed";
  const isAwaiting = execution?.status === "awaiting_approval";

  return (
    <>
      <div className="flex flex-col gap-2.5 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3.5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Bot className="size-3.5 text-violet-400" />
          <span className="text-[12px] font-semibold text-violet-300">
            Execução IA
          </span>
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
            <span className="text-[12px] text-violet-300">
              {isSubmitting
                ? "Enviando para o agente..."
                : isAwaiting
                  ? "Aguardando aprovação (risco ALTO)..."
                  : "Agente processando a task..."}
            </span>
          </div>
        )}

        {isDone && (
          <div className="flex flex-col gap-2 rounded-lg border border-green-500/20 bg-green-500/5 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 shrink-0 text-green-400" />
              <span className="text-[12px] font-semibold text-green-300">
                Concluído
              </span>
              {execution.finishedAt && (
                <span className="ml-auto text-[11px] text-muted-foreground">
                  {new Date(execution.finishedAt).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
            {execution.output && (
              <p className="text-[12px] leading-relaxed text-muted-foreground">
                {execution.output}
              </p>
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
            disabled={isSubmitting}
            onClick={() => setConfirmOpen(true)}
            className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-3 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Play className="size-3.5" />
            )}
            Executar com IA
          </button>
        )}

        {isDone && (
          <button
            type="button"
            onClick={() => {
              clearExecution();
              setConfirmOpen(true);
            }}
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
          onConfirm={() => {
            setConfirmOpen(false);
            startExecution();
          }}
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
            <h2 className="text-[16px] font-bold text-foreground">
              Confirmar execução
            </h2>
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
                <span className="truncate text-[13px] font-medium text-foreground">
                  {taskName}
                </span>
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
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
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
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
  disabled = false,
}: {
  current: string;
  onChange: (s: string) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-1.5",
        disabled && "cursor-not-allowed opacity-60",
      )}
      title={
        disabled ? "Em execução pela IA — não é possível alterar" : undefined
      }
    >
      {KANBAN_COLUMNS.map((col) => {
        const intention = COLUMN_TO_INTENTION[col.id];
        const isActive =
          current === intention ||
          (col.id === "em-progresso" &&
            (current === "EXECUTING" || current === "VALIDATING")) ||
          (col.id === "concluido" &&
            ["DONE", "VALIDATED", "CANCELLED", "DISCARDED"].includes(current));

        return (
          <button
            key={col.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(intention)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors",
              isActive
                ? "border-transparent text-white"
                : "border-border text-muted-foreground hover:border-border/60 hover:text-foreground",
              disabled && "pointer-events-none",
            )}
            style={isActive ? { background: col.color } : {}}
          >
            <span
              className="size-1.5 rounded-full"
              style={{ background: isActive ? "white" : col.color }}
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
  disabled = false,
}: {
  current?: string;
  onChange: (p: string) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-1.5",
        disabled && "cursor-not-allowed opacity-60",
      )}
      title={
        disabled ? "Em execução pela IA — não é possível alterar" : undefined
      }
    >
      {PRIORITIES.map((p) => {
        const isActive = current === p;
        return (
          <button
            key={p}
            type="button"
            disabled={disabled}
            onClick={() => onChange(p)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors",
              isActive
                ? "border-transparent text-white"
                : "border-border text-muted-foreground hover:text-foreground",
              disabled && "pointer-events-none",
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
