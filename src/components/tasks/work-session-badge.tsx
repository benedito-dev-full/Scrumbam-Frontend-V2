import { UserRound } from "lucide-react";

import { formatSince } from "@/lib/format-since";
import { cn } from "@/lib/utils";
import type { TaskResponseDto } from "@/lib/types/api";

interface WorkSessionBadgeProps {
  task: Pick<TaskResponseDto, "status" | "activeWorkSession">;
  /**
   * `compact` (default): pill enxuto para card kanban e linha de lista —
   * mostra só o nome, com o "desde" no tooltip.
   * `full`: linha completa "Em trabalho por Fulano · há X" para a tela de
   * abertura (task-sheet).
   */
  variant?: "compact" | "full";
  className?: string;
}

/**
 * Badge "em trabalho por Fulano" (task #794 / DEV-123).
 *
 * Sinaliza que a task está sendo trabalhada por alguém AGORA. Renderiza SOMENTE
 * quando `status === 'EXECUTING'` E o backend entregou `activeWorkSession`
 * (workSession aberta e fresca — o TTL de 2h de sessão órfã é aplicado
 * server-side, então este componente apenas exibe o que recebe). Retorna `null`
 * caso contrário, sendo seguro espalhar em qualquer lugar.
 *
 * A trava de concorrência real vive no backend (camada MCP) — este badge é o
 * espelho visual que evita que dois humanos disputem a mesma task.
 *
 * @see ActiveWorkSession — tipo espelhado de `ActiveWorkSessionDto`
 */
export function WorkSessionBadge({
  task,
  variant = "compact",
  className,
}: WorkSessionBadgeProps) {
  const active = task.activeWorkSession;
  if (task.status !== "EXECUTING" || !active) {
    return null;
  }

  const who = active.agentName ?? "outro usuário";
  const since = formatSince(active.startedAt);
  const fullText = since
    ? `Em trabalho por ${who} · ${since}`
    : `Em trabalho por ${who}`;

  if (variant === "full") {
    return (
      <span
        title={fullText}
        aria-label={fullText}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md bg-amber-500/15 px-2 py-1 text-[12px] font-medium text-amber-300",
          className,
        )}
      >
        <UserRound className="size-3.5" />
        {fullText}
      </span>
    );
  }

  return (
    <span
      title={fullText}
      aria-label={fullText}
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-sm bg-amber-500/15 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-amber-300",
        className,
      )}
    >
      <UserRound className="size-2.5 shrink-0" />
      <span className="truncate">{who}</span>
    </span>
  );
}
