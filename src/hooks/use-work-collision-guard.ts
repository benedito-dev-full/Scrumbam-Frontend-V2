"use client";

import { useCallback, useState } from "react";

import { useAuthStore } from "@/lib/stores/auth";
import type { ActiveWorkSession, TaskResponseDto } from "@/lib/types/api";

/**
 * Estado interno da ação adiada enquanto o diálogo de takeover está aberto.
 */
interface PendingTakeover {
  session: ActiveWorkSession;
  proceed: () => void;
}

/**
 * Props prontas para espalhar em `<TakeoverConfirmDialog {...dialogProps} />`.
 */
export interface TakeoverDialogProps {
  open: boolean;
  session: ActiveWorkSession | null;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Guard de cortesia (client-side) contra colisão de trabalho humano — task #795.
 *
 * Centraliza (1) o predicado de colisão e (2) o estado da ação pendente + do
 * diálogo. Cada superfície que move uma task para EXECUTING ou reatribui o
 * responsável envolve sua mutação em `run(task, proceed)`:
 * - **Sem colisão** → `proceed()` roda imediatamente (fluxo normal, sem atrito).
 * - **Com colisão** → a mutação é adiada e o diálogo abre; em "Assumir" roda,
 *   em "Cancelar" é descartada.
 *
 * **Predicado de colisão (única fonte de verdade):**
 * ```
 * activeWorkSession != null
 *   && activeWorkSession.agentId != null
 *   && activeWorkSession.agentId !== usuarioLogado.entidadeId
 * ```
 * `activeWorkSession != null` já implica `status === EXECUTING` e sessão fresca
 * (o TTL de 2h de sessão órfã é resolvido server-side pela #794 → sessão velha
 * chega como `null` e o guard passa em silêncio). `agentId === null` (sessão sem
 * dono identificável) também passa em silêncio: a trava conservadora vive no MCP
 * da #794; aqui é só UI.
 *
 * A autoridade real de concorrência é o backend/MCP (#794); este guard é
 * cortesia visual para o humano na interface.
 *
 * @example
 * ```tsx
 * const { run, dialogProps } = useWorkCollisionGuard();
 * // ...
 * run(task, () => updateStatus.mutate({ id, status: "EXECUTING", projectId }));
 * // ...
 * <TakeoverConfirmDialog {...dialogProps} actionLabel="assumir" />
 * ```
 */
export function useWorkCollisionGuard() {
  const me = useAuthStore((s) => s.user?.entidadeId ?? null);
  const [pending, setPending] = useState<PendingTakeover | null>(null);

  const run = useCallback(
    (task: Pick<TaskResponseDto, "activeWorkSession">, proceed: () => void) => {
      const session = task.activeWorkSession;
      if (session && session.agentId && session.agentId !== me) {
        setPending({ session, proceed });
      } else {
        proceed();
      }
    },
    [me],
  );

  const dialogProps: TakeoverDialogProps = {
    open: pending !== null,
    session: pending?.session ?? null,
    onCancel: () => setPending(null),
    onConfirm: () => {
      const p = pending;
      setPending(null);
      p?.proceed();
    },
  };

  return { run, dialogProps };
}
