"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  Settings,
  CheckCheck,
  Clock,
  AlertTriangle,
  Activity,
  ChevronDown,
  User as UserIcon,
  Users,
  Search,
  X,
  Check,
  Flame,
  ChevronUp,
  Minus,
} from "lucide-react";
import {
  useMyTasks,
  useTeamTasks,
  useUserTasks,
  useUpdateTask,
  useUpdateTaskStatus,
} from "@/hooks/use-tasks";
import { qk } from "@/lib/query-keys";
import {
  Popover,
  OptionList,
  PersonList,
} from "@/components/lists/groups-view/cells";
import { TimeSpentCell } from "@/components/lists/groups-view/time-spent-cell";
import { format } from "date-fns";
import { MiniCalendar } from "@/components/ui/mini-calendar";
import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  PILL_TO_V3,
  V3_TERMINAL_VALIDATED,
  type MemberLike,
} from "@/lib/mappers/groups-from-tasks";
import { intentionToColumn } from "@/lib/mappers/task-status.mapper";
import { usePendingDelayCount } from "@/hooks/use-delay-justifications";
import { DelayJustificationModal } from "@/components/tasks/delay-justification-modal";
import { useAllLists } from "@/hooks/use-projects";
import { useTeams } from "@/hooks/use-teams";
import { useOrgMembers } from "@/hooks/use-org-members";
import { useAuthStore } from "@/lib/stores/auth";
import type {
  TaskResponseDto,
  TeamResponseDto,
  OrgMemberDto,
  V3Intention,
  TaskPriority,
} from "@/lib/types/api";

/* ─── Constantes de domínio ──────────────────────────────────────────────── */

/** Estados que contam como "concluído" para o % de conclusão. */
const DONE_STATUSES: V3Intention[] = ["DONE", "VALIDATED"];
/** Estados terminais (não entram em "abertas"/"em atraso"). */
const TERMINAL_STATUSES: V3Intention[] = [
  "DONE",
  "VALIDATED",
  "CANCELLED",
  "DISCARDED",
  "FAILED",
];

const STATUS_DOT: Record<string, string> = {
  INBOX: "var(--muted-foreground)",
  READY: "#3b82f6",
  EXECUTING: "#f59e0b",
  VALIDATING: "#8b5cf6",
  VALIDATED: "#10b981",
  DONE: "#10b981",
  FAILED: "#ef4444",
  CANCELLED: "var(--muted-foreground)",
  DISCARDED: "var(--muted-foreground)",
};

const STATUS_LABEL: Record<V3Intention, string> = {
  INBOX: "Inbox",
  READY: "Pronta",
  EXECUTING: "Executando",
  DONE: "Concluída",
  FAILED: "Falhou",
  CANCELLED: "Cancelada",
  DISCARDED: "Descartada",
  VALIDATING: "Validando",
  VALIDATED: "Validada",
};

/* ─── Paleta semântica dos KPIs (alinhada ao design system) ──────────────── */
const KPI = {
  green: { c: "#34b87a", soft: "rgba(52,184,122,0.14)" },
  violet: { c: "#8b7bf7", soft: "rgba(139,123,247,0.16)" },
  red: { c: "#ef5f5f", soft: "rgba(239,95,95,0.14)" },
  sky: { c: "#56b6e6", soft: "rgba(86,182,230,0.14)" },
} as const;

const WARN = "#e0a94a";

/* ─── Cores de avatar por usuário (determinísticas pelo nome) ────────────────
 * Paleta suave alinhada ao design system — cor cheia no texto/inicial sobre
 * fundo da mesma cor em baixa opacidade. Mesmo nome → sempre a mesma cor,
 * pra o olho reconhecer a pessoa. */
const AVATAR_COLORS: { c: string; soft: string }[] = [
  { c: "#8b7bf7", soft: "rgba(139,123,247,0.18)" }, // violeta
  { c: "#56b6e6", soft: "rgba(86,182,230,0.18)" }, // azul
  { c: "#34b87a", soft: "rgba(52,184,122,0.18)" }, // verde
  { c: "#e0a94a", soft: "rgba(224,169,74,0.18)" }, // âmbar
  { c: "#ef7fa6", soft: "rgba(239,127,166,0.18)" }, // rosa
  { c: "#e0715f", soft: "rgba(224,113,95,0.18)" }, // coral
  { c: "#5fc0b0", soft: "rgba(95,192,176,0.18)" }, // teal
  { c: "#a98bde", soft: "rgba(169,139,222,0.18)" }, // lavanda
];

/** Escolhe uma cor de avatar estável a partir de uma string (id ou nome). */
function avatarColor(seed: string): { c: string; soft: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

/** Retorna 'overdue' | 'today' | 'future' | null a partir do dueDate. */
function dueBucket(
  dueDate?: string | null,
): "overdue" | "today" | "future" | null {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDue = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (startDue < startToday) return "overdue";
  if (startDue.getTime() === startToday.getTime()) return "today";
  return "future";
}

/** Rótulo humano do prazo relativo. */
function dueLabel(dueDate?: string | null): {
  text: string;
  tone: "bad" | "warn" | "muted";
} {
  const b = dueBucket(dueDate);
  if (b === "overdue") return { text: "atrasada", tone: "bad" };
  if (b === "today") return { text: "vence hoje", tone: "warn" };
  if (b === "future") {
    const d = new Date(dueDate as string);
    return {
      text: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      tone: "muted",
    };
  }
  return { text: "—", tone: "muted" };
}

type Period = "today" | "week" | "month";

/**
 * Janela de CALENDÁRIO (timezone local do browser) para o período selecionado.
 * - Hoje: 00:00:00 → 23:59:59.999 do dia atual.
 * - Semana: segunda-feira 00:00 → domingo 23:59 da semana atual (semana começa na SEGUNDA).
 * - Mês: dia 1 00:00 → último dia 23:59 do mês atual.
 * Puro e testável.
 */
function periodRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  const y = now.getFullYear();
  const mo = now.getMonth();
  const d = now.getDate();

  if (period === "today") {
    return {
      start: new Date(y, mo, d, 0, 0, 0, 0),
      end: new Date(y, mo, d, 23, 59, 59, 999),
    };
  }

  if (period === "week") {
    // getDay(): 0=domingo … 6=sábado. Semana começa na SEGUNDA.
    // Deslocamento até a segunda: domingo(0) → -6; segunda(1) → 0; … sábado(6) → -5.
    const dow = now.getDay();
    const offsetToMonday = dow === 0 ? -6 : 1 - dow;
    const start = new Date(y, mo, d + offsetToMonday, 0, 0, 0, 0);
    const end = new Date(y, mo, d + offsetToMonday + 6, 23, 59, 59, 999);
    return { start, end };
  }

  // month
  return {
    start: new Date(y, mo, 1, 0, 0, 0, 0),
    end: new Date(y, mo + 1, 0, 23, 59, 59, 999),
  };
}

/** Parse defensivo de `completedAt` — retorna Date válida ou null. */
function parseCompletedAt(iso?: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Conta dias úteis (segunda a sexta, inclusive) entre `start` e `end`.
 * Ambas as datas são tratadas por dia de calendário local (hora ignorada).
 * Puro e testável.
 */
function countBusinessDays(start: Date, end: Date): number {
  const cursor = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  const lastDay = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate(),
  ).getTime();
  let count = 0;
  while (cursor.getTime() <= lastDay) {
    const dow = cursor.getDay(); // 0=domingo … 6=sábado
    if (dow !== 0 && dow !== 6) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

/**
 * Conta dias úteis (segunda a sexta) do mês informado (0-indexado, igual a
 * `Date.getMonth()`). Usado pelo multiplicador de exibição "Mês" do KPI Ritmo.
 * Puro e testável.
 */
function countBusinessDaysInMonth(year: number, month: number): number {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return countBusinessDays(start, end);
}

/**
 * Janela FIXA de 28 dias corridos (últimas 4 semanas) terminando em `referenceDate`
 * (default: agora), independente do filtro Hoje/Semana/Mês da tela.
 * `end` fecha em 23:59:59.999 do dia de referência; `start` abre em 00:00:00.000
 * 27 dias antes (28 dias corridos ao todo, incluindo hoje).
 * Puro e testável.
 */
function last4WeeksRange(referenceDate: Date = new Date()): {
  start: Date;
  end: Date;
} {
  const y = referenceDate.getFullYear();
  const mo = referenceDate.getMonth();
  const d = referenceDate.getDate();
  const end = new Date(y, mo, d, 23, 59, 59, 999);
  const start = new Date(y, mo, d - 27, 0, 0, 0, 0);
  return { start, end };
}

const PRIORITY_META: Record<
  TaskPriority,
  { label: string; icon: typeof Flame; color: string }
> = {
  URGENT: { label: "Urgente", icon: Flame, color: "#ef5f5f" },
  HIGH: { label: "Alta", icon: ChevronUp, color: WARN },
  MEDIUM: { label: "Média", icon: Minus, color: "var(--muted-foreground)" },
  LOW: { label: "Baixa", icon: Minus, color: "var(--muted-foreground)" },
};

/* ─── Página ─────────────────────────────────────────────────────────────── */
export default function MinhasTarefasPage() {
  const user = useAuthStore((s) => s.user);
  const userName = user?.name ?? "você";
  const isAdmin = user?.orgRole === "ADMIN";
  // Admin enxerga tarefas de qualquer pessoa/time → "Minhas tarefas" não descreve
  // mais a tela; vira "Painel de tarefas". Usuário comum mantém "Minhas tarefas".
  const pageTitle = isAdmin ? "Painel de tarefas" : "Minhas tarefas";

  const [period, setPeriod] = useState<Period>("week");
  const [filter, setFilter] = useState<"all" | "active" | "due" | "done">(
    "all",
  );
  // Escopos ativos (mutuamente exclusivos): null/null = minhas tarefas (default);
  // um deles setado = tasks de um time OU de um usuário.
  const [scopeTeamId, setScopeTeamId] = useState<string | null>(null);
  const [scopeUserId, setScopeUserId] = useState<string | null>(null);

  const { data: teams = [] } = useTeams();
  const { data: members = [] } = useOrgMembers();
  const scopeTeam = useMemo(
    () => teams.find((t) => t.id === scopeTeamId) ?? null,
    [teams, scopeTeamId],
  );
  const scopeUser = useMemo(
    () => members.find((m) => m.userId === scopeUserId) ?? null,
    [members, scopeUserId],
  );

  // Seletores mutuamente exclusivos: escolher um time limpa o usuário e vice-versa.
  const selectTeam = (id: string | null) => {
    setScopeTeamId(id);
    if (id !== null) setScopeUserId(null);
  };
  const selectUser = (id: string | null) => {
    setScopeUserId(id);
    if (id !== null) setScopeTeamId(null);
  };

  // Fonte de tasks conforme o escopo: sempre chamamos os três hooks (regras
  // dos hooks), mas cada um se auto-desabilita quando não é o escopo ativo.
  const my = useMyTasks();
  const team = useTeamTasks(scopeTeamId);
  const userScope = useUserTasks(scopeUserId);
  const isTeamScope = scopeTeamId !== null;
  const isUserScope = scopeUserId !== null;
  const isLoading = isUserScope
    ? userScope.isLoading
    : isTeamScope
      ? team.isLoading
      : my.isLoading;
  const tasks: TaskResponseDto[] = useMemo(
    () =>
      isUserScope
        ? (userScope.data ?? [])
        : isTeamScope
          ? (team.data ?? [])
          : (my.data ?? []),
    [isUserScope, isTeamScope, userScope.data, team.data, my.data],
  );

  const { lists } = useAllLists();

  /* ── Mapa projectId → nome da lista (+ espaço) para a coluna "Projeto" ── */
  const projectMap = useMemo(() => {
    const m = new Map<string, { nome: string; spaceName: string }>();
    for (const l of lists) {
      m.set(l.id, { nome: l.nome, spaceName: l.spaceName });
    }
    return m;
  }, [lists]);

  /* ── Métricas de ESTADO ATUAL (independem do período) ──
   * "Em atraso", "Tempo focado" e a tabela usam estes números como sempre. */
  const metrics = useMemo(() => {
    const total = tasks.length;
    const open = tasks.filter((t) => !TERMINAL_STATUSES.includes(t.status));
    const overdue = open.filter((t) => dueBucket(t.dueDate) === "overdue");
    const dueToday = open.filter((t) => dueBucket(t.dueDate) === "today");
    return {
      total,
      openCount: open.length,
      overdue,
      dueToday,
      atRisk: [...overdue, ...dueToday],
    };
  }, [tasks]);

  /* ── Métricas de PERÍODO (afetam SÓ "Concluídas" e "Ritmo") ──
   * Concluídas: fórmula período÷período.
   *   doneNoPeriodo  = tasks DONE/VALIDATED com completedAt dentro de [start,end].
   *   emJogoNoPeriodo = doneNoPeriodo + abertas com dueDate <= end (era pra estar
   *                     feita até o fim do período e ainda não está).
   * Ritmo: série de conclusões por dia dentro da janela (via completedAt). */
  const periodMetrics = useMemo(() => {
    const { start, end } = periodRange(period);
    const startMs = start.getTime();
    const endMs = end.getTime();

    let doneNoPeriodo = 0;
    // Buckets por DIA (chave = timestamp do início do dia local) → contagem de conclusões.
    const perDay = new Map<number, number>();

    for (const t of tasks) {
      if (!DONE_STATUSES.includes(t.status)) continue;
      const c = parseCompletedAt(t.completedAt);
      // DONE sem completedAt (tasks antigas) não têm data para situar: ignoradas.
      if (!c) continue;
      const cm = c.getTime();
      if (cm < startMs || cm > endMs) continue;
      doneNoPeriodo++;
      const dayKey = new Date(
        c.getFullYear(),
        c.getMonth(),
        c.getDate(),
      ).getTime();
      perDay.set(dayKey, (perDay.get(dayKey) ?? 0) + 1);
    }

    // Denominador: done no período + abertas cujo dueDate <= fim do período.
    // dueDate null numa aberta NÃO entra (não dá pra dizer que era "do período").
    let abertasDoPeriodo = 0;
    for (const t of tasks) {
      if (TERMINAL_STATUSES.includes(t.status)) continue;
      if (!t.dueDate) continue;
      const due = new Date(t.dueDate);
      if (Number.isNaN(due.getTime())) continue;
      if (due.getTime() <= endMs) abertasDoPeriodo++;
    }

    const emJogoNoPeriodo = doneNoPeriodo + abertasDoPeriodo;
    const pct =
      emJogoNoPeriodo > 0
        ? Math.round((doneNoPeriodo / emJogoNoPeriodo) * 100)
        : 0;

    /* Série diária: um bucket por dia da janela.
     * Hoje → 1 barra; Semana → 7 (seg→dom); Mês → dias do mês. */
    const series: { key: number; label: string; count: number }[] = [];
    const cursor = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
    );
    const lastDay = new Date(
      end.getFullYear(),
      end.getMonth(),
      end.getDate(),
    ).getTime();
    while (cursor.getTime() <= lastDay) {
      const key = cursor.getTime();
      const label =
        period === "month"
          ? String(cursor.getDate())
          : cursor
              .toLocaleDateString("pt-BR", { weekday: "short" })
              .replace(".", "");
      series.push({ key, label, count: perDay.get(key) ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    return { doneNoPeriodo, emJogoNoPeriodo, pct, series };
  }, [tasks, period]);

  /* ── Ritmo: média móvel de 4 semanas (28 dias corridos, janela FIXA) ──
   * Independe do filtro Hoje/Semana/Mês da tela — ao contrário de
   * `periodMetrics`, a janela de COLETA nunca muda. `mediaDiaria` é
   * concluídas-na-janela ÷ dias-úteis-na-janela; quem multiplica pelo fator
   * de exibição (1 / 5 / dias úteis do mês corrente) é `KpiRitmo`.
   * `weekBuckets[0]` = semana mais recente (contém hoje) … `[3]` = mais antiga. */
  const ritmoMetrics = useMemo(() => {
    const { start, end } = last4WeeksRange();
    const startMs = start.getTime();
    const endMs = end.getTime();
    let doneUltimas4Semanas = 0;
    const weekBuckets = [0, 0, 0, 0];

    for (const t of tasks) {
      if (!DONE_STATUSES.includes(t.status)) continue;
      const c = parseCompletedAt(t.completedAt);
      if (!c) continue;
      const cm = c.getTime();
      if (cm < startMs || cm > endMs) continue;
      doneUltimas4Semanas++;
      const daysAgo = Math.floor((endMs - cm) / 86_400_000);
      const weekIndex = Math.min(3, Math.floor(daysAgo / 7));
      weekBuckets[weekIndex]++;
    }

    const diasUteisJanela = countBusinessDays(start, end);
    const mediaDiaria =
      diasUteisJanela > 0 ? doneUltimas4Semanas / diasUteisJanela : 0;
    return { mediaDiaria, doneUltimas4Semanas, diasUteisJanela, weekBuckets };
  }, [tasks]);

  /* ── Pontualidade / Margem de atraso (recorte "por usuário logado") ──
   * Média (em dias corridos) de `completedAt - dueDate` das tarefas concluídas
   * (DONE/VALIDATED) do escopo ativo (`tasks`) que possuem AMBOS os campos.
   * Convenção de sinal: positivo = atrasou (concluiu depois do prazo); negativo
   * = adiantou. Regras de negócio (fechadas): valores negativos contam
   * normalmente (não são clampados); tarefas sem `dueDate` são EXCLUÍDAS (nem
   * como 0); só status terminal DONE/VALIDATED entra. `mediaDias` é null quando
   * não há amostras (distinto de 0 = "pontual em média"). Client-side, mesma
   * fonte de dados de `periodMetrics`/`ritmoMetrics` (mesmo teto de 100 tasks;
   * risco residual idêntico ao do Ritmo, aceito como não-bloqueante).
   *
   * Consumido pela aba "Pontualidade" do painel `PanelEmAtraso` (Fase 4). */
  const pontualidadeMetrics = useMemo(() => {
    let somaDias = 0;
    let amostras = 0;
    let adiantadas = 0;
    let noDia = 0;
    let atrasadas = 0;
    let maisAdiantada: { nome: string; dias: number } | null = null;
    let maisAtrasada: { nome: string; dias: number } | null = null;
    for (const t of tasks) {
      if (!DONE_STATUSES.includes(t.status)) continue;
      if (!t.dueDate) continue;
      const completed = parseCompletedAt(t.completedAt);
      if (!completed) continue;
      const due = new Date(t.dueDate);
      if (Number.isNaN(due.getTime())) continue;
      const diffDays = (completed.getTime() - due.getTime()) / 86_400_000;
      somaDias += diffDays;
      amostras++;
      // Classificação por DIA de calendário: concluir no mesmo dia do prazo
      // conta como "no dia"; antes = adiantada; depois = atrasada.
      const dueDay = t.dueDate.slice(0, 10);
      const compDay = format(completed, "yyyy-MM-dd");
      if (compDay < dueDay) adiantadas++;
      else if (compDay > dueDay) atrasadas++;
      else noDia++;
      if (diffDays < 0 && (!maisAdiantada || diffDays < maisAdiantada.dias))
        maisAdiantada = { nome: t.nome, dias: diffDays };
      if (diffDays > 0 && (!maisAtrasada || diffDays > maisAtrasada.dias))
        maisAtrasada = { nome: t.nome, dias: diffDays };
    }
    const mediaDias = amostras > 0 ? somaDias / amostras : null;
    return {
      mediaDias,
      amostras,
      adiantadas,
      noDia,
      atrasadas,
      maisAdiantada,
      maisAtrasada,
    };
  }, [tasks]);

  /* ── Margem de atraso (recorte "por usuário logado") — irmã da Pontualidade ──
   * Mesma base de `pontualidadeMetrics` (`completedAt - dueDate` das tarefas
   * concluídas DONE/VALIDATED com `dueDate`), mas agrega SÓ o subconjunto que
   * atrasou de fato (`diffDays > 0`, atraso ESTRITO). Tarefas entregues
   * exatamente no prazo (`diffDays === 0`) e tarefas adiantadas (`diffDays < 0`)
   * são EXCLUÍDAS — não entram nem como 0. Responde "quando atraso, de quanto
   * costuma ser esse atraso?" (diferente de Pontualidade, que responde "no
   * saldo geral, estou adiantado ou atrasado?"). DEV-132.
   *
   * Consumido pela aba "Margem de atraso" do painel `PanelEmAtraso` (3ª aba). */
  const margemAtrasoMetrics = useMemo(() => {
    let somaDias = 0;
    let amostras = 0;
    let totalComPrazo = 0;
    let ate1 = 0;
    let de2a3 = 0;
    let de4a7 = 0;
    let mais7 = 0;
    let pior: { nome: string; dias: number } | null = null;
    for (const t of tasks) {
      if (!DONE_STATUSES.includes(t.status)) continue;
      if (!t.dueDate) continue;
      const completed = parseCompletedAt(t.completedAt);
      if (!completed) continue;
      const due = new Date(t.dueDate);
      if (Number.isNaN(due.getTime())) continue;
      totalComPrazo++;
      // Atraso por DIA de calendário (consistente com a aba Pontualidade):
      // só conta quem concluiu DEPOIS do dia do prazo. Mesmo-dia à tarde
      // (diffDays > 0 mas mesmo compDay) NÃO é atraso.
      const dueDay = t.dueDate.slice(0, 10);
      const compDay = format(completed, "yyyy-MM-dd");
      if (compDay <= dueDay) continue;
      const diffDays = (completed.getTime() - due.getTime()) / 86_400_000;
      somaDias += diffDays;
      amostras++;
      const dias = Math.max(1, Math.round(diffDays));
      if (dias <= 1) ate1++;
      else if (dias <= 3) de2a3++;
      else if (dias <= 7) de4a7++;
      else mais7++;
      if (!pior || diffDays > pior.dias)
        pior = { nome: t.nome, dias: diffDays };
    }
    const mediaDias = amostras > 0 ? somaDias / amostras : null;
    return {
      mediaDias,
      amostras,
      totalComPrazo,
      ate1,
      de2a3,
      de4a7,
      mais7,
      pior,
    };
  }, [tasks]);

  /* ── Tempo focado do PERÍODO ──
   * Soma `durationMs` das sessões manuais cujo `startedAt` cai na janela do
   * período ativo. Borda: a sessão conta pelo `startedAt` — se cai em
   * [start,end], soma o `durationMs` INTEIRO. Sessão aberta (durationMs null) e
   * `timerSessions` undefined são ignoradas defensivamente. Deriva de `tasks`,
   * que já respeita o escopo Usuário/Time. */
  const focoNoPeriodoMin = useMemo(() => {
    const { start, end } = periodRange(period);
    const startMs = start.getTime();
    const endMs = end.getTime();
    let totalMs = 0;
    for (const t of tasks) {
      const sessions = t.timerSessions ?? [];
      for (const s of sessions) {
        if (s.durationMs == null) continue;
        const started = parseCompletedAt(s.startedAt);
        if (!started) continue;
        const sm = started.getTime();
        if (sm < startMs || sm > endMs) continue;
        totalMs += s.durationMs;
      }
    }
    return Math.floor(totalMs / 60000);
  }, [tasks, period]);

  const visibleTasks = useMemo(() => {
    const rows = [...tasks].sort((a, b) => {
      // ordena por prazo mais urgente primeiro
      const rank = (t: TaskResponseDto) => {
        const b2 = dueBucket(t.dueDate);
        return b2 === "overdue"
          ? 0
          : b2 === "today"
            ? 1
            : b2 === "future"
              ? 2
              : 3;
      };
      return rank(a) - rank(b);
    });
    if (filter === "active")
      return rows.filter((t) => !TERMINAL_STATUSES.includes(t.status));
    if (filter === "due")
      return rows.filter((t) => {
        if (TERMINAL_STATUSES.includes(t.status)) return false;
        const b = dueBucket(t.dueDate);
        return b === "overdue" || b === "today";
      });
    if (filter === "done")
      return rows.filter((t) => DONE_STATUSES.includes(t.status));
    return rows;
  }, [tasks, filter]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--background)",
        overflow: "hidden",
      }}
    >
      {/* ── Topbar ── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          height: 44,
          flexShrink: 0,
          borderBottom: "1px solid var(--border)",
          background: "var(--background)",
        }}
      >
        <span
          style={{ fontSize: 13, color: "var(--foreground)", fontWeight: 500 }}
        >
          {pageTitle}
        </span>
        <button type="button" style={iconBtnStyle}>
          <Settings size={14} />
        </button>
      </header>

      {/* ── Conteúdo ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px 48px" }}>
        {/* Header: saudação + escopo (admin) + período */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
            marginBottom: 22,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                color: "var(--muted-foreground)",
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              {pageTitle}
            </div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: "var(--foreground)",
                margin: 0,
                letterSpacing: "-0.015em",
              }}
            >
              {saudacao()}, {userName}
            </h1>
            <div
              style={{
                fontSize: 13,
                color: "var(--muted-foreground)",
                marginTop: 5,
              }}
            >
              {scopeUser ? (
                <>
                  Usuário:{" "}
                  <span style={{ color: "var(--foreground)", fontWeight: 500 }}>
                    {scopeUser.nome}
                  </span>
                </>
              ) : scopeTeam ? (
                <>
                  Time:{" "}
                  <span style={{ color: "var(--foreground)", fontWeight: 500 }}>
                    {scopeTeam.nome}
                  </span>
                </>
              ) : (
                "Todos os espaços"
              )}{" "}
              ·{" "}
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "short",
              })}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              alignItems: "flex-end",
            }}
          >
            {isAdmin && (
              <ScopePicker
                teams={teams}
                members={members}
                selectedTeamId={scopeTeamId}
                selectedUserId={scopeUserId}
                onSelectTeam={selectTeam}
                onSelectUser={selectUser}
              />
            )}
            <PeriodToggle value={period} onChange={setPeriod} />
          </div>
        </div>

        {/* ── Fileira de KPIs ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            marginBottom: 22,
          }}
        >
          <KpiConcluidas
            pct={periodMetrics.pct}
            done={periodMetrics.doneNoPeriodo}
            total={periodMetrics.emJogoNoPeriodo}
            loading={isLoading}
          />
          <KpiTempoFocado totalMin={focoNoPeriodoMin} period={period} />
          <KpiEmAtraso
            overdue={metrics.overdue.length}
            today={metrics.dueToday.length}
          />
          <KpiRitmo mediaDiaria={ritmoMetrics.mediaDiaria} period={period} />
        </div>

        {/* ── Duas colunas: Em atraso + Ritmo ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <PanelEmAtraso
            tasks={metrics.atRisk}
            loading={isLoading}
            pontualidade={pontualidadeMetrics}
            margemAtraso={margemAtrasoMetrics}
          />
          <PanelRitmo
            weekBuckets={ritmoMetrics.weekBuckets}
            loading={isLoading}
          />
        </div>

        {/* ── Tabela de tarefas ── */}
        <PanelTabela
          tasks={visibleTasks}
          totalOpen={metrics.openCount}
          filter={filter}
          onFilter={setFilter}
          loading={isLoading}
          projectMap={projectMap}
          members={members}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * KPIs
 * ═══════════════════════════════════════════════════════════════════════════ */

function KpiShell({
  color,
  soft,
  icon,
  label,
  children,
  footer,
}: {
  color: string;
  soft: string;
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "15px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 11,
        minHeight: 104,
      }}
    >
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: color,
          opacity: 0.85,
        }}
      />
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--muted-foreground)",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            display: "grid",
            placeItems: "center",
            background: soft,
            color,
          }}
        >
          {icon}
        </span>
        {label}
      </div>
      {children}
      <div
        style={{
          fontSize: 12,
          color: "var(--muted-foreground)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {footer}
      </div>
    </div>
  );
}

function KpiConcluidas({
  pct,
  done,
  total,
  loading,
}: {
  pct: number;
  done: number;
  total: number;
  loading: boolean;
}) {
  const { c, soft } = KPI.green;
  const R = 21;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - pct / 100);
  return (
    <KpiShell
      color={c}
      soft={soft}
      icon={<Check size={13} />}
      label="Concluídas"
      footer="concluídas no período"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ position: "relative", width: 52, height: 52 }}>
          <svg
            width={52}
            height={52}
            viewBox="0 0 52 52"
            style={{ transform: "rotate(-90deg)" }}
          >
            <circle
              cx={26}
              cy={26}
              r={R}
              fill="none"
              strokeWidth={5}
              stroke="rgba(255,255,255,0.08)"
            />
            <circle
              cx={26}
              cy={26}
              r={R}
              fill="none"
              strokeWidth={5}
              stroke={c}
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={loading ? C : offset}
              style={{ transition: "stroke-dashoffset .5s ease" }}
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              fontSize: 13,
              fontWeight: 650,
              color: c,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {loading ? "—" : `${pct}%`}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            alignItems: "flex-end",
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "var(--muted-foreground)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {loading ? "" : `${done} / ${total}`}
          </span>
        </div>
      </div>
    </KpiShell>
  );
}

function KpiTempoFocado({
  totalMin,
  period,
}: {
  totalMin: number;
  period: Period;
}) {
  const { c, soft } = KPI.violet;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return (
    <KpiShell
      color={c}
      soft={soft}
      icon={<Clock size={13} />}
      label="Tempo focado"
      footer={`registrado ${PERIOD_WORD[period]}`}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 650,
            letterSpacing: "-0.02em",
            color: c,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {h}
          <small
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--muted-foreground)",
            }}
          >
            h
          </small>{" "}
          {m}
          <small
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--muted-foreground)",
            }}
          >
            m
          </small>
        </div>
        <Sparkline color={c} points="0,16 11,14 22,15 33,9 44,11 55,6 64,7" />
      </div>
    </KpiShell>
  );
}

function KpiEmAtraso({ overdue, today }: { overdue: number; today: number }) {
  const { c, soft } = KPI.red;
  const count = overdue + today;
  return (
    <KpiShell
      color={c}
      soft={soft}
      icon={<AlertTriangle size={13} />}
      label="Em atraso"
      footer={
        count > 0 ? (
          <span style={{ color: c }}>
            {overdue} atrasada{overdue !== 1 ? "s" : ""} · {today} vence
            {today !== 1 ? "m" : ""} hoje
          </span>
        ) : (
          "nada em atraso"
        )
      }
    >
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
        <div
          style={{
            fontSize: 28,
            fontWeight: 650,
            letterSpacing: "-0.02em",
            color: c,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {count}
        </div>
      </div>
    </KpiShell>
  );
}

const PERIOD_WORD: Record<Period, string> = {
  today: "hoje",
  week: "na semana",
  month: "no mês",
};

/**
 * KPI "Ritmo": média móvel de entregas, derivada da janela FIXA de 28 dias
 * corridos (`ritmoMetrics.mediaDiaria`, calculada 1x independente do filtro
 * da tela). O fator de exibição por período é o único lugar sensível a
 * `period`:
 * - Hoje  → mediaDiaria
 * - Semana → mediaDiaria × 5 (dias úteis de uma semana)
 * - Mês   → mediaDiaria × dias úteis reais do mês corrente
 */
function KpiRitmo({
  mediaDiaria,
  period,
}: {
  mediaDiaria: number;
  period: Period;
}) {
  const { c, soft } = KPI.sky;
  const now = new Date();
  const fator =
    period === "today"
      ? 1
      : period === "week"
        ? 5
        : countBusinessDaysInMonth(now.getFullYear(), now.getMonth());
  const displayValue = mediaDiaria * fator;
  const rounded = Math.round(displayValue);
  return (
    <KpiShell
      color={c}
      soft={soft}
      icon={<Activity size={13} />}
      label="Ritmo"
      footer={`ritmo médio (${PERIOD_WORD[period]}) · base: últimas 4 semanas`}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 10,
        }}
        title={`${displayValue.toFixed(2)}/${PERIOD_WORD[period]} (média diária: ${mediaDiaria.toFixed(2)})`}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 650,
            letterSpacing: "-0.02em",
            color: c,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {rounded}
        </div>
        <Sparkline
          color={c}
          points="0,10 11,12 22,9 33,11 44,10 55,11 64,9"
          dim
        />
      </div>
    </KpiShell>
  );
}

function Sparkline({
  color,
  points,
  dim,
}: {
  color: string;
  points: string;
  dim?: boolean;
}) {
  return (
    <svg
      width={64}
      height={22}
      viewBox="0 0 64 22"
      style={{ opacity: dim ? 0.4 : 0.95 }}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Painéis
 * ═══════════════════════════════════════════════════════════════════════════ */

function PanelShell({
  icon,
  iconColor,
  iconSoft,
  title,
  count,
  meta,
  children,
}: {
  icon: React.ReactNode;
  iconColor: string;
  iconSoft: string;
  title: string;
  count?: number;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "var(--foreground)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              display: "grid",
              placeItems: "center",
              background: iconSoft,
              color: iconColor,
            }}
          >
            {icon}
          </span>
          {title}
          {count !== undefined && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "1px 7px",
                borderRadius: 20,
                fontVariantNumeric: "tabular-nums",
                background: KPI.red.soft,
                color: KPI.red.c,
                border: `1px solid rgba(239,95,95,0.28)`,
              }}
            >
              {count}
            </span>
          )}
        </h2>
        {meta && (
          <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
            {meta}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

type EmAtrasoTab = "atraso" | "pontualidade" | "margem-atraso";

/**
 * Painel "Em atraso" / "Pontualidade" / "Margem de atraso" — mesmo card, 3
 * abas (Task 8, Fase 4 + DEV-132).
 *
 * Substitui o título estático do `PanelShell` por um seletor de abas no canto
 * superior esquerdo do próprio card (não é navegação de página):
 * - "Em atraso": comportamento ORIGINAL, sem nenhuma mudança (lista de tarefas
 *   atrasadas, badge de contagem, `EmptyArea` quando vazio).
 * - "Pontualidade": substitui a lista pelo número grande de
 *   `pontualidadeMetrics.mediaDias` (sinal explícito +/-, mesma tipografia dos
 *   demais números grandes da tela — `fontSize:28, fontWeight:650`) + legenda
 *   de amostras. `EmptyArea` quando `amostras === 0` (sem dados suficientes).
 * - "Margem de atraso" (nova, DEV-132): mesmo leiaute de "Pontualidade",
 *   reaproveitando `PontualidadeReadout` — mas o valor vem de
 *   `margemAtraso.mediaDias`, que agrega SÓ tarefas com atraso ESTRITO
 *   (`diffDays > 0`). Na prática o valor exibido é sempre positivo (nunca
 *   "adiantou"), então a legenda "de adiantamento médio" do readout nunca
 *   aparece aqui — não precisou mudar o componente, só o dado.
 *
 * Header montado manualmente (não via `PanelShell`) para acomodar os botões de
 * aba no lugar do `<h2>` fixo — mantém exatamente o mesmo shell visual (card,
 * borda, padding) do restante da tela.
 */
function PanelEmAtraso({
  tasks,
  loading,
  pontualidade,
  margemAtraso,
}: {
  tasks: TaskResponseDto[];
  loading: boolean;
  pontualidade: PontualidadeStats;
  margemAtraso: MargemAtrasoStats;
}) {
  const [tab, setTab] = useState<EmAtrasoTab>("atraso");
  // Tarefa cujo modal de justificativa de atraso está aberto (null = fechado).
  const [justifyTask, setJustifyTask] = useState<{
    id: string;
    nome: string;
  } | null>(null);
  const { data: pending } = usePendingDelayCount();
  const pendingCount = pending?.pendingCount ?? 0;

  return (
    <section
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <PanelTabButton
            active={tab === "atraso"}
            onClick={() => setTab("atraso")}
            icon={<AlertTriangle size={14} />}
            iconColor={KPI.red.c}
            iconSoft={KPI.red.soft}
            label="Em atraso"
            count={!loading && tab === "atraso" ? tasks.length : undefined}
          />
          <PanelTabButton
            active={tab === "pontualidade"}
            onClick={() => setTab("pontualidade")}
            icon={<Clock size={14} />}
            iconColor={KPI.sky.c}
            iconSoft={KPI.sky.soft}
            label="Pontualidade"
          />
          <PanelTabButton
            active={tab === "margem-atraso"}
            onClick={() => setTab("margem-atraso")}
            icon={<AlertTriangle size={14} />}
            iconColor={KPI.red.c}
            iconSoft={KPI.red.soft}
            label="Margem de atraso"
          />
        </div>
        {tab === "atraso" && pendingCount > 0 && (
          <span
            title="Atrasos seus sem justificativa"
            style={{
              flexShrink: 0,
              fontSize: 10,
              fontWeight: 600,
              padding: "2px 7px",
              borderRadius: 20,
              whiteSpace: "nowrap",
              background: "rgba(224,169,74,0.12)",
              color: WARN,
              border: "1px solid rgba(224,169,74,0.22)",
            }}
          >
            {pendingCount} sem justificativa
          </span>
        )}
      </div>

      {tab === "atraso" ? (
        loading ? (
          <Muted>Carregando…</Muted>
        ) : tasks.length === 0 ? (
          <EmptyArea
            icon={<CheckCheck size={20} />}
            text="Nada em atraso"
            hint="Você está em dia com seus prazos."
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {tasks.map((t) => {
              const dl = dueLabel(t.dueDate);
              const sev = dl.tone === "bad" ? KPI.red.c : WARN;
              return (
                <div
                  key={t.id}
                  role="button"
                  tabIndex={0}
                  title="Justificar atraso"
                  onClick={() => setJustifyTask({ id: t.id, nome: t.nome })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setJustifyTask({ id: t.id, nome: t.nome });
                    }
                  }}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    padding: "9px 8px 9px 12px",
                    borderRadius: 8,
                    borderBottom: "1px solid var(--border)",
                    cursor: "pointer",
                    transition: "background .12s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "var(--accent)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "transparent")
                  }
                >
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 8,
                      bottom: 8,
                      width: 2.5,
                      borderRadius: 3,
                      background: sev,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--foreground)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {t.nome}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--muted-foreground)",
                        marginTop: 3,
                        display: "flex",
                        gap: 7,
                        alignItems: "center",
                      }}
                    >
                      <PriorityTag priority={t.priority} />
                    </div>
                  </div>
                  <DueBadge label={dl} />
                  {t.identifier && (
                    <Link
                      href={`/lists/${t.projectId}`}
                      onClick={(e) => e.stopPropagation()}
                      title="Abrir no projeto"
                      style={{
                        fontSize: 11,
                        color: "var(--muted-foreground)",
                        fontVariantNumeric: "tabular-nums",
                        textDecoration: "none",
                      }}
                    >
                      {t.identifier}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : tab === "pontualidade" ? (
        loading ? (
          <Muted>Carregando…</Muted>
        ) : pontualidade.mediaDias === null || pontualidade.amostras === 0 ? (
          <EmptyArea
            icon={<Clock size={20} />}
            text="Sem dados suficientes"
            hint="Nenhuma tarefa concluída com prazo definido ainda."
          />
        ) : (
          <PontualidadePanel stats={pontualidade} />
        )
      ) : loading ? (
        <Muted>Carregando…</Muted>
      ) : margemAtraso.mediaDias === null || margemAtraso.amostras === 0 ? (
        <EmptyArea
          icon={<AlertTriangle size={20} />}
          text="Sem dados suficientes"
          hint="Nenhuma tarefa atrasada concluída com prazo definido ainda."
        />
      ) : (
        <MargemAtrasoPanel stats={margemAtraso} />
      )}

      <DelayJustificationModal
        taskId={justifyTask?.id ?? null}
        taskNome={justifyTask?.nome}
        open={!!justifyTask}
        onClose={() => setJustifyTask(null)}
      />
    </section>
  );
}

/** Botão de aba do painel "Em atraso" / "Pontualidade" — mesmo estilo do título do `PanelShell`. */
function PanelTabButton({
  active,
  onClick,
  icon,
  iconColor,
  iconSoft,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  iconColor: string;
  iconSoft: string;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "-0.01em",
        color: active ? "var(--foreground)" : "var(--muted-foreground)",
        background: active ? "var(--accent)" : "transparent",
        border: 0,
        borderRadius: 7,
        padding: "5px 9px 5px 7px",
        cursor: "pointer",
        whiteSpace: "nowrap",
        flexShrink: 0,
        transition: "background .12s, color .12s",
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          display: "grid",
          placeItems: "center",
          background: iconSoft,
          color: iconColor,
        }}
      >
        {icon}
      </span>
      {label}
      {count !== undefined && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "1px 7px",
            borderRadius: 20,
            fontVariantNumeric: "tabular-nums",
            background: KPI.red.soft,
            color: KPI.red.c,
            border: `1px solid rgba(239,95,95,0.28)`,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/**
 * Exibição da aba "Pontualidade" / "Margem de atraso": número grande com sinal
 * explícito (mesma tipografia dos KPIs do topo — `fontSize:28, fontWeight:650`)
 * + legenda de amostras. Positivo = atraso médio (vermelho); negativo = adiantou
 * em média (verde/sky); segue a mesma paleta `KPI` do resto da tela.
 *
 * Unidade adaptativa: quando `|mediaDias| < 1`, exibe em HORAS (ex: "7h") em
 * vez de uma fração de dia abstrata ("-0.3 dia") — mais concreto para quem
 * não conhece a métrica. `|mediaDias| >= 1` continua em dias.
 *
 * `legendaOverride` (opcional): reaproveitado pela aba "Margem de atraso"
 * (DEV-132), cujo valor é sempre `> 0` (só atraso estrito entra na média) — a
 * legenda padrão "de atraso médio" fica ambígua nesse contexto (poderia soar
 * como "sempre atrasa"), então o caller pode passar um texto mais preciso
 * (ex.: "de atraso médio, quando atrasa"). Quando omitido, mantém o texto
 * original ("de atraso médio" / "de adiantamento médio" / "em média, no prazo").
 *
 * Pré-condição: só é renderizado pelo caller (`PanelEmAtraso`) quando
 * `amostras > 0` — o empty state (`amostras === 0`) já foi tratado ali antes
 * de chegar aqui, então `mediaDias` é garantidamente `number` neste ponto.
 */
type PontualidadeStats = {
  mediaDias: number | null;
  amostras: number;
  adiantadas: number;
  noDia: number;
  atrasadas: number;
  maisAdiantada: { nome: string; dias: number } | null;
  maisAtrasada: { nome: string; dias: number } | null;
};

/** Desvio em dias → rótulo curto ("4d", "6h"). */
function desvioLabel(dias: number): string {
  const abs = Math.abs(dias);
  if (abs < 1) return `${Math.max(1, Math.round(abs * 24))}h`;
  return `${Math.round(abs)}d`;
}

function ExtremoRow({
  icon,
  label,
  nome,
  desvio,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  nome: string;
  desvio: string;
  color: string;
}) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}
    >
      <span style={{ display: "inline-flex", flex: "none" }}>{icon}</span>
      <span style={{ color: "var(--muted-foreground)", flex: "none" }}>
        {label}
      </span>
      <span
        style={{
          color: "var(--foreground)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flex: 1,
          minWidth: 0,
        }}
        title={nome}
      >
        {nome}
      </span>
      <span
        style={{
          color,
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
          flex: "none",
        }}
      >
        {desvio}
      </span>
    </div>
  );
}

/**
 * Painel rico da aba "Pontualidade": manchete (desvio médio) + taxa dentro do
 * prazo + distribuição (adiantadas/no dia/atrasadas) + extremos (mais adiantada
 * e mais atrasada). Tudo derivado no client de `completedAt` vs `dueDate`.
 */
function PontualidadePanel({ stats }: { stats: PontualidadeStats }) {
  const {
    amostras,
    adiantadas,
    noDia,
    atrasadas,
    maisAdiantada,
    maisAtrasada,
  } = stats;
  const media = stats.mediaDias ?? 0;
  const pontual = Math.abs(media) <= 0.05;
  const atrasou = media > 0.05;
  const headColor = pontual ? KPI.violet.c : atrasou ? KPI.red.c : KPI.sky.c;
  const abs = Math.abs(media);
  const headNum = pontual
    ? "0h"
    : abs < 1
      ? `${Math.round(abs * 24)}h`
      : `${abs.toFixed(1)} dia${abs >= 2 ? "s" : ""}`;
  const headLegend = pontual
    ? "em média, no prazo"
    : atrasou
      ? "de atraso médio"
      : "de adiantamento médio";

  const dentroPrazo = adiantadas + noDia;
  const pct = amostras > 0 ? Math.round((dentroPrazo / amostras) * 100) : 0;
  const pctColor = pct >= 70 ? KPI.green.c : pct >= 40 ? WARN : KPI.red.c;

  const segs = [
    { n: adiantadas, c: KPI.sky.c, label: "Adiantadas" },
    { n: noDia, c: KPI.violet.c, label: "No dia" },
    { n: atrasadas, c: KPI.red.c, label: "Atrasadas" },
  ];

  return (
    <div
      style={{
        padding: "16px 8px 8px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      {/* Manchete + taxa dentro do prazo */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 650,
              letterSpacing: "-0.02em",
              color: headColor,
              lineHeight: 1,
            }}
          >
            {headNum}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--muted-foreground)",
              marginTop: 6,
            }}
          >
            {headLegend} · {amostras} tarefa{amostras !== 1 ? "s" : ""} com
            prazo
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            padding: "8px 14px",
            borderRadius: 10,
            background: "var(--accent)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 650,
              color: pctColor,
              lineHeight: 1,
            }}
          >
            {pct}%
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--muted-foreground)",
              marginTop: 4,
            }}
          >
            dentro do prazo · {dentroPrazo}/{amostras}
          </div>
        </div>
      </div>

      {/* Distribuição */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--muted-foreground)",
            marginBottom: 8,
          }}
        >
          Distribuição
        </div>
        <div
          style={{
            display: "flex",
            height: 10,
            borderRadius: 5,
            overflow: "hidden",
            background: "var(--accent)",
          }}
        >
          {segs.map((s, i) =>
            s.n > 0 ? (
              <div
                key={i}
                title={`${s.label}: ${s.n}`}
                style={{ width: `${(s.n / amostras) * 100}%`, background: s.c }}
              />
            ) : null,
          )}
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            marginTop: 10,
          }}
        >
          {segs.map((s, i) => (
            <span
              key={i}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: "var(--muted-foreground)",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: s.c,
                }}
              />
              {s.label}{" "}
              <span style={{ color: "var(--foreground)", fontWeight: 600 }}>
                {s.n}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Extremos */}
      {(maisAdiantada || maisAtrasada) && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            borderTop: "1px solid var(--border)",
            paddingTop: 14,
          }}
        >
          {maisAdiantada && (
            <ExtremoRow
              icon={<ChevronUp size={13} style={{ color: KPI.sky.c }} />}
              label="Mais adiantada"
              nome={maisAdiantada.nome}
              desvio={`−${desvioLabel(maisAdiantada.dias)}`}
              color={KPI.sky.c}
            />
          )}
          {maisAtrasada && (
            <ExtremoRow
              icon={<ChevronDown size={13} style={{ color: KPI.red.c }} />}
              label="Mais atrasada"
              nome={maisAtrasada.nome}
              desvio={`+${desvioLabel(maisAtrasada.dias)}`}
              color={KPI.red.c}
            />
          )}
        </div>
      )}
    </div>
  );
}

type MargemAtrasoStats = {
  mediaDias: number | null;
  amostras: number;
  totalComPrazo: number;
  ate1: number;
  de2a3: number;
  de4a7: number;
  mais7: number;
  pior: { nome: string; dias: number } | null;
};

/**
 * Painel rico da aba "Margem de atraso": só sobre tarefas que ATRASARAM.
 * Manchete (atraso médio) + quanto do total atrasou + severidade em faixas
 * + a pior tarefa. Derivado no client de `completedAt` vs `dueDate`.
 */
function MargemAtrasoPanel({ stats }: { stats: MargemAtrasoStats }) {
  const { amostras, totalComPrazo, ate1, de2a3, de4a7, mais7, pior } = stats;
  const media = stats.mediaDias ?? 0;
  const headNum =
    media < 1
      ? `${Math.round(media * 24)}h`
      : `${media.toFixed(1)} dia${media >= 2 ? "s" : ""}`;

  const pct =
    totalComPrazo > 0 ? Math.round((amostras / totalComPrazo) * 100) : 0;
  // Menos atraso = melhor → verde; muito atraso = vermelho.
  const pctColor = pct <= 20 ? KPI.green.c : pct <= 40 ? WARN : KPI.red.c;

  const segs = [
    { n: ate1, c: "#e0a94a", label: "1 dia" },
    { n: de2a3, c: "#e08a4a", label: "2–3 dias" },
    { n: de4a7, c: "#e0715f", label: "4–7 dias" },
    { n: mais7, c: KPI.red.c, label: "+1 sem" },
  ];

  return (
    <div
      style={{
        padding: "16px 8px 8px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      {/* Manchete + quanto do total atrasou */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 650,
              letterSpacing: "-0.02em",
              color: KPI.red.c,
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {headNum}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--muted-foreground)",
              marginTop: 6,
            }}
          >
            de atraso médio, quando atrasa · {amostras} atrasada
            {amostras !== 1 ? "s" : ""}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            padding: "8px 14px",
            borderRadius: 10,
            background: "var(--accent)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 650,
              color: pctColor,
              lineHeight: 1,
            }}
          >
            {pct}%
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--muted-foreground)",
              marginTop: 4,
            }}
          >
            do total atrasou · {amostras}/{totalComPrazo}
          </div>
        </div>
      </div>

      {/* Severidade do atraso */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--muted-foreground)",
            marginBottom: 8,
          }}
        >
          Severidade do atraso
        </div>
        <div
          style={{
            display: "flex",
            height: 10,
            borderRadius: 5,
            overflow: "hidden",
            background: "var(--accent)",
          }}
        >
          {segs.map((s, i) =>
            s.n > 0 ? (
              <div
                key={i}
                title={`${s.label}: ${s.n}`}
                style={{ width: `${(s.n / amostras) * 100}%`, background: s.c }}
              />
            ) : null,
          )}
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            marginTop: 10,
          }}
        >
          {segs.map((s, i) => (
            <span
              key={i}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: "var(--muted-foreground)",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: s.c,
                }}
              />
              {s.label}{" "}
              <span style={{ color: "var(--foreground)", fontWeight: 600 }}>
                {s.n}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Pior atraso */}
      {pior && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
          <ExtremoRow
            icon={<AlertTriangle size={13} style={{ color: KPI.red.c }} />}
            label="Pior atraso"
            nome={pior.nome}
            desvio={`+${desvioLabel(pior.dias)}`}
            color={KPI.red.c}
          />
        </div>
      )}
    </div>
  );
}

/** Rótulos curtos das 4 barras semanais — index 0 = semana mais recente (contém hoje). */
const WEEK_BUCKET_LABELS = [
  "Esta sem.",
  "-1 sem.",
  "-2 sem.",
  "-3 sem.",
] as const;

/**
 * Painel "Ritmo de entrega": 4 barras semanais fixas (últimas 4 semanas
 * corridas, `ritmoMetrics.weekBuckets` — index 0 = semana mais recente).
 * Independe do filtro Hoje/Semana/Mês da tela (Fase 5, aval CEO 2026-07-09) —
 * ao contrário da série diária anterior, o painel sempre mostra a mesma
 * janela fixa; só o KPI "Ritmo" ao lado muda de número por filtro.
 */
function PanelRitmo({
  weekBuckets,
  loading,
}: {
  weekBuckets: number[];
  loading: boolean;
}) {
  const totalDone = weekBuckets.reduce((acc, c) => acc + c, 0);
  const max = Math.max(1, ...weekBuckets);

  return (
    <PanelShell
      icon={<Activity size={14} />}
      iconColor={KPI.violet.c}
      iconSoft={KPI.violet.soft}
      title="Ritmo de entrega"
      meta="últimas 4 semanas"
    >
      {loading ? (
        <div style={{ padding: "24px 8px 8px" }}>
          <Muted>Carregando…</Muted>
        </div>
      ) : totalDone === 0 ? (
        <EmptyArea
          icon={<Activity size={20} />}
          text="Sem conclusões nas últimas 4 semanas"
          hint="Nenhuma tarefa foi concluída na janela."
        />
      ) : (
        <div style={{ padding: "24px 8px 8px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 9,
              height: 130,
            }}
          >
            {weekBuckets.map((count, i) => {
              const isCurrentWeek = i === 0;
              const hgtPct = count === 0 ? 0 : Math.max(6, (count / max) * 100);
              return (
                <div
                  key={i}
                  title={`${count} concluída${count !== 1 ? "s" : ""}`}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 9,
                    height: "100%",
                    justifyContent: "flex-end",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 30,
                      height: `${hgtPct}%`,
                      borderRadius: "4px 4px 0 0",
                      background: isCurrentWeek
                        ? KPI.violet.c
                        : "rgba(139,123,247,0.32)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--muted-foreground)",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                    }}
                  >
                    {WEEK_BUCKET_LABELS[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </PanelShell>
  );
}

function PanelTabela({
  tasks,
  totalOpen,
  filter,
  onFilter,
  loading,
  projectMap,
  members,
}: {
  tasks: TaskResponseDto[];
  totalOpen: number;
  filter: "all" | "active" | "due" | "done";
  onFilter: (f: "all" | "active" | "due" | "done") => void;
  loading: boolean;
  projectMap: Map<string, { nome: string; spaceName: string }>;
  members: OrgMemberDto[];
}) {
  const filters: { id: typeof filter; label: string }[] = [
    { id: "all", label: "Todas" },
    { id: "active", label: "Ativas" },
    { id: "due", label: "Vencendo" },
    { id: "done", label: "Concluídas" },
  ];

  // Edição inline (reaproveita mutations e controles dos Blocos). As mutations
  // invalidam byProject/byId; como esta tela lê de listas "my/user/team",
  // invalidamos a raiz `tasks` para refazer o fetch após cada alteração.
  const updateTask = useUpdateTask();
  const updateStatus = useUpdateTaskStatus();
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: qk.tasks.all });
  };
  const memberLikes: MemberLike[] = useMemo(
    () => members.map((m) => ({ userId: m.userId, nome: m.nome })),
    [members],
  );
  return (
    <section
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--foreground)",
          }}
        >
          Atribuídas a mim{" "}
          <span
            style={{
              fontWeight: 400,
              color: "var(--muted-foreground)",
              marginLeft: 2,
              fontSize: 12,
            }}
          >
            {totalOpen} abertas
          </span>
        </h2>
        <div style={{ display: "flex", gap: 5 }}>
          {filters.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onFilter(f.id)}
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: active
                    ? "var(--foreground)"
                    : "var(--muted-foreground)",
                  border: `1px solid ${active ? "var(--border)" : "transparent"}`,
                  background: active ? "var(--accent)" : "transparent",
                  borderRadius: 6,
                  padding: "4px 11px",
                  cursor: "pointer",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <Muted>Carregando…</Muted>
      ) : tasks.length === 0 ? (
        <EmptyArea
          icon={<CheckCheck size={20} />}
          text="Nada aqui"
          hint="Nenhuma tarefa neste filtro."
        />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {[
                  "Tarefa",
                  "Projeto",
                  "Status",
                  "Prioridade",
                  "Responsável",
                  "Prazo",
                  "Tempo",
                ].map((h, i) => (
                  <th
                    key={h}
                    style={{
                      textAlign: i === 6 ? "center" : "left",
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "var(--muted-foreground)",
                      fontWeight: 600,
                      padding: "9px 8px",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => {
                return (
                  <tr key={t.id}>
                    <td style={tdStyle}>
                      <Link
                        href={`/lists/${t.projectId}`}
                        style={{
                          display: "flex",
                          gap: 9,
                          alignItems: "center",
                          color: "var(--foreground)",
                          textDecoration: "none",
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background:
                              STATUS_DOT[t.status] ?? "var(--muted-foreground)",
                            flex: "none",
                          }}
                        />
                        <span
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: 380,
                          }}
                        >
                          {t.nome}
                        </span>
                      </Link>
                    </td>
                    <td
                      style={{ ...tdStyle, color: "var(--muted-foreground)" }}
                    >
                      <ProjectCell project={projectMap.get(t.projectId)} />
                    </td>
                    <td style={tdStyle}>
                      <EditableStatusCell
                        task={t}
                        updateStatus={updateStatus}
                        refresh={refresh}
                      />
                    </td>
                    <td style={tdStyle}>
                      <EditablePriorityCell
                        task={t}
                        updateTask={updateTask}
                        refresh={refresh}
                      />
                    </td>
                    <td style={tdStyle}>
                      <EditablePersonCell
                        task={t}
                        members={memberLikes}
                        updateTask={updateTask}
                        refresh={refresh}
                      />
                    </td>
                    <td style={tdStyle}>
                      <EditableDueCell
                        task={t}
                        updateTask={updateTask}
                        refresh={refresh}
                      />
                    </td>
                    <TimeSpentCell
                      tdStyle={tdStyle}
                      label={t.timeSpentLabel ?? ""}
                      taskId={t.id}
                      projectId={t.projectId}
                    />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Células editáveis inline — reaproveitam os controles dos Blocos
 * (Popover + OptionList/PersonList de groups-view/cells) e as mutations
 * useUpdateTask/useUpdateTaskStatus. Gerir a tarefa sem entrar no projeto.
 * ═══════════════════════════════════════════════════════════════════════════ */

type UpdateTaskMutation = ReturnType<typeof useUpdateTask>;
type UpdateStatusMutation = ReturnType<typeof useUpdateTaskStatus>;

/** Gatilho clicável que abre um popover ancorado (via portal, escapa do overflow da tabela). */
function EditTrigger({
  disabled,
  align = "left",
  render,
  children,
}: {
  disabled?: boolean;
  align?: "left" | "right";
  render: (close: () => void) => React.ReactNode;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <span
        ref={ref}
        role={disabled ? undefined : "button"}
        tabIndex={disabled ? undefined : 0}
        onClick={disabled ? undefined : () => setOpen((o) => !o)}
        onKeyDown={
          disabled
            ? undefined
            : (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpen(true);
                }
              }
        }
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          cursor: disabled ? "default" : "pointer",
          borderRadius: 6,
          padding: "1px 3px",
          margin: "-1px -3px",
        }}
        title={disabled ? "Validado — estado final" : "Clique para editar"}
      >
        {children}
      </span>
      {open && !disabled && (
        <Popover anchorRef={ref} align={align} onClose={() => setOpen(false)}>
          {render(() => setOpen(false))}
        </Popover>
      )}
    </>
  );
}

/** Status — pílula clicável → popover com as 5 opções Kanban (achata V3). */
function EditableStatusCell({
  task,
  updateStatus,
  refresh,
}: {
  task: TaskResponseDto;
  updateStatus: UpdateStatusMutation;
  refresh: () => void;
}) {
  // VALIDATED é terminal: o backend recusa mudar → travamos a pílula (igual Blocos).
  const locked = task.status === V3_TERMINAL_VALIDATED;
  const currentPill = intentionToColumn(task.status);
  return (
    <EditTrigger
      disabled={locked}
      render={(close) => (
        <OptionList
          options={STATUS_OPTIONS}
          currentId={currentPill}
          onPick={(pill) => {
            close();
            // Só dispara quando TROCA de pílula (preserva estados V3 finos).
            if (pill === currentPill) return;
            updateStatus.mutate(
              {
                id: task.id,
                status: PILL_TO_V3[pill],
                projectId: task.projectId,
              },
              { onSuccess: refresh },
            );
          }}
        />
      )}
    >
      <StatusBadge status={task.status} />
    </EditTrigger>
  );
}

/** Prioridade — tag clicável → popover com LOW/MEDIUM/HIGH/URGENT. */
function EditablePriorityCell({
  task,
  updateTask,
  refresh,
}: {
  task: TaskResponseDto;
  updateTask: UpdateTaskMutation;
  refresh: () => void;
}) {
  return (
    <EditTrigger
      render={(close) => (
        <OptionList
          options={PRIORITY_OPTIONS}
          currentId={task.priority ?? null}
          onPick={(id) => {
            close();
            if (id === task.priority) return;
            updateTask.mutate(
              { id: task.id, projectId: task.projectId, dto: { priority: id } },
              { onSuccess: refresh },
            );
          }}
        />
      )}
    >
      <PriorityTag priority={task.priority} />
    </EditTrigger>
  );
}

/** Responsável — avatar/nome clicável → popover com membros (+ Claude/Sem resp.). */
function EditablePersonCell({
  task,
  members,
  updateTask,
  refresh,
}: {
  task: TaskResponseDto;
  members: MemberLike[];
  updateTask: UpdateTaskMutation;
  refresh: () => void;
}) {
  const current = task.assigneeId ?? null;
  const nome = current
    ? (members.find((m) => m.userId === current)?.nome ?? null)
    : null;
  return (
    <EditTrigger
      render={(close) => (
        <PersonList
          members={members}
          currentId={current}
          onPick={(id) => {
            close();
            const next = id || null;
            if (next === current) return;
            updateTask.mutate(
              {
                id: task.id,
                projectId: task.projectId,
                dto: { assigneeId: next, assigneeTeamId: null },
              },
              { onSuccess: refresh },
            );
          }}
        />
      )}
    >
      {nome ? (
        <>
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              flex: "none",
              display: "grid",
              placeItems: "center",
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              background: avatarColor(current ?? "").soft,
              color: avatarColor(current ?? "").c,
            }}
          >
            {nome.trim().charAt(0) || "?"}
          </span>
          <span
            style={{
              fontSize: 12,
              color: "var(--foreground)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 130,
            }}
          >
            {nome}
          </span>
        </>
      ) : (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 22,
            height: 22,
            borderRadius: "50%",
            border: "1.5px dashed var(--border)",
            color: "var(--muted-foreground)",
          }}
          title="Sem responsável"
        >
          <UserIcon size={12} />
        </span>
      )}
    </EditTrigger>
  );
}

/** Prazo — texto clicável → popover com input de data (limpar = remover prazo). */
function EditableDueCell({
  task,
  updateTask,
  refresh,
}: {
  task: TaskResponseDto;
  updateTask: UpdateTaskMutation;
  refresh: () => void;
}) {
  const dl = dueLabel(task.dueDate);
  const current =
    typeof task.dueDate === "string" && task.dueDate
      ? task.dueDate.slice(0, 10)
      : "";
  const color =
    dl.tone === "bad"
      ? KPI.red.c
      : dl.tone === "warn"
        ? WARN
        : "var(--muted-foreground)";
  return (
    <EditTrigger
      align="right"
      render={(close) => (
        <MiniCalendar
          value={current}
          onSelect={(v) => {
            updateTask.mutate(
              {
                id: task.id,
                projectId: task.projectId,
                dto: { dueDate: v },
              },
              { onSuccess: refresh },
            );
            close();
          }}
        />
      )}
    >
      <span style={{ fontVariantNumeric: "tabular-nums", fontSize: 12, color }}>
        {dl.text || "—"}
      </span>
    </EditTrigger>
  );
}

/* ─── Calendário custom (nosso) ──────────────────────────────────────────────
 * Grid do mês navegável, com atalhos "Hoje" e "Limpar". Substitui o <input
 * type="date"> nativo (feio e inconsistente entre browsers) por um popover
 * alinhado ao design system. */

/* ═══════════════════════════════════════════════════════════════════════════
 * Controles: escopo (admin) + período
 * ═══════════════════════════════════════════════════════════════════════════ */

function ScopePicker({
  teams,
  members,
  selectedTeamId,
  selectedUserId,
  onSelectTeam,
  onSelectUser,
}: {
  teams: TeamResponseDto[];
  members: OrgMemberDto[];
  selectedTeamId: string | null;
  selectedUserId: string | null;
  onSelectTeam: (id: string | null) => void;
  onSelectUser: (id: string | null) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--muted-foreground)",
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <span
          style={{
            fontSize: 9,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: "#a9a0e0",
            background: "rgba(139,123,247,0.16)",
            padding: "2px 6px",
            borderRadius: 4,
          }}
        >
          admin
        </span>
        ver
      </span>
      <UserScopeButton
        members={members}
        selectedUserId={selectedUserId}
        onSelectUser={onSelectUser}
      />
      <TeamScopeButton
        teams={teams}
        selectedTeamId={selectedTeamId}
        onSelectTeam={onSelectTeam}
      />
    </div>
  );
}

/** Botão de escopo de Usuário — funcional: troca o escopo do dashboard. */
function UserScopeButton({
  members,
  selectedUserId,
  onSelectUser,
}: {
  members: OrgMemberDto[];
  selectedUserId: string | null;
  onSelectUser: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const selected = members.find((m) => m.userId === selectedUserId) ?? null;

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return members;
    return members.filter((m) => m.nome.toLowerCase().includes(term));
  }, [members, q]);

  const close = () => {
    setOpen(false);
    setQ("");
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={scopeBtnStyle(!!selected)}
      >
        {selected ? (
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              flex: "none",
              display: "grid",
              placeItems: "center",
              fontSize: 8,
              fontWeight: 700,
              textTransform: "uppercase",
              background: avatarColor(selected.userId).soft,
              color: avatarColor(selected.userId).c,
            }}
          >
            {selected.nome.trim().charAt(0) || "?"}
          </span>
        ) : (
          <span style={{ color: "var(--muted-foreground)" }}>
            <UserIcon size={14} />
          </span>
        )}
        <span
          style={{
            color: selected ? "var(--foreground)" : "var(--muted-foreground)",
          }}
        >
          {selected ? selected.nome : "Usuário"}
        </span>
        <ChevronDown size={14} style={{ color: "var(--muted-foreground)" }} />
      </button>
      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 30 }}
            onClick={close}
          />
          <div style={scopeMenuStyle}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "6px 9px",
                marginBottom: 4,
                borderBottom: "1px solid var(--border)",
                color: "var(--muted-foreground)",
              }}
            >
              <Search size={13} />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar usuário…"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: 0,
                  outline: 0,
                  color: "var(--foreground)",
                  fontSize: 13,
                }}
              />
            </div>

            {/* Opção de limpar seleção → volta para "minhas tarefas". */}
            <button
              type="button"
              onClick={() => {
                onSelectUser(null);
                close();
              }}
              style={scopeItemStyle(selectedUserId === null)}
            >
              <X size={13} style={{ color: "var(--muted-foreground)" }} />
              <span style={{ flex: 1, textAlign: "left" }}>Minhas tarefas</span>
              {selectedUserId === null && (
                <Check size={13} style={{ color: "#a9a0e0" }} />
              )}
            </button>

            <div style={{ maxHeight: 220, overflowY: "auto" }}>
              {filtered.length === 0 ? (
                <div
                  style={{
                    padding: "10px 9px",
                    fontSize: 12,
                    color: "var(--muted-foreground)",
                  }}
                >
                  Nenhum usuário encontrado.
                </div>
              ) : (
                filtered.map((m) => {
                  const active = m.userId === selectedUserId;
                  const av = avatarColor(m.userId);
                  return (
                    <button
                      key={m.userId}
                      type="button"
                      onClick={() => {
                        onSelectUser(m.userId);
                        close();
                      }}
                      style={scopeItemStyle(active)}
                    >
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          flex: "none",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          background: av.soft,
                          color: av.c,
                        }}
                      >
                        {m.nome.trim().charAt(0) || "?"}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          textAlign: "left",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {m.nome}
                      </span>
                      {active && (
                        <Check size={13} style={{ color: "#a9a0e0" }} />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Botão de escopo de Time — funcional: troca o escopo do dashboard. */
function TeamScopeButton({
  teams,
  selectedTeamId,
  onSelectTeam,
}: {
  teams: TeamResponseDto[];
  selectedTeamId: string | null;
  onSelectTeam: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const selected = teams.find((t) => t.id === selectedTeamId) ?? null;

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return teams;
    return teams.filter((t) => t.nome.toLowerCase().includes(term));
  }, [teams, q]);

  const close = () => {
    setOpen(false);
    setQ("");
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={scopeBtnStyle(!!selected)}
      >
        <span
          style={{ color: selected ? "#a9a0e0" : "var(--muted-foreground)" }}
        >
          <Users size={14} />
        </span>
        <span
          style={{
            color: selected ? "var(--foreground)" : "var(--muted-foreground)",
          }}
        >
          {selected ? selected.nome : "Time"}
        </span>
        <ChevronDown size={14} style={{ color: "var(--muted-foreground)" }} />
      </button>
      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 30 }}
            onClick={close}
          />
          <div style={scopeMenuStyle}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "6px 9px",
                marginBottom: 4,
                borderBottom: "1px solid var(--border)",
                color: "var(--muted-foreground)",
              }}
            >
              <Search size={13} />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar time…"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: 0,
                  outline: 0,
                  color: "var(--foreground)",
                  fontSize: 13,
                }}
              />
            </div>

            {/* Opção de limpar seleção → volta para "minhas tarefas". */}
            <button
              type="button"
              onClick={() => {
                onSelectTeam(null);
                close();
              }}
              style={scopeItemStyle(selectedTeamId === null)}
            >
              <X size={13} style={{ color: "var(--muted-foreground)" }} />
              <span style={{ flex: 1, textAlign: "left" }}>Minhas tarefas</span>
              {selectedTeamId === null && (
                <Check size={13} style={{ color: "#a9a0e0" }} />
              )}
            </button>

            <div style={{ maxHeight: 220, overflowY: "auto" }}>
              {filtered.length === 0 ? (
                <div
                  style={{
                    padding: "10px 9px",
                    fontSize: 12,
                    color: "var(--muted-foreground)",
                  }}
                >
                  Nenhum time encontrado.
                </div>
              ) : (
                filtered.map((t) => {
                  const active = t.id === selectedTeamId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        onSelectTeam(t.id);
                        close();
                      }}
                      style={scopeItemStyle(active)}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          flex: "none",
                          background: t.color ?? "var(--muted-foreground)",
                        }}
                      />
                      <span
                        style={{
                          flex: 1,
                          textAlign: "left",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {t.nome}
                      </span>
                      {active && (
                        <Check size={13} style={{ color: "#a9a0e0" }} />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function scopeBtnStyle(active: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: active ? "var(--accent)" : "var(--card)",
    border: `1px solid ${active ? "rgba(139,123,247,0.35)" : "var(--border)"}`,
    borderRadius: 8,
    padding: "5px 9px 5px 10px",
    color: "var(--foreground)",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    maxWidth: 200,
  };
}

const scopeMenuStyle: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 6px)",
  right: 0,
  minWidth: 230,
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: 5,
  zIndex: 40,
  boxShadow: "0 12px 32px -8px rgba(0,0,0,0.6)",
};

function scopeItemStyle(active: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "8px 9px",
    fontSize: 13,
    color: "var(--foreground)",
    background: active ? "var(--accent)" : "transparent",
    border: 0,
    borderRadius: 7,
    cursor: "pointer",
  };
}

function PeriodToggle({
  value,
  onChange,
}: {
  value: Period;
  onChange: (v: Period) => void;
}) {
  const opts: { id: typeof value; label: string }[] = [
    { id: "today", label: "Hoje" },
    { id: "week", label: "Semana" },
    { id: "month", label: "Mês" },
  ];
  return (
    <div
      style={{
        display: "inline-flex",
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 3,
        gap: 2,
      }}
    >
      {opts.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            style={{
              border: 0,
              background: active ? "var(--accent)" : "transparent",
              color: active ? "var(--foreground)" : "var(--muted-foreground)",
              fontSize: 13,
              fontWeight: 500,
              padding: "5px 12px",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Átomos
 * ═══════════════════════════════════════════════════════════════════════════ */

function StatusBadge({ status }: { status: V3Intention }) {
  const map: Record<string, { bg: string; fg: string; bd: string }> = {
    EXECUTING: {
      bg: "rgba(139,123,247,0.16)",
      fg: "#a9a0e0",
      bd: "rgba(139,123,247,0.2)",
    },
    READY: {
      bg: "rgba(120,160,200,0.12)",
      fg: "#9fb8d4",
      bd: "rgba(120,160,200,0.2)",
    },
    VALIDATING: {
      bg: "rgba(139,123,247,0.16)",
      fg: "#a9a0e0",
      bd: "rgba(139,123,247,0.2)",
    },
    DONE: {
      bg: "rgba(52,184,122,0.12)",
      fg: "#34b87a",
      bd: "rgba(52,184,122,0.2)",
    },
    VALIDATED: {
      bg: "rgba(52,184,122,0.12)",
      fg: "#34b87a",
      bd: "rgba(52,184,122,0.2)",
    },
  };
  const s = map[status] ?? {
    bg: "rgba(255,255,255,0.05)",
    fg: "var(--muted-foreground)",
    bd: "var(--border)",
  };
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 550,
        padding: "2px 9px",
        borderRadius: 20,
        whiteSpace: "nowrap",
        background: s.bg,
        color: s.fg,
        border: `1px solid ${s.bd}`,
      }}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function PriorityTag({ priority }: { priority?: TaskPriority }) {
  if (!priority)
    return (
      <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>—</span>
    );
  const meta = PRIORITY_META[priority];
  const Icon = meta.icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        color: "var(--foreground)",
      }}
    >
      <Icon size={12} style={{ color: meta.color }} />
      {meta.label}
    </span>
  );
}

function ProjectCell({
  project,
}: {
  project?: { nome: string; spaceName: string };
}) {
  if (!project)
    return <span style={{ color: "var(--muted-foreground)" }}>—</span>;
  const title = project.spaceName
    ? `${project.spaceName} · ${project.nome}`
    : project.nome;
  return (
    <span
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        maxWidth: 200,
        fontSize: 12,
        color: "var(--foreground)",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: "var(--muted-foreground)",
          flex: "none",
        }}
      />
      <span
        style={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {project.nome}
      </span>
    </span>
  );
}

function DueBadge({
  label,
}: {
  label: { text: string; tone: "bad" | "warn" | "muted" };
}) {
  if (label.tone === "muted") return null;
  const c = label.tone === "bad" ? KPI.red.c : WARN;
  const soft = label.tone === "bad" ? KPI.red.soft : "rgba(224,169,74,0.14)";
  const bd =
    label.tone === "bad" ? "rgba(239,95,95,0.28)" : "rgba(224,169,74,0.26)";
  return (
    <span
      style={{
        fontSize: 11,
        padding: "2px 8px",
        borderRadius: 5,
        whiteSpace: "nowrap",
        fontWeight: 550,
        background: soft,
        color: c,
        border: `1px solid ${bd}`,
      }}
    >
      {label.text}
    </span>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        color: "var(--muted-foreground)",
        fontSize: 12,
        padding: "8px 0",
      }}
    >
      {children}
    </div>
  );
}

function EmptyArea({
  icon,
  text,
  hint,
}: {
  icon: React.ReactNode;
  text: string;
  hint: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "28px 16px",
        color: "var(--muted-foreground)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          background: "var(--accent)",
        }}
      >
        {icon}
      </div>
      <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{text}</p>
      <p style={{ fontSize: 11, margin: 0, textAlign: "center" }}>{hint}</p>
    </div>
  );
}

const tdStyle: React.CSSProperties = {
  padding: "11px 8px",
  borderBottom: "1px solid var(--border)",
  fontSize: 13,
  verticalAlign: "middle",
  color: "var(--muted-foreground)",
};

const iconBtnStyle: React.CSSProperties = {
  display: "grid",
  width: 28,
  height: 28,
  placeItems: "center",
  borderRadius: 6,
  border: 0,
  background: "none",
  cursor: "pointer",
  color: "var(--muted-foreground)",
};
