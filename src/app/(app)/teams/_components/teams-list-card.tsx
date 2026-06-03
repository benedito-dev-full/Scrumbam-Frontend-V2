"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import type { TeamLocal } from "../_lib/teams-local";
import { TeamIconSvg, TEAM_ICONS } from "./team-modals";

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

