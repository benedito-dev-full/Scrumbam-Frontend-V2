"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TeamLocal } from "../_lib/teams-local";
import { TEAM_ICONS } from "./team-modals";

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

