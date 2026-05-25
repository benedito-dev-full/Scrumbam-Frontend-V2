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
import { useTeams, useTeamMembers, useRemoveTeamMember, useAddTeamMember } from "@/hooks/use-teams";
import { useOrgMembers } from "@/hooks/use-org-members";
import type { TeamMemberDto, OrgMemberDto } from "@/lib/types/api";

/* ══════════════════════════════════════════════════════════════════
   TIPOS (localStorage — sem backend)
══════════════════════════════════════════════════════════════════ */

interface TeamLocal {
  id: string;
  nome: string;
  memberCount: number;
  color: string;
  criadoEm: string;
  descricao?: string;
  membros?: MemberLocal[];
}

interface MemberLocal {
  id: string;
  nome: string;
  cargo: string;
  color: string;
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

function getInitials(nome: string) {
  return nome.trim().charAt(0).toUpperCase();
}

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
   MODAL ADICIONAR MEMBRO
══════════════════════════════════════════════════════════════════ */

const MEMBER_COLORS = ["#e74c3c","#e67e22","#f1c40f","#2ecc71","#3498db","#9b59b6","#e91e63","#1abc9c"];

function AddMemberModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (nome: string, cargo: string) => void;
}) {
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("MEMBER");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    onAdd(nome.trim(), cargo);
    onClose();
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: 400, borderRadius: 12, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", padding: "26px 26px 22px", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#e4e4e4", marginBottom: 18 }}>Adicionar membro</h2>
        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 5 }}>Nome</label>
          <input
            autoFocus
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Nome do membro"
            style={{ width: "100%", height: 36, padding: "0 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "#e4e4e4", fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 14 }}
          />
          <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 5 }}>Cargo</label>
          <select
            value={cargo}
            onChange={e => setCargo(e.target.value)}
            style={{ width: "100%", height: 36, padding: "0 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "#1e1e1e", color: "#e4e4e4", fontSize: 13, outline: "none", boxSizing: "border-box" }}
          >
            <option value="LEAD">Lead</option>
            <option value="MEMBER">Membro</option>
          </select>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
            <button type="button" onClick={onClose} style={{ height: 32, padding: "0 14px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "none", cursor: "pointer", color: "#888", fontSize: 13 }}>
              Cancelar
            </button>
            <button type="submit" disabled={!nome.trim()} style={{ height: 32, padding: "0 18px", borderRadius: 7, border: "none", background: nome.trim() ? "#e4e4e4" : "#2a2a2a", cursor: nome.trim() ? "pointer" : "not-allowed", color: nome.trim() ? "#111" : "#555", fontSize: 13, fontWeight: 600 }}>
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ABA VISÃO GERAL
══════════════════════════════════════════════════════════════════ */

function avatarColor(str: string) {
  const colors = ["#e74c3c","#3498db","#2ecc71","#9b59b6","#f59e0b","#e91e63","#1abc9c","#e67e22"];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

// ─── Popover de adicionar membro ─────────────────────────────────────────────

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
    // Calcula posição baseada no botão âncora
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    }
    setTimeout(() => inputRef.current?.focus(), 50);
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) &&
          anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onClose();
      }
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
    } catch {
      // silencia
    } finally {
      setAdding(null);
    }
  };

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        top: pos.top,
        right: pos.right,
        width: 260,
        borderRadius: 10,
        background: "#1a1a1a",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      {/* busca */}
      <div style={{ padding: "10px 10px 6px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, height: 32, borderRadius: 7, background: "rgba(255,255,255,0.06)", padding: "0 10px" }}>
          <Search size={13} strokeWidth={2} style={{ color: "#555", flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Busque ou insira o e-mail..."
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#e4e4e4", fontSize: 12 }}
          />
        </div>
      </div>

      {/* lista */}
      <div style={{ maxHeight: 260, overflowY: "auto", padding: "4px 0" }}>
        {filtered.length === 0 ? (
          <p style={{ fontSize: 12, color: "#555", padding: "12px 14px" }}>
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
                style={{
                  display: "flex", alignItems: "center", gap: 9,
                  width: "100%", padding: "7px 12px",
                  border: "none", background: "none",
                  cursor: isAdded ? "default" : "pointer",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => { if (!isAdded) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
              >
                {/* avatar */}
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: avatarColor(m.nome), flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, color: "#fff",
                }}>
                  {m.nome.charAt(0).toUpperCase()}
                </div>

                {/* info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, color: "#e4e4e4", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.nome}</p>
                  {m.email && <p style={{ fontSize: 10, color: "#555", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.email}</p>}
                </div>

                {/* status */}
                {isLoading && <Loader2 size={13} strokeWidth={2} style={{ color: "#555", flexShrink: 0, animation: "spin 1s linear infinite" }} />}
                {isAdded && <Check size={13} strokeWidth={2.5} style={{ color: "#22c55e", flexShrink: 0 }} />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function MemberRow({ member, onRemove, isRemoving }: { member: TeamMemberDto; onRemove: () => void; isRemoving: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 4px", borderRadius: 6, background: hovered ? "rgba(255,255,255,0.04)" : "none", transition: "background .12s" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: avatarColor(member.nome), flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>
        {member.nome.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, color: "#e4e4e4", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{member.nome}</p>
        <p style={{ fontSize: 10, color: "#555" }}>{member.cargo === "LEAD" ? "Lead" : "Membro"}</p>
      </div>
      <button
        type="button"
        title="Remover do time"
        disabled={isRemoving}
        onClick={onRemove}
        style={{
          width: 22, height: 22, borderRadius: 5, border: "none", background: "none",
          cursor: isRemoving ? "not-allowed" : "pointer",
          color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "background .12s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,38,38,0.15)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
      >
        <UserMinus size={12} strokeWidth={2} />
      </button>
    </div>
  );
}

function MembersPanel({
  teamId,
  onAddMember,
}: {
  teamId: string;
  onAddMember: () => void;
}) {
  const { data: members = [], isLoading } = useTeamMembers(teamId);
  const removeMember = useRemoveTeamMember(teamId);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <div style={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", background: "#161616", padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: members.length > 0 ? 12 : 4 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e4" }}>
          Membros {members.length > 0 && <span style={{ fontSize: 11, color: "#555", fontWeight: 400 }}>({members.length})</span>}
        </p>
        <button
          ref={btnRef}
          type="button"
          onClick={() => setPopoverOpen((v) => !v)}
          style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "none", cursor: "pointer", color: "#777", display: "flex", alignItems: "center", justifyContent: "center" }}
          onMouseEnter={e => { e.currentTarget.style.color = "#e4e4e4"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#777"; }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0", color: "#555" }}>
          <Loader2 size={13} strokeWidth={2} style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 12 }}>Carregando...</span>
        </div>
      ) : members.length === 0 ? (
        <p style={{ fontSize: 12, color: "#444", marginTop: 6 }}>Nenhum membro ainda.</p>
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

function TabVisaoGeral({
  team,
  onDescricaoChange,
  onAddMember,
}: {
  team: TeamLocal;
  onDescricaoChange: (v: string) => void;
  onAddMember: () => void;
}) {

  return (
    <div style={{ display: "flex", gap: 16, flex: 1, overflow: "hidden", padding: "16px 20px", minHeight: 0 }}>
      {/* coluna principal */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", minWidth: 0 }}>

        {/* descrição */}
        <div style={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", background: "#161616", overflow: "hidden" }}>
          <textarea
            value={team.descricao ?? ""}
            onChange={e => onDescricaoChange(e.target.value)}
            placeholder="Adicione a descrição, informações e wiki da equipe"
            style={{ width: "100%", minHeight: 80, padding: "14px 16px", background: "transparent", border: "none", outline: "none", color: "#777", fontSize: 13, resize: "none", lineHeight: 1.6, boxSizing: "border-box", fontFamily: "inherit" }}
          />
        </div>

        {/* favoritos */}
        <div style={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", background: "#161616", padding: "16px 18px" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#e4e4e4", marginBottom: 28 }}>Favoritos</p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "12px 0 20px" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <BookmarkIcon size={22} strokeWidth={1.4} color="#555" />
              <div style={{ position: "absolute", bottom: -4, right: -4, width: 18, height: 18, borderRadius: "50%", background: "#2a2a2a", border: "2px solid #161616", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Plus size={10} strokeWidth={2.5} color="#777" />
              </div>
            </div>
            <p style={{ fontSize: 12, color: "#555", textAlign: "center", maxWidth: 320, lineHeight: 1.6 }}>
              Os favoritos facilitam salvar itens da sua workspace ou qualquer URL da web.
            </p>
            <button type="button" style={{ height: 28, padding: "0 14px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)", background: "none", cursor: "pointer", color: "#c4c4c4", fontSize: 12, fontWeight: 500 }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
              Adicionar favorito
            </button>
          </div>
        </div>

        {/* feed */}
        <div style={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", background: "#161616", padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#e4e4e4" }}>Feed</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" style={{ height: 26, padding: "0 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "none", cursor: "pointer", color: "#777", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                Filtrar por tipo <ChevronDown size={11} strokeWidth={2} />
              </button>
              <button type="button" style={{ height: 26, padding: "0 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", cursor: "pointer", color: "#888", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                Subtarefas: Mostrados
                <X size={11} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* empty feed */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "24px 0 32px" }}>
            <div style={{ width: 64, height: 48, position: "relative" }}>
              {/* ícone decorativo de "sem atividade" */}
              <div style={{ width: 52, height: 38, borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", position: "absolute", top: 0, left: 0 }}>
                <div style={{ margin: "8px 10px 0", height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)" }} />
                <div style={{ margin: "5px 10px 0", height: 4, borderRadius: 2, background: "rgba(255,255,255,0.05)", width: "60%" }} />
                <div style={{ margin: "5px 10px 0", height: 4, borderRadius: 2, background: "rgba(255,255,255,0.04)", width: "40%" }} />
              </div>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#1a1a1a", border: "2px solid #161616", position: "absolute", bottom: -2, right: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BarChart2 size={11} strokeWidth={2} color="#555" />
              </div>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#c4c4c4" }}>Nada para ver aqui</p>
            <p style={{ fontSize: 12, color: "#555" }}>Parece que você ainda não tem nenhuma atividade de tarefas.</p>
          </div>
        </div>
      </div>

      {/* coluna direita */}
      <div style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>

        {/* membros — dinâmico via backend */}
        <MembersPanel teamId={team.id} onAddMember={onAddMember} />

        {/* análises */}
        <div style={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", background: "#161616", padding: "14px 16px" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e4", marginBottom: 16 }}>Análises da equipe</p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "8px 0 12px" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <BarChart2 size={20} strokeWidth={1.4} color="#444" />
              <div style={{ position: "absolute", bottom: -3, right: -3, width: 16, height: 16, borderRadius: "50%", background: "#1a1a1a", border: "2px solid #161616", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BarChart2 size={8} strokeWidth={2} color="#555" />
              </div>
            </div>
            <p style={{ fontSize: 11, color: "#555" }}>Não há dados suficientes.</p>
          </div>
        </div>

        {/* prioridades card */}
        <div style={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", background: "#161616", overflow: "hidden" }}>
          {/* preview colorido */}
          <div style={{ height: 90, background: "linear-gradient(135deg,#1e1040 0%,#120c30 100%)", padding: "10px 12px", display: "flex", gap: 8 }}>
            {[
              { name: "Priya Gupta", role: "UI designer", color: "#f472b6" },
              { name: "Sarah C.",    role: "Software Eng", color: "#60a5fa" },
            ].map(m => (
              <div key={m.name} style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: "6px 8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
                  <p style={{ fontSize: 9, color: "#e4e4e4", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</p>
                </div>
                {[1,2,3].map(i => (
                  <div key={i} style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.08)", marginBottom: 3 }} />
                ))}
              </div>
            ))}
          </div>
          <div style={{ padding: "12px 14px 14px" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e4", marginBottom: 4 }}>Use as prioridades para manter o foco</p>
            <p style={{ fontSize: 11, color: "#555", lineHeight: 1.5, marginBottom: 10 }}>
              Saiba instantaneamente no que cada membro da equipe está trabalhando agora e o que está por vir na agenda deles.
            </p>
            <button type="button" style={{ height: 26, padding: "0 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)", background: "none", cursor: "pointer", color: "#c4c4c4", fontSize: 11, fontWeight: 500 }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
              Acessar Prioridades
            </button>
          </div>
        </div>

        {/* espaços card */}
        <div style={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", background: "#161616", overflow: "hidden" }}>
          <div style={{ height: 64, background: "linear-gradient(135deg,#1a2a1a 0%,#0d1a0d 100%)", padding: "8px 12px", display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ flex: 1, background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 6, height: 44, padding: "6px 8px" }}>
              <p style={{ fontSize: 9, color: "#f59e0b", fontWeight: 600 }}>Needs Updates</p>
              <p style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700 }}>5</p>
            </div>
            <div style={{ flex: 1, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 6, height: 44, padding: "6px 8px" }}>
              <p style={{ fontSize: 9, color: "#22c55e", fontWeight: 600 }}>Closed</p>
            </div>
          </div>
          <div style={{ padding: "12px 14px 14px" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e4", marginBottom: 4 }}>Espaços da equipe - Veja apenas o que importa</p>
            <p style={{ fontSize: 11, color: "#555", lineHeight: 1.5 }}>
              Filtre espaços para ver apenas o trabalho relevante para sua equipe.
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

function TabPlaceholder({ label }: { label: string }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#444", fontSize: 14 }}>{label} — em breve</p>
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

  const [team, setTeam]           = useState<TeamLocal | null>(null);
  const [teams, setTeams]         = useState<TeamLocal[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("visao-geral");
  const [modalOpen, setModalOpen] = useState(false);
  const [hydrated, setHydrated]   = useState(false);

  useEffect(() => {
    const all = loadTeams();
    setTeams(all);
    const found = all.find(t => t.id === teamId) ?? null;
    setTeam(found);
    setHydrated(true);
  }, [teamId]);

  const persist = (updated: TeamLocal) => {
    const newAll = teams.map(t => t.id === updated.id ? updated : t);
    setTeams(newAll);
    setTeam(updated);
    saveTeams(newAll);
  };

  const handleDescricao = (v: string) => {
    if (!team) return;
    persist({ ...team, descricao: v });
  };

  const handleAddMember = (nome: string, cargo: string) => {
    if (!team) return;
    const novo: MemberLocal = {
      id: Date.now().toString(),
      nome,
      cargo,
      color: ["#e74c3c","#3498db","#2ecc71","#9b59b6","#f59e0b","#e91e63"][Math.floor(Math.random() * 6)],
    };
    const membros = [...(team.membros ?? []), novo];
    persist({ ...team, membros, memberCount: membros.length });
  };

  if (!hydrated) return null;

  if (!team) {
    return (
      <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", background: "#111", flexDirection: "column", gap: 12 }}>
        <p style={{ color: "#555", fontSize: 14 }}>Equipe não encontrada.</p>
        <button type="button" onClick={() => router.push("/teams")} style={{ height: 30, padding: "0 14px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "none", cursor: "pointer", color: "#888", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <ArrowLeft size={13} strokeWidth={2} /> Voltar para equipes
        </button>
      </div>
    );
  }

  const slug = "@" + team.nome.toLowerCase().replace(/\s+/g, "").slice(0, 16);

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", background: "#111111" }}>

      {/* sidebar — igual à página /teams */}
      <aside style={{ width: 260, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.07)", background: "#1a1a1a", display: "flex", flexDirection: "column" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", height: 44, borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e4" }}>Equipes</span>
        </header>
        <div style={{ padding: "8px 6px" }}>
          {[
            { label: "Todas as equipes", icon: <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
            { label: "Todas as pessoas",  icon: <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20v-2a8 8 0 0 1 16 0v2"/></svg> },
            { label: "Dados analíticos",  icon: <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
          ].map(item => (
            <button key={item.label} type="button" onClick={() => router.push("/teams")}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", height: 34, padding: "0 8px", borderRadius: 5, border: 0, cursor: "pointer", background: "none", color: "#888892", fontSize: 13 }}
              onMouseEnter={e => { e.currentTarget.style.background = "#1a1a1c"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
              <span style={{ color: "#505058" }}>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <p style={{ fontSize: 11, fontWeight: 600, color: "#505058", textTransform: "uppercase", letterSpacing: "0.06em", padding: "12px 8px 6px" }}>Minhas equipes</p>

          {teams.map(t => (
            <button key={t.id} type="button" onClick={() => router.push(`/teams/${t.id}`)}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", height: 32, padding: "0 8px", borderRadius: 5, border: 0, cursor: "pointer", background: t.id === teamId ? "#202022" : "none", color: t.id === teamId ? "#e4e4e4" : "#888892", fontSize: 13 }}
              onMouseEnter={e => { if (t.id !== teamId) e.currentTarget.style.background = "#1a1a1c"; }}
              onMouseLeave={e => { if (t.id !== teamId) e.currentTarget.style.background = "none"; }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: t.color, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff" }}>
                {getInitials(t.nome)}
              </div>
              <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.nome}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* conteúdo principal */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* header do time */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 52, borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* avatar */}
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: team.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {getInitials(team.nome)}
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#e4e4e4" }}>{team.nome}</span>
            <span style={{ fontSize: 13, color: "#444" }}>{slug}</span>
            {/* ícone de editar nome — decorativo */}
            <button type="button" style={{ width: 22, height: 22, borderRadius: 5, border: "1px solid rgba(255,255,255,0.08)", background: "none", cursor: "pointer", color: "#555", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
              </svg>
            </button>
          </div>

          <button type="button" onClick={() => setModalOpen(true)} style={{ height: 30, padding: "0 14px", borderRadius: 7, background: "#e4e4e4", border: "none", cursor: "pointer", color: "#111", fontSize: 13, fontWeight: 600 }}
            onMouseEnter={e => { e.currentTarget.style.background = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#e4e4e4"; }}>
            Adicionar membro
          </button>
        </div>

        {/* abas */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 20px", height: 42, borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0, gap: 2 }}>
          {TABS.map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              style={{
                height: 42, padding: "0 12px", border: 0, background: "none", cursor: "pointer",
                fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? "#e4e4e4" : "#666",
                display: "flex", alignItems: "center", gap: 5, position: "relative",
                borderBottom: activeTab === tab.id ? "2px solid #e4e4e4" : "2px solid transparent",
                transition: "color .15s",
              }}
              onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = "#aaa"; }}
              onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = "#666"; }}
            >
              <span style={{ color: tab.color ?? (activeTab === tab.id ? "#e4e4e4" : "#555") }}>
                {TAB_ICONS[tab.id]}
              </span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* conteúdo da aba */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {activeTab === "visao-geral" ? (
            <TabVisaoGeral
              team={team}
              onDescricaoChange={handleDescricao}
              onAddMember={() => setModalOpen(true)}
            />
          ) : (
            <TabPlaceholder label={TABS.find(t => t.id === activeTab)?.label ?? ""} />
          )}
        </div>
      </div>

      {/* modal adicionar membro */}
      {modalOpen && (
        <AddMemberModal
          onClose={() => setModalOpen(false)}
          onAdd={handleAddMember}
        />
      )}
    </div>
  );
}
