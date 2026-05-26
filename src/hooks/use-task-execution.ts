'use client';

// Mock de execução de tasks via agente IA herdado do projeto.
// O agente não é selecionado na task — é herdado do Space/Folder/List.
// TODO: conectar ao backend quando endpoints de execução estiverem prontos.

import { useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TaskType = 'code' | 'docs' | 'research' | 'validation' | 'other';
export type ExecutionStatus = 'idle' | 'running' | 'done' | 'failed';

export interface TaskExecution {
  taskId: string;
  status: ExecutionStatus;
  startedAt: string | null;
  finishedAt: string | null;
  output: string | null;
}

// ─── Constante especial — assigneeId quando task é da IA ─────────────────────
// Valor reservado que identifica "responsável = IA" no campo assigneeId.
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

// ─── Store de execuções (mock localStorage) ───────────────────────────────────

const STORAGE_KEY = 'scrumban_task_executions_mock';

function loadExecutions(): Record<string, TaskExecution> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, TaskExecution>;
  } catch {
    return {};
  }
}

function saveExecutions(data: Record<string, TaskExecution>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useTaskExecution(taskId: string) {
  const [, forceRender] = useState(0);
  const refresh = useCallback(() => forceRender((n) => n + 1), []);

  const execution = loadExecutions()[taskId] ?? null;

  function startExecution() {
    const exec: TaskExecution = {
      taskId,
      status: 'running',
      startedAt: new Date().toISOString(),
      finishedAt: null,
      output: null,
    };
    saveExecutions({ ...loadExecutions(), [taskId]: exec });
    refresh();

    // Simula conclusão após 4s
    setTimeout(() => {
      const finished: TaskExecution = {
        ...exec,
        status: 'done',
        finishedAt: new Date().toISOString(),
        output: 'Execução concluída com sucesso. Alterações aplicadas no repositório.',
      };
      saveExecutions({ ...loadExecutions(), [taskId]: finished });
      refresh();
    }, 4000);
  }

  function clearExecution() {
    const all = loadExecutions();
    delete all[taskId];
    saveExecutions(all);
    refresh();
  }

  return { execution, startExecution, clearExecution };
}
