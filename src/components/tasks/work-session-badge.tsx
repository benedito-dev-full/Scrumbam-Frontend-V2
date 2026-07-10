import { UserRound } from "lucide-react";

import { cn } from "@/lib/utils";
import type { TaskResponseDto } from "@/lib/types/api";

/**
 * Formata "desde X" de forma compacta em pt-BR ("há 5 min", "há 2 h", "há 1 d").
 *
 * Puramente visual — o backend é a fonte de verdade do `startedAt`. Usa
 * `Intl.RelativeTimeFormat` (sem dependência externa, compatível com o CSP).
 */
function formatSince(startedAt: string): string {
  const startedMs = new Date(startedAt).getTime();
  if (!Number.isFinite(startedMs)) return "";
  const diffMs = Date.now() - startedMs;
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.round(hours / 24);
  return rtf.format(-days, "day");
}

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
