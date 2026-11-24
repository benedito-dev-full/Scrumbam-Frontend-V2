"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Ban,
  Bot,
  CheckCircle2,
  Clock,
  ExternalLink,
  GitBranch,
  Loader2,
  Play,
} from "lucide-react";
import { useExecutionDetail } from "@/hooks/use-execution-approval";
import {
  buildExecution,
  friendlyFailureReason,
  useTaskExecution,
  detectTaskType,
  TASK_TYPE_LABELS,
  TASK_TYPE_COLORS,
} from "@/hooks/use-task-execution";
import type { TaskExecution } from "@/hooks/use-task-execution";
import type {
  ActiveExecutionDto,
  ExecutionPipelineDecision,
} from "@/lib/types/api";
import { ApprovalCard } from "./task-detail-drawer-ai-approval";

// ─── AiExecutionPanel ─────────────────────────────────────────────────────────

export function AiExecutionPanel({
  taskId,
  taskName,
  projectId,
  activeExecution = null,
}: {
  taskId: string;
  taskName: string;
  projectId: string;
  /** Execução viva vinda da task — permite ao gestor aprovar sem ter disparado. */
  activeExecution?: ActiveExecutionDto | null;
}) {
  const {
    execution,
    startExecution,
    clearExecution,
    adoptExecution,
    isSubmitting,
  } = useTaskExecution(taskId, projectId);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const taskType = detectTaskType(taskName);
  const typeColor = TASK_TYPE_COLORS[taskType];
  const typeLabel = TASK_TYPE_LABELS[taskType];
  // Fonte da verdade: store em memória (quem disparou, com polling próprio) ou
  // activeExecution da task (qualquer usuário, ex.: o gestor que vai aprovar).
  // Neste segundo caso o detalhe da execução (com polling) prevalece sobre o
  // status da task, que não é repolled.
  const live = execution ? null : activeExecution;
  const awaitingId = execution?.executionId ?? live?.id ?? null;
  // Store já faz polling para quem disparou; o detalhe só é buscado enquanto
  // aguarda aprovação (risco/expiração) ou no caminho sem store.
  const detailId =
    execution && execution.status !== "awaiting_approval" ? null : awaitingId;
  const detail = useExecutionDetail(detailId, !execution);
  const view: TaskExecution | null =
    execution ??
    (live && detail.data
      ? buildExecution(taskId, detail.data)
      : live
        ? {
            taskId,
            executionId: live.id,
            status:
              live.status === "awaiting_approval"
                ? "awaiting_approval"
                : "running",
            riskLevel: live.riskLevel,
            startedAt: live.startedAt,
            finishedAt: null,
            output: null,
            approval: null,
            risk: null,
            failureReason: null,
            pullRequest: null,
            git: null,
            pipeline: null,
          }
        : null);
  const awaitingCurrent = detail.data
    ? buildExecution(taskId, detail.data, execution)
    : view;
  const isAwaiting = view?.status === "awaiting_approval";
  const isRunning = view?.status === "running" || isSubmitting;
  const isDone = view?.status === "done";
  const isFailed = view?.status === "failed";
  const isRejected = view?.status === "rejected";
  const isExpired = view?.status === "expired";

  return (
    <>
      <div className="flex flex-col gap-2.5 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3.5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Bot className="size-3.5 text-violet-400" />
          <span className="text-[12px] font-semibold text-violet-300">
            Execução IA
          </span>
          <span
            className="rounded-full px-1.5 py-px text-[10px] font-semibold"
            style={{ background: `${typeColor}20`, color: typeColor }}
          >
            {typeLabel}
          </span>
        </div>

        {/* Estado */}
        {isAwaiting && awaitingId && !isSubmitting && (
          <ApprovalCard
            executionId={awaitingId}
            projectId={projectId}
            riskLevel={view?.riskLevel ?? null}
            current={awaitingCurrent}
            onDecided={adoptExecution}
          />
        )}

        {isRunning && (
          <div className="flex items-center gap-2 rounded-lg bg-violet-500/10 px-3 py-2.5">
            <Loader2 className="size-3.5 shrink-0 animate-spin text-violet-400" />
            <span className="text-[12px] text-violet-300">
              {isSubmitting
                ? "Enviando para o agente..."
                : "Agente processando a task..."}
            </span>
            {!isSubmitting && view?.startedAt && (
              <ElapsedLabel startedAt={view.startedAt} />
            )}
          </div>
        )}
        {isRunning && !isSubmitting && view?.pipeline?.required && (
          <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
            A esteira de agentes pode levar algumas horas. Você pode fechar
            este painel — o acompanhamento continua ao reabri-lo.
          </p>
        )}

        {isDone && view && (
          <div className="flex flex-col gap-2 rounded-lg border border-green-500/20 bg-green-500/5 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 shrink-0 text-green-400" />
              <span className="text-[12px] font-semibold text-green-300">
                Concluído
              </span>
              {view.finishedAt && (
                <span className="ml-auto text-[11px] text-muted-foreground">
                  {new Date(view.finishedAt).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
            <PipelineResult view={view} />
            {view.output && (
              <p className="text-[12px] leading-relaxed text-muted-foreground">
                {view.output}
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
          <div
            role="alert"
            className="flex flex-col gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="size-3.5 shrink-0 text-red-400" />
              <span className="text-[12px] text-red-300">
                {friendlyFailureReason(view?.failureReason ?? null) ??
                  "Execução falhou"}
              </span>
              <button
                type="button"
                onClick={clearExecution}
                className="ml-auto text-[11px] text-muted-foreground underline hover:text-foreground"
              >
                Limpar
              </button>
            </div>
            {view && <PipelineResult view={view} />}
          </div>
        )}

        {isRejected && (
          <div className="flex flex-col gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Ban className="size-3.5 shrink-0 text-red-400" />
              <span className="text-[12px] font-semibold text-red-300">
                Execução rejeitada pelo gestor
              </span>
              <button
                type="button"
                onClick={clearExecution}
                className="ml-auto text-[11px] text-muted-foreground underline hover:text-foreground"
              >
                Limpar
              </button>
            </div>
            {view.approval?.rejectedReason && (
              <p className="text-[12px] leading-relaxed text-muted-foreground">
                Motivo: {view.approval?.rejectedReason}
              </p>
            )}
          </div>
        )}

        {isExpired && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
            <Clock className="size-3.5 shrink-0 text-amber-400" />
            <span className="text-[12px] text-amber-300">
              Aprovação expirou
            </span>
            <button
              type="button"
              onClick={() => {
                clearExecution();
                setConfirmOpen(true);
              }}
              className="ml-auto text-[11px] text-muted-foreground underline hover:text-foreground"
            >
              Executar novamente
            </button>
          </div>
        )}

        {/* Botão executar */}
        {!view && !activeExecution && (
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

// ─── Resultado da esteira ─────────────────────────────────────────────────────

const DECISION_LABELS: Record<ExecutionPipelineDecision, string> = {
  APPROVED: "Aprovado",
  NEEDS_CHANGES: "Requer ajustes",
  REJECTED: "Rejeitado",
  NO_CHANGES: "Sem alterações",
  ABORTED: "Abortado",
};

/** Só devolve a URL se for https:// válida (evita javascript:/http: vindos do payload). */
function safeHttpsUrl(url: string | undefined): string | null {
  if (!url || !url.startsWith("https://")) return null;
  try {
    return new URL(url).protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

/** "há 12 min" / "há 2h05" desde `startedAt`; atualiza a cada 30s. */
function ElapsedLabel({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const started = Date.parse(startedAt);
  if (Number.isNaN(started)) return null;
  const min = Math.max(0, Math.floor((now - started) / 60_000));
  const label =
    min < 60
      ? `${min} min`
      : `${Math.floor(min / 60)}h${String(min % 60).padStart(2, "0")}`;
  return (
    <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
      em execução há {label}
    </span>
  );
}

/** Summary da esteira como texto puro; recolhível quando longo. */
function PipelineSummary({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 280 || text.split("\n").length > 4;
  return (
    <div className="flex flex-col gap-1">
      <p
        className={`whitespace-pre-wrap break-words text-[12px] leading-relaxed text-muted-foreground ${
          isLong && !expanded ? "line-clamp-4" : ""
        }`}
      >
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className="self-start text-[11px] text-muted-foreground underline hover:text-foreground"
        >
          {expanded ? "Mostrar menos" : "Mostrar mais"}
        </button>
      )}
    </div>
  );
}

/** PR, rascunho, decisão/nota do Reviewer, branch e resumo (tudo opcional). */
function PipelineResult({ view }: { view: TaskExecution }) {
  const { pullRequest, pipeline, git } = view;
  const prUrl = safeHttpsUrl(pullRequest?.url);
  const decision = pipeline?.decision
    ? (DECISION_LABELS[pipeline.decision] ?? null)
    : null;
  const score =
    typeof pipeline?.reviewScore === "number" ? pipeline.reviewScore : null;
  const summary = pipeline?.summary?.trim() || null;
  if (!prUrl && !decision && score === null && !git?.branch && !summary)
    return null;

  return (
    <div className="flex flex-col gap-2">
      {(prUrl || decision || score !== null) && (
        <div className="flex flex-wrap items-center gap-2">
          {prUrl && (
            <a
              href={prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-2.5 py-1 text-[12px] font-semibold text-white transition-colors hover:bg-violet-500"
            >
              <ExternalLink className="size-3" />
              {pullRequest?.number ? `Ver PR #${pullRequest.number}` : "Ver PR"}
            </a>
          )}
          {prUrl && pullRequest?.isDraft && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
              Rascunho
            </span>
          )}
          {decision && (
            <span className="text-[11px] text-muted-foreground">
              Reviewer: <strong className="font-semibold">{decision}</strong>
            </span>
          )}
          {score !== null && (
            <span className="text-[11px] text-muted-foreground">
              Nota{" "}
              <strong className="font-semibold">{score.toFixed(1)}/10</strong>
            </span>
          )}
        </div>
      )}
      {git?.branch && (
        <span className="inline-flex items-center gap-1 break-all text-[11px] text-muted-foreground">
          <GitBranch className="size-3 shrink-0" />
          {git.branch}
        </span>
      )}
      {summary && <PipelineSummary text={summary} />}
    </div>
  );
}

// ─── AiConfirmModal ───────────────────────────────────────────────────────────

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
              Confirmar execução
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

