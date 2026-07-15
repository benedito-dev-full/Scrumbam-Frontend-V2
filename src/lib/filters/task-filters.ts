// ─── Filtros de tarefas (client-side) ──────────────────────────────────────
//
// Estado compartilhado de filtros do ListPage, aplicado em memória sobre as
// tasks já carregadas (useTasksByProject). Vale para TODAS as views da lista
// (Lista, Quadro, Blocos) — derivar `filteredTasks` uma vez e passar adiante.
//
// Lógica pura e sem dependência de React: fácil de testar e reaproveitar.

import type {
  TaskResponseDto,
  TaskPriority,
  V3Intention,
} from "@/lib/types/api";
import { isOverdue } from "@/lib/mappers/task-status.mapper";

/** Sentinela para "sem responsável" no filtro de responsável. */
export const UNASSIGNED = "__unassigned__";

/** Status "fechados" — escondidos quando o toggle "Fechado" está ativo. */
export const CLOSED_STATUSES: readonly V3Intention[] = ["DONE"];

/** Buckets de vencimento do painel de filtro. */
export type DueFilter = "overdue" | "today" | "week" | "none";

/**
 * Estado de filtros da lista. Arrays vazios / `null` / `false` = sem restrição
 * naquela dimensão (passa tudo).
 */
export interface TaskFilters {
  /** Painel "Filtro": status do workflow. */
  statuses: V3Intention[];
  /** Painel "Filtro": prioridades. */
  priorities: TaskPriority[];
  /** Painel "Filtro": vencimento. `null` = qualquer. */
  due: DueFilter | null;
  /** Botão "Responsável": userIds, AI_ASSIGNEE_ID ou UNASSIGNED. */
  assignees: string[];
  /** Botão "Responsável": teamIds. */
  teams: string[];
  /** Toggle "Fechado": quando true, esconde tasks em status terminal. */
  hideClosed: boolean;
  /** Lupa: busca textual por nome + identificador (case-insensitive). */
  search: string;
}

/** Estado inicial — nenhum filtro ativo. */
export const emptyTaskFilters: TaskFilters = {
  statuses: [],
  priorities: [],
  due: null,
  assignees: [],
  teams: [],
  hideClosed: false,
  search: "",
};

/** Converte ISO (com ou sem hora) para Date no meio-dia local (evita drift TZ). */
function dateOnly(iso: string): Date {
  return new Date(iso.slice(0, 10) + "T12:00:00");
}

/** Verifica se a task casa com o bucket de vencimento. */
function matchesDue(task: TaskResponseDto, due: DueFilter): boolean {
  if (due === "none") return !task.dueDate;
  if (!task.dueDate) return false;
  if (due === "overdue") return isOverdue(task.dueDate, task.status);

  const d = dateOnly(task.dueDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);

  if (due === "today") return d.getTime() === today.getTime();

  // "week": de hoje até +7 dias (inclusive).
  const in7 = new Date(today);
  in7.setDate(in7.getDate() + 7);
  return d.getTime() >= today.getTime() && d.getTime() <= in7.getTime();
}

/** Há ao menos uma dimensão de filtro ativa? (fast-path do apply) */
export function isAnyFilterActive(f: TaskFilters): boolean {
  return (
    f.statuses.length > 0 ||
    f.priorities.length > 0 ||
    f.due !== null ||
    f.assignees.length > 0 ||
    f.teams.length > 0 ||
    f.hideClosed ||
    f.search.trim() !== ""
  );
}

/** Nº de dimensões ativas do PAINEL "Filtro" (status/prioridade/vencimento). */
export function countPanelFilters(f: TaskFilters): number {
  let n = 0;
  if (f.statuses.length) n += 1;
  if (f.priorities.length) n += 1;
  if (f.due !== null) n += 1;
  return n;
}

/** Nº de seleções do filtro "Responsável" (pessoas + times). */
export function countAssigneeFilters(f: TaskFilters): number {
  return f.assignees.length + f.teams.length;
}

/**
 * Aplica os filtros sobre uma lista de tasks (em memória). Pura — não muta a
 * entrada. Dimensões se combinam por AND; dentro de cada dimensão é OR.
 *
 * A dimensão "Responsável" (assignees + teams) casa se a task bater em QUALQUER
 * pessoa OU QUALQUER time selecionado.
 *
 * @param tasks - Lista crua (já carregada via useTasksByProject)
 * @param f - Estado de filtros
 * @returns Subconjunto que satisfaz todos os critérios ativos
 */
export function applyTaskFilters(
  tasks: TaskResponseDto[],
  f: TaskFilters,
): TaskResponseDto[] {
  if (!isAnyFilterActive(f)) return tasks;

  const query = f.search.trim().toLowerCase();

  return tasks.filter((t) => {
    if (query) {
      const haystack = `${t.nome} ${t.identifier}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (f.hideClosed && CLOSED_STATUSES.includes(t.status)) return false;
    if (f.statuses.length && !f.statuses.includes(t.status)) return false;
    if (
      f.priorities.length &&
      (!t.priority || !f.priorities.includes(t.priority))
    )
      return false;

    if (f.assignees.length || f.teams.length) {
      const matchPerson =
        f.assignees.length > 0 &&
        ((!!t.assigneeId && f.assignees.includes(t.assigneeId)) ||
          (f.assignees.includes(UNASSIGNED) &&
            !t.assigneeId &&
            !t.assigneeTeamId));
      const matchTeam =
        f.teams.length > 0 &&
        !!t.assigneeTeamId &&
        f.teams.includes(t.assigneeTeamId);
      if (!matchPerson && !matchTeam) return false;
    }

    if (f.due && !matchesDue(t, f.due)) return false;

    return true;
  });
}
