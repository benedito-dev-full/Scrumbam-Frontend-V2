"use client";

import { useState, useMemo } from "react";
import { Search, LayoutGrid, List } from "lucide-react";
import type {
  TeamLocal,
  MembrosFilter,
  MembershipFilter,
  CriadoFilter,
  SortBy,
} from "../_lib/teams-local";
import {
  MEMBROS_OPTIONS,
  MEMBERSHIP_OPTIONS,
  CRIADO_OPTIONS,
  SORT_OPTIONS,
  matchMembros,
  matchCriado,
} from "../_lib/teams-local";
import { FilterDropdown } from "./teams-list-filter";
import { TeamCard } from "./teams-list-card";
import { TeamsListTable } from "./teams-list-table";

/* ══════════════════════════════════════════════════════════════════
   TEAMS LIST VIEW — tela com times existentes (grid + filtros)
══════════════════════════════════════════════════════════════════ */

export function TeamsListView({
  teams,
  myTeamIds,
  isAdmin,
  onCreateTeam,
  onTeamClick,
  onEdit,
  onDelete,
}: {
  teams: TeamLocal[];
  myTeamIds: ReadonlySet<string>;
  /** ADMIN vê todos os times + toggle "Sou membro"; membro só vê os seus, sem toggle. */
  isAdmin: boolean;
  onCreateTeam: () => void;
  onTeamClick: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const [membrosFilter, setMembrosFilter] = useState<MembrosFilter | null>(
    null,
  );
  const [membershipFilter, setMembershipFilter] =
    useState<MembershipFilter | null>(null);
  const [criadoFilter, setCriadoFilter] = useState<CriadoFilter | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("nome-asc");

  // Membro comum não escolhe: o filtro "Sou membro" fica sempre ativo (e o
  // dropdown some). Admin controla livremente via `membershipFilter`.
  const effectiveMembership: MembershipFilter | null = isAdmin
    ? membershipFilter
    : "mine";

  const filtered = useMemo(() => {
    let out = teams;
    const q = search.trim().toLowerCase();
    if (q) out = out.filter((t) => t.nome.toLowerCase().includes(q));
    if (membrosFilter)
      out = out.filter((t) => matchMembros(t.memberCount, membrosFilter));
    if (effectiveMembership === "mine")
      out = out.filter((t) => t.myCargo != null || myTeamIds.has(t.id));
    if (criadoFilter)
      out = out.filter((t) => matchCriado(t.criadoEm, criadoFilter));

    const sorted = [...out];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case "nome-asc":
          return a.nome.localeCompare(b.nome, "pt-BR");
        case "nome-desc":
          return b.nome.localeCompare(a.nome, "pt-BR");
        case "criado-desc":
          return (
            new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
          );
        case "criado-asc":
          return (
            new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime()
          );
        case "members-desc":
          return b.memberCount - a.memberCount;
        case "members-asc":
          return a.memberCount - b.memberCount;
      }
    });
    return sorted;
  }, [
    teams,
    search,
    membrosFilter,
    effectiveMembership,
    myTeamIds,
    criadoFilter,
    sortBy,
  ]);

  const membrosLabel =
    MEMBROS_OPTIONS.find((o) => o.id === membrosFilter)?.label ?? "Membros";
  const membershipLabel =
    MEMBERSHIP_OPTIONS.find((o) => o.id === membershipFilter)?.label ??
    "Meus times";
  const criadoLabel =
    CRIADO_OPTIONS.find((o) => o.id === criadoFilter)?.label ?? "Criado";
  const sortLabel =
    SORT_OPTIONS.find((o) => o.id === sortBy)?.label ?? "Classificar";

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* topbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          height: 52,
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <h1
          style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)" }}
        >
          {isAdmin ? "Todas as equipes" : "Minhas equipes"}
        </h1>
        <button
          type="button"
          onClick={onCreateTeam}
          style={{
            height: 30,
            padding: "0 14px",
            borderRadius: 7,
            background: "var(--primary)",
            border: "none",
            cursor: "pointer",
            color: "var(--primary-foreground)",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = "brightness(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = "none";
          }}
        >
          Criar equipe
        </button>
      </div>

      {/* barra de filtros */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          height: 44,
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
          gap: 8,
        }}
      >
        {/* filtros esquerda */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <FilterDropdown
            label={membrosLabel}
            active={!!membrosFilter}
            options={MEMBROS_OPTIONS}
            value={membrosFilter}
            onChange={setMembrosFilter}
            clearable
          />
          {/* Toggle "Sou membro" só para admin — membro já vê apenas os seus times */}
          {isAdmin && (
            <FilterDropdown
              label={membershipLabel}
              active={!!membershipFilter}
              options={MEMBERSHIP_OPTIONS}
              value={membershipFilter}
              onChange={setMembershipFilter}
              clearable
            />
          )}
          <FilterDropdown
            label={criadoLabel}
            active={!!criadoFilter}
            options={CRIADO_OPTIONS}
            value={criadoFilter}
            onChange={setCriadoFilter}
            clearable
          />
          <FilterDropdown
            label={sortLabel}
            active={sortBy !== "nome-asc"}
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={(v) => setSortBy(v ?? "nome-asc")}
          />
        </div>

        {/* direita: pesquisa + toggle view */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {searchOpen ? (
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={() => {
                if (!search) setSearchOpen(false);
              }}
              placeholder="Pesquisar equipe..."
              style={{
                height: 28,
                padding: "0 10px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "var(--border)",
                color: "var(--foreground)",
                fontSize: 12,
                outline: "none",
                width: 180,
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "none",
                cursor: "pointer",
                color: "var(--muted-foreground)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--foreground)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--muted-foreground)";
              }}
            >
              <Search size={13} strokeWidth={1.8} />
            </button>
          )}
          {[
            { mode: "grid" as const, icon: LayoutGrid },
            { mode: "list" as const, icon: List },
          ].map(({ mode, icon: Icon }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: "1px solid",
                borderColor:
                  viewMode === mode ? "var(--border)" : "var(--border)",
                background: viewMode === mode ? "var(--border)" : "none",
                cursor: "pointer",
                color:
                  viewMode === mode
                    ? "var(--foreground)"
                    : "var(--muted-foreground)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={13} strokeWidth={1.8} />
            </button>
          ))}
        </div>
      </div>

      {/* grid de cards */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px" }}>
        {filtered.length === 0 &&
        (search || membrosFilter || membershipFilter || criadoFilter) ? (
          <p style={{ color: "var(--muted-foreground)", fontSize: 13 }}>
            {search
              ? `Nenhuma equipe encontrada para "${search}".`
              : "Nenhuma equipe encontrada com os filtros atuais."}
          </p>
        ) : viewMode === "grid" ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "calc(var(--row-gap) + 6px)",
            }}
          >
            {filtered.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onNotify={() => {}}
                onClick={onTeamClick}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          <TeamsListTable
            teams={filtered}
            onTeamClick={onTeamClick}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
      </div>
    </div>
  );
}
