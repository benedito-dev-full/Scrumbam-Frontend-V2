"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BarChart2, Loader2, Users } from "lucide-react";

import {
  AddMemberPopover,
  TABS,
  TAB_ICONS,
  TabPlaceholder,
  TabVisaoGeral,
  avatarColor,
  getInitials,
  type TabId,
} from "../_components/team-detail-sections";
import { useTeam, useTeamMembers, useTeams } from "@/hooks/use-teams";
import type { TeamResponseDto } from "@/lib/types/api";

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params?.id as string;

  const [activeTab, setActiveTab] = useState<TabId>("visao-geral");
  const [topPopoverOpen, setTopPopoverOpen] = useState(false);
  const addMemberBtnRef = useRef<HTMLButtonElement>(null);

  const { data: team, isLoading, isError } = useTeam(teamId);
  const { data: allTeams = [] } = useTeams();
  const { data: teamMembers = [] } = useTeamMembers(teamId);

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--background)",
        }}
      >
        <Loader2
          size={20}
          strokeWidth={2}
          style={{
            animation: "spin 1s linear infinite",
            color: "var(--muted-foreground)",
          }}
        />
      </div>
    );
  }

  if (isError || !team) {
    return (
      <div
        style={{
          display: "flex",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--background)",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <p style={{ color: "var(--muted-foreground)", fontSize: 14 }}>
          Equipe não encontrada.
        </p>
        <button
          type="button"
          onClick={() => router.push("/teams")}
          style={{
            height: 30,
            padding: "0 14px",
            borderRadius: 7,
            border: "1px solid var(--border)",
            background: "none",
            cursor: "pointer",
            color: "var(--muted-foreground)",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <ArrowLeft size={13} strokeWidth={2} /> Voltar para equipes
        </button>
      </div>
    );
  }

  const teamColor = team.color ?? avatarColor(team.nome);
  const slug = "@" + team.nome.toLowerCase().replace(/\s+/g, "").slice(0, 16);

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        overflow: "hidden",
        background: "var(--background)",
      }}
    >
      {/* sidebar */}
      <aside
        style={{
          width: 260,
          flexShrink: 0,
          borderRight: "1px solid var(--border)",
          background: "var(--card)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 12px",
            height: 44,
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--foreground)",
            }}
          >
            Equipes
          </span>
        </header>
        <div style={{ padding: "8px 6px" }}>
          {[
            {
              label: "Todas as equipes",
              icon: <Users size={14} strokeWidth={1.7} />,
            },
            {
              label: "Dados analíticos",
              icon: <BarChart2 size={14} strokeWidth={1.7} />,
            },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => router.push("/teams")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                height: 34,
                padding: "0 8px",
                borderRadius: 5,
                border: 0,
                cursor: "pointer",
                background: "none",
                color: "var(--muted-foreground)",
                fontSize: 13,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
              }}
            >
              <span style={{ color: "var(--muted-foreground)" }}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}

          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--muted-foreground)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              padding: "12px 8px 6px",
            }}
          >
            Minhas equipes
          </p>

          {allTeams.map((t: TeamResponseDto) => {
            const tc = t.color ?? avatarColor(t.nome);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => router.push(`/teams/${t.id}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  height: 32,
                  padding: "0 8px",
                  borderRadius: 5,
                  border: 0,
                  cursor: "pointer",
                  background: t.id === teamId ? "var(--accent)" : "none",
                  color:
                    t.id === teamId
                      ? "var(--foreground)"
                      : "var(--muted-foreground)",
                  fontSize: 13,
                }}
                onMouseEnter={(e) => {
                  if (t.id !== teamId)
                    e.currentTarget.style.background = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  if (t.id !== teamId)
                    e.currentTarget.style.background = "none";
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: tc,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {getInitials(t.nome)}
                </div>
                <span
                  style={{
                    flex: 1,
                    textAlign: "left",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.nome}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* conteúdo principal */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* header */}
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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: teamColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {getInitials(team.nome)}
            </div>
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--foreground)",
              }}
            >
              {team.nome}
            </span>
            <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
              {slug}
            </span>
          </div>

          <button
            ref={addMemberBtnRef}
            type="button"
            onClick={() => setTopPopoverOpen((v) => !v)}
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
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = "brightness(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "none";
            }}
          >
            Adicionar membro
          </button>
          {topPopoverOpen && (
            <AddMemberPopover
              teamId={teamId}
              currentMembers={teamMembers}
              anchorRef={addMemberBtnRef}
              onClose={() => setTopPopoverOpen(false)}
            />
          )}
        </div>

        {/* abas */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            height: 42,
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
            gap: 2,
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                height: 42,
                padding: "0 12px",
                border: 0,
                background: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 600 : 400,
                color:
                  activeTab === tab.id
                    ? "var(--foreground)"
                    : "var(--muted-foreground)",
                display: "flex",
                alignItems: "center",
                gap: 5,
                borderBottom:
                  activeTab === tab.id
                    ? "2px solid #e4e4e4"
                    : "2px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id)
                  e.currentTarget.style.color = "var(--foreground)";
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id)
                  e.currentTarget.style.color = "var(--muted-foreground)";
              }}
            >
              <span
                style={{
                  color:
                    tab.color ??
                    (activeTab === tab.id
                      ? "var(--foreground)"
                      : "var(--muted-foreground)"),
                }}
              >
                {TAB_ICONS[tab.id]}
              </span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* conteúdo da aba */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {activeTab === "visao-geral" ? (
            <TabVisaoGeral team={team} teamId={teamId} />
          ) : (
            <TabPlaceholder
              label={TABS.find((t) => t.id === activeTab)?.label ?? ""}
            />
          )}
        </div>
      </div>
    </div>
  );
}
