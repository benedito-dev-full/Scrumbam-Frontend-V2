"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, ChevronDown, ChevronLeft, ChevronRight, Bell, Search, LayoutGrid, List } from "lucide-react";
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
    "#e74c3c", "#e67e22", "#f1c40f", "#2ecc71",
    "#1abc9c", "#3498db", "#9b59b6", "#e91e63",
  ];
  return palette[Math.floor(Math.random() * palette.length)];
}

/* ══════════════════════════════════════════════════════════════════
   EMPTY STATE — tela original preservada intacta
══════════════════════════════════════════════════════════════════ */

function PreviewTimeline() {
  return (
    <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg,#0d2137 0%,#0a1a2e 100%)", borderRadius: 10, padding: "14px 16px", overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 0, marginBottom: 10 }}>
        {["","7","8","9","10","11"].map((n, i) => (
          <div key={i} style={{ flex: i === 0 ? "0 0 60px" : 1, textAlign: "center", fontSize: 11, color: "#4a8db5", fontWeight: 600 }}>{n}</div>
        ))}
      </div>
      {[
        { color: "#3b82f6", left: 70, width: 180 },
        { color: "#8b5cf6", left: 120, width: 200 },
        { color: "#06b6d4", left: 70, width: 120 },
        { color: "#3b82f6", left: 180, width: 160 },
      ].map((b, i) => (
        <div key={i} style={{ position: "relative", height: 18, marginBottom: 8 }}>
          <div style={{ position: "absolute", left: b.left, width: b.width, height: 14, borderRadius: 4, background: b.color, opacity: 0.85, top: 2 }} />
        </div>
      ))}
      <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 10 }}>
        <div style={{ fontSize: 10, color: "#4a8db5", marginBottom: 6 }}>Members</div>
        <div style={{ display: "flex", gap: -4 }}>
          {["#f87171","#60a5fa","#34d399","#a78bfa","#fb923c"].map((c, i) => (
            <div key={i} style={{ width: 20, height: 20, borderRadius: "50%", background: c, border: "2px solid #0a1a2e", marginLeft: i > 0 ? -6 : 0 }} />
          ))}
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 10, color: "#4a8db5", marginBottom: 6 }}>Members online</div>
        <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 28 }}>
          {[14,20,10,24,18,22,16].map((h, i) => (
            <div key={i} style={{ flex: 1, height: h, borderRadius: 2, background: "#22c55e", opacity: 0.8 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewMembers() {
  const members = [
    { name: "Priya Gupta",  role: "UI designer",             color: "#f472b6",
      tasks: ["4.0 design","Todo page","Chat : Next gen view ch...","Ai creation modal","Update WS picker"] },
    { name: "Sarah Chang",  role: "Software Engineer",        color: "#60a5fa",
      tasks: ["DevForge 3.0","TaskFlow Centr...","ChatSphere: Fu...","Innovate Studio","Project Revive"] },
    { name: "Mei Chen",     role: "Cloud Solutions Architect", color: "#34d399", tasks: [] },
    { name: "Ryan Johnson", role: "DevOps Engineer",           color: "#fb923c", tasks: [] },
  ];
  return (
    <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg,#1a1040 0%,#120c30 100%)", borderRadius: 10, padding: "12px", overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {members.map((m) => (
          <div key={m.name} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#e4e4e4" }}>{m.name}</p>
                <p style={{ fontSize: 9, color: "#666" }}>{m.role}</p>
              </div>
            </div>
            {m.tasks.slice(0, 5).map((t, i) => (
              <div key={i} style={{ fontSize: 9, color: "#888", padding: "2px 0", borderBottom: i < m.tasks.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
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
    <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg,#1e0a3c 0%,#160830 100%)", borderRadius: 10, padding: "12px", overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {["Members","Contact","Owner"].map(t => (
          <span key={t} style={{ fontSize: 9, color: "#a78bfa", background: "rgba(167,139,250,0.15)", borderRadius: 4, padding: "2px 6px" }}>{t}</span>
        ))}
      </div>
      {[
        { label: "People", count: "4 members", color: "#8b5cf6" },
        { label: "Design",  count: "3 members", color: "#3b82f6" },
        { label: "Sales",   count: "2 members", color: "#10b981" },
      ].map((g, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: g.color }} />
              <span style={{ fontSize: 10, color: "#c4c4c4", fontWeight: 600 }}>{g.label}</span>
            </div>
            <span style={{ fontSize: 9, color: "#555" }}>{g.count}</span>
          </div>
          <div style={{ display: "flex", gap: -4 }}>
            {[1,2,3].map((_, j) => (
              <div key={j} style={{ width: 16, height: 16, borderRadius: "50%", background: ["#f472b6","#60a5fa","#34d399"][j], border: "2px solid #160830", marginLeft: j > 0 ? -5 : 0 }} />
            ))}
          </div>
        </div>
      ))}
      <div style={{ marginTop: 8, background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "6px 8px" }}>
        <div style={{ fontSize: 9, color: "#666", marginBottom: 4 }}>Analytics</div>
        <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 20 }}>
          {[8,14,10,18,12,16,20].map((h, i) => (
            <div key={i} style={{ flex: 1, height: h, borderRadius: 2, background: "#8b5cf6", opacity: 0.7 }} />
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
    featureDesc: "Fornece uma visão geral de exibições permitindo que você se familiarize de cada equipe.",
    preview: <PreviewTimeline />,
  },
  {
    title: "Gestão de equipe e de membros",
    desc: "Navegue, localize e gerencie facilmente todas as equipes e membros em uma central conveniente. Adicione, remova ou atualize funções com facilidade.",
    featureTitle: "Gestão de equipe e de membros",
    featureDesc: "Navegue, localize e gerencie facilmente todas as equipes e membros em uma central conveniente.",
    preview: <PreviewMembers />,
  },
  {
    title: "Use as prioridades para sua equipe",
    desc: "Saiba instantaneamente no que a equipe está trabalhando e o que está por vir na agenda delas.",
    featureTitle: "Use as prioridades para sua equipe",
    featureDesc: "Saiba instantaneamente no que a equipe está trabalhando e o que está por vir na agenda delas.",
    preview: <PreviewPriorities />,
  },
];

function EmptyState({ onCreateTeam }: { onCreateTeam: () => void }) {
  const [slide, setSlide] = useState(0);
  const total = SLIDES.length;

  const getVisible = () => [-1, 0, 1, 2].map(offset => {
    const idx = (slide + offset + total) % total;
    return { idx, offset };
  });

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* topbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 52, borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: "#e4e4e4" }}>Todas as equipes</h1>
        <button type="button" onClick={onCreateTeam} style={{ height: 32, padding: "0 16px", borderRadius: 7, background: "#e4e4e4", border: "none", cursor: "pointer", color: "#111", fontSize: 13, fontWeight: 600 }}
          onMouseEnter={e => { e.currentTarget.style.background = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#e4e4e4"; }}>
          Criar equipe
        </button>
      </div>

      {/* corpo */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", overflow: "hidden", padding: "0 0 0 48px" }}>
        <div style={{ flexShrink: 0, width: 408, paddingRight: 40 }}>
          <h2 style={{ fontSize: 42, fontWeight: 900, color: "#e4e4e4", lineHeight: 1.08, marginBottom: 18, letterSpacing: "-0.02em" }}>
            {SLIDES[slide].title}
          </h2>
          <p style={{ fontSize: 14, color: "#777", lineHeight: 1.65, marginBottom: 28 }}>
            {SLIDES[slide].desc}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button type="button" onClick={onCreateTeam} style={{ height: 36, padding: "0 20px", borderRadius: 7, background: "#e4e4e4", border: "none", cursor: "pointer", color: "#111", fontSize: 13, fontWeight: 700 }}
              onMouseEnter={e => { e.currentTarget.style.background = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#e4e4e4"; }}>
              Criar equipe
            </button>
            <button type="button" style={{ height: 36, padding: "0 4px", borderRadius: 7, background: "none", border: "none", cursor: "pointer", color: "#777", fontSize: 13, fontWeight: 500 }}
              onMouseEnter={e => { e.currentTarget.style.color = "#c4c4c4"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#777"; }}>
              Procurar pessoas
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          <div style={{ display: "flex", gap: 14, transform: "translateX(-60px)", alignItems: "flex-start" }}>
            {getVisible().map(({ idx, offset }) => {
              const s = SLIDES[idx];
              const isActive = offset === 0;
              return (
                <div key={`${idx}-${offset}`} style={{ flexShrink: 0, width: 340, height: 420, borderRadius: 14, background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", opacity: isActive ? 1 : offset === 1 ? 0.85 : 0.4, display: "flex", flexDirection: "column" }}>
                  <div style={{ flex: 1, padding: 12, minHeight: 0, overflow: "hidden" }}>{s.preview}</div>
                  {s.featureTitle && (
                    <div style={{ padding: "10px 16px 16px", flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e4", marginBottom: isActive ? 4 : 0 }}>{s.featureTitle}</p>
                      {isActive && <p style={{ fontSize: 11, color: "#666", lineHeight: 1.5 }}>{s.featureDesc}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* controles */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, height: 56, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {SLIDES.map((_, i) => (
            <button key={i} type="button" onClick={() => setSlide(i)} style={{ width: i === slide ? 22 : 8, height: 8, borderRadius: 4, border: 0, cursor: "pointer", padding: 0, background: i === slide ? "#c4c4c4" : "#2a2a2a", transition: "all .2s" }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { icon: ChevronLeft,  fn: () => setSlide(s => (s - 1 + total) % total) },
            { icon: ChevronRight, fn: () => setSlide(s => (s + 1) % total) },
          ].map(({ icon: Icon, fn }, i) => (
            <button key={i} type="button" onClick={fn} style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid #2a2a2a", background: "none", cursor: "pointer", color: "#666", display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#1e1e1e"; e.currentTarget.style.color = "#c4c4c4"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#666"; }}>
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
  const iconEmoji = ICON_OPTIONS.find(i => i.name === team.icon)?.emoji;
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      onClick={() => { if (!menuOpen) onClick(team.id); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
      style={{
        width: 192,
        borderRadius: 10,
        background: "#1a1a1a",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)"}`,
        overflow: "visible",
        cursor: "pointer",
        transition: "border-color .15s",
        position: "relative",
      }}
    >
      {/* preview escuro */}
      <div style={{ height: 110, background: "linear-gradient(160deg,#1c1c2e 0%,#111118 100%)", position: "relative", overflow: "hidden", borderRadius: "10px 10px 0 0" }}>
        <div style={{ position: "absolute", top: 22, left: 16, right: 16, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", top: 36, left: 16, right: 40, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "absolute", top: 50, left: 16, right: 28, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.03)" }} />

        {/* botão ··· — só aparece no hover */}
        {hovered && (
          <button
            type="button"
            aria-label="Opções"
            onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
            style={{
              position: "absolute", top: 8, right: 8,
              width: 28, height: 28, borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(20,20,28,0.85)",
              cursor: "pointer", color: "#c4c4c4",
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(4px)",
              zIndex: 2,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(40,40,50,0.95)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(20,20,28,0.85)"; }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
            </svg>
          </button>
        )}

        {/* dropdown */}
        {menuOpen && (
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: "absolute", top: 40, right: 8,
              width: 140, borderRadius: 8,
              background: "#1e1e22", border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              zIndex: 50, overflow: "hidden",
            }}
          >
            {[
              { label: "Editar", icon: "✏️", action: () => { setMenuOpen(false); onEdit(team.id); } },
              { label: "Excluir", icon: "🗑️", action: () => { setMenuOpen(false); onDelete(team.id); }, danger: true },
            ].map(item => (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  width: "100%", height: 36, padding: "0 12px",
                  border: 0, background: "none", cursor: "pointer",
                  color: item.danger ? "#f87171" : "#c4c4c4",
                  fontSize: 13, textAlign: "left",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = item.danger ? "rgba(248,113,113,0.08)" : "rgba(255,255,255,0.05)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
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
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: team.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: iconEmoji ? 16 : 14, fontWeight: 700, color: "#fff", flexShrink: 0,
              marginTop: -22, boxShadow: "0 0 0 3px #1a1a1a",
            }}>
              {iconEmoji ?? inicial}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e4", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {team.nome}
              </p>
              <p style={{ fontSize: 11, color: "#555", marginTop: 1 }}>
                {team.memberCount} {team.memberCount === 1 ? "membro" : "membros"}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Notificações"
            onClick={e => { e.stopPropagation(); onNotify(team.id); }}
            style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "none", cursor: "pointer", color: "#555", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "color .15s, border-color .15s" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#c4c4c4"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#555"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
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

type FilterId = "membros" | "criado" | "criador" | "classificar";

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
  const [activeFilter, setActiveFilter] = useState<FilterId | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const filtered = search.trim()
    ? teams.filter(t => t.nome.toLowerCase().includes(search.toLowerCase()))
    : teams;

  const filters: { id: FilterId; label: string }[] = [
    { id: "membros",    label: "Membros" },
    { id: "criado",     label: "Criado" },
    { id: "criador",    label: "Criador" },
    { id: "classificar",label: "Classificar" },
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* topbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 52, borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <h1 style={{ fontSize: 15, fontWeight: 700, color: "#e4e4e4" }}>Todas as equipes</h1>
        <button type="button" onClick={onCreateTeam} style={{ height: 30, padding: "0 14px", borderRadius: 7, background: "#e4e4e4", border: "none", cursor: "pointer", color: "#111", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}
          onMouseEnter={e => { e.currentTarget.style.background = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#e4e4e4"; }}>
          Criar equipe
        </button>
      </div>

      {/* barra de filtros */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 44, borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0, gap: 8 }}>
        {/* filtros esquerda */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {filters.map(f => (
            <button key={f.id} type="button"
              onClick={() => setActiveFilter(activeFilter === f.id ? null : f.id)}
              style={{
                height: 28, padding: "0 10px", borderRadius: 6, border: "1px solid",
                borderColor: activeFilter === f.id ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
                background: activeFilter === f.id ? "rgba(255,255,255,0.06)" : "none",
                cursor: "pointer", color: activeFilter === f.id ? "#e4e4e4" : "#777",
                fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 4,
                transition: "all .15s",
              }}
              onMouseEnter={e => { if (activeFilter !== f.id) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; e.currentTarget.style.color = "#c4c4c4"; }}}
              onMouseLeave={e => { if (activeFilter !== f.id) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#777"; }}}
            >
              {f.label}
              <ChevronDown size={11} strokeWidth={2} />
            </button>
          ))}
        </div>

        {/* direita: pesquisa + toggle view */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {searchOpen ? (
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              onBlur={() => { if (!search) setSearchOpen(false); }}
              placeholder="Pesquisar equipe..."
              style={{ height: 28, padding: "0 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "#e4e4e4", fontSize: 12, outline: "none", width: 180 }}
            />
          ) : (
            <button type="button" onClick={() => setSearchOpen(true)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "none", cursor: "pointer", color: "#666", display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#c4c4c4"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#666"; }}>
              <Search size={13} strokeWidth={1.8} />
            </button>
          )}
          {[
            { mode: "grid" as const, icon: LayoutGrid },
            { mode: "list" as const, icon: List },
          ].map(({ mode, icon: Icon }) => (
            <button key={mode} type="button" onClick={() => setViewMode(mode)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid", borderColor: viewMode === mode ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)", background: viewMode === mode ? "rgba(255,255,255,0.06)" : "none", cursor: "pointer", color: viewMode === mode ? "#e4e4e4" : "#555", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={13} strokeWidth={1.8} />
            </button>
          ))}
        </div>
      </div>

      {/* grid de cards */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px" }}>
        {filtered.length === 0 && search ? (
          <p style={{ color: "#555", fontSize: 13 }}>Nenhuma equipe encontrada para "{search}".</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            {filtered.map(team => (
              <TeamCard key={team.id} team={team} onNotify={() => {}} onClick={onTeamClick} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MODAL CRIAR EQUIPE
══════════════════════════════════════════════════════════════════ */

/* paleta de cores e lista de ícones disponíveis para seleção */
const COLOR_PALETTE = [
  "#ef4444","#f97316","#eab308","#22c55e",
  "#14b8a6","#3b82f6","#8b5cf6","#ec4899",
  "#64748b","#06b6d4","#a3e635","#f43f5e",
];

const ICON_OPTIONS: { name: string; emoji: string }[] = [
  { name: "users",       emoji: "👥" },
  { name: "rocket",      emoji: "🚀" },
  { name: "star",        emoji: "⭐" },
  { name: "lightning",   emoji: "⚡" },
  { name: "fire",        emoji: "🔥" },
  { name: "diamond",     emoji: "💎" },
  { name: "target",      emoji: "🎯" },
  { name: "shield",      emoji: "🛡️" },
  { name: "code",        emoji: "💻" },
  { name: "chart",       emoji: "📊" },
  { name: "megaphone",   emoji: "📣" },
  { name: "wrench",      emoji: "🔧" },
  { name: "palette",     emoji: "🎨" },
  { name: "globe",       emoji: "🌐" },
  { name: "lock",        emoji: "🔒" },
  { name: "heart",       emoji: "❤️" },
];

interface CreateTeamPayloadLocal {
  nome: string;
  color: string;
  icon: string;
}

function CreateTeamModal({ onClose, onCreate }: { onClose: () => void; onCreate: (p: CreateTeamPayloadLocal) => void }) {
  const [nome, setNome] = useState("");
  const [color, setColor] = useState(COLOR_PALETTE[5]); // azul padrão
  const [icon, setIcon] = useState(ICON_OPTIONS[0].name);
  const [colorOpen, setColorOpen] = useState(false);
  const [iconOpen, setIconOpen] = useState(false);

  const selectedIcon = ICON_OPTIONS.find(i => i.name === icon) ?? ICON_OPTIONS[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nome.trim();
    if (!trimmed) return;
    onCreate({ nome: trimmed, color, icon });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)" }}
      onClick={e => { if (e.target === e.currentTarget) { onClose(); } }}>
      <div style={{ width: 440, borderRadius: 12, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", padding: "28px 28px 24px", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#e4e4e4", marginBottom: 6 }}>Criar equipe</h2>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 20, lineHeight: 1.5 }}>
          Escolha um ícone, uma cor e dê um nome para sua nova equipe.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 8 }}>Nome da equipe</label>

          {/* linha: ícone + cor + input */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>

            {/* botão ícone */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <button type="button" onClick={() => { setIconOpen(v => !v); setColorOpen(false); }}
                title="Escolher ícone"
                style={{ width: 38, height: 38, borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color .15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}>
                {selectedIcon.emoji}
              </button>

              {/* dropdown ícones */}
              {iconOpen && (
                <div style={{ position: "absolute", top: 44, left: 0, zIndex: 10, background: "#252528", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, width: 168 }}>
                  {ICON_OPTIONS.map(opt => (
                    <button key={opt.name} type="button"
                      onClick={() => { setIcon(opt.name); setIconOpen(false); }}
                      style={{ width: 36, height: 36, borderRadius: 6, border: "1px solid", borderColor: icon === opt.name ? "rgba(255,255,255,0.3)" : "transparent", background: icon === opt.name ? "rgba(255,255,255,0.08)" : "none", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .1s" }}
                      onMouseEnter={e => { if (icon !== opt.name) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                      onMouseLeave={e => { if (icon !== opt.name) e.currentTarget.style.background = "none"; }}>
                      {opt.emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* botão cor */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <button type="button" onClick={() => { setColorOpen(v => !v); setIconOpen(false); }}
                title="Escolher cor"
                style={{ width: 38, height: 38, borderRadius: 7, border: "2px solid rgba(255,255,255,0.15)", background: color, cursor: "pointer", transition: "border-color .15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }} />

              {/* dropdown cores */}
              {colorOpen && (
                <div style={{ position: "absolute", top: 44, left: 0, zIndex: 10, background: "#252528", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, width: 148 }}>
                  {COLOR_PALETTE.map(c => (
                    <button key={c} type="button"
                      onClick={() => { setColor(c); setColorOpen(false); }}
                      style={{ width: 28, height: 28, borderRadius: 6, border: "2px solid", borderColor: color === c ? "#fff" : "transparent", background: c, cursor: "pointer", transition: "border-color .1s" }} />
                  ))}
                </div>
              )}
            </div>

            {/* input nome */}
            <input
              autoFocus
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Backend, Marketing, Design..."
              style={{ flex: 1, height: 38, padding: "0 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "#e4e4e4", fontSize: 13, outline: "none" }}
            />
          </div>

          {/* preview */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
              {selectedIcon.emoji}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: nome.trim() ? "#e4e4e4" : "#444" }}>
              {nome.trim() || "Nome da equipe"}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
            <button type="button" onClick={onClose}
              style={{ height: 34, padding: "0 16px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "none", cursor: "pointer", color: "#888", fontSize: 13 }}
              onMouseEnter={e => { e.currentTarget.style.color = "#e4e4e4"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#888"; }}>
              Cancelar
            </button>
            <button type="submit" disabled={!nome.trim()}
              style={{ height: 34, padding: "0 20px", borderRadius: 7, border: "none", background: nome.trim() ? "#e4e4e4" : "#2a2a2a", cursor: nome.trim() ? "pointer" : "not-allowed", color: nome.trim() ? "#111" : "#555", fontSize: 13, fontWeight: 600, transition: "all .15s" }}>
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

function EditTeamModal({ team, onClose, onSave }: { team: TeamLocal; onClose: () => void; onSave: (id: string, nome: string) => void }) {
  const [nome, setNome] = useState(team.nome);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nome.trim();
    if (!trimmed || trimmed === team.nome) { onClose(); return; }
    onSave(team.id, trimmed);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 420, borderRadius: 12, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", padding: "28px 28px 24px", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#e4e4e4", marginBottom: 6 }}>Editar equipe</h2>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 20, lineHeight: 1.5 }}>
          Altere o nome da equipe.
        </p>
        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 6 }}>Nome da equipe</label>
          <input
            autoFocus
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Nome da equipe..."
            style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "#e4e4e4", fontSize: 13, outline: "none", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
            <button type="button" onClick={onClose} style={{ height: 34, padding: "0 16px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "none", cursor: "pointer", color: "#888", fontSize: 13 }}
              onMouseEnter={e => { e.currentTarget.style.color = "#e4e4e4"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#888"; }}>
              Cancelar
            </button>
            <button type="submit" disabled={!nome.trim()} style={{ height: 34, padding: "0 20px", borderRadius: 7, border: "none", background: nome.trim() ? "#e4e4e4" : "#2a2a2a", cursor: nome.trim() ? "pointer" : "not-allowed", color: nome.trim() ? "#111" : "#555", fontSize: 13, fontWeight: 600, transition: "all .15s" }}>
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

function DeleteTeamModal({ team, onClose, onConfirm, isDeleting }: { team: TeamLocal; onClose: () => void; onConfirm: () => void; isDeleting: boolean }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)" }}
      onClick={e => { if (e.target === e.currentTarget && !isDeleting) onClose(); }}>
      <div style={{ width: 420, borderRadius: 12, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", padding: "28px 28px 24px", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
        {/* ícone */}
        <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#e4e4e4", marginBottom: 8 }}>
          Excluir &ldquo;{team.nome}&rdquo;?
        </h2>
        <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6, marginBottom: 24 }}>
          Esta ação não pode ser desfeita. Todos os membros serão removidos e o time será excluído permanentemente.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" onClick={onClose} disabled={isDeleting}
            style={{ height: 34, padding: "0 16px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "none", cursor: isDeleting ? "not-allowed" : "pointer", color: "#888", fontSize: 13, opacity: isDeleting ? 0.5 : 1 }}
            onMouseEnter={e => { if (!isDeleting) e.currentTarget.style.color = "#e4e4e4"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#888"; }}>
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} disabled={isDeleting}
            style={{ height: 34, padding: "0 20px", borderRadius: 7, border: "none", background: isDeleting ? "#7f1d1d" : "#ef4444", cursor: isDeleting ? "not-allowed" : "pointer", color: "#fff", fontSize: 13, fontWeight: 600, transition: "background .15s", minWidth: 100 }}
            onMouseEnter={e => { if (!isDeleting) e.currentTarget.style.background = "#dc2626"; }}
            onMouseLeave={e => { if (!isDeleting) e.currentTarget.style.background = "#ef4444"; }}>
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
    { id: "status",      label: "Status" },
    { id: "equipe",      label: "Equipe" },
    { id: "tipo",        label: "Tipo de conta" },
    { id: "gerente",     label: "Gerente" },
    { id: "classificar", label: "Classificar" },
  ];

  const filtered = search.trim()
    ? pessoas.filter(p => p.nome.toLowerCase().includes(search.toLowerCase()))
    : pessoas;

  const getIniciais = (nome: string) =>
    nome.trim().split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* topbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 52, borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <h1 style={{ fontSize: 15, fontWeight: 700, color: "#e4e4e4" }}>Todas as pessoas</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button type="button" style={{ height: 30, padding: "0 14px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "none", cursor: "pointer", color: "#c4c4c4", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#c4c4c4"; }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Exportar
          </button>
          <button type="button" style={{ height: 30, padding: "0 14px", borderRadius: 7, border: "none", background: "#e4e4e4", cursor: "pointer", color: "#111", fontSize: 13, fontWeight: 600 }}
            onMouseEnter={e => { e.currentTarget.style.background = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#e4e4e4"; }}>
            Convidar
          </button>
        </div>
      </div>

      {/* barra de filtros */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 44, borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {filters.map(f => (
            <button key={f.id} type="button"
              onClick={() => setActiveFilter(activeFilter === f.id ? null : f.id)}
              style={{
                height: 28, padding: "0 10px", borderRadius: 6, border: "1px solid",
                borderColor: activeFilter === f.id ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
                background: activeFilter === f.id ? "rgba(255,255,255,0.06)" : "none",
                cursor: "pointer", color: activeFilter === f.id ? "#e4e4e4" : "#777",
                fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 4, transition: "all .15s",
              }}
              onMouseEnter={e => { if (activeFilter !== f.id) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; e.currentTarget.style.color = "#c4c4c4"; }}}
              onMouseLeave={e => { if (activeFilter !== f.id) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#777"; }}}>
              {f.label} <ChevronDown size={11} strokeWidth={2} />
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {searchOpen ? (
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              onBlur={() => { if (!search) setSearchOpen(false); }}
              placeholder="Pesquisar pessoa..."
              style={{ height: 28, padding: "0 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "#e4e4e4", fontSize: 12, outline: "none", width: 180 }} />
          ) : (
            <button type="button" onClick={() => setSearchOpen(true)}
              style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "none", cursor: "pointer", color: "#666", display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#c4c4c4"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#666"; }}>
              <Search size={13} strokeWidth={1.8} />
            </button>
          )}
          {([
            { mode: "grid" as const, icon: LayoutGrid },
            { mode: "list" as const, icon: List },
          ] as const).map(({ mode, icon: Icon }) => (
            <button key={mode} type="button" onClick={() => setViewMode(mode)}
              style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid", borderColor: viewMode === mode ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)", background: viewMode === mode ? "rgba(255,255,255,0.06)" : "none", cursor: "pointer", color: viewMode === mode ? "#e4e4e4" : "#555", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={13} strokeWidth={1.8} />
            </button>
          ))}
        </div>
      </div>

      {/* grid de pessoas */}
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {filtered.length === 0 && search ? (
          <p style={{ color: "#555", fontSize: 13 }}>Nenhuma pessoa encontrada para "{search}".</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            {filtered.map(p => (
              <div key={p.id} style={{ width: 148, borderRadius: 10, background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", cursor: "pointer", transition: "border-color .15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.18)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)"; }}>
                {/* avatar grande */}
                <div style={{ height: 148, background: "#e8e8e8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: "#111", letterSpacing: "-0.02em" }}>
                    {getIniciais(p.nome)}
                  </span>
                </div>
                {/* nome + dot */}
                <div style={{ padding: "10px 12px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e4", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.nome}
                  </span>
                  {p.online && (
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", flexShrink: 0, boxShadow: "0 0 0 2px #1e1e1e" }} />
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
  const navItems: { id: SidebarView | null; label: string; badge?: string; icon: React.ReactNode }[] = [
    {
      id: "equipes",
      label: "Todas as equipes",
      badge: teams.length > 0 ? String(teams.length) : undefined,
      icon: (
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      id: "pessoas",
      label: "Todas as pessoas",
      badge: "1",
      icon: (
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4"/><path d="M4 20v-2a8 8 0 0 1 16 0v2"/>
        </svg>
      ),
    },
    {
      id: null,
      label: "Dados analíticos",
      icon: (
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      ),
    },
  ];

  return (
    <>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", height: 44, borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e4" }}>Equipes</span>
        <div style={{ display: "flex", gap: 2 }}>
          {[Plus, ChevronDown].map((Icon, i) => (
            <button key={i} type="button" style={{ width: 24, height: 24, borderRadius: 5, border: 0, background: "none", cursor: "pointer", color: "#606068", display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#222"; e.currentTarget.style.color = "#c0c0c4"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#606068"; }}>
              <Icon size={13} strokeWidth={2} />
            </button>
          ))}
        </div>
      </header>

      <div style={{ padding: "8px 6px" }}>
        {navItems.map((item) => {
          const isActive = item.id !== null && activeView === item.id;
          return (
            <button key={item.label} type="button"
              onClick={() => item.id && onViewChange(item.id)}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", height: 34, padding: "0 8px", borderRadius: 5, border: 0, cursor: "pointer", textAlign: "left", background: isActive ? "#202022" : "none", color: isActive ? "#e4e4e4" : "#888892", fontSize: 13, fontWeight: isActive ? 500 : 400 }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#1a1a1c"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "none"; }}>
              <span style={{ color: isActive ? "#c0c0c4" : "#505058", flexShrink: 0 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{ fontSize: 11, color: "#606068", background: "#202022", borderRadius: 4, padding: "0 5px", lineHeight: "18px" }}>{item.badge}</span>
              )}
            </button>
          );
        })}

        <p style={{ fontSize: 11, fontWeight: 600, color: "#505058", textTransform: "uppercase", letterSpacing: "0.06em", padding: "12px 8px 6px" }}>
          Minhas equipes
        </p>

        {teams.length === 0 ? (
          <div style={{ margin: "0 2px", padding: "16px 10px", borderRadius: 8, border: "1px dashed #282828", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: 5, background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>A</div>
              <div style={{ width: 22, height: 22, borderRadius: 5, background: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>B</div>
            </div>
            <p style={{ fontSize: 11, color: "#505058", lineHeight: 1.6 }}>Depois de entrar ou criar uma<br />equipe, você a verá aqui</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {teams.map(t => (
              <button key={t.id} type="button" onClick={() => onTeamClick?.(t.id)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", height: 32, padding: "0 8px", borderRadius: 5, border: 0, cursor: "pointer", background: "none", color: "#888892", fontSize: 13 }}
                onMouseEnter={e => { e.currentTarget.style.background = "#1a1a1c"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: t.color, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff" }}>
                  {t.nome.charAt(0).toUpperCase()}
                </div>
                <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.nome}</span>
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
    setLocalTeams(loadTeams());
    setHydrated(true);
  }, []);

  // Quando o banco responde, sincroniza localStorage com os ids reais
  useEffect(() => {
    if (!apiTeams) return;
    const merged: TeamLocal[] = apiTeams.map((t) => {
      const existing = localTeams.find((l) => l.id === t.id || l.nome === t.nome);
      return {
        id: t.id,
        nome: t.nome,
        memberCount: t.memberCount ?? 1,
        color: t.color ?? existing?.color ?? randomColor(),
        icon: t.icon ?? existing?.icon,
        criadoEm: t.criadoEm,
      };
    });
    setLocalTeams(merged);
    saveTeams(merged);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiTeams]);

  // teams exibidos: banco (quando disponível) ou localStorage
  const teams = localTeams;

  const handleCreate = async ({ nome, color, icon }: CreateTeamPayloadLocal) => {
    const tempId = Date.now().toString();
    const novo: TeamLocal = {
      id: tempId,
      nome,
      memberCount: 1,
      color,
      icon,
      criadoEm: new Date().toISOString(),
    };
    const updated = [...localTeams, novo];
    setLocalTeams(updated);
    saveTeams(updated);

    if (user?.organizationId) {
      try {
        const created = await createTeam.mutateAsync({ nome, color, icon });
        const withRealId = updated.map(t =>
          t.id === tempId ? { ...t, id: created.id, color: created.color ?? color } : t
        );
        setLocalTeams(withRealId);
        saveTeams(withRealId);
      } catch {
        // mantém no localStorage se falhar
      }
    }
  };

  const handleTeamClick = (id: string) => {
    router.push(`/teams/${id}`);
  };

  const handleEdit = (id: string) => {
    const team = localTeams.find(t => t.id === id);
    if (team) setEditTarget(team);
  };

  const handleEditSave = (id: string, novoNome: string) => {
    const updated = localTeams.map(t => t.id === id ? { ...t, nome: novoNome } : t);
    setLocalTeams(updated);
    saveTeams(updated);
  };

  const handleDelete = (id: string) => {
    const team = localTeams.find(t => t.id === id);
    if (team) setDeleteTarget(team);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;

    // Remove localmente de imediato
    const updated = localTeams.filter(t => t.id !== id);
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
    <div style={{ display: "flex", height: "100%", overflow: "hidden", background: "#111111" }}>
      {/* sidebar */}
      <aside style={{ width: 260, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.07)", background: "#1a1a1a", display: "flex", flexDirection: "column" }}>
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
        <TeamsListView teams={teams} onCreateTeam={() => setModalOpen(true)} onTeamClick={handleTeamClick} onEdit={handleEdit} onDelete={handleDelete} />
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
    </div>
  );
}
