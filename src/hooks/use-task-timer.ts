"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Internos ─────────────────────────────────────────────────────────────────
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { useAuthStore } from "@/lib/stores/auth";

// ─── Types ────────────────────────────────────────────────────────────────────
import type { TaskResponseDto, TaskTimerState } from "@/lib/types/api";

/** Ações de timer suportadas pelo backend (ADR-V2-057). */
export type TimerAction = "start" | "pause" | "resume" | "stop";

/** Intervalo de tick do cronômetro visual (ms). 1s mantém o display fluido. */
const TICK_INTERVAL_MS = 1000;

// ─── Formatação ─────────────────────────────────────────────────────────────

/**
 * Formata uma duração em milissegundos para o formato "Xh Ymin Zs".
 *
 * Omite as unidades de ordem superior quando zero (ex.: `45min 12s`,
 * `12s`). Retorna `"0s"` para zero/negativo. Usado tanto no cronômetro
 * do usuário logado quanto na lista de totais por usuário.
 *
 * @param ms - Duração em milissegundos (server-side; nunca somada no cliente).
 * @returns String legível em português (h/min/s).
 *
 * @example
 * formatDuration(9900000); // "2h 45min 0s"
 * formatDuration(72000);   // "1min 12s"
 */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0s";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (hours > 0 || minutes > 0) parts.push(`${minutes}min`);
  parts.push(`${seconds}s`);
  return parts.join(" ");
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Controla o timer manual de tempo de trabalho de uma task (ADR-V2-057).
 *
 * Expõe 4 mutations (`start`/`pause`/`resume`/`stop`) que chamam
 * `POST /tasks/:id/timer/{action}` (body vazio — o `userId` vem do JWT no
 * backend). Após cada mutação, invalida `qk.tasks.byId(taskId)` e
 * `qk.tasks.byProject(projectId)` para que o drawer e o board reflitam o
 * novo estado (totais server-side).
 *
 * Mantém um **cronômetro puramente visual**: quando há uma sessão aberta
 * (`timer.running`) do usuário logado, soma `(agora − runningStartedAt)` sobre
 * o `totalMs` desse usuário e re-renderiza a cada segundo. A verdade do tempo
 * acumulado é sempre o backend — o cliente nunca envia duração (anti-fraude).
 *
 * @param taskId    - ID da DTask alvo do timer.
 * @param projectId - ID do DProject (List) para invalidação do board.
 * @param timer     - Estado de timer vindo do `TaskResponseDto` (ou null/undefined).
 * @returns Mutations, flags de estado e o tempo do usuário logado em ms (`displayMs`).
 *
 * @example
 * ```tsx
 * const { start, pause, resume, stop, displayMs, isRunningMine } =
 *   useTaskTimer(taskId, projectId, task.timer);
 * ```
 */
export function useTaskTimer(
  taskId: string,
  projectId: string,
  timer: TaskTimerState | null | undefined,
) {
  const queryClient = useQueryClient();
  const myEntidadeId = useAuthStore((s) => s.user?.entidadeId ?? null);

  // ─── Mutation base (1 action por chamada) ────────────────────────────────
  const mutation = useMutation<TaskResponseDto, Error, TimerAction>({
    mutationFn: async (action) => {
      const res = await api.post<TaskResponseDto>(
        `/tasks/${taskId}/timer/${action}`,
        {}, // body vazio — userId vem do JWT
      );
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.tasks.byId(taskId) });
      void queryClient.invalidateQueries({
        queryKey: qk.tasks.byProject(projectId),
      });
    },
  });

  const run = useCallback(
    (action: TimerAction) => mutation.mutate(action),
    [mutation],
  );

  // ─── Estado derivado do backend (verdade canônica) ───────────────────────
  const running = timer?.running ?? false;
  const runningUserId = timer?.runningUserId ?? null;
  const runningStartedAt = timer?.runningStartedAt ?? null;
  const totalsByUser = timer?.totalsByUser ?? [];

  /** Sessão aberta pertence ao usuário logado? */
  const isRunningMine =
    running && runningUserId != null && runningUserId === myEntidadeId;
  /** Sessão aberta pertence a OUTRO usuário (timer ocupado)? */
  const isRunningOther =
    running && runningUserId != null && runningUserId !== myEntidadeId;

  /** Total fechado (server-side) do usuário logado, em ms. */
  const myClosedTotalMs =
    totalsByUser.find((t) => t.userId === myEntidadeId)?.totalMs ?? 0;

  // ─── Cronômetro visual ───────────────────────────────────────────────────
  // Re-renderiza a cada segundo SOMENTE quando a sessão aberta é do usuário
  // logado. O valor exibido = total fechado server-side + (agora − início).
  // `now` é atualizado apenas pelo interval (sem setState síncrono no efeito);
  // o primeiro tick ocorre em até TICK_INTERVAL_MS, suficiente para um
  // cronômetro visual.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!isRunningMine || !runningStartedAt) return;
    const id = setInterval(() => setNow(Date.now()), TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isRunningMine, runningStartedAt]);

  const liveOffsetMs =
    isRunningMine && runningStartedAt
      ? Math.max(0, now - new Date(runningStartedAt).getTime())
      : 0;

  /** Tempo a exibir para o usuário logado (fechado + sessão viva). */
  const displayMs = myClosedTotalMs + liveOffsetMs;

  return {
    // mutations
    start: () => run("start"),
    pause: () => run("pause"),
    resume: () => run("resume"),
    stop: () => run("stop"),
    isPending: mutation.isPending,
    error: mutation.error,
    // estado do backend
    running,
    runningUserId,
    runningStartedAt,
    totalsByUser,
    isRunningMine,
    isRunningOther,
    // cronômetro visual
    displayMs,
  };
}
