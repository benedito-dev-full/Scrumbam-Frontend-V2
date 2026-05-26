/**
 * Mapeamento de V3 Intentions do backend para colunas e labels da UX Kanban.
 *
 * V3 Intentions são os estados canônicos do workflow Scrumban (backend).
 * Colunas Kanban são os agrupamentos visuais acordados com o CEO para o frontend.
 *
 * @see docs/plano/00-PLANO-MESTRE.md — §V3 Intentions
 */

import type { V3Intention } from '@/lib/types/api';

// ─── Colunas Kanban (agrupamentos visuais do frontend) ────────────────────────

export type KanbanColumn =
  | 'backlog'
  | 'ready'
  | 'em-progresso'
  | 'concluido'
  | 'falhou';

export interface KanbanColumnConfig {
  id: KanbanColumn;
  /** Label exibido no header da coluna. */
  label: string;
  /** Cor hexadecimal do header da coluna. */
  color: string;
  /** V3 Intentions agrupadas nesta coluna. */
  intentions: V3Intention[];
}

// ─── Configuração das colunas ────────────────────────────────────────────────

/**
 * Definição canônica das 5 colunas Kanban acordadas com o CEO.
 *
 * Mapeamento:
 * - backlog      → INBOX
 * - ready        → READY
 * - em-progresso → EXECUTING, VALIDATING
 * - concluido    → DONE, VALIDATED, CANCELLED, DISCARDED
 * - falhou       → FAILED
 *
 * "atrasado" NÃO é uma coluna — é um badge calculado via `isOverdue()`.
 */
export const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    id: 'backlog',
    label: 'Backlog',
    color: '#6b7280',
    intentions: ['INBOX'],
  },
  {
    id: 'ready',
    label: 'Pronto',
    color: '#3b82f6',
    intentions: ['READY'],
  },
  {
    id: 'em-progresso',
    label: 'Em Progresso',
    color: '#8b5cf6',
    intentions: ['EXECUTING', 'VALIDATING'],
  },
  {
    id: 'concluido',
    label: 'Concluído',
    color: '#10b981',
    intentions: ['DONE', 'VALIDATED', 'CANCELLED', 'DISCARDED'],
  },
  {
    id: 'falhou',
    label: 'Falhou',
    color: '#ef4444',
    intentions: ['FAILED'],
  },
];

// ─── Helpers de mapeamento ────────────────────────────────────────────────────

/**
 * Mapeia uma V3 Intention para a coluna Kanban correspondente.
 *
 * Fallback para 'backlog' em caso de intention desconhecida (defensive).
 *
 * @param intention - V3 Intention vinda do backend (campo `status` da task).
 * @returns ID da coluna Kanban.
 *
 * @example
 * ```typescript
 * intentionToColumn('EXECUTING') // 'em-progresso'
 * intentionToColumn('DONE')      // 'concluido'
 * intentionToColumn('INBOX')     // 'backlog'
 * ```
 */
export function intentionToColumn(intention: V3Intention): KanbanColumn {
  for (const col of KANBAN_COLUMNS) {
    if (col.intentions.includes(intention)) return col.id;
  }
  return 'backlog';
}

/**
 * Retorna a configuração completa de uma coluna pelo ID.
 *
 * @param columnId - ID da coluna Kanban.
 * @returns `KanbanColumnConfig` ou `undefined` se não encontrada.
 */
export function getColumnConfig(columnId: KanbanColumn): KanbanColumnConfig | undefined {
  return KANBAN_COLUMNS.find((col) => col.id === columnId);
}

// ─── Cálculo de atraso ────────────────────────────────────────────────────────

/**
 * Intentions terminais — tasks nestes estados nunca são consideradas atrasadas,
 * mesmo que `dueDate` já tenha passado.
 */
const TERMINAL_INTENTIONS: V3Intention[] = [
  'DONE',
  'VALIDATED',
  'CANCELLED',
  'DISCARDED',
  'FAILED',
];

/**
 * Verifica se uma task está atrasada em relação ao `dueDate`.
 *
 * Calculado em runtime no frontend — NÃO vem do backend como campo.
 * Tasks em estado terminal nunca são consideradas atrasadas.
 * "atrasado" é exibido como badge na task, não como coluna separada.
 *
 * @param dueDate - Data de vencimento ISO 8601 (ou null/undefined se não definida).
 * @param intention - V3 Intention atual da task.
 * @returns `true` se a task está atrasada (dueDate no passado e intention não-terminal).
 *
 * @example
 * ```typescript
 * isOverdue('2024-01-01', 'EXECUTING') // true  (data passada, não-terminal)
 * isOverdue('2030-12-31', 'EXECUTING') // false (data futura)
 * isOverdue('2024-01-01', 'DONE')      // false (terminal, nunca atrasada)
 * isOverdue(null, 'INBOX')             // false (sem dueDate)
 * ```
 */
export function isOverdue(
  dueDate: string | null | undefined,
  intention: V3Intention,
): boolean {
  if (!dueDate) return false;
  if (TERMINAL_INTENTIONS.includes(intention)) return false;
  return new Date(dueDate) < new Date();
}

/**
 * Verifica se uma task vence hoje (timezone local).
 *
 * Tasks em estado terminal nunca sao consideradas "para hoje" — a regra
 * espelha `isOverdue` para que as duas listas (Atrasadas / Hoje) sejam
 * mutuamente exclusivas e cubram exatamente os mesmos status.
 *
 * @param dueDate - Data de vencimento ISO 8601 (ou null/undefined).
 * @param intention - V3 Intention atual da task.
 * @returns `true` se a task vence hoje e nao esta em estado terminal.
 *
 * @example
 * isDueToday(new Date().toISOString(), 'EXECUTING')  // true
 * isDueToday('2030-12-31', 'EXECUTING')              // false (futuro)
 * isDueToday(new Date().toISOString(), 'DONE')       // false (terminal)
 */
export function isDueToday(
  dueDate: string | null | undefined,
  intention: V3Intention,
): boolean {
  if (!dueDate) return false;
  if (TERMINAL_INTENTIONS.includes(intention)) return false;
  const due = new Date(dueDate);
  const now = new Date();
  return (
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate()
  );
}

// ─── Mapeamento de prioridade ─────────────────────────────────────────────────

const PRIORITY_LABEL_MAP: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

const PRIORITY_COLOR_MAP: Record<string, string> = {
  LOW: '#6b7280',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  URGENT: '#ef4444',
};

/**
 * Mapeia o valor de prioridade do backend para label UX em português.
 *
 * @param priority - Valor bruto do backend ('LOW' | 'MEDIUM' | 'HIGH' | 'URGENT').
 * @returns Label localizado ou '—' quando não definido.
 *
 * @example
 * ```typescript
 * priorityToLabel('HIGH')      // 'Alta'
 * priorityToLabel('URGENT')    // 'Urgente'
 * priorityToLabel(undefined)   // '—'
 * ```
 */
export function priorityToLabel(priority?: string): string {
  if (!priority) return '—';
  return PRIORITY_LABEL_MAP[priority] ?? priority;
}

/**
 * Retorna a cor hexadecimal do badge de prioridade.
 *
 * @param priority - Valor bruto do backend ('LOW' | 'MEDIUM' | 'HIGH' | 'URGENT').
 * @returns Cor hexadecimal. Fallback para cinza (#6b7280) quando não definida.
 *
 * @example
 * ```typescript
 * priorityToColor('URGENT')   // '#ef4444'
 * priorityToColor('MEDIUM')   // '#f59e0b'
 * priorityToColor(undefined)  // '#6b7280'
 * ```
 */
export function priorityToColor(priority?: string): string {
  if (!priority) return '#6b7280';
  return PRIORITY_COLOR_MAP[priority] ?? '#6b7280';
}
