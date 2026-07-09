"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import React, { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { subDays, startOfMonth, format } from "date-fns";

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
} from "@/hooks/use-delay-justifications";
import { useAllLists } from "@/hooks/use-projects";
import { useOrgMembers } from "@/hooks/use-org-members";

const BAR_COLOR = "#8b7bf7";

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

// ─── Coluna de ranking ──────────────────────────────────────────────────────────

function RankingColumn({
  title,
  report,
}: {
  title: string;
  report: ReturnType<typeof useDelayReasonsReport>;
}) {
  const data = report.data;
  const groups = data?.groups ?? [];
  const max = Math.max(1, ...groups.map((g) => g.count));

  return (
    <div
      style={{
        flex: 1,
        minWidth: 220,
        background: "var(--background)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--muted-foreground)",
          }}
        >
          {title}
        </span>
        {data && (
          <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
            {data.total} total
          </span>
        )}
      </div>

      {report.isLoading ? (
        <div
          style={{
            fontSize: 12,
            color: "var(--muted-foreground)",
            padding: "8px 0",
          }}
        >
          Carregando…
        </div>
      ) : report.isError ? (
        <div style={{ fontSize: 12, color: "#ef5f5f", padding: "8px 0" }}>
          Erro ao carregar.
        </div>
      ) : groups.length === 0 ? (
        <div
          style={{
            fontSize: 12,
            color: "var(--muted-foreground)",
            padding: "18px 0",
            textAlign: "center",
          }}
        >
          Sem justificativas no filtro.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {groups.map((g) => (
            <div key={g.key}>
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
                    fontSize: 12,
                    color: "var(--foreground)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={g.label ?? g.key}
                >
                  {g.label ?? g.key}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--foreground)",
                    fontVariantNumeric: "tabular-nums",
                    flexShrink: 0,
                  }}
                >
                  {g.count}
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  borderRadius: 4,
                  background: "var(--accent)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${(g.count / max) * 100}%`,
                    height: "100%",
                    background: BAR_COLOR,
                  }}
                />
              </div>
              {g.avgDelayDays != null && (
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--muted-foreground)",
                    marginTop: 3,
                  }}
                >
                  ~{g.avgDelayDays.toFixed(1)}d de atraso médio
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Gaveta ──────────────────────────────────────────────────────────────────────

/**
 * Painel admin de motivos de atraso (Fase 2) — gaveta full-width sobre o
 * `/assigned`. Cruza os 3 cortes (por motivo, por pessoa, por projeto) com
 * filtros compartilhados (motivo/projeto/usuário/período). Só o org ADMIN
 * enxerga o gatilho; o backend também barra não-admin (403).
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
  const rUsuario = useDelayReasonsReport("usuario", filters, open);
  const rProjeto = useDelayReasonsReport("projeto", filters, open);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-400" />
            Motivos de atraso
          </DialogTitle>
          <DialogDescription>
            Análise dos motivos das tarefas atrasadas — por motivo, por pessoa e
            por projeto.
          </DialogDescription>
        </DialogHeader>

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

        {/* 3 cortes lado a lado */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <RankingColumn title="Por motivo" report={rMotivo} />
          <RankingColumn title="Por pessoa" report={rUsuario} />
          <RankingColumn title="Por projeto" report={rProjeto} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
