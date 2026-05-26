'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TaskType = 'code' | 'docs' | 'research' | 'validation' | 'other';
export type ExecutionStatus = 'idle' | 'running' | 'awaiting_approval' | 'done' | 'failed';

export interface TaskExecution {
  taskId: string;
  executionId: string | null;
  status: ExecutionStatus;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  startedAt: string | null;
  finishedAt: string | null;
  output: string | null;
}

export const AI_ASSIGNEE_ID = 'ai';

// ─── Detecção de tipo de task ─────────────────────────────────────────────────

export function detectTaskType(taskName: string): TaskType {
  const name = taskName.toLowerCase();
  if (/\b(doc|document|readme|changelog|wiki|escrever|redigir)\b/.test(name)) return 'docs';
  if (/\b(pesquisa|research|investigar|analisar|explorar|levantar)\b/.test(name)) return 'research';
  if (/\b(validar|testar|review|revisar|homolog|qa)\b/.test(name)) return 'validation';
  if (/\b(implementar|criar|fix|corrigir|refator|build|deploy|feat|bug)\b/.test(name)) return 'code';
  return 'other';
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  code: 'Código',
  docs: 'Documentação',
  research: 'Pesquisa',
  validation: 'Validação',
  other: 'Geral',
};

export const TASK_TYPE_COLORS: Record<TaskType, string> = {
  code: '#6366f1',
  docs: '#f59e0b',
  research: '#22d3ee',
  validation: '#10b981',
  other: '#a1a1aa',
};

// ─── API types ────────────────────────────────────────────────────────────────

interface ExecutionResponseDto {
  id: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  projectId: string;
  approval: { status: string };
  command: { text: string };
  claude?: { exitCode?: number; stdout?: string; finishedAt?: string };
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

// ─── Polling de status ────────────────────────────────────────────────────────

const POLL_INTERVAL = 3000;
const TERMINAL_STATUSES = new Set(['done', 'failed']);

async function pollExecution(
  executionId: string,
  taskId: string,
  signal: AbortSignal,
) {
  while (!signal.aborted) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    if (signal.aborted) break;

    try {
      const { data } = await api.get<ExecutionResponseDto>(`/executions/${executionId}`);
      const approvalStatus = data.approval.status;

      let status: ExecutionStatus = 'running';
      if (approvalStatus === 'awaiting_approval') status = 'awaiting_approval';
      else if (approvalStatus === 'rejected') status = 'failed';
      else if (approvalStatus === 'expired') status = 'failed';
      else if (approvalStatus === 'approved' || approvalStatus === 'queued') {
        // ainda executando — quando o agente acabar, o status do DPedido muda via callback
        // mas não temos um campo "finished" direto no approval — usamos claude.finishedAt
        if (data.claude?.finishedAt) {
          const exitCode = data.claude.exitCode ?? 0;
          status = exitCode === 0 ? 'done' : 'failed';
        }
      }

      const current = executionStore.get(taskId);
      if (current) {
        setExecution(taskId, {
          ...current,
          status,
          finishedAt: data.claude?.finishedAt ?? current.finishedAt,
          output: data.claude?.stdout ?? current.output,
        });
      }

      if (TERMINAL_STATUSES.has(status)) break;
    } catch {
      // rede instável — tenta de novo
    }
  }
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
    return () => { listeners.delete(refresh); };
  }, [refresh]);

  const execution = executionStore.get(taskId) ?? null;

  const executeMutation = useMutation({
    mutationFn: async (pid: string) => {
      const { data } = await api.post<ExecutionResponseDto>(`/projects/${pid}/execute`, {
        command: {
          executable: 'claude',
          args: ['-p', taskId],
          timeoutMs: 600000,
        },
        taskId,
      });
      return data;
    },
    onSuccess: (data) => {
      const exec: TaskExecution = {
        taskId,
        executionId: data.id,
        status: data.approval.status === 'awaiting_approval' ? 'awaiting_approval' : 'running',
        riskLevel: data.riskLevel,
        startedAt: data.createdAt,
        finishedAt: null,
        output: null,
      };
      setExecution(taskId, exec);

      // Invalida queries de tasks para atualizar status
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });

      // Inicia polling
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      void pollExecution(data.id, taskId, ctrl.signal);
    },
  });

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
    isSubmitting: executeMutation.isPending,
    error: executeMutation.error,
  };
}
