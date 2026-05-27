"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  BarChart2,
  BookmarkIcon,
  ChevronDown,
  LayoutGrid,
  Users,
  Footprints,
  Briefcase,
  Clock,
  Plus,
  X,
  ArrowLeft,
  Loader2,
  UserMinus,
  Search,
  Check,
} from "lucide-react";
import {
  useTeam,
  useTeams,
  useUpdateTeam,
  useTeamMembers,
  useRemoveTeamMember,
  useAddTeamMember,
} from "@/hooks/use-teams";
import { useOrgMembers } from "@/hooks/use-org-members";
import type { TeamMemberDto, TeamResponseDto, OrgMemberDto } from "@/lib/types/api";

/* ══════════════════════════════════════════════════════════════════
   ABAS
══════════════════════════════════════════════════════════════════ */

type TabId = "visao-geral" | "analiticos" | "prioridades" | "equipe" | "de-pe" | "carga" | "planilha";

const TABS: { id: TabId; label: string; color?: string }[] = [
  { id: "visao-geral",  label: "Visão geral" },
  { id: "analiticos",   label: "Dados analíticos", color: "#3b82f6" },
  { id: "prioridades",  label: "Prioridades",       color: "#e74c3c" },
  { id: "equipe",       label: "Equipe",            color: "#a855f7" },
  { id: "de-pe",        label: "De pé",             color: "#a855f7" },
  { id: "carga",        label: "Carga de trabalho", color: "#22c55e" },
  { id: "planilha",     label: "Planilha de horas", color: "#f59e0b" },
];

const TAB_ICONS: Record<TabId, React.ReactNode> = {
  "visao-geral":  <LayoutGrid size={13} strokeWidth={1.8} />,
  "analiticos":   <BarChart2  size={13} strokeWidth={1.8} />,
  "prioridades":  <span style={{ fontSize: 11 }}>⚑</span>,
  "equipe":       <Users      size={13} strokeWidth={1.8} />,
  "de-pe":        <Footprints size={13} strokeWidth={1.8} />,
  "carga":        <Briefcase  size={13} strokeWidth={1.8} />,
  "planilha":     <Clock      size={13} strokeWidth={1.8} />,
};

/* ══════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════ */

function avatarColor(str: string) {
  const colors = ["#e74c3c","#3498db","#2ecc71","#9b59b6","#f59e0b","#e91e63","#1abc9c","#e67e22"];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

function getInitials(nome: string) {
  return nome.trim().charAt(0).toUpperCase();
}

/* ══════════════════════════════════════════════════════════════════
   POPOVER ADICIONAR MEMBRO
══════════════════════════════════════════════════════════════════ */

function AddMemberPopover({
  teamId,
  currentMembers,
  anchorRef,
  onClose,
}: {
  teamId: string;
  currentMembers: TeamMemberDto[];
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: orgMembers = [] } = useOrgMembers();
  const addMember = useAddTeamMember(teamId);
  const alreadyInTeam = new Set(currentMembers.map((m) => m.userId));

  const filtered = orgMembers.filter((m: OrgMemberDto) => {
    const inTeam = alreadyInTeam.has(m.userId);
    const matchSearch =
      m.nome.toLowerCase().includes(search.toLowerCase()) ||
      (m.email ?? "").toLowerCase().includes(search.toLowerCase());
    return matchSearch && !inTeam;
  });

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    setTimeout(() => inputRef.current?.focus(), 50);
    const handler = (e: MouseEvent) => {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, anchorRef]);

  const handleAdd = async (member: OrgMemberDto) => {
    if (adding || added.has(member.userId)) return;
    setAdding(member.userId);
    try {
      await addMember.mutateAsync({ userId: member.userId, cargo: "MEMBER" });
      setAdded((prev) => new Set(prev).add(member.userId));
    } catch { /* silencia */ } finally {
      setAdding(null);
    }
  };

  return (
    <div
      ref={ref}
      style={{
        position: "fixed", top: pos.top, right: pos.right,
        width: 260, borderRadius: 10, background: "var(--card)",
        border: "1px solid var(--border)", boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
        zIndex: 9999, overflow: "hidden",
      }}
    >
      <div style={{ padding: "10px 10px 6px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, height: 32, borderRadius: 7, background: "var(--border)", padding: "0 10px" }}>
          <Search size={13} strokeWidth={2} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Busque ou insira o e-mail..."
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--foreground)", fontSize: 12 }}
          />
        </div>
      </div>
      <div style={{ maxHeight: 260, overflowY: "auto", padding: "4px 0" }}>
        {filtered.length === 0 ? (
          <p style={{ fontSize: 12, color: "var(--muted-foreground)", padding: "12px 14px" }}>
            {search ? "Nenhum resultado." : "Todos os membros já estão no time."}
          </p>
        ) : (
          filtered.map((m: OrgMemberDto) => {
            const isAdded = added.has(m.userId);
            const isLoading = adding === m.userId;
            return (
              <button
                key={m.userId}
                type="button"
                onClick={() => handleAdd(m)}
                disabled={isAdded || isLoading}
                style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "7px 12px", border: "none", background: "none", cursor: isAdded ? "default" : "pointer", textAlign: "left" }}
                onMouseEnter={(e) => { if (!isAdded) e.currentTarget.style.background = "var(--border)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
              >
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: avatarColor(m.nome), flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>
                  {m.nome.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, color: "var(--foreground)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.nome}</p>
                  {m.email && <p style={{ fontSize: 10, color: "var(--muted-foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.email}</p>}
                </div>
                {isLoading && <Loader2 size={13} strokeWidth={2} style={{ color: "var(--muted-foreground)", flexShrink: 0, animation: "spin 1s linear infinite" }} />}
                {isAdded && <Check size={13} strokeWidth={2.5} style={{ color: "#22c55e", flexShrink: 0 }} />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MEMBER ROW
══════════════════════════════════════════════════════════════════ */

function MemberRow({ member, onRemove, isRemoving }: { member: TeamMemberDto; onRemove: () => void; isRemoving: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 4px", borderRadius: 6, background: hovered ? "var(--border)" : "none", transition: "background .12s" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: avatarColor(member.nome), flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>
        {member.nome.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, color: "var(--foreground)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{member.nome}</p>
        <p style={{ fontSize: 10, color: "var(--muted-foreground)" }}>{member.cargo === "LEAD" ? "Lead" : "Membro"}</p>
      </div>
      <button
        type="button"
        title="Remover do time"
        disabled={isRemoving}
        onClick={onRemove}
        style={{ width: 22, height: 22, borderRadius: 5, border: "none", background: "none", cursor: isRemoving ? "not-allowed" : "pointer", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,38,38,0.15)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
      >
        <UserMinus size={12} strokeWidth={2} />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MEMBERS PANEL
══════════════════════════════════════════════════════════════════ */

function MembersPanel({ teamId }: { teamId: string }) {
  const { data: members = [], isLoading } = useTeamMembers(teamId);
  const removeMember = useRemoveTeamMember(teamId);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <div style={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: members.length > 0 ? 12 : 4 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
          Membros {members.length > 0 && <span style={{ fontSize: 11, color: "var(--muted-foreground)", fontWeight: 400 }}>({members.length})</span>}
        </p>
        <button
          ref={btnRef}
          type="button"
          onClick={() => setPopoverOpen((v) => !v)}
          style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid var(--border)", background: "none", cursor: "pointer", color: "var(--muted-foreground)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--foreground)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--muted-foreground)"; }}
        >
          <Plus size={13} strokeWidth={2} />
        </button>
        {popoverOpen && (
          <AddMemberPopover
            teamId={teamId}
            currentMembers={members}
            anchorRef={btnRef}
            onClose={() => setPopoverOpen(false)}
          />
        )}
      </div>
      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0", color: "var(--muted-foreground)" }}>
          <Loader2 size={13} strokeWidth={2} style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 12 }}>Carregando...</span>
        </div>
      ) : members.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 6 }}>Nenhum membro ainda.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {members.map((m: TeamMemberDto) => (
            <MemberRow
              key={m.userId}
              member={m}
              onRemove={() => removeMember.mutate(m.userId)}
              isRemoving={removeMember.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ABA VISÃO GERAL
══════════════════════════════════════════════════════════════════ */

function TabVisaoGeral({
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
    <div style={{ display: "flex", gap: 16, flex: 1, overflow: "hidden", padding: "16px 20px", minHeight: 0 }}>
      {/* coluna principal */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", minWidth: 0 }}>

        {/* descrição */}
        <div style={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", overflow: "hidden" }}>
          <textarea
            value={descricao}
            onChange={e => handleDescricao(e.target.value)}
            placeholder="Adicione a descrição, informações e wiki da equipe"
            style={{ width: "100%", minHeight: 80, padding: "14px 16px", background: "transparent", border: "none", outline: "none", color: "var(--muted-foreground)", fontSize: 13, resize: "none", lineHeight: 1.6, boxSizing: "border-box", fontFamily: "inherit" }}
          />
        </div>

        {/* favoritos */}
        <div style={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", padding: "16px 18px" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", marginBottom: 28 }}>Favoritos</p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "12px 0 20px" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <BookmarkIcon size={22} strokeWidth={1.4} color="var(--muted-foreground)" />
              <div style={{ position: "absolute", bottom: -4, right: -4, width: 18, height: 18, borderRadius: "50%", background: "var(--accent)", border: "2px solid #161616", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Plus size={10} strokeWidth={2.5} color="var(--muted-foreground)" />
              </div>
            </div>
            <p style={{ fontSize: 12, color: "var(--muted-foreground)", textAlign: "center", maxWidth: 320, lineHeight: 1.6 }}>
              Os favoritos facilitam salvar itens da sua workspace ou qualquer URL da web.
            </p>
            <button type="button" style={{ height: 28, padding: "0 14px", borderRadius: 6, border: "1px solid var(--border)", background: "none", cursor: "pointer", color: "var(--foreground)", fontSize: 12, fontWeight: 500 }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--border)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
              Adicionar favorito
            </button>
          </div>
        </div>

        {/* feed */}
        <div style={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>Feed</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" style={{ height: 26, padding: "0 10px", borderRadius: 6, border: "1px solid var(--border)", background: "none", cursor: "pointer", color: "var(--muted-foreground)", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                Filtrar por tipo <ChevronDown size={11} strokeWidth={2} />
              </button>
              <button type="button" style={{ height: 26, padding: "0 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--border)", cursor: "pointer", color: "var(--muted-foreground)", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                Subtarefas: Mostrados <X size={11} strokeWidth={2} />
              </button>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "24px 0 32px" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>Nada para ver aqui</p>
            <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Parece que você ainda não tem nenhuma atividade de tarefas.</p>
          </div>
        </div>
      </div>

      {/* coluna direita */}
      <div style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
        <MembersPanel teamId={teamId} />

        {/* análises */}
        <div style={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", padding: "14px 16px" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", marginBottom: 16 }}>Análises da equipe</p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "8px 0 12px" }}>
            <BarChart2 size={20} strokeWidth={1.4} color="var(--muted-foreground)" />
            <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Não há dados suficientes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ABAS PLACEHOLDER
══════════════════════════════════════════════════════════════════ */

function TabPlaceholder({ label }: { label: string }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--muted-foreground)", fontSize: 14 }}>{label} — em breve</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PÁGINA /teams/[id]
══════════════════════════════════════════════════════════════════ */

export default function TeamDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const teamId  = params?.id as string;

  const [activeTab, setActiveTab] = useState<TabId>("visao-geral");
  const [topPopoverOpen, setTopPopoverOpen] = useState(false);
  const addMemberBtnRef = useRef<HTMLButtonElement>(null);

  const { data: team, isLoading, isError } = useTeam(teamId);
  const { data: allTeams = [] } = useTeams();
  const { data: teamMembers = [] } = useTeamMembers(teamId);

  if (isLoading) {
    return (
      <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", background: "var(--background)" }}>
        <Loader2 size={20} strokeWidth={2} style={{ animation: "spin 1s linear infinite", color: "var(--muted-foreground)" }} />
      </div>
    );
  }

  if (isError || !team) {
    return (
      <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", background: "var(--background)", flexDirection: "column", gap: 12 }}>
        <p style={{ color: "var(--muted-foreground)", fontSize: 14 }}>Equipe não encontrada.</p>
        <button type="button" onClick={() => router.push("/teams")} style={{ height: 30, padding: "0 14px", borderRadius: 7, border: "1px solid var(--border)", background: "none", cursor: "pointer", color: "var(--muted-foreground)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <ArrowLeft size={13} strokeWidth={2} /> Voltar para equipes
        </button>
      </div>
    );
  }

  const teamColor = team.color ?? avatarColor(team.nome);
  const slug = "@" + team.nome.toLowerCase().replace(/\s+/g, "").slice(0, 16);

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", background: "var(--background)" }}>

      {/* sidebar */}
      <aside style={{ width: 260, flexShrink: 0, borderRight: "1px solid var(--border)", background: "var(--card)", display: "flex", flexDirection: "column" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", height: 44, borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>Equipes</span>
        </header>
        <div style={{ padding: "8px 6px" }}>
          {[
            { label: "Todas as equipes", icon: <Users size={14} strokeWidth={1.7} /> },
            { label: "Dados analíticos",  icon: <BarChart2 size={14} strokeWidth={1.7} /> },
          ].map(item => (
            <button key={item.label} type="button" onClick={() => router.push("/teams")}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", height: 34, padding: "0 8px", borderRadius: 5, border: 0, cursor: "pointer", background: "none", color: "var(--muted-foreground)", fontSize: 13 }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--accent)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
              <span style={{ color: "var(--muted-foreground)" }}>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "12px 8px 6px" }}>Minhas equipes</p>

          {allTeams.map((t: TeamResponseDto) => {
            const tc = t.color ?? avatarColor(t.nome);
            return (
              <button key={t.id} type="button" onClick={() => router.push(`/teams/${t.id}`)}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", height: 32, padding: "0 8px", borderRadius: 5, border: 0, cursor: "pointer", background: t.id === teamId ? "var(--accent)" : "none", color: t.id === teamId ? "var(--foreground)" : "var(--muted-foreground)", fontSize: 13 }}
                onMouseEnter={e => { if (t.id !== teamId) e.currentTarget.style.background = "var(--accent)"; }}
                onMouseLeave={e => { if (t.id !== teamId) e.currentTarget.style.background = "none"; }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: tc, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff" }}>
                  {getInitials(t.nome)}
                </div>
                <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.nome}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* conteúdo principal */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 52, borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: teamColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {getInitials(team.nome)}
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)" }}>{team.nome}</span>
            <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>{slug}</span>
          </div>

          <button
            ref={addMemberBtnRef}
            type="button"
            onClick={() => setTopPopoverOpen(v => !v)}
            style={{ height: 30, padding: "0 14px", borderRadius: 7, background: "var(--primary)", border: "none", cursor: "pointer", color: "var(--primary-foreground)", fontSize: 13, fontWeight: 600 }}
            onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.filter = "none"; }}
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
        <div style={{ display: "flex", alignItems: "center", padding: "0 20px", height: 42, borderBottom: "1px solid var(--border)", flexShrink: 0, gap: 2 }}>
          {TABS.map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              style={{
                height: 42, padding: "0 12px", border: 0, background: "none", cursor: "pointer",
                fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? "var(--foreground)" : "var(--muted-foreground)",
                display: "flex", alignItems: "center", gap: 5,
                borderBottom: activeTab === tab.id ? "2px solid #e4e4e4" : "2px solid transparent",
              }}
              onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = "var(--foreground)"; }}
              onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = "var(--muted-foreground)"; }}
            >
              <span style={{ color: tab.color ?? (activeTab === tab.id ? "var(--foreground)" : "var(--muted-foreground)") }}>
                {TAB_ICONS[tab.id]}
              </span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* conteúdo da aba */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {activeTab === "visao-geral" ? (
            <TabVisaoGeral team={team} teamId={teamId} />
          ) : (
            <TabPlaceholder label={TABS.find(t => t.id === activeTab)?.label ?? ""} />
          )}
        </div>
      </div>
    </div>
  );
}
