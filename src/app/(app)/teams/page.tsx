"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
import { useCreateTeam, useTeams, useDeleteTeam } from "@/hooks/use-teams";
import { useAuthStore } from "@/lib/stores/auth";

/* ══════════════════════════════════════════════════════════════════
   TIPOS LOCAIS (localStorage — sem backend ainda)
══════════════════════════════════════════════════════════════════ */

interface TeamLocal {
  id: string;
  nome: string;
  memberCount: number;
  color: string;
  icon?: string;
  criadoEm: string;
  /** Papel do usuario logado no time (do TeamResponseDto.myCargo). */
  myCargo?: "LEAD" | "MEMBER" | null;
}

const STORAGE_KEY = "scrumban_teams_proto";

function loadTeams(): TeamLocal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTeams(teams: TeamLocal[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
}

function randomColor() {
  const palette = [
    "#e74c3c",
    "#e67e22",
    "#f1c40f",
    "#2ecc71",
    "#1abc9c",
    "#3498db",
    "#9b59b6",
    "#e91e63",
  ];
  return palette[Math.floor(Math.random() * palette.length)];
}

/* ══════════════════════════════════════════════════════════════════
   EMPTY STATE — tela original preservada intacta
══════════════════════════════════════════════════════════════════ */

function PreviewTimeline() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(160deg,#0d2137 0%,#0a1a2e 100%)",
        borderRadius: 10,
        padding: "14px 16px",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", gap: 0, marginBottom: 10 }}>
        {["", "7", "8", "9", "10", "11"].map((n, i) => (
          <div
            key={i}
            style={{
              flex: i === 0 ? "0 0 60px" : 1,
              textAlign: "center",
              fontSize: 11,
              color: "var(--muted-foreground)",
              fontWeight: 600,
            }}
          >
            {n}
          </div>
        ))}
      </div>
      {[
        { color: "#3b82f6", left: 70, width: 180 },
        { color: "#8b5cf6", left: 120, width: 200 },
        { color: "#06b6d4", left: 70, width: 120 },
        { color: "#3b82f6", left: 180, width: 160 },
      ].map((b, i) => (
        <div
          key={i}
          style={{ position: "relative", height: 18, marginBottom: 8 }}
        >
          <div
            style={{
              position: "absolute",
              left: b.left,
              width: b.width,
              height: 14,
              borderRadius: 4,
              background: b.color,
              opacity: 0.85,
              top: 2,
            }}
          />
        </div>
      ))}
      <div
        style={{
          marginTop: 12,
          borderTop: "1px solid var(--border)",
          paddingTop: 10,
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: "var(--muted-foreground)",
            marginBottom: 6,
          }}
        >
          Members
        </div>
        <div style={{ display: "flex", gap: -4 }}>
          {["#f87171", "#60a5fa", "#34d399", "#a78bfa", "#fb923c"].map(
            (c, i) => (
              <div
                key={i}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: c,
                  border: "2px solid #0a1a2e",
                  marginLeft: i > 0 ? -6 : 0,
                }}
              />
            ),
          )}
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        <div
          style={{
            fontSize: 10,
            color: "var(--muted-foreground)",
            marginBottom: 6,
          }}
        >
          Members online
        </div>
        <div
          style={{
            display: "flex",
            gap: 3,
            alignItems: "flex-end",
            height: 28,
          }}
        >
          {[14, 20, 10, 24, 18, 22, 16].map((h, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: h,
                borderRadius: 2,
                background: "#22c55e",
                opacity: 0.8,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewMembers() {
  const members = [
    {
      name: "Priya Gupta",
      role: "UI designer",
      color: "#f472b6",
      tasks: [
        "4.0 design",
        "Todo page",
        "Chat : Next gen view ch...",
        "Ai creation modal",
        "Update WS picker",
      ],
    },
    {
      name: "Sarah Chang",
      role: "Software Engineer",
      color: "#60a5fa",
      tasks: [
        "DevForge 3.0",
        "TaskFlow Centr...",
        "ChatSphere: Fu...",
        "Innovate Studio",
        "Project Revive",
      ],
    },
    {
      name: "Mei Chen",
      role: "Cloud Solutions Architect",
      color: "#34d399",
      tasks: [],
    },
    {
      name: "Ryan Johnson",
      role: "DevOps Engineer",
      color: "#fb923c",
      tasks: [],
    },
  ];
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(160deg,#1a1040 0%,#120c30 100%)",
        borderRadius: 10,
        padding: "12px",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {members.map((m) => (
          <div
            key={m.name}
            style={{
              background: "var(--border)",
              borderRadius: 8,
              padding: "8px 10px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: m.color,
                  flexShrink: 0,
                }}
              />
              <div>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--foreground)",
                  }}
                >
                  {m.name}
                </p>
                <p style={{ fontSize: 9, color: "var(--muted-foreground)" }}>
                  {m.role}
                </p>
              </div>
            </div>
            {m.tasks.slice(0, 5).map((t, i) => (
              <div
                key={i}
                style={{
                  fontSize: 9,
                  color: "var(--muted-foreground)",
                  padding: "2px 0",
                  borderBottom:
                    i < m.tasks.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                {i + 1}. {t}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewPriorities() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(160deg,#1e0a3c 0%,#160830 100%)",
        borderRadius: 10,
        padding: "12px",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {["Members", "Contact", "Owner"].map((t) => (
          <span
            key={t}
            style={{
              fontSize: 9,
              color: "#a78bfa",
              background: "rgba(167,139,250,0.15)",
              borderRadius: 4,
              padding: "2px 6px",
            }}
          >
            {t}
          </span>
        ))}
      </div>
      {[
        { label: "People", count: "4 members", color: "#8b5cf6" },
        { label: "Design", count: "3 members", color: "#3b82f6" },
        { label: "Sales", count: "2 members", color: "#10b981" },
      ].map((g, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: g.color,
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  color: "var(--foreground)",
                  fontWeight: 600,
                }}
              >
                {g.label}
              </span>
            </div>
            <span style={{ fontSize: 9, color: "var(--muted-foreground)" }}>
              {g.count}
            </span>
          </div>
          <div style={{ display: "flex", gap: -4 }}>
            {[1, 2, 3].map((_, j) => (
              <div
                key={j}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: ["#f472b6", "#60a5fa", "#34d399"][j],
                  border: "2px solid #160830",
                  marginLeft: j > 0 ? -5 : 0,
                }}
              />
            ))}
          </div>
        </div>
      ))}
      <div
        style={{
          marginTop: 8,
          background: "var(--border)",
          borderRadius: 6,
          padding: "6px 8px",
        }}
      >
        <div
          style={{
            fontSize: 9,
            color: "var(--muted-foreground)",
            marginBottom: 4,
          }}
        >
          Analytics
        </div>
        <div
          style={{
            display: "flex",
            gap: 2,
            alignItems: "flex-end",
            height: 20,
          }}
        >
          {[8, 14, 10, 18, 12, 16, 20].map((h, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: h,
                borderRadius: 2,
                background: "#8b5cf6",
                opacity: 0.7,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const SLIDES = [
  {
    title: "Alinhe as equipes e visualize o trabalho delas!",
    desc: "Use a Central de equipes para coordenar equipes, organizar prioridades e entender os detalhes do trabalho delas.",
    featureTitle: "Visão geral de exibições",
    featureDesc:
      "Fornece uma visão geral de exibições permitindo que você se familiarize de cada equipe.",
    preview: <PreviewTimeline />,
  },
  {
    title: "Gestão de equipe e de membros",
    desc: "Navegue, localize e gerencie facilmente todas as equipes e membros em uma central conveniente. Adicione, remova ou atualize funções com facilidade.",
    featureTitle: "Gestão de equipe e de membros",
    featureDesc:
      "Navegue, localize e gerencie facilmente todas as equipes e membros em uma central conveniente.",
    preview: <PreviewMembers />,
  },
  {
    title: "Use as prioridades para sua equipe",
    desc: "Saiba instantaneamente no que a equipe está trabalhando e o que está por vir na agenda delas.",
    featureTitle: "Use as prioridades para sua equipe",
    featureDesc:
      "Saiba instantaneamente no que a equipe está trabalhando e o que está por vir na agenda delas.",
    preview: <PreviewPriorities />,
  },
];

function EmptyState({ onCreateTeam }: { onCreateTeam: () => void }) {
  const [slide, setSlide] = useState(0);
  const total = SLIDES.length;

  const getVisible = () =>
    [-1, 0, 1, 2].map((offset) => {
      const idx = (slide + offset + total) % total;
      return { idx, offset };
    });

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
          padding: "0 24px",
          height: 52,
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <h1
          style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)" }}
        >
          Todas as equipes
        </h1>
        <button
          type="button"
          onClick={onCreateTeam}
          style={{
            height: 32,
            padding: "0 16px",
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
          Criar equipe
        </button>
      </div>

      {/* corpo */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          padding: "0 0 0 48px",
        }}
      >
        <div style={{ flexShrink: 0, width: 408, paddingRight: 40 }}>
          <h2
            style={{
              fontSize: 42,
              fontWeight: 900,
              color: "var(--foreground)",
              lineHeight: 1.08,
              marginBottom: 18,
              letterSpacing: "-0.02em" /* text on light avatar bg */,
            }}
          >
            {SLIDES[slide].title}
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "var(--muted-foreground)",
              lineHeight: 1.65,
              marginBottom: 28,
            }}
          >
            {SLIDES[slide].desc}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              onClick={onCreateTeam}
              style={{
                height: 36,
                padding: "0 20px",
                borderRadius: 7,
                background: "var(--primary)",
                border: "none",
                cursor: "pointer",
                color: "var(--primary-foreground)",
                fontSize: 13,
                fontWeight: 700,
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
            <button
              type="button"
              style={{
                height: 36,
                padding: "0 4px",
                borderRadius: 7,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--muted-foreground)",
                fontSize: 13,
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--foreground)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--muted-foreground)";
              }}
            >
              Procurar pessoas
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          <div
            style={{
              display: "flex",
              gap: 14,
              transform: "translateX(-60px)",
              alignItems: "flex-start",
            }}
          >
            {getVisible().map(({ idx, offset }) => {
              const s = SLIDES[idx];
              const isActive = offset === 0;
              return (
                <div
                  key={`${idx}-${offset}`}
                  style={{
                    flexShrink: 0,
                    width: 340,
                    height: 420,
                    borderRadius: 14,
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    overflow: "hidden",
                    opacity: isActive ? 1 : offset === 1 ? 0.85 : 0.4,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      padding: 12,
                      minHeight: 0,
                      overflow: "hidden",
                    }}
                  >
                    {s.preview}
                  </div>
                  {s.featureTitle && (
                    <div
                      style={{
                        padding: "10px 16px 16px",
                        flexShrink: 0,
                        borderTop: "1px solid var(--border)",
                      }}
                    >
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--foreground)",
                          marginBottom: isActive ? 4 : 0,
                        }}
                      >
                        {s.featureTitle}
                      </p>
                      {isActive && (
                        <p
                          style={{
                            fontSize: 11,
                            color: "var(--muted-foreground)",
                            lineHeight: 1.5,
                          }}
                        >
                          {s.featureDesc}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* controles */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          height: 56,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSlide(i)}
              style={{
                width: i === slide ? 22 : 8,
                height: 8,
                borderRadius: 4,
                border: 0,
                cursor: "pointer",
                padding: 0,
                background: i === slide ? "var(--foreground)" : "var(--accent)",
                transition: "all .2s",
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[
            {
              icon: ChevronLeft,
              fn: () => setSlide((s) => (s - 1 + total) % total),
            },
            { icon: ChevronRight, fn: () => setSlide((s) => (s + 1) % total) },
          ].map(({ icon: Icon, fn }, i) => (
            <button
              key={i}
              type="button"
              onClick={fn}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "1px solid #2a2a2a",
                background: "none",
                cursor: "pointer",
                color: "var(--muted-foreground)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--accent)";
                e.currentTarget.style.color = "var(--foreground)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.color = "var(--muted-foreground)";
              }}
            >
              <Icon size={13} strokeWidth={2} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TEAM CARD — grid de cards quando há times
══════════════════════════════════════════════════════════════════ */

function TeamCard({
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
   TEAMS LIST — tela com times existentes
══════════════════════════════════════════════════════════════════ */

/**
 * Botao de filtro generico estilo "topbar" (membros/criado/criador/classificar).
 * Mantem visual igual ao botao antigo + dropdown shadcn/Base UI.
 */
function FilterDropdown<T extends string>({
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

type MembrosFilter = "1" | "2-5" | "6-20" | "20+";
type CriadoFilter = "today" | "week" | "month" | "year";
type SortBy =
  | "nome-asc"
  | "nome-desc"
  | "criado-desc"
  | "criado-asc"
  | "members-desc"
  | "members-asc";

const MEMBROS_OPTIONS: { id: MembrosFilter; label: string }[] = [
  { id: "1", label: "Apenas 1 membro" },
  { id: "2-5", label: "2 a 5 membros" },
  { id: "6-20", label: "6 a 20 membros" },
  { id: "20+", label: "Mais de 20 membros" },
];
const CRIADO_OPTIONS: { id: CriadoFilter; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "week", label: "Últimos 7 dias" },
  { id: "month", label: "Últimos 30 dias" },
  { id: "year", label: "Último ano" },
];
const SORT_OPTIONS: { id: SortBy; label: string }[] = [
  { id: "nome-asc", label: "Nome (A → Z)" },
  { id: "nome-desc", label: "Nome (Z → A)" },
  { id: "criado-desc", label: "Mais recente primeiro" },
  { id: "criado-asc", label: "Mais antiga primeiro" },
  { id: "members-desc", label: "Mais membros primeiro" },
  { id: "members-asc", label: "Menos membros primeiro" },
];

function matchMembros(count: number, f: MembrosFilter): boolean {
  if (f === "1") return count <= 1;
  if (f === "2-5") return count >= 2 && count <= 5;
  if (f === "6-20") return count >= 6 && count <= 20;
  return count > 20;
}

function matchCriado(criadoEm: string, f: CriadoFilter): boolean {
  const d = new Date(criadoEm).getTime();
  if (isNaN(d)) return false;
  const now = Date.now();
  const days =
    f === "today" ? 1 : f === "week" ? 7 : f === "month" ? 30 : 365;
  return now - d <= days * 24 * 60 * 60 * 1000;
}

function TeamsListView({
  teams,
  onCreateTeam,
  onTeamClick,
  onEdit,
  onDelete,
}: {
  teams: TeamLocal[];
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
  const [criadoFilter, setCriadoFilter] = useState<CriadoFilter | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("nome-asc");

  const filtered = useMemo(() => {
    let out = teams;
    const q = search.trim().toLowerCase();
    if (q) out = out.filter((t) => t.nome.toLowerCase().includes(q));
    if (membrosFilter)
      out = out.filter((t) => matchMembros(t.memberCount, membrosFilter));
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
  }, [teams, search, membrosFilter, criadoFilter, sortBy]);

  const membrosLabel =
    MEMBROS_OPTIONS.find((o) => o.id === membrosFilter)?.label ?? "Membros";
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
          Todas as equipes
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
        {filtered.length === 0 && search ? (
          <p style={{ color: "var(--muted-foreground)", fontSize: 13 }}>
            Nenhuma equipe encontrada para &ldquo;{search}&rdquo;.
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

/**
 * Visualizacao em lista (tabela) das equipes. Mantem as mesmas acoes do
 * card (clicar abre, hover mostra editar/excluir) num formato denso.
 */
function TeamsListTable({
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

function TeamListRow({
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
   MODAL CRIAR EQUIPE
══════════════════════════════════════════════════════════════════ */

const COLOR_PALETTE = [
  "#8b5cf6",
  "#6366f1",
  "#3b82f6",
  "#06b6d4",
  "#22c55e",
  "#eab308",
  "#f97316",
  "#ef4444",
  "#ec4899",
  "#f43f5e",
  "#a3a3a3",
  "#64748b",
];

/* Ícones SVG monocromáticos — paths Lucide */
const TEAM_ICONS: { name: string; path: string }[] = [
  {
    name: "users",
    path: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  },
  {
    name: "rocket",
    path: "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z",
  },
  {
    name: "star",
    path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  },
  { name: "zap", path: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
  { name: "shield", path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
  {
    name: "target",
    path: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  },
  { name: "code", path: "M16 18l6-6-6-6M8 6l-6 6 6 6" },
  { name: "bar-chart", path: "M18 20V10M12 20V4M6 20v-6" },
  {
    name: "globe",
    path: "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
  },
  {
    name: "wrench",
    path: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  },
  {
    name: "layers",
    path: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  },
  {
    name: "briefcase",
    path: "M20 7H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2",
  },
  { name: "trending-up", path: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" },
  {
    name: "settings",
    path: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  },
  {
    name: "flag",
    path: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7",
  },
  {
    name: "cpu",
    path: "M18 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM9 9h6v6H9zM9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3",
  },
  {
    name: "package",
    path: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12",
  },
  {
    name: "heart",
    path: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  },
  {
    name: "lock",
    path: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4",
  },
  {
    name: "message",
    path: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  },
  {
    name: "database",
    path: "M12 2C6.48 2 2 4.24 2 7v10c0 2.76 4.48 5 10 5s10-2.24 10-5V7c0-2.76-4.48-5-10-5zM2 12c0 2.76 4.48 5 10 5s10-2.24 10-5M2 7c0 2.76 4.48 5 10 5s10-2.24 10-5",
  },
  {
    name: "compass",
    path: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z",
  },
  {
    name: "award",
    path: "M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.21 13.89L7 23l5-3 5 3-1.21-9.12",
  },
  { name: "map", path: "M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4zM8 2v16M16 6v16" },
  {
    name: "box",
    path: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
  },
  {
    name: "book",
    path: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z",
  },
  {
    name: "camera",
    path: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  },
  { name: "activity", path: "M22 12h-4l-3 9L9 3l-3 9H2" },
  { name: "cloud", path: "M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" },
  { name: "terminal", path: "M4 17l6-6-6-6M12 19h8" },
  {
    name: "git-branch",
    path: "M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9",
  },
  {
    name: "layout",
    path: "M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM3 9h18M9 21V9",
  },
  {
    name: "mail",
    path: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  },
  {
    name: "phone",
    path: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  },
  {
    name: "search",
    path: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35",
  },
  {
    name: "home",
    path: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  },
  {
    name: "printer",
    path: "M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z",
  },
  {
    name: "wifi",
    path: "M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01",
  },
  {
    name: "bell",
    path: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  },
  {
    name: "user",
    path: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  },
  {
    name: "edit",
    path: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  },
  {
    name: "trash",
    path: "M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6",
  },
  {
    name: "link",
    path: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  },
  {
    name: "eye",
    path: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  },
  { name: "filter", path: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z" },
  {
    name: "copy",
    path: "M20 9H11a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
  },
  {
    name: "upload",
    path: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  },
  {
    name: "download",
    path: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  },
  {
    name: "maximize",
    path: "M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3",
  },
  { name: "grid", path: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" },
  { name: "list", path: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" },
  { name: "minus", path: "M5 12h14" },
  { name: "plus", path: "M12 5v14M5 12h14" },
  { name: "check", path: "M20 6L9 17l-5-5" },
  { name: "x", path: "M18 6L6 18M6 6l12 12" },
  {
    name: "info",
    path: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01",
  },
  {
    name: "alert",
    path: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  },
  {
    name: "help",
    path: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01",
  },
  {
    name: "tag",
    path: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
  },
  {
    name: "bookmark",
    path: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z",
  },
  {
    name: "calendar",
    path: "M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18",
  },
  {
    name: "clock",
    path: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  },
  {
    name: "refresh",
    path: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  },
  {
    name: "share",
    path: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13",
  },
  { name: "send", path: "M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" },
  {
    name: "paper-clip",
    path: "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48",
  },
  {
    name: "image",
    path: "M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21",
  },
  {
    name: "video",
    path: "M22.54 6.42a2.78 2.78 0 0 0-1.95-1.95C18.88 4 12 4 12 4s-6.88 0-8.59.47a2.78 2.78 0 0 0-1.95 1.95A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z",
  },
];

interface CreateTeamPayloadLocal {
  nome: string;
  color: string;
  icon: string;
}

function TeamIconSvg({
  path,
  size = 16,
  color = "currentColor",
}: {
  path: string;
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}

function CreateTeamModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (p: CreateTeamPayloadLocal) => void;
}) {
  const [nome, setNome] = useState("");
  const [color, setColor] = useState(COLOR_PALETTE[2]);
  const [icon, setIcon] = useState(TEAM_ICONS[0].name);
  const [panelOpen, setPanelOpen] = useState(false);
  const [colorDropOpen, setColorDropOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedIcon = TEAM_ICONS.find((i) => i.name === icon) ?? TEAM_ICONS[0];
  const filteredIcons = search.trim()
    ? TEAM_ICONS.filter((i) => i.name.includes(search.toLowerCase()))
    : TEAM_ICONS;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nome.trim();
    if (!trimmed) return;
    onCreate({ nome: trimmed, color, icon });
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.55)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
        // fecha sub-dropdowns ao clicar fora
        if (colorDropOpen) setColorDropOpen(false);
        if (panelOpen) setPanelOpen(false);
      }}
    >
      <div
        style={{
          width: 460,
          borderRadius: 12,
          background: "var(--card)",
          border: "1px solid var(--border)",
          padding: "28px 28px 24px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--foreground)",
            marginBottom: 6,
          }}
        >
          Criar equipe
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "var(--muted-foreground)",
            marginBottom: 20,
            lineHeight: 1.5,
          }}
        >
          Uma equipe representa um grupo de pessoas com espaços e configurações
          próprias.
        </p>

        <form onSubmit={handleSubmit}>
          <p
            style={{
              fontSize: 12,
              color: "var(--muted-foreground)",
              fontWeight: 500,
              marginBottom: 8,
            }}
          >
            Ícone e nome
          </p>

          {/* linha: avatar-botão + input nome */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: panelOpen ? 0 : 20,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setPanelOpen((v) => !v);
                setColorDropOpen(false);
              }}
              style={{
                flexShrink: 0,
                width: 42,
                height: 42,
                borderRadius: 8,
                background: color,
                border: panelOpen
                  ? "2px solid var(--border)"
                  : "2px solid transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "border-color .15s",
              }}
            >
              <TeamIconSvg path={selectedIcon.path} size={22} color="#fff" />
            </button>

            <input
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="por exemplo, marketing, engenharia, RH"
              style={{
                flex: 1,
                height: 42,
                padding: "0 14px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--border)",
                color: "var(--foreground)",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            />
          </div>

          {/* painel de ícones — sem aba de cor, cor é sub-dropdown */}
          {panelOpen && (
            <div
              style={{
                marginTop: 2,
                marginBottom: 20,
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--card)",
                overflow: "visible",
              }}
            >
              {/* cabeçalho fixo da aba ícone */}
              <div
                style={{
                  display: "flex",
                  borderBottom: "1px solid var(--border)",
                  padding: "0 10px",
                }}
              >
                <div
                  style={{
                    height: 38,
                    display: "flex",
                    alignItems: "center",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--foreground)",
                    borderBottom: "2px solid #e4e4e4",
                    paddingBottom: 0,
                  }}
                >
                  Ícone
                </div>
              </div>

              <div style={{ padding: "10px 10px 12px" }}>
                {/* barra pesquisa + bolinha cor (sub-dropdown) */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 10,
                    position: "relative",
                  }}
                >
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Pesquisar..."
                    style={{
                      flex: 1,
                      height: 30,
                      padding: "0 10px",
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                      background: "var(--border)",
                      color: "var(--foreground)",
                      fontSize: 12,
                      outline: "none",
                    }}
                  />

                  {/* bolinha cor — abre sub-dropdown flutuante */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setColorDropOpen((v) => !v);
                      }}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        border: "2px solid var(--border)",
                        background: color,
                        cursor: "pointer",
                        display: "block",
                      }}
                    />

                    {colorDropOpen && (
                      <div
                        style={{
                          position: "absolute",
                          top: 30,
                          right: 0,
                          zIndex: 10,
                          background: "var(--accent)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          padding: "10px",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 6,
                          width: 168,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {COLOR_PALETTE.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              setColor(c);
                              setColorDropOpen(false);
                            }}
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: "50%",
                              background: c,
                              border: "2px solid",
                              borderColor: color === c ? "#fff" : "transparent",
                              cursor: "pointer",
                              transition: "border-color .1s",
                              boxShadow:
                                color === c ? `0 0 0 1px ${c}` : "none",
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* grid de ícones SVG — selecionar NÃO fecha painel */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(11, 1fr)",
                    gap: 0,
                    maxHeight: 196,
                    overflowY: "auto",
                  }}
                >
                  {filteredIcons.map((opt) => (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => setIcon(opt.name)}
                      title={opt.name}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 4,
                        border: "none",
                        background:
                          icon === opt.name ? "var(--border)" : "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color:
                          icon === opt.name
                            ? "var(--foreground)"
                            : "var(--muted-foreground)",
                        transition: "background .1s, color .1s",
                      }}
                      onMouseEnter={(e) => {
                        if (icon !== opt.name) {
                          e.currentTarget.style.background = "var(--border)";
                          e.currentTarget.style.color = "var(--foreground)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (icon !== opt.name) {
                          e.currentTarget.style.background = "none";
                          e.currentTarget.style.color =
                            "var(--muted-foreground)";
                        }
                      }}
                    >
                      <TeamIconSvg
                        path={opt.path}
                        size={16}
                        color="currentColor"
                      />
                    </button>
                  ))}
                </div>

                {/* botão confirmar seleção */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 10,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setPanelOpen(false)}
                    style={{
                      height: 28,
                      padding: "0 14px",
                      borderRadius: 6,
                      border: "none",
                      background: "var(--border)",
                      cursor: "pointer",
                      color: "var(--foreground)",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--border)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--border)";
                    }}
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                height: 34,
                padding: "0 16px",
                borderRadius: 7,
                border: "1px solid var(--border)",
                background: "none",
                cursor: "pointer",
                color: "var(--muted-foreground)",
                fontSize: 13,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--foreground)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--muted-foreground)";
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!nome.trim()}
              style={{
                height: 34,
                padding: "0 20px",
                borderRadius: 7,
                border: "none",
                background: nome.trim() ? "var(--foreground)" : "var(--accent)",
                cursor: nome.trim() ? "pointer" : "not-allowed",
                color: nome.trim()
                  ? "var(--primary-foreground)"
                  : "var(--muted-foreground)",
                fontSize: 13,
                fontWeight: 600,
                transition: "all .15s",
              }}
            >
              Criar equipe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MODAL EDITAR EQUIPE
══════════════════════════════════════════════════════════════════ */

function EditTeamModal({
  team,
  onClose,
  onSave,
}: {
  team: TeamLocal;
  onClose: () => void;
  onSave: (id: string, nome: string) => void;
}) {
  const [nome, setNome] = useState(team.nome);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nome.trim();
    if (!trimmed || trimmed === team.nome) {
      onClose();
      return;
    }
    onSave(team.id, trimmed);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.55)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: 420,
          borderRadius: 12,
          background: "var(--card)",
          border: "1px solid var(--border)",
          padding: "28px 28px 24px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--foreground)",
            marginBottom: 6,
          }}
        >
          Editar equipe
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "var(--muted-foreground)",
            marginBottom: 20,
            lineHeight: 1.5,
          }}
        >
          Altere o nome da equipe.
        </p>
        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: "var(--muted-foreground)",
              marginBottom: 6,
            }}
          >
            Nome da equipe
          </label>
          <input
            autoFocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome da equipe..."
            style={{
              width: "100%",
              height: 38,
              padding: "0 12px",
              borderRadius: 7,
              border: "1px solid var(--border)",
              background: "var(--border)",
              color: "var(--foreground)",
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 20,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                height: 34,
                padding: "0 16px",
                borderRadius: 7,
                border: "1px solid var(--border)",
                background: "none",
                cursor: "pointer",
                color: "var(--muted-foreground)",
                fontSize: 13,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--foreground)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--muted-foreground)";
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!nome.trim()}
              style={{
                height: 34,
                padding: "0 20px",
                borderRadius: 7,
                border: "none",
                background: nome.trim() ? "var(--foreground)" : "var(--accent)",
                cursor: nome.trim() ? "pointer" : "not-allowed",
                color: nome.trim()
                  ? "var(--primary-foreground)"
                  : "var(--muted-foreground)",
                fontSize: 13,
                fontWeight: 600,
                transition: "all .15s",
              }}
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MODAL CONFIRMAR EXCLUSÃO
══════════════════════════════════════════════════════════════════ */

function DeleteTeamModal({
  team,
  onClose,
  onConfirm,
  isDeleting,
}: {
  team: TeamLocal;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div
        style={{
          width: 420,
          borderRadius: 12,
          background: "var(--card)",
          border: "1px solid var(--border)",
          padding: "28px 28px 24px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        {/* ícone */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: "rgba(248,113,113,0.1)",
            border: "1px solid rgba(248,113,113,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f87171"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </div>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--foreground)",
            marginBottom: 8,
          }}
        >
          Excluir &ldquo;{team.nome}&rdquo;?
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "var(--muted-foreground)",
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          Esta ação não pode ser desfeita. Todos os membros serão removidos e o
          time será excluído permanentemente.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            style={{
              height: 34,
              padding: "0 16px",
              borderRadius: 7,
              border: "1px solid var(--border)",
              background: "none",
              cursor: isDeleting ? "not-allowed" : "pointer",
              color: "var(--muted-foreground)",
              fontSize: 13,
              opacity: isDeleting ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isDeleting)
                e.currentTarget.style.color = "var(--foreground)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--muted-foreground)";
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              height: 34,
              padding: "0 20px",
              borderRadius: 7,
              border: "none",
              background: isDeleting ? "#7f1d1d" : "#ef4444",
              cursor: isDeleting ? "not-allowed" : "pointer",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              transition: "background .15s",
              minWidth: 100,
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) e.currentTarget.style.background = "#dc2626";
            }}
            onMouseLeave={(e) => {
              if (!isDeleting) e.currentTarget.style.background = "#ef4444";
            }}
          >
            {isDeleting ? "Excluindo..." : "Sim, excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ALL PEOPLE VIEW — aba "Todas as pessoas"
══════════════════════════════════════════════════════════════════ */

interface PersonMock {
  id: string;
  nome: string;
  online: boolean;
}

type PeopleFilter = "status" | "equipe" | "tipo" | "gerente" | "classificar";

function AllPeopleView({ pessoas }: { pessoas: PersonMock[] }) {
  const [activeFilter, setActiveFilter] = useState<PeopleFilter | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filters: { id: PeopleFilter; label: string }[] = [
    { id: "status", label: "Status" },
    { id: "equipe", label: "Equipe" },
    { id: "tipo", label: "Tipo de conta" },
    { id: "gerente", label: "Gerente" },
    { id: "classificar", label: "Classificar" },
  ];

  const filtered = search.trim()
    ? pessoas.filter((p) => p.nome.toLowerCase().includes(search.toLowerCase()))
    : pessoas;

  const getIniciais = (nome: string) =>
    nome
      .trim()
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

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
          Todas as pessoas
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            style={{
              height: 30,
              padding: "0 14px",
              borderRadius: 7,
              border: "1px solid var(--border)",
              background: "none",
              cursor: "pointer",
              color: "var(--foreground)",
              fontSize: 13,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--foreground)";
            }}
          >
            <svg
              width={13}
              height={13}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Exportar
          </button>
          <button
            type="button"
            style={{
              height: 30,
              padding: "0 14px",
              borderRadius: 7,
              border: "none",
              background: "var(--primary)",
              cursor: "pointer",
              color: "var(--primary-foreground)",
              fontSize: 13,
              fontWeight: 600,
              transition: "filter 120ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = "brightness(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "none";
            }}
          >
            Convidar
          </button>
        </div>
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
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() =>
                setActiveFilter(activeFilter === f.id ? null : f.id)
              }
              style={{
                height: 28,
                padding: "0 10px",
                borderRadius: 6,
                border: "1px solid",
                borderColor:
                  activeFilter === f.id ? "var(--border)" : "var(--border)",
                background: activeFilter === f.id ? "var(--border)" : "none",
                cursor: "pointer",
                color:
                  activeFilter === f.id
                    ? "var(--foreground)"
                    : "var(--muted-foreground)",
                fontSize: 12,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "all .15s",
              }}
              onMouseEnter={(e) => {
                if (activeFilter !== f.id) {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--foreground)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeFilter !== f.id) {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--muted-foreground)";
                }
              }}
            >
              {f.label} <ChevronDown size={11} strokeWidth={2} />
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {searchOpen ? (
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={() => {
                if (!search) setSearchOpen(false);
              }}
              placeholder="Pesquisar pessoa..."
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
          {(
            [
              { mode: "grid" as const, icon: LayoutGrid },
              { mode: "list" as const, icon: List },
            ] as const
          ).map(({ mode, icon: Icon }) => (
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

      {/* grid de pessoas */}
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {filtered.length === 0 && search ? (
          <p style={{ color: "var(--muted-foreground)", fontSize: 13 }}>
            Nenhuma pessoa encontrada para &ldquo;{search}&rdquo;.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "calc(var(--row-gap) + 6px)",
            }}
          >
            {filtered.map((p) => (
              <div
                key={p.id}
                style={{
                  width: 148,
                  borderRadius: 10,
                  background: "var(--accent)",
                  border: "1px solid var(--border)",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "border-color .15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "var(--border)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "var(--border)";
                }}
              >
                {/* avatar grande */}
                <div
                  style={{
                    height: 148,
                    background: "var(--muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 36,
                      fontWeight: 800,
                      color: "var(--foreground)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {getIniciais(p.nome)}
                  </span>
                </div>
                {/* nome + dot */}
                <div
                  style={{
                    padding: "10px 12px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--foreground)",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.nome}
                  </span>
                  {p.online && (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#22c55e",
                        flexShrink: 0,
                        boxShadow: "0 0 0 2px #1e1e1e",
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SIDEBAR
══════════════════════════════════════════════════════════════════ */

type SidebarView = "equipes" | "pessoas";

function TeamsPanel({
  teams,
  onTeamClick,
  activeView,
  onViewChange,
}: {
  teams: TeamLocal[];
  onTeamClick?: (id: string) => void;
  activeView: SidebarView;
  onViewChange: (v: SidebarView) => void;
}) {
  const navItems: {
    id: SidebarView | null;
    label: string;
    badge?: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "equipes",
      label: "Todas as equipes",
      badge: teams.length > 0 ? String(teams.length) : undefined,
      icon: (
        <svg
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: "pessoas",
      label: "Todas as pessoas",
      badge: "1",
      icon: (
        <svg
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20v-2a8 8 0 0 1 16 0v2" />
        </svg>
      ),
    },
    {
      id: null,
      label: "Dados analíticos",
      icon: (
        <svg
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
  ];

  return (
    <>
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
          style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}
        >
          Equipes
        </span>
        <div style={{ display: "flex", gap: 2 }}>
          {[Plus, ChevronDown].map((Icon, i) => (
            <button
              key={i}
              type="button"
              style={{
                width: 24,
                height: 24,
                borderRadius: 5,
                border: 0,
                background: "none",
                cursor: "pointer",
                color: "var(--muted-foreground)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--secondary)";
                e.currentTarget.style.color = "var(--foreground)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.color = "var(--muted-foreground)";
              }}
            >
              <Icon size={13} strokeWidth={2} />
            </button>
          ))}
        </div>
      </header>

      <div style={{ padding: "8px 6px" }}>
        {navItems.map((item) => {
          const isActive = item.id !== null && activeView === item.id;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => item.id && onViewChange(item.id)}
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
                textAlign: "left",
                background: isActive ? "var(--accent)" : "none",
                color: isActive
                  ? "var(--foreground)"
                  : "var(--muted-foreground)",
                fontSize: 13,
                fontWeight: isActive ? 500 : 400,
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  e.currentTarget.style.background = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "none";
              }}
            >
              <span
                style={{
                  color: isActive
                    ? "var(--foreground)"
                    : "var(--muted-foreground)",
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--muted-foreground)",
                    background: "var(--accent)",
                    borderRadius: 4,
                    padding: "0 5px",
                    lineHeight: "18px",
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

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

        {teams.length === 0 ? (
          <div
            style={{
              margin: "0 2px",
              padding: "16px 10px",
              borderRadius: 8,
              border: "1px dashed #282828",
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 4,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 5,
                  background: "#f59e0b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                A
              </div>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 5,
                  background: "#8b5cf6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                B
              </div>
            </div>
            <p
              style={{
                fontSize: 11,
                color: "var(--muted-foreground)",
                lineHeight: 1.6,
              }}
            >
              Depois de entrar ou criar uma
              <br />
              equipe, você a verá aqui
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {teams.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onTeamClick?.(t.id)}
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
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: t.color,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {t.nome.charAt(0).toUpperCase()}
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
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
══════════════════════════════════════════════════════════════════ */

export default function TeamsPage() {
  const [localTeams, setLocalTeams] = useState<TeamLocal[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TeamLocal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeamLocal | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [activeView, setActiveView] = useState<SidebarView>("equipes");
  const [toast, setToast] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);
  const router = useRouter();
  const createTeam = useCreateTeam();
  const deleteTeam = useDeleteTeam();
  const user = useAuthStore((s) => s.user);
  const { data: apiTeams } = useTeams();

  // Mock de pessoas — apenas o usuário logado por enquanto
  const mockPessoas: PersonMock[] = user
    ? [{ id: user.entidadeId, nome: user.name, online: true }]
    : [];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalTeams(loadTeams());
    setHydrated(true);
  }, []);

  // Quando o banco responde, sincroniza localStorage com os ids reais
  useEffect(() => {
    if (!apiTeams) return;
    const merged: TeamLocal[] = apiTeams.map((t) => {
      const existing = localTeams.find(
        (l) => l.id === t.id || l.nome === t.nome,
      );
      return {
        id: t.id,
        nome: t.nome,
        memberCount: t.memberCount ?? 1,
        color: t.color ?? existing?.color ?? randomColor(),
        icon: t.icon ?? existing?.icon,
        criadoEm: t.criadoEm,
        myCargo: t.myCargo ?? null,
      };
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalTeams(merged);
    saveTeams(merged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiTeams]);

  // teams exibidos: banco (quando disponível) ou localStorage
  const teams = localTeams;

  const showToast = (msg: string, type: "error" | "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  const handleCreate = async ({
    nome,
    color,
    icon,
  }: CreateTeamPayloadLocal) => {
    if (!user?.organizationId) {
      showToast("Nenhuma organização ativa. Faça login novamente.", "error");
      return;
    }

    try {
      const created = await createTeam.mutateAsync({ nome, color, icon });
      const novo: TeamLocal = {
        id: created.id,
        nome: created.nome,
        memberCount: created.memberCount ?? 1,
        color: created.color ?? color,
        icon: created.icon ?? icon,
        criadoEm: created.criadoEm,
      };
      const updated = [...localTeams, novo];
      setLocalTeams(updated);
      saveTeams(updated);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status === 401) {
        showToast(
          "Sessão expirada. Saia e entre novamente para criar equipes.",
          "error",
        );
      } else {
        showToast(
          "Falha ao criar equipe. Verifique sua conexão e tente novamente.",
          "error",
        );
      }
    }
  };

  const handleTeamClick = (id: string) => {
    router.push(`/teams/${id}`);
  };

  const handleEdit = (id: string) => {
    const team = localTeams.find((t) => t.id === id);
    if (team) setEditTarget(team);
  };

  const handleEditSave = (id: string, novoNome: string) => {
    const updated = localTeams.map((t) =>
      t.id === id ? { ...t, nome: novoNome } : t,
    );
    setLocalTeams(updated);
    saveTeams(updated);
  };

  const handleDelete = (id: string) => {
    const team = localTeams.find((t) => t.id === id);
    if (team) setDeleteTarget(team);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;

    // Remove localmente de imediato
    const updated = localTeams.filter((t) => t.id !== id);
    setLocalTeams(updated);
    saveTeams(updated);

    // Persiste no banco se o id é real (não temporário)
    if (user?.organizationId) {
      try {
        await deleteTeam.mutateAsync(id);
      } catch {
        // silencia — já foi removido do localStorage
      }
    }

    setDeleteTarget(null);
  };

  // Evita flash de conteúdo errado no SSR
  if (!hydrated) return null;

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
        <TeamsPanel
          teams={teams}
          onTeamClick={handleTeamClick}
          activeView={activeView}
          onViewChange={setActiveView}
        />
      </aside>

      {/* conteúdo principal */}
      {activeView === "pessoas" ? (
        <AllPeopleView pessoas={mockPessoas} />
      ) : teams.length === 0 ? (
        <EmptyState onCreateTeam={() => setModalOpen(true)} />
      ) : (
        <TeamsListView
          teams={teams}
          onCreateTeam={() => setModalOpen(true)}
          onTeamClick={handleTeamClick}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {modalOpen && (
        <CreateTeamModal
          onClose={() => setModalOpen(false)}
          onCreate={handleCreate}
        />
      )}

      {editTarget && (
        <EditTeamModal
          team={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleEditSave}
        />
      )}

      {deleteTarget && (
        <DeleteTeamModal
          team={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          isDeleting={deleteTeam.isPending}
        />
      )}

      {/* Toast de feedback */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: toast.type === "error" ? "#2d1414" : "#142d14",
            border: `1px solid ${toast.type === "error" ? "#c0392b" : "#27ae60"}`,
            borderRadius: 8,
            padding: "12px 18px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            color: toast.type === "error" ? "#f87171" : "#4ade80",
            fontSize: 13,
            fontWeight: 500,
            maxWidth: 420,
            textAlign: "center",
          }}
        >
          <span>{toast.type === "error" ? "⚠" : "✓"}</span>
          <span>{toast.msg}</span>
          <button
            onClick={() => setToast(null)}
            style={{
              marginLeft: 8,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "inherit",
              opacity: 0.6,
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
