"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import { Clock, Play, Pause, Square, Loader2, User } from "lucide-react";

// ─── Internos ─────────────────────────────────────────────────────────────────
import { useTaskTimer, formatDuration } from "@/hooks/use-task-timer";
import { useProjectMembers } from "@/hooks/use-members";
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
  const {
    start,
    pause,
    resume,
    stop,
    isPending,
    running,
    runningUserId,
    runningStartedAt,
    totalsByUser,
    isRunningMine,
    isRunningOther,
    displayMs,
  } = useTaskTimer(taskId, projectId, timer);

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

      {/* Controles */}
      <div className="flex items-center gap-2">
        {!running && (
          <button
            type="button"
            disabled={isPending}
            onClick={start}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-sky-600 px-3 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Play className="size-3.5" />
            )}
            Iniciar
          </button>
        )}

        {isRunningMine && (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={pause}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-sky-500/30 px-3 py-2.5 text-[13px] font-semibold text-sky-300 transition-colors hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Pause className="size-3.5" />
              )}
              Pausar
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={stop}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Square className="size-3.5" />
              Parar
            </button>
          </>
        )}

        {/* Sessão aberta por outro usuário: só "Retomar" (alias do start) fica
            indisponível — o backend retornaria 409. Mantemos um botão Retomar
            desabilitado para deixar claro que o timer está ocupado. */}
        {isRunningOther && (
          <button
            type="button"
            disabled
            title="Timer em andamento por outro usuário"
            className="flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-[13px] font-semibold text-muted-foreground opacity-60"
          >
            <Play className="size-3.5" />
            Retomar
          </button>
        )}
      </div>

      {/* Botão Retomar quando NÃO há sessão aberta mas já tenho tempo acumulado */}
      {!running && displayMs > 0 && (
        <button
          type="button"
          disabled={isPending}
          onClick={resume}
          className="flex items-center justify-center gap-2 rounded-lg border border-sky-500/30 px-3 py-2 text-[12px] text-sky-400 transition-colors hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Play className="size-3.5" />
          Retomar
        </button>
      )}

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
