"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import React, { useMemo, useState } from "react";
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
import {
  Play,
  Bot,
  Loader2,
  Lock,
  Trash2,
  ListTree,
  CalendarDays,
  Clock3,
} from "lucide-react";

// ─── Internos ─────────────────────────────────────────────────────────────────
import { useTasksByProject, useUpdateTaskStatus } from "@/hooks/use-tasks";
import {
  KANBAN_COLUMNS,
  intentionToColumn,
  isOverdue,
  isFailed,
  priorityToLabel,
} from "@/lib/mappers/task-status.mapper";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { TaskDetailDrawer } from "@/components/tasks/task-detail-drawer";
import { DeleteTaskDialog } from "@/components/tasks/delete-task-dialog";
import { TakeoverConfirmDialog } from "@/components/tasks/takeover-confirm-dialog";
import { WorkSessionBadge } from "@/components/tasks/work-session-badge";
import { useWorkCollisionGuard } from "@/hooks/use-work-collision-guard";
import { useTaskExecution, AI_ASSIGNEE_ID } from "@/hooks/use-task-execution";
import { useTeams } from "@/hooks/use-teams";
import { useProjectMembers } from "@/hooks/use-members";
import {
  PriorityGlyph,
  avatarColor,
  buildInitials,
} from "@/components/tasks/task-visuals";

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

  // UMA query por board (cacheada 5min) resolve `assigneeId` -> nome de todos
  // os cards. Nunca por card — isso seria N+1 de rede.
  const { data: members = [] } = useProjectMembers(projectId);
  const memberNames = useMemo(
    () => new Map(members.map((m) => [m.userId, m.nome])),
    [members],
  );

  const updateStatus = useUpdateTaskStatus();
  const queryClient = useQueryClient();
  const { run, dialogProps } = useWorkCollisionGuard();
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

    // Aplica o otimista + persiste. Tudo dentro do proceed para que, em
    // "Cancelar" no diálogo de colisão, o card volte sozinho à origem
    // (nunca chegamos a mover na UI).
    const proceed = () => {
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
    };

    // Task #795: guarda só ao ENTRAR em EXECUTING; demais colunas não perguntam.
    if (newIntention === "EXECUTING") run(task, proceed);
    else proceed();
  }

  if (isLoading) return <KanbanSkeleton />;

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-full min-h-0 gap-[calc(var(--row-gap)+4px)] overflow-x-auto p-4">
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
                memberNames={memberNames}
              />
            );
          })}
        </div>

        {/* Card "fantasma" seguindo o cursor durante o drag */}
        <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
          {activeTask && (
            <TaskCard
              task={activeTask}
              onClick={() => {}}
              isDragOverlay
              memberNames={memberNames}
            />
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

      {/* Task #795: guard de colisão ao arrastar para EXECUTING. */}
      <TakeoverConfirmDialog {...dialogProps} actionLabel="mover" />
    </>
  );
}

// ─── KanbanColumn ─────────────────────────────────────────────────────────────

function KanbanColumn({
  config,
  tasks,
  onSelectTask,
  isDragging,
  memberNames,
}: {
  config: KanbanColumnConfig;
  tasks: TaskResponseDto[];
  onSelectTask: (id: string) => void;
  isDragging: boolean;
  memberNames: Map<string, string>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: config.id });

  return (
    /* Coluna = superficie AFUNDADA (sunken), o "poco" onde os cards ficam.
       Antes a coluna nao tinha fundo nenhum: os cards boiavam direto sobre a
       pagina e o quadro nao lia como quadro. Padrao Jira/Trello/GitHub
       Projects — ver `elevation.surface.sunken` do Atlassian Design. */
    <div
      className={cn(
        "flex h-full min-h-0 min-w-[248px] flex-1 flex-col rounded-xl transition-colors",
        "bg-muted/40 dark:bg-black/25",
        isOver && "ring-1 ring-violet-500/40",
      )}
    >
      {/* Header dentro do poco, nao solto acima dele. */}
      <div className="flex shrink-0 items-center gap-2 px-3 pb-2 pt-3">
        <span
          className="size-2 rounded-full"
          style={{ background: config.color }}
        />
        <span className="text-[12px] font-semibold uppercase tracking-wide text-foreground">
          {config.label}
        </span>
        <span className="ml-auto rounded-full bg-black/10 px-1.5 text-[11px] font-medium text-muted-foreground dark:bg-white/10">
          {tasks.length}
        </span>
      </div>

      {/* Area rolavel dos cards */}
      <div
        ref={setNodeRef}
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2"
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => onSelectTask(task.id)}
            memberNames={memberNames}
          />
        ))}
        {tasks.length === 0 && (
          <div
            className={cn(
              "shrink-0 rounded-lg border border-dashed px-3 py-6 text-center text-[12px] transition-colors",
              isOver
                ? "border-violet-500/60 bg-violet-500/10 text-violet-400"
                : "border-border text-muted-foreground",
            )}
          >
            {isDragging
              ? isOver
                ? "Soltar aqui"
                : "Arraste para cá"
              : "Nenhuma task"}
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
  memberNames,
}: {
  task: TaskResponseDto;
  onClick: () => void;
  isDragOverlay?: boolean;
  memberNames: Map<string, string>;
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
  // FAILED nao tem coluna (decisao do CEO): a task cai em `backlog`
  // carregando este badge. Sem ele, uma falha some do quadro.
  const failed = isFailed(task.status as V3Intention);
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

  // Nome real do responsável humano. Sem match no mapa (membro removido do
  // projeto, ou lista ainda carregando) cai em "Atribuído" — o card nunca
  // mente dizendo que não há responsável.
  const assigneeName =
    task.assigneeId && !isAiAssigned
      ? (memberNames.get(task.assigneeId) ?? "Atribuído")
      : null;

  // Tempo gasto: o backend manda "—" quando é zero; não ocupar a linha com isso.
  const timeSpent =
    task.timeSpentLabel && task.timeSpentLabel !== "—"
      ? task.timeSpentLabel
      : null;

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
        // Card = superficie ELEVADA (raised) sobre o poco da coluna. No dark,
        // sombra quase nao se ve — o Atlassian recomenda diferenciar por COR
        // de superficie, entao o contraste vem do par coluna(#0d) / card(#1e).
        "group relative shrink-0 rounded-lg border px-2.5 py-2 transition-all",
        "border-black/[0.06] bg-card shadow-sm",
        "dark:border-white/[0.06] dark:bg-[#1e1e1e] dark:shadow-none",
        isLocked
          ? "cursor-not-allowed opacity-60"
          : "cursor-grab active:cursor-grabbing",
        isDragging && !isDragOverlay && "opacity-40",
        isDragOverlay && "rotate-1 shadow-xl ring-1 ring-violet-500/40",
        !isDragging &&
          !isDragOverlay &&
          !isLocked &&
          "hover:border-black/[0.12] dark:hover:border-white/[0.14] dark:hover:bg-[#242424]",
        isAiAssigned && isRunning && "border-violet-500/30 bg-violet-500/5",
        isAiAssigned && isDone && !isLocked && "border-green-500/20",
      )}
    >
      {/* Dialog de confirmação — controlado por `deleteOpen`.
          O <span> NAO e decorativo: o dialog renderiza num portal, e eventos
          de portal sobem pela arvore REACT, nao pela DOM. Como o dialog e
          filho React do card (que tem onClick para abrir o drawer), clicar
          "Excluir" dentro do dialog disparava o onClick do card e abria o
          drawer da task recem-excluida. O stopPropagation aqui e a fronteira
          que faltava — o da lixeira so cobria o botao que ABRE o dialog. */}
      <span
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <DeleteTaskDialog
          task={task}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      </span>

      {/* Lixeira — fora do fluxo, só no hover. Antes ocupava uma linha
          permanente no topo junto do identifier; agora o topo é só o título. */}
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
          className="pointer-events-none absolute right-1 top-1 inline-flex size-5 items-center justify-center rounded bg-card text-muted-foreground opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:pointer-events-auto group-hover:opacity-100"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}

      {/* ── Titulo ─────────────────────────────────────────────────────────
          3 linhas, nao 2: com ~230px de largura util e 13px, duas linhas dao
          ~60 caracteres e praticamente TODO titulo real terminava em "…".
          Trello e Jira nao truncam o titulo — e o dado principal do card.
          Peso normal (nao medium): no dark, 13px medium fica pesado; o
          contraste com o rodape ja vem da cor (#e4e4e4 vs #888). */}
      <p
        title={task.nome}
        className="line-clamp-3 pr-5 text-[13px] leading-[1.45] text-foreground"
      >
        {task.nome?.trim() ? (
          task.nome
        ) : (
          <span className="italic text-muted-foreground">(sem título)</span>
        )}
      </p>

      {/* ── Rodape em DUAS linhas ──────────────────────────────────────────
          Uma linha so obrigava tudo a caber em ~230px, e o que sobrava eram
          glifos mudos. Separado em "o que e" (badges) e "quem/qual" (identidade),
          cada dado ganha espaco para se expressar por extenso.
          E o arranjo de GitHub Projects (labels em cima, meta embaixo). */}

      {/* Linha 1: badges. `flex-wrap` para nunca cortar um badge pela metade. */}
      {(task.priority ||
        task.dueDate ||
        timeSpent ||
        task.hasChildren ||
        isAiAssigned ||
        isLocked ||
        failed) && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {task.priority && (
            <Badge
              tone="neutral"
              title={`Prioridade: ${priorityToLabel(task.priority)}`}
              icon={<PriorityGlyph priority={task.priority} size={12} />}
            >
              {priorityToLabel(task.priority)}
            </Badge>
          )}

          {failed && (
            <Badge tone="danger" title="A automação falhou nesta task">
              Falhou
            </Badge>
          )}

          {isLocked && (
            <Badge
              tone="violet"
              title="Em execução pela IA"
              icon={<Lock className="size-2.5" />}
            >
              {task.activeExecution?.status === "awaiting_approval"
                ? "aprovar"
                : "executando"}
            </Badge>
          )}

          {/* Task #794: "em trabalho por Fulano" — só renderiza em EXECUTING
              com workSession ativa (o componente decide). */}
          <WorkSessionBadge task={task} />

          {task.dueDate && (
            <Badge
              tone={overdue ? "danger" : "neutral"}
              title={overdue ? "Prazo vencido" : "Prazo"}
              icon={<CalendarDays className="size-2.5" />}
            >
              {new Date(
                task.dueDate.slice(0, 10) + "T12:00:00",
              ).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
            </Badge>
          )}

          {timeSpent && (
            <Badge
              tone="neutral"
              title={
                task.timeSpentIsRollup
                  ? "Tempo somado das subtarefas"
                  : "Tempo gasto"
              }
              icon={<Clock3 className="size-2.5" />}
            >
              {timeSpent}
            </Badge>
          )}

          {task.hasChildren && (
            <Badge
              tone="neutral"
              title="Tem subtarefas"
              icon={<ListTree className="size-2.5" />}
            >
              subtarefas
            </Badge>
          )}

          {isAiAssigned && (
            <Badge
              tone={isDone && !isTerminalStatus ? "success" : "violet"}
              title="Atribuída à IA"
              icon={<Bot className="size-2.5" />}
            >
              {isRunning && !isTerminalStatus
                ? "executando"
                : isDone && !isTerminalStatus
                  ? "concluído"
                  : "IA"}
            </Badge>
          )}
        </div>
      )}

      {/* Linha 2: identidade — codigo a esquerda, pessoa a direita, por extenso. */}
      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="shrink-0 font-mono text-[10px] tracking-wide">
          {task.identifier}
        </span>

        <span className="ml-auto flex min-w-0 items-center gap-1.5">
          {isAiAssigned &&
            !isTerminalStatus &&
            !execution &&
            !isLocked &&
            !isDragOverlay && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  startExecution();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                title="Executar com IA"
                className="flex shrink-0 items-center gap-1 rounded-md bg-violet-600/80 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 transition-all hover:bg-violet-500 group-hover:opacity-100"
              >
                <Play className="size-2.5" />
                Executar
              </button>
            )}

          {isAiAssigned && isRunning && (
            <Loader2 className="size-3 shrink-0 animate-spin text-violet-400" />
          )}

          {task.assigneeTeamId && <TeamBadge teamId={task.assigneeTeamId} />}

          {assigneeName && (
            <>
              <span className="truncate">{assigneeName}</span>
              <span
                aria-hidden="true"
                className="flex size-[18px] shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{ background: avatarColor(assigneeName) }}
              >
                {buildInitials(assigneeName)}
              </span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}

// ─── Badge do rodapé ──────────────────────────────────────────────────────────

/**
 * Badge compacto do rodapé do card (prazo, tempo, subtarefas, IA).
 *
 * Cada metadado ganha fundo próprio em vez de virar texto solto separado por
 * "·" — é o que agrupa a linha e cria ritmo, no padrão de badges do Trello.
 *
 * @param tone - Paleta do badge. `neutral` para informação, `danger` para
 *   prazo vencido, `violet` para IA/execução, `success` para conclusão.
 * @param icon - Ícone à esquerda (opcional, 10px).
 * @param title - Tooltip nativo — obrigatório, já que vários badges são só ícone.
 * @param children - Rótulo. Ausente quando o ícone basta (ex: subtarefas).
 */
function Badge({
  tone,
  icon,
  title,
  children,
}: {
  tone: "neutral" | "danger" | "violet" | "success";
  icon?: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <span
      title={title}
      className={cn(
        "flex shrink-0 items-center gap-1 rounded px-1 py-0.5 text-[10px] leading-none",
        tone === "neutral" &&
          "bg-black/[0.05] text-muted-foreground dark:bg-white/[0.06]",
        tone === "danger" && "bg-red-500/12 text-red-400",
        tone === "violet" && "bg-violet-500/15 text-violet-300",
        tone === "success" && "bg-green-500/15 text-green-400",
      )}
    >
      {icon}
      {children}
    </span>
  );
}

// ─── TeamBadge ────────────────────────────────────────────────────────────────

/**
 * Exibe badge do time responsável (assigneeTeamId) na linha de meta do
 * TaskCard. Carrega dados do time via `useTeams()` e renderiza cor + nome.
 *
 * @param teamId - ID do time a exibir
 */
function TeamBadge({ teamId }: { teamId: string }) {
  const { data: teams = [] } = useTeams();
  const team = teams.find((t) => t.id === teamId);
  if (!team) return null;
  return (
    <span className="flex min-w-0 shrink items-center gap-1" title={team.nome}>
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ background: team.color ?? "var(--muted-foreground)" }}
      />
      <span className="truncate">{team.nome}</span>
    </span>
  );
}

// ─── KanbanSkeleton ───────────────────────────────────────────────────────────

function KanbanSkeleton() {
  return (
    <div className="flex h-full min-h-0 gap-[calc(var(--row-gap)+4px)] overflow-x-auto p-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex min-w-[248px] flex-1 flex-col gap-2">
          <div className="h-5 w-24 animate-pulse rounded bg-muted" />
          {[1, 2, 3, 4].map((j) => (
            <div
              key={j}
              className="h-[68px] animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
