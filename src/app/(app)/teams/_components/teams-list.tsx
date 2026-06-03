"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  Bell,
  Search,
  LayoutGrid,
  List,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { TeamIconSvg, TEAM_ICONS } from "./team-modals";

/* ══════════════════════════════════════════════════════════════════
   FILTER DROPDOWN — botao generico de filtro estilo topbar
══════════════════════════════════════════════════════════════════ */

/**
 * Botao de filtro generico estilo "topbar" (membros/criado/criador/classificar).
 * Mantem visual igual ao botao antigo + dropdown shadcn/Base UI.
 */
export function FilterDropdown<T extends string>({
  label,
  active,
  options,
  value,
  onChange,
  clearable = false,
}: {
  label: string;
  active: boolean;
  options: { id: T; label: string }[];
  value: T | null;
  onChange: (v: T | null) => void;
  /** Se true, mostra item "Todas" no topo para limpar a selecao. */
  clearable?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            style={{
              height: 28,
              padding: "0 10px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: active ? "var(--border)" : "none",
              cursor: "pointer",
              color: active ? "var(--foreground)" : "var(--muted-foreground)",
              fontSize: 12,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 4,
              maxWidth: 200,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.color = "var(--foreground)";
            }}
            onMouseLeave={(e) => {
              if (!active)
                e.currentTarget.style.color = "var(--muted-foreground)";
            }}
          >
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {label}
            </span>
            <ChevronDown size={11} strokeWidth={2} />
          </button>
        }
      />
      <DropdownMenuContent align="start" sideOffset={6} className="min-w-44">
        <DropdownMenuGroup>
          {clearable && (
            <DropdownMenuItem
              className="text-[13px]"
              onClick={() => onChange(null)}
            >
              <span style={{ flex: 1 }}>Todas</span>
              {value === null && <Check size={13} strokeWidth={2} />}
            </DropdownMenuItem>
          )}
          {options.map((opt) => (
            <DropdownMenuItem
              key={opt.id}
              className="text-[13px]"
              onClick={() => onChange(opt.id)}
            >
              <span style={{ flex: 1 }}>{opt.label}</span>
              {value === opt.id && <Check size={13} strokeWidth={2} />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TEAM CARD — card individual de equipe no grid
══════════════════════════════════════════════════════════════════ */

export function TeamCard({
  team,
  onNotify,
  onClick,
  onEdit,
  onDelete,
}: {
  team: TeamLocal;
  onNotify: (id: string) => void;
  onClick: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const inicial = team.nome.trim().charAt(0).toUpperCase();
  const iconPath = TEAM_ICONS.find((i) => i.name === team.icon)?.path;
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      onClick={() => {
        if (!menuOpen) onClick(team.id);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setMenuOpen(false);
      }}
      style={{
        width: 192,
        borderRadius: 10,
        background: "var(--card)",
        border: `1px solid ${hovered ? "var(--border)" : "var(--border)"}`,
        overflow: "visible",
        cursor: "pointer",
        transition: "border-color .15s",
        position: "relative",
      }}
    >
      {/* preview escuro */}
      <div
        style={{
          height: 110,
          background: "linear-gradient(160deg,#1c1c2e 0%,#111118 100%)",
          position: "relative",
          overflow: "hidden",
          borderRadius: "10px 10px 0 0",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 22,
            left: 16,
            right: 16,
            height: 6,
            borderRadius: 3,
            background: "var(--border)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 36,
            left: 16,
            right: 40,
            height: 6,
            borderRadius: 3,
            background: "var(--border)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 50,
            left: 16,
            right: 28,
            height: 6,
            borderRadius: 3,
            background: "var(--border)",
          }}
        />

        {/* botão ··· — só aparece no hover */}
        {hovered && (
          <button
            type="button"
            aria-label="Opções"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 28,
              height: 28,
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "rgba(20,20,28,0.85)",
              cursor: "pointer",
              color: "var(--foreground)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(4px)",
              zIndex: 2,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(40,40,50,0.95)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(20,20,28,0.85)";
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>
        )}

        {/* dropdown */}
        {menuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: 40,
              right: 8,
              width: 140,
              borderRadius: 8,
              background: "var(--card)",
              border: "1px solid var(--border)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              zIndex: 50,
              overflow: "hidden",
            }}
          >
            {[
              {
                label: "Editar",
                icon: "✏️",
                action: () => {
                  setMenuOpen(false);
                  onEdit(team.id);
                },
              },
              {
                label: "Excluir",
                icon: "🗑️",
                action: () => {
                  setMenuOpen(false);
                  onDelete(team.id);
                },
                danger: true,
              },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  height: 36,
                  padding: "0 12px",
                  border: 0,
                  background: "none",
                  cursor: "pointer",
                  color: item.danger ? "#f87171" : "var(--foreground)",
                  fontSize: 13,
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = item.danger
                    ? "rgba(248,113,113,0.08)"
                    : "var(--border)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                }}
              >
                <span style={{ fontSize: 12 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* rodapé do card */}
      <div style={{ padding: "10px 12px 12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: team.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
                marginTop: -22,
                boxShadow: "0 0 0 3px #1a1a1a",
              }}
            >
              {iconPath ? (
                <TeamIconSvg path={iconPath} size={16} color="#fff" />
              ) : (
                inicial
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--foreground)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {team.nome}
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--muted-foreground)",
                  marginTop: 1,
                }}
              >
                {team.memberCount}{" "}
                {team.memberCount === 1 ? "membro" : "membros"}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Notificações"
            onClick={(e) => {
              e.stopPropagation();
              onNotify(team.id);
            }}
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "none",
              cursor: "pointer",
              color: "var(--muted-foreground)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "color .15s, border-color .15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--foreground)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--muted-foreground)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            <Bell size={13} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TEAM LIST ROW — linha da tabela de equipes
══════════════════════════════════════════════════════════════════ */

export function TeamListRow({
  team,
  onClick,
  onEdit,
  onDelete,
}: {
  team: TeamLocal;
  onClick: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const inicial = team.nome.trim().charAt(0).toUpperCase();
  const iconPath = TEAM_ICONS.find((i) => i.name === team.icon)?.path;

  const criadoFmt = (() => {
    try {
      return new Date(team.criadoEm).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  })();

  return (
    <div
      onClick={() => {
        if (!menuOpen) onClick(team.id);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setMenuOpen(false);
      }}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 120px 160px 80px",
        gap: 12,
        alignItems: "center",
        padding: "10px 16px",
        borderBottom: "1px solid var(--border)",
        cursor: "pointer",
        background: hovered ? "var(--accent)" : "transparent",
        transition: "background .12s",
        position: "relative",
      }}
    >
      {/* nome + avatar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          minWidth: 0,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: team.color,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {iconPath ? (
            <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
              <path d={iconPath} />
            </svg>
          ) : (
            inicial
          )}
        </div>
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--foreground)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {team.nome}
        </span>
      </div>

      <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
        {team.memberCount} {team.memberCount === 1 ? "membro" : "membros"}
      </span>

      <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
        {criadoFmt}
      </span>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 8,
        }}
      >
        {team.myCargo && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: "2px 7px",
              borderRadius: 4,
              background:
                team.myCargo === "LEAD"
                  ? "rgba(37,99,235,0.18)"
                  : "var(--border)",
              color:
                team.myCargo === "LEAD" ? "#60a5fa" : "var(--muted-foreground)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {team.myCargo === "LEAD" ? "Líder" : "Membro"}
          </span>
        )}

        {hovered && (
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label="Opções"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 4,
                    border: "none",
                    background: "transparent",
                    color: "var(--muted-foreground)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    lineHeight: 1,
                  }}
                >
                  ⋯
                </button>
              }
            />
            <DropdownMenuContent
              align="end"
              sideOffset={4}
              className="min-w-32"
            >
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="text-[13px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(team.id);
                  }}
                >
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-[13px] text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(team.id);
                  }}
                >
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TEAMS LIST TABLE — tabela de equipes
══════════════════════════════════════════════════════════════════ */

/**
 * Visualizacao em lista (tabela) das equipes. Mantem as mesmas acoes do
 * card (clicar abre, hover mostra editar/excluir) num formato denso.
 */
export function TeamsListTable({
  teams,
  onTeamClick,
  onEdit,
  onDelete,
}: {
  teams: TeamLocal[];
  onTeamClick: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 8,
        overflow: "hidden",
        background: "var(--card)",
      }}
    >
      {/* header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 120px 160px 80px",
          gap: 12,
          padding: "10px 16px",
          background: "var(--background)",
          borderBottom: "1px solid var(--border)",
          fontSize: 11,
          fontWeight: 600,
          color: "var(--muted-foreground)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        <span>Equipe</span>
        <span>Membros</span>
        <span>Criada em</span>
        <span style={{ textAlign: "right" }}>Papel</span>
      </div>

      {/* rows */}
      {teams.map((team) => (
        <TeamListRow
          key={team.id}
          team={team}
          onClick={onTeamClick}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

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
