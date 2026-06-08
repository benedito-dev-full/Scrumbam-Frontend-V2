"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import { Clock, User } from "lucide-react";

// ─── Internos ─────────────────────────────────────────────────────────────────
import { useTaskTimer, formatDuration } from "@/hooks/use-task-timer";
import { useTask } from "@/hooks/use-tasks";
import { useProjectMembers } from "@/hooks/use-members";
import { TimerControls } from "@/components/tasks/timer-controls";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
import type { TaskTimerState } from "@/lib/types/api";

/**
 * Painel de timer manual de tempo de trabalho no drawer da task (ADR-V2-057).
 *
 * Espelha o padrão visual do `AiExecutionPanel` (card arredondado, ícones
 * lucide, estados). Mostra o cronômetro do usuário logado (formato Xh Ymin Zs),
 * botões play/pause/resume/stop conforme o estado, e a lista de totais por
 * usuário (o gestor vê todos). Quando a sessão aberta é de OUTRO usuário,
 * exibe "Timer aberto por [nome] desde [hora]" e bloqueia o start local.
 *
 * Toda a aritmética de tempo é server-side (anti-fraude); o cronômetro daqui
 * é puramente visual e usa `timer.runningStartedAt` como offset.
 *
 * @param taskId    - ID da DTask.
 * @param projectId - ID do DProject (List) — usado para invalidação e nomes.
 * @param timer     - Estado de timer vindo do `TaskResponseDto.timer`.
 *
 * @example
 * ```tsx
 * <TaskTimerPanel taskId={taskId} projectId={projectId} timer={task.timer} />
 * ```
 */
export function TaskTimerPanel({
  taskId,
  projectId,
  timer,
}: {
  taskId: string;
  projectId: string;
  timer: TaskTimerState | null | undefined;
}) {
  // O `timer` da prop pode vir de um objeto de task CONGELADO (ex.: o TaskSheet
  // recebe a task via estado local, não do cache). Buscamos o estado fresco via
  // `useTask` — que compartilha a query key invalidada após cada mutação de
  // timer — e usamos a prop apenas como fallback inicial enquanto carrega.
  const { data: liveTask } = useTask(taskId);
  const liveTimer = liveTask?.timer ?? timer;

  const timerApi = useTaskTimer(taskId, projectId, liveTimer);
  const {
    runningUserId,
    runningStartedAt,
    totalsByUser,
    isRunningMine,
    isRunningOther,
    displayMs,
  } = timerApi;

  const { data: members = [] } = useProjectMembers(projectId);

  // Nome do dono da sessão aberta (quando é outro usuário). Tenta primeiro os
  // totais já hidratados pelo backend; cai para os membros do projeto.
  const runningUserName =
    totalsByUser.find((t) => t.userId === runningUserId)?.userName ??
    members.find((m) => m.userId === runningUserId)?.nome ??
    null;

  const startedAtLabel = runningStartedAt
    ? new Date(runningStartedAt).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-sky-500/20 bg-sky-500/5 p-3.5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Clock className="size-3.5 text-sky-400" />
        <span className="text-[12px] font-semibold text-sky-300">
          Tempo de trabalho
        </span>
      </div>

      {/* Cronômetro do usuário logado */}
      <div className="flex items-center justify-between gap-2 rounded-lg bg-sky-500/10 px-3 py-2.5">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Meu tempo
        </span>
        <span
          className={cn(
            "font-mono text-[15px] font-semibold tabular-nums",
            isRunningMine ? "text-sky-300" : "text-foreground",
          )}
        >
          {formatDuration(displayMs)}
        </span>
      </div>

      {/* Aviso: timer aberto por outro usuário (COULD HAVE — ADR-V2-057) */}
      {isRunningOther && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <User className="size-3.5 shrink-0 text-amber-400" />
          <span className="text-[12px] text-amber-300">
            Timer aberto por {runningUserName ?? "outro usuário"}
            {startedAtLabel ? ` desde ${startedAtLabel}` : ""}
          </span>
        </div>
      )}

      {/* Controles (máquina de botões compartilhada com a célula de Blocos) */}
      <TimerControls timer={timerApi} />

      {/* Totais por usuário (gestor vê todos) */}
      {totalsByUser.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-sky-500/15 pt-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Totais por usuário
          </span>
          {totalsByUser.map((t) => (
            <div
              key={t.userId}
              className="flex items-center justify-between gap-2 text-[12px]"
            >
              <span className="truncate text-foreground">
                {t.userName ?? `Usuário ${t.userId}`}
              </span>
              <span className="font-mono tabular-nums text-muted-foreground">
                {formatDuration(t.totalMs)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
