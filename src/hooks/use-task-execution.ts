"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type {
  ExecutionFailureReason,
  ExecutionGitDto,
  ExecutionOutcomeDto,
  ExecutionPipelineDto,
  ExecutionPullRequestDto,
} from "@/lib/types/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TaskType = "code" | "docs" | "research" | "validation" | "other";
export type ExecutionStatus =
  | "idle"
  | "running"
  | "awaiting_approval"
  | "done"
  | "failed"
  | "rejected"
  | "expired";

/** Resumo do motivo da classificação de risco (espelha `RiskSummaryDto`). */
export interface ExecutionRisk {
  explanation: string;
  matchedPatterns: { pattern: string; level: string; source?: string }[];
}

/** Dados de aprovação relevantes para a UI (expiração e rejeição). */
export interface ExecutionApprovalInfo {
  expiresAt: string | null;
  rejectedReason: string | null;
  rejectedBy: string | null;
}

export interface TaskExecution {
  taskId: string;
  executionId: string | null;
  status: ExecutionStatus;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | null;
  startedAt: string | null;
  finishedAt: string | null;
  output: string | null;
  approval: ExecutionApprovalInfo | null;
  /** Motivo do risco — ausente em registros antigos. */
  risk: ExecutionRisk | null;
  /** `outcome.reason` (falha marcada pelo sistema ou rebaixada pela esteira). */
  failureReason: ExecutionFailureReason | null;
  /** PR verificado pelo agente (modo esteira) — ausente em execuções legadas. */
  pullRequest: ExecutionPullRequestDto | null;
  /** Branch/commits/push verificados — ausente em execuções legadas. */
  git: ExecutionGitDto | null;
  /** Resultado da esteira de agentes — ausente em execuções legadas/COMMAND. */
  pipeline: ExecutionPipelineDto | null;
}

/** Texto amigável por motivo canônico (mapa exaustivo: o TS acusa se o backend ganhar um novo). */
const FAILURE_REASON_MESSAGES: Record<ExecutionFailureReason, string> = {
  TIMEOUT_NO_CALLBACK: "A IA não respondeu a tempo.",
  AGENT_RESTARTED: "O agente foi reiniciado durante a execução.",
  QUEUE_STALE: "A execução não saiu da fila.",
  TUNNEL_UNAVAILABLE: "O agente está indisponível no momento.",
  DISPATCH_FAILED: "Não foi possível enviar a execução ao agente.",
  PROJECT_BUSY_EXHAUSTED:
    "O projeto ficou ocupado por muito tempo com outra execução.",
  DUPLICATE_TASK_EXECUTION: "Já havia outra execução desta task em andamento.",
  BACKFILL_STALE: "Execução antiga encerrada pelo sistema.",
  PIPELINE_NOT_INSTALLED:
    "Este projeto ainda não tem a esteira de agentes instalada (comando /scrumban-executar).",
  PIPELINE_PRECONDITION_FAILED:
    "O ambiente do agente não está pronto (GitHub CLI/token, branch base ou git).",
  PIPELINE_CONTRACT_MISSING:
    "A esteira terminou sem o resultado esperado (ou sem passar pelo Reviewer).",
  PIPELINE_NOT_APPROVED:
    "A esteira não aprovou o resultado — o PR ficou em rascunho.",
  PR_NOT_CREATED: "Nenhum PR foi aberto pela esteira.",
};

/** Texto amigável (PT-BR) para o motivo da falha; `null` se ausente/desconhecido. */
export function friendlyFailureReason(
  reason: ExecutionFailureReason | null,
): string | null {
  if (!reason) return null;
  return Object.hasOwn(FAILURE_REASON_MESSAGES, reason)
    ? FAILURE_REASON_MESSAGES[reason]
    : null;
}

export const AI_ASSIGNEE_ID = "ai";

// ─── Detecção de tipo de task ─────────────────────────────────────────────────

export function detectTaskType(taskName: string): TaskType {
  const name = taskName.toLowerCase();
  if (/\b(doc|document|readme|changelog|wiki|escrever|redigir)\b/.test(name))
    return "docs";
  if (
    /\b(pesquisa|research|investigar|analisar|explorar|levantar)\b/.test(name)
  )
    return "research";
  if (/\b(validar|testar|review|revisar|homolog|qa)\b/.test(name))
    return "validation";
  if (
    /\b(implementar|criar|fix|corrigir|refator|build|deploy|feat|bug)\b/.test(
      name,
    )
  )
    return "code";
  return "other";
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  code: "Código",
  docs: "Documentação",
  research: "Pesquisa",
  validation: "Validação",
  other: "Geral",
};

export const TASK_TYPE_COLORS: Record<TaskType, string> = {
  code: "#6366f1",
  docs: "#f59e0b",
  research: "#22d3ee",
  validation: "#10b981",
  other: "#a1a1aa",
};

// ─── API types ────────────────────────────────────────────────────────────────

export interface ExecutionResponseDto {
  id: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  projectId: string;
  approval: {
    status: string;
    expiresAt?: string;
    rejectedReason?: string;
    rejectedBy?: string;
  };
  risk?: ExecutionRisk;
  /** Ausente em backends antigos; `reason` vem com `source='system'` ou motivo da esteira (`'agent'`). */
  outcome?: ExecutionOutcomeDto;
  /** Campos aditivos da esteira (ADR-V2-083) — todos opcionais. */
  pullRequest?: ExecutionPullRequestDto;
  git?: ExecutionGitDto;
  pipeline?: ExecutionPipelineDto;
  command: { text: string };
  claude?: {
    exitCode?: number;
    stdout?: string;
    finishedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ─── Store em memória (por sessão, sem localStorage) ─────────────────────────

const executionStore = new Map<string, TaskExecution>();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

function setExecution(taskId: string, exec: TaskExecution) {
  executionStore.set(taskId, exec);
  notify();
}

function deleteExecution(taskId: string) {
  executionStore.delete(taskId);
  notify();
}

// ─── Mapeamento DTO → estado da UI ────────────────────────────────────────────

export function deriveStatus(data: ExecutionResponseDto): ExecutionStatus {
  const approvalStatus = data.approval.status;
  if (approvalStatus === "awaiting_approval") return "awaiting_approval";
  if (approvalStatus === "rejected") return "rejected";
  if (approvalStatus === "expired") return "expired";
  if (data.claude?.finishedAt) {
    // Motivo canônico de falha (sistema ou esteira) prevalece sobre o exitCode.
    if (data.outcome?.reason) return "failed";
    // approved/queued com fim registrado: o exitCode decide o desfecho.
    return (data.claude.exitCode ?? 0) === 0 ? "done" : "failed";
  }
  return "running";
}

/** Converte a resposta do backend no estado em memória da task. */
export function buildExecution(
  taskId: string,
  data: ExecutionResponseDto,
  current?: TaskExecution | null,
): TaskExecution {
  return {
    taskId,
    executionId: data.id,
    status: deriveStatus(data),
    riskLevel: data.riskLevel,
    startedAt: current?.startedAt ?? data.createdAt,
    finishedAt: data.claude?.finishedAt ?? current?.finishedAt ?? null,
    output: data.claude?.stdout ?? current?.output ?? null,
    approval: {
      expiresAt: data.approval.expiresAt ?? null,
      rejectedReason: data.approval.rejectedReason ?? null,
      rejectedBy: data.approval.rejectedBy ?? null,
    },
    risk: data.risk ?? current?.risk ?? null,
    // Com `outcome` presente o backend é a fonte: reason null limpa um motivo antigo.
    failureReason: data.outcome
      ? data.outcome.reason
      : (current?.failureReason ?? null),
    pullRequest: data.pullRequest ?? current?.pullRequest ?? null,
    git: data.git ?? current?.git ?? null,
    pipeline: data.pipeline ?? current?.pipeline ?? null,
  };
}

// ─── Polling de status ────────────────────────────────────────────────────────

const POLL_INTERVAL = 3000;
/** Após este tempo de execução o polling recua (esteira pode levar horas). */
const SLOW_POLL_AFTER_MS = 10 * 60 * 1000;
const SLOW_POLL_INTERVAL = 15000;

/** Intervalo de polling: 3s no início; 15s após 10 min desde a criação da execução. */
export function pollIntervalFor(startedAt: string | null, now: number): number {
  const started = startedAt ? Date.parse(startedAt) : NaN;
  if (Number.isNaN(started)) return POLL_INTERVAL;
  return now - started > SLOW_POLL_AFTER_MS
    ? SLOW_POLL_INTERVAL
    : POLL_INTERVAL;
}
const TERMINAL_STATUSES = new Set<ExecutionStatus>([
  "done",
  "failed",
  "rejected",
  "expired",
]);

async function pollExecution(
  executionId: string,
  taskId: string,
  signal: AbortSignal,
  queryClient: ReturnType<typeof useQueryClient>,
) {
  while (!signal.aborted) {
    const wait = pollIntervalFor(
      executionStore.get(taskId)?.startedAt ?? null,
      Date.now(),
    );
    await new Promise((r) => setTimeout(r, wait));
    if (signal.aborted) break;

    try {
      const { data } = await api.get<ExecutionResponseDto>(
        `/executions/${executionId}`,
      );
      const current = executionStore.get(taskId);
      const previousStatus = current?.status;
      const next = buildExecution(taskId, data, current);
      const status = next.status;
      if (current) setExecution(taskId, next);

      // Quando o status muda para terminal, invalida a query de tasks
      // para que a UI da lista/kanban reflita o novo estado sem reload manual.
      if (TERMINAL_STATUSES.has(status) && previousStatus !== status) {
        void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      }

      if (TERMINAL_STATUSES.has(status)) break;
    } catch {
      // rede instável — tenta de novo
    }
  }
}

/** Extrai `details.executionId` do 409 `EXECUTION_IN_PROGRESS` (distinto do 409 de Idempotency-Key). */
function parseExecutionInProgress(err: unknown): { executionId: string } | null {
  if (!axios.isAxiosError(err) || err.response?.status !== 409) return null;
  const body = err.response.data as
    | { code?: string; details?: { reason?: string; executionId?: string } }
    | undefined;
  const isInProgress =
    body?.code === "EXECUTION_IN_PROGRESS" ||
    body?.details?.reason === "execution_in_progress";
  const id = body?.details?.executionId;
  return isInProgress && id ? { executionId: String(id) } : null;
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useTaskExecution(taskId: string, projectId?: string) {
  const [, forceRender] = useState(0);
  const refresh = useCallback(() => forceRender((n) => n + 1), []);
  const abortRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  // Subscreve ao store global para re-render quando qualquer execução mudar
  useEffect(() => {
    listeners.add(refresh);
    return () => {
      listeners.delete(refresh);
    };
  }, [refresh]);

  const execution = executionStore.get(taskId) ?? null;

  const executeMutation = useMutation({
    mutationFn: async (pid: string) => {
      // Backend monta o prompt natural a partir da DTask (ADR-V2-049).
      // Frontend passa apenas taskId — backend lê titulo/descricao da task,
      // escolhe template por taskType, e injeta em dados.prompt.
      const { data } = await api.post<ExecutionResponseDto>(
        `/projects/${pid}/execute`,
        {
          taskId,
        },
      );
      return data;
    },
    onSuccess: (data) => adoptExecution(data),
    onError: (err) => {
      const info = parseExecutionInProgress(err);
      if (!info) return;
      void adoptExisting(info.executionId);
    },
  });

  /** F-1: 409 EXECUTION_IN_PROGRESS — retoma o acompanhamento da execução existente. */
  async function adoptExisting(executionId: string) {
    try {
      const { data } = await api.get<ExecutionResponseDto>(
        `/executions/${executionId}`,
      );
      const exec = adoptExecution(data);
      // Corrida: se já terminou, o painel mostra o desfecho; sem toast de "retomada".
      if (!TERMINAL_STATUSES.has(exec.status)) {
        toast.info("Já existe uma execução em andamento", {
          description: "Retomamos o acompanhamento dela.",
        });
      }
    } catch {
      toast.error("Já existe uma execução em andamento para esta task.");
    }
  }

  /**
   * Registra uma execução (recém-criada ou decidida por aprovação) no store
   * em memória, invalida as tasks e (re)inicia o polling se não for terminal.
   */
  function adoptExecution(data: ExecutionResponseDto): TaskExecution {
    const exec = buildExecution(taskId, data, executionStore.get(taskId));
    setExecution(taskId, exec);
    void queryClient.invalidateQueries({ queryKey: ["tasks"] });

    abortRef.current?.abort();
    if (TERMINAL_STATUSES.has(exec.status)) return exec;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    void pollExecution(data.id, taskId, ctrl.signal, queryClient);
    return exec;
  }

  function startExecution() {
    if (!projectId) return;
    executeMutation.mutate(projectId);
  }

  function clearExecution() {
    abortRef.current?.abort();
    deleteExecution(taskId);
  }

  return {
    execution,
    startExecution,
    clearExecution,
    adoptExecution,
    isSubmitting: executeMutation.isPending,
    error: executeMutation.error,
  };
}
