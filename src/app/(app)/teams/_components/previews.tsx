"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════
   PREVIEWS — miniaturas usadas nos slides do EmptyState
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

/* ══════════════════════════════════════════════════════════════════
   SLIDES — dados do carrossel do EmptyState
══════════════════════════════════════════════════════════════════ */

export const SLIDES = [
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

/* ══════════════════════════════════════════════════════════════════
   EMPTY STATE — tela exibida quando nao ha times
══════════════════════════════════════════════════════════════════ */

export function EmptyState({ onCreateTeam }: { onCreateTeam: () => void }) {
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
