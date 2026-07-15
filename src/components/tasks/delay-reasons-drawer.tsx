"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import React, { useMemo, useState } from "react";
import { AlertTriangle, Clock, Layers, Gauge } from "lucide-react";
import { subDays, startOfMonth, endOfMonth, subMonths, format } from "date-fns";

// ─── Internos ─────────────────────────────────────────────────────────────────
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useDelayReasons,
  useDelayReasonsReport,
  type DelayReasonsFilters,
  type DelayReasonGroup,
} from "@/hooks/use-delay-justifications";
import { useAllLists } from "@/hooks/use-projects";
import { useOrgMembers } from "@/hooks/use-org-members";

const BAR_FILL = "linear-gradient(90deg, #7a68f0, #9b8cf9)";

const selectStyle: React.CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--foreground)",
  fontSize: 12,
  padding: "6px 10px",
  outline: "none",
  colorScheme: "dark",
  cursor: "pointer",
  maxWidth: 200,
};

// ─── Formatação (pt-BR) ─────────────────────────────────────────────────────────

/** "3,0d" — atraso médio, uma casa decimal, vírgula decimal. */
function fmtAvg(d: number | null): string {
  return d == null ? "—" : `${d.toFixed(1).replace(".", ",")}d`;
}

/** "15d" — dias acumulados (impacto), inteiro arredondado. */
function fmtImpact(d: number | null): string {
  return d == null ? "—" : `${Math.round(d)}d`;
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

// ─── Severidade do atraso médio (status: cor + rótulo, nunca cor sozinha) ────────

type Sev = { fg: string; bg: string; border: string };

function severity(days: number | null): Sev {
  if (days == null)
    return {
      fg: "var(--muted-foreground)",
      bg: "rgba(255,255,255,0.05)",
      border: "var(--border)",
    };
  if (days < 1)
    return {
      fg: "#37b981",
      bg: "rgba(55,185,129,0.13)",
      border: "rgba(55,185,129,0.26)",
    };
  if (days < 3)
    return {
      fg: "#e6a94e",
      bg: "rgba(230,169,78,0.14)",
      border: "rgba(230,169,78,0.26)",
    };
  return {
    fg: "#ef5f5f",
    bg: "rgba(239,95,95,0.14)",
    border: "rgba(239,95,95,0.26)",
  };
}

// ─── Período (preset → from/to) ─────────────────────────────────────────────────

type PeriodKey = "all" | "7d" | "30d" | "month";

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "all", label: "Tudo" },
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "month", label: "Este mês" },
];

function periodRange(key: PeriodKey): {
  from: string | null;
  to: string | null;
} {
  const today = new Date();
  if (key === "7d")
    return { from: format(subDays(today, 6), "yyyy-MM-dd"), to: null };
  if (key === "30d")
    return { from: format(subDays(today, 29), "yyyy-MM-dd"), to: null };
  if (key === "month")
    return { from: format(startOfMonth(today), "yyyy-MM-dd"), to: null };
  return { from: null, to: null };
}

/**
 * Janela IMEDIATAMENTE anterior à do preset — para calcular a tendência
 * (▲▼ vs período anterior) no frontend, sem depender de endpoint novo.
 * "Tudo" não tem período anterior → null (tendência escondida).
 */
function previousRange(key: PeriodKey): { from: string; to: string } | null {
  const today = new Date();
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");
  if (key === "7d")
    return { from: fmt(subDays(today, 13)), to: fmt(subDays(today, 7)) };
  if (key === "30d")
    return { from: fmt(subDays(today, 59)), to: fmt(subDays(today, 30)) };
  if (key === "month") {
    const prev = subMonths(today, 1);
    return { from: fmt(startOfMonth(prev)), to: fmt(endOfMonth(prev)) };
  }
  return null;
}

/** Rótulo curto do período anterior, para a legenda da tendência. */
const PREV_LABEL: Record<PeriodKey, string> = {
  all: "",
  "7d": "vs 7 dias anteriores",
  "30d": "vs 30 dias anteriores",
  month: "vs mês anterior",
};

// ─── Enriquecimento: impacto = contagem × atraso médio (dias acumulados) ─────────

type Report = ReturnType<typeof useDelayReasonsReport>;

interface EnrichedGroup {
  key: string;
  label: string;
  count: number;
  avg: number | null;
  /** Dias de atraso acumulados. `null` se o backend não trouxe média. */
  impact: number | null;
  /** Quebra por sub-dimensão (ex: motivos da pessoa), já enriquecida/ordenada. */
  sub?: EnrichedGroup[];
}

/** Mapeia grupos crus para enriquecidos, ordena por impacto e desce no `sub`. */
function enrichGroups(groups: DelayReasonGroup[] | undefined): EnrichedGroup[] {
  const rows: EnrichedGroup[] = (groups ?? []).map((g) => ({
    key: g.key,
    label: g.label ?? g.key,
    count: g.count,
    avg: g.avgDelayDays,
    impact: g.avgDelayDays != null ? g.count * g.avgDelayDays : null,
    sub: g.sub ? enrichGroups(g.sub) : undefined,
  }));
  const byImpact = rows.some((r) => r.impact != null);
  rows.sort((a, b) =>
    byImpact ? (b.impact ?? -1) - (a.impact ?? -1) : b.count - a.count,
  );
  return rows;
}

interface Ranked {
  rows: EnrichedGroup[];
  /** Há pelo menos um grupo com média → dá para ranquear por impacto. */
  byImpact: boolean;
  maxImpact: number;
  maxCount: number;
  total: number;
  /** Σ dos dias de atraso acumulados. */
  accumulated: number;
  /** Média ponderada por tarefa (accumulated / tarefas com média). */
  weightedAvg: number | null;
}

/**
 * Ordena os grupos de um corte por IMPACTO (dias acumulados), não por
 * frequência. Cai para contagem se o backend não popular a média. Derivado
 * 100% do payload atual de `GET /reports/delay-reasons`.
 */
function rank(report: Report): Ranked {
  const rows = enrichGroups(report.data?.groups);
  const byImpact = rows.some((r) => r.impact != null);
  let accumulated = 0;
  let counted = 0;
  for (const r of rows) {
    if (r.impact == null) continue;
    accumulated += r.impact;
    counted += r.count;
  }
  return {
    rows,
    byImpact,
    maxImpact: Math.max(1, ...rows.map((r) => r.impact ?? 0)),
    maxCount: Math.max(1, ...rows.map((r) => r.count)),
    total: report.data?.total ?? 0,
    accumulated,
    weightedAvg: counted > 0 ? accumulated / counted : null,
  };
}

// ─── Diagnóstico (a frase que responde "e daí?") ────────────────────────────────

function Diagnosis({
  rMotivo,
  rUsuario,
  rProjeto,
}: {
  rMotivo: Report;
  rUsuario: Report;
  rProjeto: Report;
}) {
  const base: React.CSSProperties = {
    margin: "5px 0 0",
    fontSize: 13,
    lineHeight: 1.5,
    color: "var(--muted-foreground)",
    maxWidth: "70ch",
  };

  if (rMotivo.isLoading) {
    return (
      <div
        style={{
          height: 10,
          width: "60%",
          borderRadius: 4,
          background: "var(--accent)",
          opacity: 0.5,
          marginTop: 8,
        }}
      />
    );
  }

  const m = rank(rMotivo);
  const topImpact = m.rows[0];
  if (m.total === 0 || !topImpact) {
    return (
      <p style={base}>
        Nenhuma tarefa atrasada foi justificada no filtro atual.
      </p>
    );
  }

  const b = (t: string) => (
    <strong style={{ color: "var(--foreground)", fontWeight: 600 }}>{t}</strong>
  );
  const topAvg = [...m.rows]
    .filter((r) => r.avg != null)
    .sort((a, b2) => (b2.avg ?? 0) - (a.avg ?? 0))[0];
  const leadPessoa = rank(rUsuario).rows[0];
  const leadProjeto = rank(rProjeto).rows[0];

  return (
    <p style={base}>
      No filtro, {b(fmtImpact(m.accumulated))} de atraso em {b(String(m.total))}{" "}
      {plural(m.total, "registro", "registros")}. Maior fonte:{" "}
      {b(topImpact.label)} ({fmtImpact(topImpact.impact)}).
      {topAvg && topAvg.key !== topImpact.key && (
        <>
          {" "}
          O que mais pesa por tarefa:{" "}
          <span style={{ color: "#f0a3a3", fontWeight: 600 }}>
            {topAvg.label}
          </span>{" "}
          ({fmtAvg(topAvg.avg)} cada).
        </>
      )}
      {(leadProjeto || leadPessoa) && (
        <>
          {" "}
          Concentra em {leadProjeto && b(leadProjeto.label)}
          {leadProjeto && leadPessoa && " e "}
          {leadPessoa && b(leadPessoa.label)}.
        </>
      )}
    </p>
  );
}

// ─── KPIs ────────────────────────────────────────────────────────────────────────

function KpiTile({
  icon,
  label,
  value,
  unit,
  valueColor,
  sub,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  valueColor?: string;
  sub: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 150,
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "13px 15px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 10.5,
          fontWeight: 650,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--muted-foreground)",
          marginBottom: 9,
        }}
      >
        {icon}
        {label}
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 720,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
          color: loading
            ? "var(--muted-foreground)"
            : (valueColor ?? "var(--foreground)"),
          display: "flex",
          alignItems: "baseline",
          gap: 3,
        }}
      >
        {loading ? "…" : value}
        {!loading && unit && (
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--muted-foreground)",
            }}
          >
            {unit}
          </span>
        )}
      </div>
      <div
        style={{
          marginTop: 7,
          fontSize: 11.5,
          color: "var(--muted-foreground)",
        }}
      >
        {sub}
      </div>
    </div>
  );
}

/**
 * Linha de comparação vs período anterior. `worse` positivo = piorou (mais
 * atraso/tarefas) → vermelho; negativo = melhorou → verde.
 */
function TrendSub({
  worse,
  display,
  label,
}: {
  worse: number;
  display: string;
  label: string;
}) {
  const flat = worse === 0;
  const up = worse > 0;
  const color = flat ? "var(--muted-foreground)" : up ? "#ef5f5f" : "#37b981";
  const arrow = flat ? "•" : up ? "▲" : "▼";
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 5 }}>
      <span
        style={{ color, fontWeight: 650, fontVariantNumeric: "tabular-nums" }}
      >
        {arrow} {display}
      </span>
      <span style={{ color: "var(--muted-foreground)" }}>{label}</span>
    </span>
  );
}

function KpiRow({
  report,
  filters,
  period,
  open,
}: {
  report: Report;
  filters: DelayReasonsFilters;
  period: PeriodKey;
  open: boolean;
}) {
  const m = rank(report);
  const loading = report.isLoading;
  const sev = severity(m.weightedAvg);

  // Tendência: o mesmo corte na janela IMEDIATAMENTE anterior (frontend-only,
  // sem endpoint novo). "Tudo" não tem janela anterior → sem tendência.
  const prev = previousRange(period);
  const prevFilters: DelayReasonsFilters = prev
    ? { ...filters, from: prev.from, to: prev.to }
    : filters;
  const reportPrev = useDelayReasonsReport(
    "motivo",
    prevFilters,
    open && !!prev,
  );
  const p = rank(reportPrev);
  const hasTrend = !!prev && !reportPrev.isLoading;
  const accPct =
    hasTrend && p.accumulated > 0
      ? ((m.accumulated - p.accumulated) / p.accumulated) * 100
      : null;
  const totalDelta = hasTrend ? m.total - p.total : null;
  const label = PREV_LABEL[period];

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <KpiTile
        icon={<Clock className="size-3" />}
        label="Atraso acumulado"
        value={loading ? "…" : String(Math.round(m.accumulated))}
        unit="dias"
        sub={
          accPct != null ? (
            <TrendSub
              worse={accPct}
              display={
                accPct === 0
                  ? "0%"
                  : `${accPct > 0 ? "+" : "−"}${Math.round(Math.abs(accPct))}%`
              }
              label={label}
            />
          ) : (
            <>
              Σ dos atrasos em {m.total}{" "}
              {plural(m.total, "registro", "registros")}
            </>
          )
        }
        loading={loading}
      />
      <KpiTile
        icon={<Layers className="size-3" />}
        label="Atrasos justificados"
        value={loading ? "…" : String(m.total)}
        sub={
          totalDelta != null && totalDelta !== 0 ? (
            <TrendSub
              worse={totalDelta}
              display={String(Math.abs(totalDelta))}
              label={label}
            />
          ) : (
            "no filtro atual"
          )
        }
        loading={loading}
      />
      <KpiTile
        icon={<Gauge className="size-3" />}
        label="Atraso médio"
        value={fmtAvg(m.weightedAvg)}
        valueColor={m.weightedAvg != null ? sev.fg : undefined}
        sub="ponderado por tarefa"
        loading={loading}
      />
    </div>
  );
}

// ─── Chip de severidade ──────────────────────────────────────────────────────────

function SevChip({ avg }: { avg: number | null }) {
  if (avg == null) return null;
  const s = severity(avg);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 10.5,
        fontWeight: 600,
        padding: "1.5px 8px",
        borderRadius: 20,
        color: s.fg,
        background: s.bg,
        border: `1px solid ${s.border}`,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <span
        style={{ width: 5, height: 5, borderRadius: "50%", background: s.fg }}
      />
      {fmtAvg(avg)} médio
    </span>
  );
}

// ─── Painel herói: causas por impacto ─────────────────────────────────────────────

function BarSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {[0, 1, 2].map((i) => (
        <div key={i}>
          <div
            style={{
              height: 10,
              width: `${72 - i * 14}%`,
              borderRadius: 4,
              background: "var(--accent)",
              marginBottom: 7,
              opacity: 0.55,
            }}
          />
          <div
            style={{
              height: 8,
              borderRadius: 5,
              background: "var(--accent)",
              opacity: 0.35,
            }}
          />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      style={{
        fontSize: 12,
        color: "var(--muted-foreground)",
        padding: "26px 0",
        textAlign: "center",
      }}
    >
      {text}
    </div>
  );
}

function CausesPanel({ report }: { report: Report }) {
  const m = rank(report);
  const isFrequency = !m.byImpact;

  return (
    <div
      style={{
        flex: "1.5 1 300px",
        minWidth: 300,
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 13,
        padding: "15px 16px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 15,
        }}
      >
        <span
          style={{ fontSize: 12, fontWeight: 650, color: "var(--foreground)" }}
        >
          Causas{" "}
          <span style={{ color: "var(--muted-foreground)", fontWeight: 500 }}>
            — {isFrequency ? "por frequência" : "por dias de atraso (impacto)"}
          </span>
        </span>
        {report.data && (
          <span
            style={{
              fontSize: 11,
              color: "var(--muted-foreground)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {m.rows.length} {plural(m.rows.length, "motivo", "motivos")}
            {!isFrequency && ` · ${Math.round(m.accumulated)}d`}
          </span>
        )}
      </div>

      {report.isLoading ? (
        <BarSkeleton />
      ) : report.isError ? (
        <EmptyState text="Erro ao carregar." />
      ) : m.rows.length === 0 ? (
        <EmptyState text="Sem justificativas no filtro." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          {m.rows.map((r, i) => {
            const width = isFrequency
              ? (r.count / m.maxCount) * 100
              : ((r.impact ?? 0) / m.maxImpact) * 100;
            const highImpactLowFreq =
              !isFrequency && r.avg != null && r.avg >= 3 && r.count <= 2;
            return (
              <div
                key={r.key}
                title={`${r.label} — ${r.count} ${plural(r.count, "tarefa", "tarefas")}${
                  r.impact != null
                    ? ` · ${Math.round(r.impact)}d acumulados`
                    : ""
                }${r.avg != null ? ` · ${fmtAvg(r.avg)} médio` : ""}`}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 8,
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "var(--muted-foreground)",
                        fontVariantNumeric: "tabular-nums",
                        width: 10,
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span
                      style={{
                        fontSize: 12.5,
                        color: "var(--foreground)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {r.label}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 720,
                      color: "var(--foreground)",
                      fontVariantNumeric: "tabular-nums",
                      flexShrink: 0,
                    }}
                  >
                    {isFrequency ? r.count : fmtImpact(r.impact)}
                  </span>
                </div>

                <div
                  style={{
                    height: 8,
                    borderRadius: 5,
                    background: "rgba(255,255,255,0.05)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.max(6, width)}%`,
                      height: "100%",
                      borderRadius: 5,
                      background: BAR_FILL,
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 7,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--muted-foreground)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {r.count} {plural(r.count, "tarefa", "tarefas")}
                  </span>
                  <SevChip avg={r.avg} />
                  {highImpactLowFreq && (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 10,
                        fontStyle: "italic",
                        color: "var(--muted-foreground)",
                      }}
                    >
                      poucas tarefas, atraso alto
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Painel secundário: onde concentra (líder + quebra por motivo) ────────────────

/** Mini-barra de um motivo dentro do card de líder. */
function SubBar({
  row,
  max,
  byImpact,
}: {
  row: EnrichedGroup;
  max: number;
  byImpact: boolean;
}) {
  const val = byImpact ? (row.impact ?? 0) : row.count;
  const width = (val / max) * 100;
  return (
    <div
      title={`${row.label} — ${byImpact ? `${Math.round(row.impact ?? 0)}d acumulados` : `${row.count} ${plural(row.count, "tarefa", "tarefas")}`}${row.avg != null ? ` · ${fmtAvg(row.avg)} médio` : ""}`}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "var(--muted-foreground)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {row.label}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--foreground)",
            fontVariantNumeric: "tabular-nums",
            flexShrink: 0,
          }}
        >
          {byImpact ? fmtImpact(row.impact) : row.count}
        </span>
      </div>
      <div
        style={{
          height: 5,
          borderRadius: 4,
          background: "rgba(255,255,255,0.05)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.max(6, width)}%`,
            height: "100%",
            borderRadius: 4,
            background: BAR_FILL,
          }}
        />
      </div>
    </div>
  );
}

/**
 * Card do líder de uma dimensão (pessoa OU projeto): quem mais acumula atraso,
 * com a quebra dos seus motivos (cruzamento vindo de `groupBy=X&subGroupBy=motivo`).
 */
function LeaderCard({
  title,
  report,
  avatar,
  avatarColor = "linear-gradient(135deg,#8b7bf7,#6d5de0)",
}: {
  title: string;
  report: Report;
  avatar?: boolean;
  avatarColor?: string;
}) {
  const m = rank(report);
  const leader = m.rows[0];

  const header = (
    <div
      style={{
        fontSize: 10.5,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        fontWeight: 650,
        color: "var(--muted-foreground)",
      }}
    >
      {title}
    </div>
  );

  if (report.isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {header}
        <BarSkeleton />
      </div>
    );
  }
  if (!leader) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {header}
        <EmptyState text="Sem dados." />
      </div>
    );
  }

  const subs = leader.sub ?? [];
  const subByImpact = subs.some((s) => s.impact != null);
  const maxSub = Math.max(
    1,
    ...subs.map((s) => (subByImpact ? (s.impact ?? 0) : s.count)),
  );
  const others = m.rows.slice(1);
  const othersImpact = others.reduce((acc, r) => acc + (r.impact ?? 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {header}

      <div
        style={{
          background: "var(--background)",
          border: "1px solid var(--border)",
          borderRadius: 11,
          padding: "12px 13px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Quem + total acumulado */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {avatar && (
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                fontSize: 12,
                fontWeight: 700,
                color: "#fff",
                background: avatarColor,
              }}
            >
              {(leader.label.trim()[0] ?? "?").toUpperCase()}
            </span>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 620,
                color: "var(--foreground)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {leader.label}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
              {leader.count}{" "}
              {plural(leader.count, "tarefa atrasada", "tarefas atrasadas")}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div
              style={{
                fontSize: 17,
                fontWeight: 720,
                color: "var(--foreground)",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
              }}
            >
              {m.byImpact ? fmtImpact(leader.impact) : leader.count}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--muted-foreground)",
                marginTop: 2,
              }}
            >
              {m.byImpact ? "acumulado" : "tarefas"}
            </div>
          </div>
        </div>

        {/* Quebra por motivo (o cruzamento) */}
        {subs.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {subs.slice(0, 3).map((s) => (
              <SubBar key={s.key} row={s} max={maxSub} byImpact={subByImpact} />
            ))}
          </div>
        )}
      </div>

      {/* Runner-ups */}
      {others.length > 0 && (
        <div style={{ fontSize: 10.5, color: "var(--muted-foreground)" }}>
          {m.byImpact && othersImpact > 0
            ? `+ ${others.length} ${plural(others.length, "outro", "outros")} · ${fmtImpact(othersImpact)}`
            : `+ ${others.length} ${plural(others.length, "outro", "outros")}`}
        </div>
      )}
    </div>
  );
}

function ConcentrationPanel({
  rUsuario,
  rProjeto,
}: {
  rUsuario: Report;
  rProjeto: Report;
}) {
  return (
    <div
      style={{
        flex: "1 1 240px",
        minWidth: 240,
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 13,
        padding: "15px 16px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <div
        style={{ fontSize: 12, fontWeight: 650, color: "var(--foreground)" }}
      >
        Onde concentra{" "}
        <span style={{ color: "var(--muted-foreground)", fontWeight: 500 }}>
          — líder + seus motivos
        </span>
      </div>
      <LeaderCard title="Pessoa mais impactada" report={rUsuario} avatar />
      <LeaderCard
        title="Projeto mais impactado"
        report={rProjeto}
        avatar
        avatarColor="linear-gradient(135deg,#37b981,#2a9668)"
      />
    </div>
  );
}

// ─── Gaveta ──────────────────────────────────────────────────────────────────────

/**
 * Painel admin de motivos de atraso (Fase 2) — gaveta full-width sobre o
 * `/assigned`. Reformulada para responder "onde dói mais": abre com um
 * diagnóstico em texto + KPIs, ranqueia as causas por DIAS DE ATRASO ACUMULADOS
 * (impacto = contagem × atraso médio), não por frequência, e mostra a
 * concentração por pessoa e projeto. Só o org ADMIN enxerga o gatilho; o backend
 * também barra não-admin (403).
 *
 * Métricas derivadas 100% do payload atual de `GET /reports/delay-reasons`.
 * Tendência vs período anterior e cruzamento motivo×pessoa ficam para o Tier 2
 * (dependem de endpoint novo).
 *
 * @param open - Estado controlado de abertura.
 * @param onClose - Callback ao fechar (Esc, clique fora, X).
 */
export function DelayReasonsDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data: reasons = [] } = useDelayReasons();
  const { lists } = useAllLists();
  const { data: members = [] } = useOrgMembers();

  const [motivoClasse, setMotivoClasse] = useState("");
  const [projectId, setProjectId] = useState("");
  const [userId, setUserId] = useState("");
  const [period, setPeriod] = useState<PeriodKey>("all");

  const filters: DelayReasonsFilters = useMemo(() => {
    const range = periodRange(period);
    return {
      motivoClasse: motivoClasse || null,
      projectId: projectId || null,
      userId: userId || null,
      from: range.from,
      to: range.to,
    };
  }, [motivoClasse, projectId, userId, period]);

  const rMotivo = useDelayReasonsReport("motivo", filters, open);
  // Cruzamento: cada pessoa/projeto quebrado por motivo (alimenta "Onde concentra").
  const rUsuario = useDelayReasonsReport("usuario", filters, open, "motivo");
  const rProjeto = useDelayReasonsReport("projeto", filters, open, "motivo");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-400" />
            Motivos de atraso
          </DialogTitle>
          <DialogDescription className="sr-only">
            Análise dos motivos das tarefas atrasadas por impacto — causas,
            pessoas e projetos.
          </DialogDescription>
        </DialogHeader>

        {/* Diagnóstico dinâmico (bloco próprio: evita <p> aninhado no <p> da
            DialogDescription) */}
        <Diagnosis rMotivo={rMotivo} rUsuario={rUsuario} rProjeto={rProjeto} />

        {/* KPIs (impacto acumulado, volume, atraso médio ponderado) */}
        <KpiRow
          report={rMotivo}
          filters={filters}
          period={period}
          open={open}
        />

        {/* Filtros compartilhados */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
          }}
        >
          <select
            style={selectStyle}
            value={motivoClasse}
            onChange={(e) => setMotivoClasse(e.target.value)}
            aria-label="Filtrar por motivo"
          >
            <option value="">Todos os motivos</option>
            {reasons.map((r) => (
              <option key={r.chave} value={r.chave}>
                {r.nome}
              </option>
            ))}
          </select>
          <select
            style={selectStyle}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            aria-label="Filtrar por projeto"
          >
            <option value="">Todos os projetos</option>
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
          <select
            style={selectStyle}
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            aria-label="Filtrar por usuário"
          >
            <option value="">Todos os usuários</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.nome}
              </option>
            ))}
          </select>
          <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
            {PERIODS.map((p) => {
              const active = period === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriod(p.key)}
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    borderRadius: 6,
                    padding: "5px 10px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    border: `1px solid ${active ? "var(--border)" : "transparent"}`,
                    background: active ? "var(--accent)" : "transparent",
                    color: active
                      ? "var(--foreground)"
                      : "var(--muted-foreground)",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Causa (herói) + onde concentra */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <CausesPanel report={rMotivo} />
          <ConcentrationPanel rUsuario={rUsuario} rProjeto={rProjeto} />
        </div>

        {/* Legenda + nota de Tier 2 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
            fontSize: 11,
            color: "var(--muted-foreground)",
            borderTop: "1px solid var(--border)",
            paddingTop: 12,
          }}
        >
          {[
            { c: "#37b981", t: "até 1d" },
            { c: "#e6a94e", t: "1–3d" },
            { c: "#ef5f5f", t: "3d+" },
          ].map((l) => (
            <span
              key={l.t}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: l.c,
                }}
              />
              {l.t}
            </span>
          ))}
          <span>· ordenado por impacto, não por frequência</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
