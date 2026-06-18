"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import React, { useRef, useState } from "react";
import { Clock, Loader2, User } from "lucide-react";

// ─── Internos ─────────────────────────────────────────────────────────────────
import { useTask } from "@/hooks/use-tasks";
import { useTaskTimer, formatDuration } from "@/hooks/use-task-timer";
import { TimerControls } from "@/components/tasks/timer-controls";
import { cn } from "@/lib/utils";

import { Popover } from "./cells";

/**
 * Célula "Tempo" da view de Blocos com timer inline (ADR-V2-057).
 *
 * Mostra o total agregado (label pronta do backend, `timeSpentLabel`) e, ao
 * clicar, abre um popover compacto com o cronômetro do usuário logado e os
 * controles Iniciar/Pausar/Retomar/Parar — evitando abrir o drawer da task só
 * para bater o ponto.
 *
 * O estado fresco do timer é buscado **sob demanda** (`useTask`) apenas quando o
 * popover está aberto — não há query por linha enquanto a célula está fechada.
 *
 * @param tdStyle   - Estilo base da `<td>` (vindo do `TaskRow`).
 * @param label     - Total agregado já formatado (ex.: "2h 30min") ou "" / "—".
 * @param taskId    - ID da DTask.
 * @param projectId - ID do DProject (List) — invalidação e nomes de membros.
 * @param isRollup  - Quando `true`, o `label` é a SOMA do tempo das filhas
 *                    (task mãe); exibe um badge "Σ" sinalizando o rollup.
 */
export function TimeSpentCell({
  tdStyle,
  label,
  taskId,
  projectId,
  isRollup = false,
}: {
  tdStyle: React.CSSProperties;
  label: string;
  taskId: string;
  projectId: string;
  isRollup?: boolean;
}) {
  const ref = useRef<HTMLTableCellElement>(null);
  const [open, setOpen] = useState(false);
  const hasValue = !!label && label !== "—";

  return (
    <td
      ref={ref}
      style={{ ...tdStyle, textAlign: "center", cursor: "pointer" }}
      onClick={() => setOpen(true)}
      title={isRollup ? "Soma do tempo das subtarefas" : "Registrar tempo"}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          color: hasValue ? "var(--foreground)" : "var(--muted-foreground)",
        }}
      >
        {label || "—"}
        {isRollup && (
          <span
            aria-hidden
            title="Soma das subtarefas"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 14,
              height: 14,
              padding: "0 3px",
              borderRadius: 3,
              background: "rgba(124, 92, 255, 0.18)",
              color: "#7c5cff",
              fontSize: 9,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            Σ
          </span>
        )}
      </span>
      {open && (
        <Popover anchorRef={ref} onClose={() => setOpen(false)} align="right">
          <TimerPopoverBody taskId={taskId} projectId={projectId} />
        </Popover>
      )}
    </td>
  );
}

/**
 * Corpo do popover de timer — só monta quando aberto (lazy-fetch via `useTask`).
 *
 * Mostra "Meu tempo" (cronômetro do usuário logado), aviso quando a sessão é de
 * outro usuário, e os `TimerControls` compartilhados com o painel do drawer.
 */
function TimerPopoverBody({
  taskId,
  projectId,
}: {
  taskId: string;
  projectId: string;
}) {
  const { data: task, isLoading } = useTask(taskId);
  const timer = useTaskTimer(taskId, projectId, task?.timer);

  return (
    <div
      style={{
        width: 230,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
      // Cliques internos não devem propagar para a célula/linha por baixo.
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Clock className="size-3.5 text-sky-400" />
        <span className="text-[12px] font-semibold text-sky-300">
          Tempo de trabalho
        </span>
      </div>

      {/* Cronômetro do usuário logado */}
      <div className="flex items-center justify-between gap-2 rounded-lg bg-sky-500/10 px-3 py-2">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Meu tempo
        </span>
        <span
          className={cn(
            "font-mono text-[14px] font-semibold tabular-nums",
            timer.isRunningMine ? "text-sky-300" : "text-foreground",
          )}
        >
          {formatDuration(timer.displayMs)}
        </span>
      </div>

      {/* Aviso: timer aberto por outro usuário */}
      {timer.isRunningOther && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5">
          <User className="size-3.5 shrink-0 text-amber-400" />
          <span className="text-[11px] text-amber-300">
            Timer aberto por outro usuário
          </span>
        </div>
      )}

      {/* Controles — spinner enquanto o estado fresco carrega (evita flicker
          de mostrar "Iniciar" antes de saber se já existe sessão aberta). */}
      {isLoading && !task ? (
        <div className="flex items-center justify-center py-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
        </div>
      ) : (
        <TimerControls timer={timer} />
      )}
    </div>
  );
}
