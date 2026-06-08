"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import { Play, Pause, Square, Loader2 } from "lucide-react";

// ─── Internos ─────────────────────────────────────────────────────────────────
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
import type { useTaskTimer } from "@/hooks/use-task-timer";

/** Slice do retorno de `useTaskTimer` consumido pelos controles. */
type TimerApi = ReturnType<typeof useTaskTimer>;

/**
 * Controles play/pause/resume/stop do timer manual de uma task (ADR-V2-057).
 *
 * Encapsula a **máquina de estados de botões** — Iniciar (sem tempo) / Pausar +
 * Parar (rodando p/ mim) / Retomar (pausado com tempo) / Retomar bloqueado
 * (sessão de outro usuário). É a fonte única dessa regra, reaproveitada pelo
 * painel do drawer (`TaskTimerPanel`) e pelo popover da célula "Tempo" na view
 * de Blocos (`TimeSpentCell`).
 *
 * @param timer - Retorno do hook `useTaskTimer` (estado canônico + mutations).
 *
 * @example
 * const timer = useTaskTimer(taskId, projectId, task.timer);
 * <TimerControls timer={timer} />
 */
export function TimerControls({
  timer,
  className,
}: {
  timer: TimerApi;
  className?: string;
}) {
  const {
    start,
    pause,
    resume,
    stop,
    isPending,
    running,
    isRunningMine,
    isRunningOther,
    displayMs,
  } = timer;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        {/* "Iniciar" só quando não há tempo acumulado — caso contrário o
            "Retomar" (abaixo) cobre o caso e os dois seriam redundantes. */}
        {!running && displayMs === 0 && (
          <button
            type="button"
            disabled={isPending}
            onClick={start}
            className="timer-start-btn flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-white disabled:cursor-not-allowed"
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
              className="timer-stop-btn flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-white disabled:cursor-not-allowed"
            >
              <Square className="size-3.5" />
              Parar
            </button>
          </>
        )}

        {/* Sessão aberta por outro usuário: "Retomar" desabilitado deixa claro
            que o timer está ocupado (o backend retornaria 409). */}
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

      {/* "Retomar" quando NÃO há sessão aberta mas já tenho tempo acumulado. */}
      {!running && displayMs > 0 && (
        <button
          type="button"
          disabled={isPending}
          onClick={resume}
          className="timer-start-btn flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-white disabled:cursor-not-allowed"
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Play className="size-3.5" />
          )}
          Retomar
        </button>
      )}
    </div>
  );
}
