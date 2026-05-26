'use client';

// Mock de execução de tasks via agente VPS.
// Simula o workflow: atribuir agente → confirmar → executar.
// TODO: conectar ao backend quando endpoints de execução estiverem prontos.

import { useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TaskType = 'code' | 'docs' | 'research' | 'validation' | 'other';
export type ExecutionStatus = 'idle' | 'running' | 'done' | 'failed';

export interface MockAgent {
  id: string;
  name: string;
  hostname: string;
  status: 'online' | 'offline';
}

export interface TaskExecution {
  taskId: string;
  agentId: string;
  status: ExecutionStatus;
  startedAt: string | null;
  finishedAt: string | null;
  output: string | null;
}

// ─── Mock agents ──────────────────────────────────────────────────────────────

export const MOCK_AGENTS: MockAgent[] = [
  { id: 'agent-1', name: 'Produção BR-01', hostname: '192.168.1.100', status: 'online' },
  { id: 'agent-2', name: 'Staging EU-02', hostname: '10.0.0.45', status: 'online' },
  { id: 'agent-3', name: 'Dev Local', hostname: 'localhost', status: 'offline' },
];

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

// ─── Hook principal ───────────────────────────────────────────────────────────

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

const AGENT_ASSIGN_KEY = 'scrumban_task_agent_assign_mock';

function loadAssignments(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(AGENT_ASSIGN_KEY) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

function saveAssignments(data: Record<string, string>): void {
  localStorage.setItem(AGENT_ASSIGN_KEY, JSON.stringify(data));
}

export function useTaskExecution(taskId: string) {
  const [, forceRender] = useState(0);
  const refresh = useCallback(() => forceRender((n) => n + 1), []);

  const assignments = loadAssignments();
  const executions = loadExecutions();

  const assignedAgentId = assignments[taskId] ?? null;
  const assignedAgent = MOCK_AGENTS.find((a) => a.id === assignedAgentId) ?? null;
  const execution = executions[taskId] ?? null;

  function assignAgent(agentId: string | null) {
    const updated = { ...loadAssignments() };
    if (agentId === null) {
      delete updated[taskId];
    } else {
      updated[taskId] = agentId;
    }
    saveAssignments(updated);
    refresh();
  }

  function startExecution() {
    const exec: TaskExecution = {
      taskId,
      agentId: assignedAgentId!,
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

  return {
    assignedAgent,
    execution,
    assignAgent,
    startExecution,
    clearExecution,
  };
}
