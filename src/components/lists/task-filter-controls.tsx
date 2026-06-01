"use client";

// ─── Controles de filtro da Toolbar da Lista ───────────────────────────────
//
// Renderiza os 3 controles dinâmicos: "Filtro" (painel status/prioridade/
// vencimento), "Fechado" (toggle de ocultar concluídas) e "Responsável"
// (popover pessoas/times). Stateless quanto aos dados — recebe `filters` e
// emite `onChange`. A aplicação real é feita por `applyTaskFilters` no caller.

import React, { useState } from "react";
import {
  IcFilter,
  IcCheck,
  IcUser,
  IcCaret,
  IcSearch,
} from "@/components/lists/icons";
import {
  KANBAN_COLUMNS,
  priorityToColor,
} from "@/lib/mappers/task-status.mapper";
import {
  type TaskFilters,
  type DueFilter,
  UNASSIGNED,
  countPanelFilters,
  countAssigneeFilters,
} from "@/lib/filters/task-filters";
import type { ProjectMemberDto } from "@/hooks/use-members";
import type { TaskPriority, V3Intention } from "@/lib/types/api";

/** Time mínimo necessário para o filtro (subset de TeamResponseDto). */
interface TeamLike {
  id: string;
  nome: string;
  color?: string | null;
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "URGENT", label: "Urgente" },
  { value: "HIGH", label: "Alta" },
  { value: "MEDIUM", label: "Média" },
  { value: "LOW", label: "Baixa" },
];

const DUE_OPTIONS: { value: DueFilter; label: string }[] = [
  { value: "overdue", label: "Vencidas" },
  { value: "today", label: "Hoje" },
  { value: "week", label: "Próximos 7 dias" },
  { value: "none", label: "Sem data" },
];

// ─── Estilos compartilhados ─────────────────────────────────────────────────

const btnBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  height: 28,
  padding: "0 10px",
  border: "1px solid #2a2a32",
  background: "var(--card)",
  borderRadius: 6,
  color: "var(--muted-foreground)",
  fontSize: 13,
  cursor: "pointer",
};

const btnActive: React.CSSProperties = {
  borderColor: "#7c5cff",
  color: "#cfc1ff",
  background: "rgba(124,92,255,0.12)",
};

const popoverStyle: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 4px)",
  right: 0,
  zIndex: 101,
  background: "var(--card)",
  border: "1px solid #2e2e38",
  borderRadius: 10,
  padding: 8,
  minWidth: 240,
  maxHeight: 380,
  overflowY: "auto",
  boxShadow: "0 12px 32px rgba(0,0,0,.6)",
};

const sectionLabel: React.CSSProperties = {
  display: "block",
  padding: "6px 8px 4px",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--muted-foreground)",
};

// ─── Badge de contagem ──────────────────────────────────────────────────────
function CountBadge({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 16,
        height: 16,
        padding: "0 4px",
        borderRadius: 8,
        background: "#7c5cff",
        color: "#fff",
        fontSize: 10,
        fontWeight: 700,
      }}
    >
      {n}
    </span>
  );
}

// ─── Pílula selecionável (status/prioridade/vencimento) ─────────────────────
function Chip({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 10px",
        margin: 3,
        borderRadius: 6,
        border: active ? "1px solid #7c5cff" : "1px solid var(--border)",
        background: active ? "rgba(124,92,255,0.14)" : "transparent",
        color: active ? "#cfc1ff" : "var(--foreground)",
        fontSize: 12,
        cursor: "pointer",
      }}
    >
      {color && (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
          }}
        />
      )}
      {label}
      {active && <IcCheck size={11} />}
    </button>
  );
}

// ─── Item de lista (responsável) ────────────────────────────────────────────
function PersonItem({
  label,
  active,
  onClick,
  avatar,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  avatar?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        padding: "7px 8px",
        borderRadius: 6,
        border: 0,
        background: active ? "rgba(124,92,255,0.14)" : "none",
        color: "var(--foreground)",
        fontSize: 13,
        cursor: "pointer",
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "var(--accent)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "none";
      }}
    >
      {avatar}
      <span style={{ flex: 1 }}>{label}</span>
      {active && <IcCheck size={12} />}
    </button>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────

/**
 * Os 3 controles de filtro da toolbar (Filtro / Fechado / Responsável).
 *
 * @param filters - Estado atual de filtros (controlado pelo caller).
 * @param onChange - Emite o próximo estado de filtros.
 * @param members - Membros do projeto (opções de responsável).
 * @param teams - Times (opções de responsável).
 * @param aiAssigneeId - ID do assignee IA (Claude) para a opção dedicada.
 */
export function TaskFilterControls({
  filters,
  onChange,
  members,
  teams,
  aiAssigneeId,
}: {
  filters: TaskFilters;
  onChange: (next: TaskFilters) => void;
  members: ProjectMemberDto[];
  teams: TeamLike[];
  aiAssigneeId: string;
}) {
  const [open, setOpen] = useState<"filtro" | "responsavel" | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const panelCount = countPanelFilters(filters);
  const assigneeCount = countAssigneeFilters(filters);

  // ── Helpers de toggle (imutáveis) ──
  function toggleInArray<T>(arr: T[], value: T): T[] {
    return arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value];
  }

  // Status no painel usa as 5 colunas Kanban; cada uma agrupa N intentions.
  function isColumnActive(intentions: V3Intention[]): boolean {
    return intentions.every((i) => filters.statuses.includes(i));
  }
  function toggleColumn(intentions: V3Intention[]) {
    const allActive = isColumnActive(intentions);
    const next = allActive
      ? filters.statuses.filter((s) => !intentions.includes(s))
      : Array.from(new Set([...filters.statuses, ...intentions]));
    onChange({ ...filters, statuses: next });
  }

  function togglePriority(p: TaskPriority) {
    onChange({ ...filters, priorities: toggleInArray(filters.priorities, p) });
  }
  function toggleDue(d: DueFilter) {
    onChange({ ...filters, due: filters.due === d ? null : d });
  }
  function toggleAssignee(id: string) {
    onChange({ ...filters, assignees: toggleInArray(filters.assignees, id) });
  }
  function toggleTeam(id: string) {
    onChange({ ...filters, teams: toggleInArray(filters.teams, id) });
  }

  function clearPanel() {
    onChange({ ...filters, statuses: [], priorities: [], due: null });
  }
  function clearAssignee() {
    onChange({ ...filters, assignees: [], teams: [] });
  }

  return (
    <>
      {/* ── Filtro ── */}
      <div style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setOpen((v) => (v === "filtro" ? null : "filtro"))}
          style={{ ...btnBase, ...(panelCount > 0 ? btnActive : {}) }}
        >
          <IcFilter size={13} />
          Filtro
          <CountBadge n={panelCount} />
        </button>
        {open === "filtro" && (
          <>
            <Overlay onClose={() => setOpen(null)} />
            <div style={popoverStyle}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "2px 4px 6px",
                }}
              >
                <span style={{ ...sectionLabel, padding: 0 }}>Filtrar</span>
                {panelCount > 0 && (
                  <button
                    type="button"
                    onClick={clearPanel}
                    style={{
                      background: "none",
                      border: 0,
                      color: "var(--muted-foreground)",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Limpar
                  </button>
                )}
              </div>

              <span style={sectionLabel}>Status</span>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {KANBAN_COLUMNS.map((col) => (
                  <Chip
                    key={col.id}
                    label={col.label}
                    color={col.color}
                    active={isColumnActive(col.intentions)}
                    onClick={() => toggleColumn(col.intentions)}
                  />
                ))}
              </div>

              <span style={sectionLabel}>Prioridade</span>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {PRIORITY_OPTIONS.map((p) => (
                  <Chip
                    key={p.value}
                    label={p.label}
                    color={priorityToColor(p.value)}
                    active={filters.priorities.includes(p.value)}
                    onClick={() => togglePriority(p.value)}
                  />
                ))}
              </div>

              <span style={sectionLabel}>Vencimento</span>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {DUE_OPTIONS.map((d) => (
                  <Chip
                    key={d.value}
                    label={d.label}
                    active={filters.due === d.value}
                    onClick={() => toggleDue(d.value)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Fechado (toggle) ── */}
      <button
        type="button"
        title={
          filters.hideClosed
            ? "Mostrando apenas ativas — clique para incluir concluídas"
            : "Ocultar tarefas concluídas"
        }
        onClick={() =>
          onChange({ ...filters, hideClosed: !filters.hideClosed })
        }
        style={{ ...btnBase, ...(filters.hideClosed ? btnActive : {}) }}
      >
        <IcCheck size={13} />
        Fechado
      </button>

      {/* ── Responsável ── */}
      <div style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() =>
            setOpen((v) => (v === "responsavel" ? null : "responsavel"))
          }
          style={{ ...btnBase, ...(assigneeCount > 0 ? btnActive : {}) }}
        >
          <IcUser size={13} />
          Responsável
          <CountBadge n={assigneeCount} />
          <IcCaret size={10} />
        </button>
        {open === "responsavel" && (
          <>
            <Overlay onClose={() => setOpen(null)} />
            <div style={popoverStyle}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "2px 4px 6px",
                }}
              >
                <span style={{ ...sectionLabel, padding: 0 }}>Responsável</span>
                {assigneeCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAssignee}
                    style={{
                      background: "none",
                      border: 0,
                      color: "var(--muted-foreground)",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Limpar
                  </button>
                )}
              </div>

              <PersonItem
                label="Sem responsável"
                active={filters.assignees.includes(UNASSIGNED)}
                onClick={() => toggleAssignee(UNASSIGNED)}
                avatar={<IcUser size={14} />}
              />
              <PersonItem
                label="Claude (IA)"
                active={filters.assignees.includes(aiAssigneeId)}
                onClick={() => toggleAssignee(aiAssigneeId)}
                avatar={
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "rgba(217,119,87,0.2)",
                      color: "#d97757",
                      fontSize: 10,
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    C
                  </span>
                }
              />

              {members.length > 0 && (
                <>
                  <span style={sectionLabel}>Pessoas</span>
                  {members.map((m) => (
                    <PersonItem
                      key={m.userId}
                      label={m.nome}
                      active={filters.assignees.includes(m.userId)}
                      onClick={() => toggleAssignee(m.userId)}
                      avatar={<Initials nome={m.nome} />}
                    />
                  ))}
                </>
              )}

              {teams.length > 0 && (
                <>
                  <span style={sectionLabel}>Times</span>
                  {teams.map((t) => (
                    <PersonItem
                      key={t.id}
                      label={t.nome}
                      active={filters.teams.includes(t.id)}
                      onClick={() => toggleTeam(t.id)}
                      avatar={
                        <span
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            background: t.color ?? "var(--muted-foreground)",
                            flexShrink: 0,
                          }}
                        />
                      }
                    />
                  ))}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Busca (lupa) ── */}
      {searchOpen ? (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            height: 28,
            padding: "0 8px",
            border: "1px solid #7c5cff",
            background: "var(--card)",
            borderRadius: 6,
          }}
        >
          <IcSearch size={14} />
          <input
            autoFocus
            type="text"
            value={filters.search}
            placeholder="buscar..."
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                onChange({ ...filters, search: "" });
                setSearchOpen(false);
              }
            }}
            onBlur={() => {
              // Recolhe só se vazio — evita "busca ativa escondida".
              if (filters.search.trim() === "") setSearchOpen(false);
            }}
            style={{
              width: 150,
              background: "none",
              border: 0,
              outline: "none",
              color: "var(--foreground)",
              fontSize: 13,
            }}
          />
          <button
            type="button"
            aria-label="Limpar busca"
            title="Limpar busca"
            onClick={() => {
              onChange({ ...filters, search: "" });
              setSearchOpen(false);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 16,
              height: 16,
              padding: 0,
              border: 0,
              background: "none",
              color: "var(--muted-foreground)",
              cursor: "pointer",
              fontSize: 14,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-label="Buscar tarefas"
          title="Buscar tarefas"
          onClick={() => setSearchOpen(true)}
          style={{
            width: 28,
            height: 28,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 6,
            border: filters.search.trim() !== "" ? "1px solid #7c5cff" : 0,
            background:
              filters.search.trim() !== "" ? "rgba(124,92,255,0.12)" : "none",
            color:
              filters.search.trim() !== ""
                ? "#cfc1ff"
                : "var(--muted-foreground)",
            cursor: "pointer",
          }}
        >
          <IcSearch size={15} />
        </button>
      )}
    </>
  );
}

// ─── Overlay invisível para fechar popover ao clicar fora ───────────────────
function Overlay({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100 }}
      onClick={onClose}
    />
  );
}

// ─── Iniciais do nome (avatar fallback) ─────────────────────────────────────
function Initials({ nome }: { nome: string }) {
  const initials = nome
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span
      style={{
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: "var(--accent)",
        color: "#d8ccff",
        fontSize: 9,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {initials}
    </span>
  );
}
