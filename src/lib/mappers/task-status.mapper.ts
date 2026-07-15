/**
 * Mapeamento de V3 Intentions do backend para colunas e labels da UX Kanban.
 *
 * V3 Intentions são os estados canônicos do workflow Scrumban (backend).
 * Colunas Kanban são os agrupamentos visuais acordados com o CEO para o frontend.
 *
 * @see docs/plano/00-PLANO-MESTRE.md — §V3 Intentions
 */

import type { TaskResponseDto, V3Intention } from "@/lib/types/api";
import { isDueOnToday, isPastDue } from "@/lib/dates/civil-day";

// ─── Colunas Kanban (agrupamentos visuais do frontend) ────────────────────────

export type KanbanColumn = "backlog" | "ready" | "em-progresso" | "concluido";

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
 * Definição canônica das 4 colunas do board (poda V3 9 -> 5).
 *
 * Agora que os status V3 são 5 e não 9, o mapeamento é 1:1 — não há mais
 * "achatamento" de estados finos:
 * - backlog      → INBOX
 * - ready        → READY
 * - em-progresso → EXECUTING
 * - concluido    → DONE
 *
 * FAILED **não é coluna** (decisão do CEO): é um BADGE vermelho, e só a
 * automação o escreve. Uma task que falhou volta a aparecer em `backlog`
 * (= precisa de triagem humana de novo) carregando o badge "Falhou" —
 * ver {@link isFailed} e {@link STATUS_LABEL}. Como `falhou` saiu de
 * KANBAN_COLUMNS, o usuário também não consegue mais ARRASTAR uma task para
 * FAILED nem escolhê-lo no seletor de status — que é exatamente a intenção.
 *
 * "atrasado" também NÃO é coluna — é badge calculado via `isOverdue()`.
 */
export const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    id: "backlog",
    label: "Backlog",
    color: "#6b7280",
    intentions: ["INBOX"],
  },
  {
    id: "ready",
    label: "A fazer",
    color: "#3b82f6",
    intentions: ["READY"],
  },
  {
    id: "em-progresso",
    label: "Em progresso",
    color: "#8b5cf6",
    intentions: ["EXECUTING"],
  },
  {
    id: "concluido",
    label: "Concluída",
    color: "#10b981",
    intentions: ["DONE"],
  },
];

/**
 * Label PT-BR de cada status V3 — fonte única dos rótulos exibidos ao usuário
 * (colunas, pílulas, badges, filtros).
 */
export const STATUS_LABEL: Record<V3Intention, string> = {
  INBOX: "Backlog",
  READY: "A fazer",
  EXECUTING: "Em progresso",
  DONE: "Concluída",
  FAILED: "Falhou",
};

/** Cor do badge/pílula de cada status V3. */
export const STATUS_COLOR: Record<V3Intention, string> = {
  INBOX: "#6b7280",
  READY: "#3b82f6",
  EXECUTING: "#8b5cf6",
  DONE: "#10b981",
  FAILED: "#ef4444",
};

/**
 * `true` se a task falhou. FAILED é BADGE, não coluna — use isto para pintar
 * o indicador vermelho. Escrito apenas pela automação.
 */
export function isFailed(intention: V3Intention): boolean {
  return intention === "FAILED";
}

// ─── Pílula de status (superfície de TABELA — distinta da coluna do board) ────

/**
 * Pílula de status exibida na GRADE (Blocos, subtarefas, "Atribuídas a mim").
 *
 * É um conceito DIFERENTE de {@link KanbanColumn}, e a diferença é o FAILED:
 * - No BOARD, FAILED não tem coluna (decisão do CEO) — a task cai em `backlog`.
 * - Na GRADE, FAILED **precisa** de pílula própria: a célula de status mostra
 *   UMA pílula, e sem `falhou` uma task que falhou apareceria como "Backlog",
 *   apagando o sinal de falha justamente onde ele importa.
 *
 * Por isso: 4 colunas de board + 1 pílula extra (`falhou`, vermelha).
 */
export type StatusPill = KanbanColumn | "falhou";

/** Pílula vermelha de falha — não é coluna do board. */
export const FAILED_PILL = {
  id: "falhou" as const,
  label: STATUS_LABEL.FAILED,
  color: STATUS_COLOR.FAILED,
};

/** Opções da célula de status na grade: as 4 colunas + `falhou`. */
export const STATUS_PILL_OPTIONS: Array<{
  id: StatusPill;
  label: string;
  color: string;
}> = [
  ...KANBAN_COLUMNS.map((c) => ({
    id: c.id as StatusPill,
    label: c.label,
    color: c.color,
  })),
  FAILED_PILL,
];

/**
 * Mapeia a V3 Intention para a PÍLULA da grade (inclui `falhou`).
 *
 * Use esta função na grade; use {@link intentionToColumn} no board.
 */
export function intentionToPill(intention: V3Intention): StatusPill {
  if (intention === "FAILED") return "falhou";
  return intentionToColumn(intention);
}

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
  // FAILED cai aqui de PROPOSITO (nao tem coluna — e badge). Uma task que
  // falhou volta para o backlog, onde pede triagem humana, exibindo o badge
  // vermelho "Falhou". Qualquer status desconhecido tambem cai aqui (defensivo).
  return "backlog";
}

/**
 * Retorna a configuração completa de uma coluna pelo ID.
 *
 * @param columnId - ID da coluna Kanban.
 * @returns `KanbanColumnConfig` ou `undefined` se não encontrada.
 */
export function getColumnConfig(
  columnId: KanbanColumn,
): KanbanColumnConfig | undefined {
  return KANBAN_COLUMNS.find((col) => col.id === columnId);
}

// ─── Cálculo de atraso ────────────────────────────────────────────────────────

/**
 * Intentions terminais — tasks nestes estados nunca são consideradas atrasadas,
 * mesmo que `dueDate` já tenha passado.
 */
export const TERMINAL_INTENTIONS: V3Intention[] = ["DONE", "FAILED"];

/**
 * Verifica se uma V3 Intention representa estado "fechado" (concluida ou
 * falhou) — task que nao pede mais acao no fluxo normal.
 *
 * Util para filtrar fora tasks "fechadas" em listas como "Atribuidas a
 * mim" do PlannerPanel.
 *
 * @example
 * isTerminalIntention('DONE')      // true
 * isTerminalIntention('EXECUTING') // false
 */
export function isTerminalIntention(intention: V3Intention): boolean {
  return TERMINAL_INTENTIONS.includes(intention);
}

/**
 * Verifica se uma task está atrasada em relação ao `dueDate`.
 *
 * Atrasada = o dia do prazo **já passou**. Uma task que vence hoje NÃO está
 * atrasada — ela tem o dia inteiro para ser concluída (use {@link isDueToday}).
 *
 * Calculado em runtime no frontend — NÃO vem do backend como campo.
 * Tasks em estado terminal nunca são consideradas atrasadas.
 *
 * A comparação é de **dia civil**, nunca de instante: `dueDate` chega da API
 * como `2026-07-13T00:00:00.000Z` (meia-noite UTC = 21h do dia 12 em Brasília),
 * então comparar timestamps marcaria a task de hoje como atrasada desde a
 * noite anterior. Ver {@link isPastDue}.
 *
 * @param dueDate - Data de vencimento ISO 8601 (ou null/undefined se não definida).
 * @param intention - V3 Intention atual da task.
 * @returns `true` se o prazo já passou e a intention não é terminal.
 *
 * @example
 * ```typescript
 * // supondo hoje = 2026-07-13
 * isOverdue('2026-07-12', 'EXECUTING') // true  (ontem — prazo passou)
 * isOverdue('2026-07-13', 'EXECUTING') // false (vence HOJE)
 * isOverdue('2026-07-12', 'DONE')      // false (terminal, nunca atrasada)
 * isOverdue(null, 'INBOX')             // false (sem dueDate)
 * ```
 */
export function isOverdue(
  dueDate: string | null | undefined,
  intention: V3Intention,
): boolean {
  if (TERMINAL_INTENTIONS.includes(intention)) return false;
  return isPastDue(dueDate);
}

/**
 * Verifica se uma task vence hoje.
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
 * // supondo hoje = 2026-07-13
 * isDueToday('2026-07-13', 'EXECUTING')  // true
 * isDueToday('2026-07-14', 'EXECUTING')  // false (futuro)
 * isDueToday('2026-07-13', 'DONE')       // false (terminal)
 */
export function isDueToday(
  dueDate: string | null | undefined,
  intention: V3Intention,
): boolean {
  if (TERMINAL_INTENTIONS.includes(intention)) return false;
  return isDueOnToday(dueDate);
}

// ─── Mapeamento de prioridade ─────────────────────────────────────────────────

const PRIORITY_LABEL_MAP: Record<string, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  URGENT: "Urgente",
};

const PRIORITY_COLOR_MAP: Record<string, string> = {
  LOW: "#6b7280",
  MEDIUM: "#f59e0b",
  HIGH: "#f97316",
  URGENT: "#ef4444",
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
  if (!priority) return "—";
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
  if (!priority) return "#6b7280";
  return PRIORITY_COLOR_MAP[priority] ?? "#6b7280";
}

// ─── Progresso de bloco (idClasse=-200) ──────────────────────────────────────

export interface BlockProgress {
  done: number;
  failed: number;
  total: number;
  percent: number;
}

const BLOCK_DONE_INTENTIONS: V3Intention[] = ["DONE"];
const BLOCK_FAILED_INTENTIONS: V3Intention[] = ["FAILED"];

/**
 * Calcula o progresso de um bloco (idClasse=-200) a partir das tasks filhas.
 *
 * Usado client-side enquanto GET /tasks/:id/metrics retorna 501 (Phase 4 stub).
 *
 * `done`    = DONE (único estado de conclusão após a poda 9 -> 5)
 * `failed`  = FAILED
 * `percent` = Math.round(done / total * 100), 0 se total=0
 */
export function calcBlockProgress(tasks: TaskResponseDto[]): BlockProgress {
  const total = tasks.length;
  if (total === 0) return { done: 0, failed: 0, total: 0, percent: 0 };
  const done = tasks.filter((t) =>
    BLOCK_DONE_INTENTIONS.includes(t.status as V3Intention),
  ).length;
  const failed = tasks.filter((t) =>
    BLOCK_FAILED_INTENTIONS.includes(t.status as V3Intention),
  ).length;
  return { done, failed, total, percent: Math.round((done / total) * 100) };
}
