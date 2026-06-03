"use client";

import { useState } from "react";
import { AlertCircle, Bot, CheckCircle2, Loader2, Play } from "lucide-react";
import {
  useTaskExecution,
  detectTaskType,
  TASK_TYPE_LABELS,
  TASK_TYPE_COLORS,
} from "@/hooks/use-task-execution";

// â”€â”€â”€ AiExecutionPanel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function AiExecutionPanel({
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
            ExecuÃ§Ã£o IA
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
                  ? "Aguardando aprovaÃ§Ã£o (risco ALTO)..."
                  : "Agente processando a task..."}
            </span>
          </div>
        )}

        {isDone && (
          <div className="flex flex-col gap-2 rounded-lg border border-green-500/20 bg-green-500/5 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 shrink-0 text-green-400" />
              <span className="text-[12px] font-semibold text-green-300">
                ConcluÃ­do
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
            <span className="text-[12px] text-red-300">ExecuÃ§Ã£o falhou</span>
            <button
              type="button"
              onClick={clearExecution}
              className="ml-auto text-[11px] text-muted-foreground underline hover:text-foreground"
            >
              Limpar
            </button>
          </div>
        )}

        {/* BotÃ£o executar */}
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

// â”€â”€â”€ AiConfirmModal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
              Confirmar execuÃ§Ã£o
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

