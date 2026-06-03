"use client";

import { useEffect, useRef, useState } from "react";
import { BarChart2, BookmarkIcon, Plus } from "lucide-react";

import { useUpdateTeam } from "@/hooks/use-teams";
import type { TeamResponseDto } from "@/lib/types/api";
import { FeedPanel } from "./team-feed-panel";
import { MembersPanel } from "./team-members-panel";

export function TabVisaoGeral({
  team,
  teamId,
}: {
  team: TeamResponseDto;
  teamId: string;
}) {
  const updateTeam = useUpdateTeam(teamId);
  const [descricao, setDescricao] = useState(team.description ?? "");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sincroniza se o dado da API mudar
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDescricao(team.description ?? "");
  }, [team.description]);

  const handleDescricao = (v: string) => {
    setDescricao(v);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateTeam.mutate({ description: v });
    }, 800);
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        flex: 1,
        overflow: "hidden",
        padding: "16px 20px",
        minHeight: 0,
      }}
    >
      {/* coluna principal */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          overflowY: "auto",
          minWidth: 0,
        }}
      >
        {/* descrição */}
        <div
          style={{
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--card)",
            overflow: "hidden",
          }}
        >
          <textarea
            value={descricao}
            onChange={(e) => handleDescricao(e.target.value)}
            placeholder="Adicione a descrição, informações e wiki da equipe"
            style={{
              width: "100%",
              minHeight: 80,
              padding: "14px 16px",
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--muted-foreground)",
              fontSize: 13,
              resize: "none",
              lineHeight: 1.6,
              boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* favoritos */}
        <div
          style={{
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--card)",
            padding: "16px 18px",
          }}
        >
          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--foreground)",
              marginBottom: 28,
            }}
          >
            Favoritos
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              padding: "12px 0 20px",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <BookmarkIcon
                size={22}
                strokeWidth={1.4}
                color="var(--muted-foreground)"
              />
              <div
                style={{
                  position: "absolute",
                  bottom: -4,
                  right: -4,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  border: "2px solid #161616",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus
                  size={10}
                  strokeWidth={2.5}
                  color="var(--muted-foreground)"
                />
              </div>
            </div>
            <p
              style={{
                fontSize: 12,
                color: "var(--muted-foreground)",
                textAlign: "center",
                maxWidth: 320,
                lineHeight: 1.6,
              }}
            >
              Os favoritos facilitam salvar itens da sua workspace ou qualquer
              URL da web.
            </p>
            <button
              type="button"
              style={{
                height: 28,
                padding: "0 14px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "none",
                cursor: "pointer",
                color: "var(--foreground)",
                fontSize: 12,
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--border)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
              }}
            >
              Adicionar favorito
            </button>
          </div>
        </div>

        {/* feed */}
        <FeedPanel teamId={teamId} />
      </div>

      {/* coluna direita */}
      <div
        style={{
          width: 280,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          overflowY: "auto",
        }}
      >
        <MembersPanel teamId={teamId} />

        {/* análises */}
        <div
          style={{
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--card)",
            padding: "14px 16px",
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--foreground)",
              marginBottom: 16,
            }}
          >
            Análises da equipe
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: "8px 0 12px",
            }}
          >
            <BarChart2
              size={20}
              strokeWidth={1.4}
              color="var(--muted-foreground)"
            />
            <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
              Não há dados suficientes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ABAS PLACEHOLDER
══════════════════════════════════════════════════════════════════ */

export function TabPlaceholder({ label }: { label: string }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <p style={{ color: "var(--muted-foreground)", fontSize: 14 }}>
        {label} — em breve
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PÁGINA /teams/[id]
══════════════════════════════════════════════════════════════════ */

