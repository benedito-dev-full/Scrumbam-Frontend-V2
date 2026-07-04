"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { useMyTasks, useTeamTasks } from "@/hooks/use-tasks";
import { useAllLists } from "@/hooks/use-projects";
import { useTeams } from "@/hooks/use-teams";
import { useAuthStore } from "@/lib/stores/auth";
import type {
  TaskResponseDto,
  TeamResponseDto,
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

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

/** Retorna 'overdue' | 'today' | 'future' | null a partir do dueDate. */
function dueBucket(dueDate?: string | null): "overdue" | "today" | "future" | null {
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
function dueLabel(dueDate?: string | null): { text: string; tone: "bad" | "warn" | "muted" } {
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

  const [period, setPeriod] = useState<"today" | "week" | "month">("week");
  const [filter, setFilter] = useState<"all" | "active" | "due" | "done">("all");
  // Escopo ativo: null = minhas tarefas (default); string = tasks de um time.
  const [scopeTeamId, setScopeTeamId] = useState<string | null>(null);

  const { data: teams = [] } = useTeams();
  const scopeTeam = useMemo(
    () => teams.find((t) => t.id === scopeTeamId) ?? null,
    [teams, scopeTeamId],
  );

  // Fonte de tasks conforme o escopo: sempre chamamos os dois hooks (regras
  // dos hooks), mas cada um se auto-desabilita quando não é o escopo ativo.
  const my = useMyTasks();
  const team = useTeamTasks(scopeTeamId);
  const isTeamScope = scopeTeamId !== null;
  const isLoading = isTeamScope ? team.isLoading : my.isLoading;
  const tasks: TaskResponseDto[] = useMemo(
    () => (isTeamScope ? team.data ?? [] : my.data ?? []),
    [isTeamScope, team.data, my.data],
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

  /* ── Métricas derivadas dos dados reais ── */
  const metrics = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => DONE_STATUSES.includes(t.status)).length;
    const open = tasks.filter((t) => !TERMINAL_STATUSES.includes(t.status));
    const overdue = open.filter((t) => dueBucket(t.dueDate) === "overdue");
    const dueToday = open.filter((t) => dueBucket(t.dueDate) === "today");
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return {
      total,
      done,
      pct,
      openCount: open.length,
      overdue,
      dueToday,
      atRisk: [...overdue, ...dueToday],
    };
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    const rows = [...tasks].sort((a, b) => {
      // ordena por prazo mais urgente primeiro
      const rank = (t: TaskResponseDto) => {
        const b2 = dueBucket(t.dueDate);
        return b2 === "overdue" ? 0 : b2 === "today" ? 1 : b2 === "future" ? 2 : 3;
      };
      return rank(a) - rank(b);
    });
    if (filter === "active")
      return rows.filter((t) => !TERMINAL_STATUSES.includes(t.status));
    if (filter === "due")
      return rows.filter((t) => {
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
        <span style={{ fontSize: 13, color: "var(--foreground)", fontWeight: 500 }}>
          Minhas tarefas
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
              Minhas tarefas
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
              style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 5 }}
            >
              {scopeTeam ? (
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

          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
            {isAdmin && (
              <ScopePicker
                teams={teams}
                selectedTeamId={scopeTeamId}
                onSelectTeam={setScopeTeamId}
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
          <KpiConcluidas pct={metrics.pct} done={metrics.done} total={metrics.total} loading={isLoading} />
          <KpiTempoFocado tasks={tasks} />
          <KpiEmAtraso overdue={metrics.overdue.length} today={metrics.dueToday.length} />
          <KpiRitmo />
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
          <PanelEmAtraso tasks={metrics.atRisk} loading={isLoading} />
          <PanelRitmo />
        </div>

        {/* ── Tabela de tarefas ── */}
        <PanelTabela
          tasks={visibleTasks}
          totalOpen={metrics.openCount}
          filter={filter}
          onFilter={setFilter}
          loading={isLoading}
          projectMap={projectMap}
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
      footer="tarefas do período concluídas"
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ position: "relative", width: 52, height: 52 }}>
          <svg width={52} height={52} viewBox="0 0 52 52" style={{ transform: "rotate(-90deg)" }}>
            <circle cx={26} cy={26} r={R} fill="none" strokeWidth={5} stroke="rgba(255,255,255,0.08)" />
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
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
          <span style={{ fontSize: 11, color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>
            {loading ? "" : `${done} / ${total}`}
          </span>
        </div>
      </div>
    </KpiShell>
  );
}

function KpiTempoFocado({ tasks }: { tasks: TaskResponseDto[] }) {
  const { c, soft } = KPI.violet;
  // Aproximação: soma dos rótulos "Xh Ymin" que vierem do backend (own-time).
  const totalMin = useMemo(() => {
    let min = 0;
    for (const t of tasks) {
      const lbl = t.timeSpentLabel;
      if (!lbl || lbl === "—") continue;
      const h = /(\d+)\s*h/.exec(lbl);
      const m = /(\d+)\s*min/.exec(lbl);
      min += (h ? +h[1] : 0) * 60 + (m ? +m[1] : 0);
    }
    return min;
  }, [tasks]);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return (
    <KpiShell
      color={c}
      soft={soft}
      icon={<Clock size={13} />}
      label="Tempo focado"
      footer="soma do tempo registrado (aprox.)"
    >
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontSize: 28, fontWeight: 650, letterSpacing: "-0.02em", color: c, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {h}
          <small style={{ fontSize: 14, fontWeight: 500, color: "var(--muted-foreground)" }}>h</small> {m}
          <small style={{ fontSize: 14, fontWeight: 500, color: "var(--muted-foreground)" }}>m</small>
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
            {overdue} atrasada{overdue !== 1 ? "s" : ""} · {today} vence{today !== 1 ? "m" : ""} hoje
          </span>
        ) : (
          "nada em atraso"
        )
      }
    >
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
        <div style={{ fontSize: 28, fontWeight: 650, letterSpacing: "-0.02em", color: c, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {count}
        </div>
      </div>
    </KpiShell>
  );
}

function KpiRitmo() {
  const { c, soft } = KPI.sky;
  return (
    <KpiShell
      color={c}
      soft={soft}
      icon={<Activity size={13} />}
      label="Ritmo"
      footer={<SoonTag>histórico por dia — em breve</SoonTag>}
    >
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontSize: 28, fontWeight: 650, letterSpacing: "-0.02em", color: c, lineHeight: 1, opacity: 0.55 }}>
          —
        </div>
        <Sparkline color={c} points="0,10 11,12 22,9 33,11 44,10 55,11 64,9" dim />
      </div>
    </KpiShell>
  );
}

function Sparkline({ color, points, dim }: { color: string; points: string; dim?: boolean }) {
  return (
    <svg width={64} height={22} viewBox="0 0 64 22" style={{ opacity: dim ? 0.4 : 0.95 }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--foreground)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 22, height: 22, borderRadius: 6, display: "grid", placeItems: "center", background: iconSoft, color: iconColor }}>
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
        {meta && <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{meta}</span>}
      </div>
      {children}
    </section>
  );
}

function PanelEmAtraso({ tasks, loading }: { tasks: TaskResponseDto[]; loading: boolean }) {
  return (
    <PanelShell
      icon={<AlertTriangle size={14} />}
      iconColor={KPI.red.c}
      iconSoft={KPI.red.soft}
      title="Em atraso"
      count={loading ? undefined : tasks.length}
      meta="precisa de ação"
    >
      {loading ? (
        <Muted>Carregando…</Muted>
      ) : tasks.length === 0 ? (
        <EmptyArea icon={<CheckCheck size={20} />} text="Nada em atraso" hint="Você está em dia com seus prazos." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {tasks.map((t) => {
            const dl = dueLabel(t.dueDate);
            const sev = dl.tone === "bad" ? KPI.red.c : WARN;
            return (
              <Link
                key={t.id}
                href={`/lists/${t.projectId}`}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "9px 8px 9px 12px",
                  borderRadius: 8,
                  borderBottom: "1px solid var(--border)",
                  textDecoration: "none",
                  transition: "background .12s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--accent)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              >
                <span style={{ position: "absolute", left: 0, top: 8, bottom: 8, width: 2.5, borderRadius: 3, background: sev }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {t.nome}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 3, display: "flex", gap: 7, alignItems: "center" }}>
                    <PriorityTag priority={t.priority} />
                  </div>
                </div>
                <DueBadge label={dl} />
                {t.identifier && (
                  <span style={{ fontSize: 11, color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>{t.identifier}</span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </PanelShell>
  );
}

function PanelRitmo() {
  return (
    <PanelShell
      icon={<Activity size={14} />}
      iconColor={KPI.violet.c}
      iconSoft={KPI.violet.soft}
      title="Ritmo de entrega"
      meta="concluídas / dia"
    >
      <div style={{ position: "relative", padding: "24px 8px 8px" }}>
        {/* barras mock desabilitadas — aguardando endpoint de throughput por pessoa */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 9, height: 130, opacity: 0.4 }}>
          {[40, 20, 60, 82, 40, 60, 40].map((hgt, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 9, height: "100%", justifyContent: "flex-end" }}>
              <div
                style={{
                  width: "100%",
                  maxWidth: 30,
                  height: `${hgt}%`,
                  borderRadius: "4px 4px 0 0",
                  background: i === 6 ? KPI.violet.c : "rgba(139,123,247,0.32)",
                }}
              />
              <span style={{ fontSize: 10, color: "var(--muted-foreground)", textTransform: "uppercase" }}>
                {["sáb", "dom", "seg", "ter", "qua", "qui", "hoje"][i]}
              </span>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
          <SoonTag large>gráfico de ritmo — em breve</SoonTag>
        </div>
      </div>
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
}: {
  tasks: TaskResponseDto[];
  totalOpen: number;
  filter: "all" | "active" | "due" | "done";
  onFilter: (f: "all" | "active" | "due" | "done") => void;
  loading: boolean;
  projectMap: Map<string, { nome: string; spaceName: string }>;
}) {
  const filters: { id: typeof filter; label: string }[] = [
    { id: "all", label: "Todas" },
    { id: "active", label: "Ativas" },
    { id: "due", label: "Vencendo" },
    { id: "done", label: "Concluídas" },
  ];
  return (
    <section style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
          Atribuídas a mim{" "}
          <span style={{ fontWeight: 400, color: "var(--muted-foreground)", marginLeft: 2, fontSize: 12 }}>
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
                  color: active ? "var(--foreground)" : "var(--muted-foreground)",
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
        <EmptyArea icon={<CheckCheck size={20} />} text="Nada aqui" hint="Nenhuma tarefa neste filtro." />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Tarefa", "Projeto", "Status", "Prioridade", "Prazo", "Tempo"].map((h, i) => (
                  <th
                    key={h}
                    style={{
                      textAlign: i === 5 ? "right" : "left",
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
                const dl = dueLabel(t.dueDate);
                return (
                  <tr key={t.id}>
                    <td style={tdStyle}>
                      <Link
                        href={`/lists/${t.projectId}`}
                        style={{ display: "flex", gap: 9, alignItems: "center", color: "var(--foreground)", textDecoration: "none" }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_DOT[t.status] ?? "var(--muted-foreground)", flex: "none" }} />
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 380 }}>{t.nome}</span>
                      </Link>
                    </td>
                    <td style={{ ...tdStyle, color: "var(--muted-foreground)" }}>
                      <ProjectCell project={projectMap.get(t.projectId)} />
                    </td>
                    <td style={tdStyle}>
                      <StatusBadge status={t.status} />
                    </td>
                    <td style={tdStyle}>
                      <PriorityTag priority={t.priority} />
                    </td>
                    <td style={{ ...tdStyle, fontVariantNumeric: "tabular-nums", fontSize: 12, color: dl.tone === "bad" ? KPI.red.c : dl.tone === "warn" ? WARN : "var(--muted-foreground)" }}>
                      {dl.text}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--muted-foreground)", fontSize: 12, fontFamily: "var(--font-mono, monospace)" }}>
                        {t.timeSpentLabel && t.timeSpentLabel !== "" ? t.timeSpentLabel : "—"}
                      </span>
                    </td>
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
 * Controles: escopo (admin) + período
 * ═══════════════════════════════════════════════════════════════════════════ */

function ScopePicker({
  teams,
  selectedTeamId,
  onSelectTeam,
}: {
  teams: TeamResponseDto[];
  selectedTeamId: string | null;
  onSelectTeam: (id: string | null) => void;
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
        <span style={{ fontSize: 9, letterSpacing: "0.07em", textTransform: "uppercase", fontWeight: 600, color: "#a9a0e0", background: "rgba(139,123,247,0.16)", padding: "2px 6px", borderRadius: 4 }}>
          admin
        </span>
        ver
      </span>
      {/* Dropdown de Usuário permanece placeholder (aguarda backend de métricas). */}
      <ScopeButton icon={<UserIcon size={14} />} label="Usuário" />
      <TeamScopeButton
        teams={teams}
        selectedTeamId={selectedTeamId}
        onSelectTeam={onSelectTeam}
      />
    </div>
  );
}

/** Botão de escopo placeholder (usado apenas pelo dropdown de Usuário). */
function ScopeButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen((o) => !o)} style={scopeBtnStyle(false)}>
        <span style={{ color: "var(--muted-foreground)" }}>{icon}</span>
        <span style={{ color: "var(--muted-foreground)" }}>{label}</span>
        <ChevronDown size={14} style={{ color: "var(--muted-foreground)" }} />
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 30 }} onClick={() => setOpen(false)} />
          <div style={scopeMenuStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 9px", marginBottom: 4, borderBottom: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
              <Search size={13} />
              <input placeholder={`Buscar ${label.toLowerCase()}…`} style={{ flex: 1, background: "transparent", border: 0, outline: 0, color: "var(--foreground)", fontSize: 13 }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 9px", fontSize: 12, color: "var(--muted-foreground)" }}>
              <X size={13} /> Seleção de {label.toLowerCase()} chega com o backend de métricas.
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
        <span style={{ color: selected ? "#a9a0e0" : "var(--muted-foreground)" }}>
          <Users size={14} />
        </span>
        <span style={{ color: selected ? "var(--foreground)" : "var(--muted-foreground)" }}>
          {selected ? selected.nome : "Time"}
        </span>
        <ChevronDown size={14} style={{ color: "var(--muted-foreground)" }} />
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 30 }} onClick={close} />
          <div style={scopeMenuStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 9px", marginBottom: 4, borderBottom: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
              <Search size={13} />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar time…"
                style={{ flex: 1, background: "transparent", border: 0, outline: 0, color: "var(--foreground)", fontSize: 13 }}
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
              {selectedTeamId === null && <Check size={13} style={{ color: "#a9a0e0" }} />}
            </button>

            <div style={{ maxHeight: 220, overflowY: "auto" }}>
              {filtered.length === 0 ? (
                <div style={{ padding: "10px 9px", fontSize: 12, color: "var(--muted-foreground)" }}>
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
                      <span style={{ flex: 1, textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {t.nome}
                      </span>
                      {active && <Check size={13} style={{ color: "#a9a0e0" }} />}
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
  value: "today" | "week" | "month";
  onChange: (v: "today" | "week" | "month") => void;
}) {
  const opts: { id: typeof value; label: string }[] = [
    { id: "today", label: "Hoje" },
    { id: "week", label: "Semana" },
    { id: "month", label: "Mês" },
  ];
  return (
    <div style={{ display: "inline-flex", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 3, gap: 2 }}>
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
    EXECUTING: { bg: "rgba(139,123,247,0.16)", fg: "#a9a0e0", bd: "rgba(139,123,247,0.2)" },
    READY: { bg: "rgba(120,160,200,0.12)", fg: "#9fb8d4", bd: "rgba(120,160,200,0.2)" },
    VALIDATING: { bg: "rgba(139,123,247,0.16)", fg: "#a9a0e0", bd: "rgba(139,123,247,0.2)" },
    DONE: { bg: "rgba(52,184,122,0.12)", fg: "#34b87a", bd: "rgba(52,184,122,0.2)" },
    VALIDATED: { bg: "rgba(52,184,122,0.12)", fg: "#34b87a", bd: "rgba(52,184,122,0.2)" },
  };
  const s = map[status] ?? { bg: "rgba(255,255,255,0.05)", fg: "var(--muted-foreground)", bd: "var(--border)" };
  return (
    <span style={{ fontSize: 11, fontWeight: 550, padding: "2px 9px", borderRadius: 20, whiteSpace: "nowrap", background: s.bg, color: s.fg, border: `1px solid ${s.bd}` }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function PriorityTag({ priority }: { priority?: TaskPriority }) {
  if (!priority) return <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>—</span>;
  const meta = PRIORITY_META[priority];
  const Icon = meta.icon;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--foreground)" }}>
      <Icon size={12} style={{ color: meta.color }} />
      {meta.label}
    </span>
  );
}

function ProjectCell({ project }: { project?: { nome: string; spaceName: string } }) {
  if (!project) return <span style={{ color: "var(--muted-foreground)" }}>—</span>;
  const title = project.spaceName ? `${project.spaceName} · ${project.nome}` : project.nome;
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
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--muted-foreground)", flex: "none" }} />
      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {project.nome}
      </span>
    </span>
  );
}

function DueBadge({ label }: { label: { text: string; tone: "bad" | "warn" | "muted" } }) {
  if (label.tone === "muted") return null;
  const c = label.tone === "bad" ? KPI.red.c : WARN;
  const soft = label.tone === "bad" ? KPI.red.soft : "rgba(224,169,74,0.14)";
  const bd = label.tone === "bad" ? "rgba(239,95,95,0.28)" : "rgba(224,169,74,0.26)";
  return (
    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, whiteSpace: "nowrap", fontWeight: 550, background: soft, color: c, border: `1px solid ${bd}` }}>
      {label.text}
    </span>
  );
}

function SoonTag({ children, large }: { children: React.ReactNode; large?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: large ? 12 : 11,
        color: "var(--muted-foreground)",
        background: "var(--accent)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        padding: large ? "5px 12px" : "1px 8px",
      }}
    >
      {children}
    </span>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <div style={{ color: "var(--muted-foreground)", fontSize: 12, padding: "8px 0" }}>{children}</div>;
}

function EmptyArea({ icon, text, hint }: { icon: React.ReactNode; text: string; hint: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: "28px 16px", color: "var(--muted-foreground)" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", display: "grid", placeItems: "center", background: "var(--accent)" }}>{icon}</div>
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
