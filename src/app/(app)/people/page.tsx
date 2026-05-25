"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  Download,
  ChevronDown,
  X,
  Trash2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInviteDialogStore } from "@/lib/stores/invite-dialog";
import { useOrgMembers, useOrgInvites, useCancelInvite, useRemoveOrgMember, useUpdateOrgMemberRole } from "@/hooks/use-org-members";
import { useAuthStore } from "@/lib/stores/auth";
import type { OrgMemberDto, InviteResponseDto } from "@/lib/types/api";

// ─── Filtros ──────────────────────────────────────────────────────────────────

const FILTER_OPTIONS = ["Todos os usuários", "Membros", "Convidados"] as const;
type FilterOption = (typeof FILTER_OPTIONS)[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function avatarColor(str: string) {
  const colors = [
    "#3b5bdb", "#ae3ec9", "#0ca678", "#e8590c",
    "#f03e3e", "#1098ad", "#74b816", "#f59f00",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function roleLabel(role: string) {
  const map: Record<string, string> = {
    ADMIN: "Administrador",
    MEMBER: "Membro",
    VIEWER: "Visualizador",
  };
  return map[role] ?? role;
}

function roleBadgeStyle(role: string): React.CSSProperties {
  if (role === "ADMIN") return { background: "rgba(139,92,246,0.18)", color: "#a78bfa" };
  if (role === "VIEWER") return { background: "rgba(100,116,139,0.18)", color: "#94a3b8" };
  return { background: "rgba(59,130,246,0.15)", color: "#60a5fa" };
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "—";
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PeoplePage() {
  const openInvite = useInviteDialogStore((s) => s.openDialog);
  const me = useAuthStore((s) => s.user);

  const { data: members = [], isLoading: loadingMembers } = useOrgMembers();
  const { data: invites = [], isLoading: loadingInvites } = useOrgInvites();
  const cancelInvite = useCancelInvite();
  const removeMember = useRemoveOrgMember();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterOption>("Todos os usuários");
  const [filterOpen, setFilterOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<OrgMemberDto | null>(null);

  const filteredMembers = members.filter((m) => {
    const matchSearch =
      m.nome.toLowerCase().includes(search.toLowerCase()) ||
      (m.email ?? "").toLowerCase().includes(search.toLowerCase());
    if (filter === "Membros") return matchSearch && m.role !== "ADMIN";
    return matchSearch;
  });

  const filteredInvites = invites.filter((inv) => {
    if (filter === "Membros") return false;
    if (filter === "Convidados") return true;
    const matchSearch =
      inv.email.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const totalCount =
    filter === "Convidados"
      ? filteredInvites.length
      : filter === "Membros"
      ? filteredMembers.length
      : filteredMembers.length + filteredInvites.length;

  const isLoading = loadingMembers || loadingInvites;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-semibold text-foreground">
            Gerenciar pessoas
          </h1>
          <button type="button" className="text-[13px] text-primary hover:underline">
            Saiba mais
          </button>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Download className="size-3.5" />
          Exportar
        </button>
      </header>

      {/* ── Barra de busca + Convidar ──────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-6 py-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar ou convidar por e-mail"
            className="h-9 w-full rounded-lg border border-border bg-transparent pl-9 pr-4 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={openInvite}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Convidar pessoas
        </button>
      </div>

      {/* ── Filtro ─────────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-6 py-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[13px] text-foreground transition-colors hover:bg-muted"
          >
            {filter}{" "}
            <span className="text-muted-foreground">({totalCount})</span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
          {filterOpen && (
            <div className="absolute left-0 top-full z-10 mt-1 min-w-[180px] rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { setFilter(opt); setFilterOpen(false); }}
                  className={cn(
                    "flex w-full items-center px-4 py-2 text-[13px] transition-colors hover:bg-muted",
                    filter === opt ? "text-foreground font-medium" : "text-muted-foreground",
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Conteúdo ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-[13px] text-muted-foreground">
            Carregando...
          </div>
        ) : (
          <>
            {/* ── Tabela de membros ── */}
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-2.5 text-left text-[12px] font-medium text-muted-foreground/70 w-[300px]">Nome</th>
                  <th className="px-4 py-2.5 text-left text-[12px] font-medium text-muted-foreground/70 w-[200px]">E-mail</th>
                  <th className="px-4 py-2.5 text-left text-[12px] font-medium text-muted-foreground/70 w-[140px]">Função</th>
                  <th className="px-4 py-2.5 text-left text-[12px] font-medium text-muted-foreground/70 w-[120px]">Membro desde</th>
                  <th className="px-4 py-2.5 text-left text-[12px] font-medium text-muted-foreground/70 w-[120px]">Status</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {/* Linha "Convidar pessoas" */}
                <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td colSpan={6} className="px-6 py-2.5">
                    <button
                      type="button"
                      onClick={openInvite}
                      className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span className="grid size-5 place-items-center rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground/60">
                        <Plus className="size-3" />
                      </span>
                      Convidar pessoas
                    </button>
                  </td>
                </tr>

                {filteredMembers.map((member) => (
                  <MemberRow
                    key={member.userId}
                    member={member}
                    isMe={member.email === me?.email}
                    onRemove={() => setRemoveTarget(member)}
                  />
                ))}

                {filteredMembers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-[13px] text-muted-foreground">
                      {search ? <>Nenhum membro para <span className="text-foreground">"{search}"</span></> : "Nenhum membro encontrado"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* ── Seção de convites pendentes ── */}
            {invites.length > 0 && (
              <div className="mt-6 px-6 pb-8">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Convites pendentes
                  </h2>
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
                    {invites.length}
                  </span>
                </div>
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2.5 text-left text-[12px] font-medium text-muted-foreground/70 w-[300px]">E-mail convidado</th>
                      <th className="px-4 py-2.5 text-left text-[12px] font-medium text-muted-foreground/70 w-[140px]">Função</th>
                      <th className="px-4 py-2.5 text-left text-[12px] font-medium text-muted-foreground/70 w-[160px]">Expira em</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {invites
                      .filter((inv) =>
                        !search || inv.email.toLowerCase().includes(search.toLowerCase())
                      )
                      .map((invite) => (
                        <InviteRow
                          key={invite.id}
                          invite={invite}
                          onCancel={() => cancelInvite.mutate(invite.id)}
                          isCancelling={cancelInvite.isPending}
                        />
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
      {/* Modal de confirmação de remoção */}
      {removeTarget && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)" }}
          onClick={() => setRemoveTarget(null)}
        >
          <div
            style={{ width: 420, borderRadius: 12, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", padding: "28px 28px 24px", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#e4e4e4", marginBottom: 8 }}>
              Remover membro
            </h2>
            <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6, marginBottom: 24 }}>
              Tem certeza que deseja remover <strong style={{ color: "#e4e4e4" }}>{removeTarget.nome}</strong> da organização?
              Essa ação não pode ser desfeita.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                onClick={() => setRemoveTarget(null)}
                style={{ height: 34, padding: "0 16px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "none", cursor: "pointer", color: "#888", fontSize: 13 }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#e4e4e4"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#888"; }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={removeMember.isPending}
                onClick={async () => {
                  await removeMember.mutateAsync(removeTarget.userId);
                  setRemoveTarget(null);
                }}
                style={{ height: 34, padding: "0 20px", borderRadius: 7, border: "none", background: removeMember.isPending ? "#5a1a1a" : "#c0392b", cursor: removeMember.isPending ? "not-allowed" : "pointer", color: "#fff", fontSize: 13, fontWeight: 600, transition: "background .15s" }}
                onMouseEnter={(e) => { if (!removeMember.isPending) e.currentTarget.style.background = "#e74c3c"; }}
                onMouseLeave={(e) => { if (!removeMember.isPending) e.currentTarget.style.background = "#c0392b"; }}
              >
                {removeMember.isPending ? "Removendo..." : "Remover"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── RoleDropdown ─────────────────────────────────────────────────────────────

const ROLES: Array<{ value: 'ADMIN' | 'MEMBER' | 'VIEWER'; label: string }> = [
  { value: 'ADMIN',  label: 'Administrador' },
  { value: 'MEMBER', label: 'Membro' },
  { value: 'VIEWER', label: 'Visualizador' },
];

function RoleDropdown({ memberId, currentRole, disabled }: { memberId: string; currentRole: 'ADMIN' | 'MEMBER' | 'VIEWER'; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [optimisticRole, setOptimisticRole] = useState(currentRole);
  const ref = useRef<HTMLDivElement>(null);
  const updateRole = useUpdateOrgMemberRole();

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = (role: 'ADMIN' | 'MEMBER' | 'VIEWER') => {
    if (role === optimisticRole) { setOpen(false); return; }
    setOptimisticRole(role);
    setOpen(false);
    updateRole.mutate({ userId: memberId, role }, {
      onError: () => setOptimisticRole(currentRole), // reverte se falhar
    });
  };

  if (disabled) {
    return <span className="text-[13px] text-muted-foreground">{roleLabel(optimisticRole)}</span>;
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded px-2 py-1 text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        {roleLabel(optimisticRole)}
        <ChevronDown className="size-3 opacity-50" />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 50, marginTop: 4,
          minWidth: 160, borderRadius: 8, overflow: 'hidden',
          background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => handleSelect(r.value)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px 14px', border: 0, background: 'none', cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              <span style={{ fontSize: 13, color: optimisticRole === r.value ? '#e4e4e4' : '#888' }}>{r.label}</span>
              {optimisticRole === r.value && <Check size={13} style={{ color: '#4f7ef7', flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MemberRow ────────────────────────────────────────────────────────────────

function MemberRow({ member, isMe, onRemove }: { member: OrgMemberDto; isMe: boolean; onRemove: () => void }) {
  const color = avatarColor(member.nome);
  const ini = initials(member.nome);

  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors group">
      <td className="px-6 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
            style={{ background: color }}
          >
            {ini}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{member.nome}</span>
            {isMe && (
              <span className="text-[11px] text-muted-foreground">(você)</span>
            )}
            <span
              className="rounded-sm px-1.5 py-0.5 text-[11px] font-semibold"
              style={roleBadgeStyle(member.role)}
            >
              {roleLabel(member.role)}
            </span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{member.email ?? "—"}</td>
      <td className="px-4 py-3">
        <RoleDropdown memberId={member.userId} currentRole={member.role} disabled={isMe} />
      </td>
      <td className="px-4 py-3 text-muted-foreground">—</td>
      <td className="px-4 py-3">
        <span className="text-[11px] font-medium text-emerald-400">Ativo</span>
      </td>
      <td className="px-2 py-3">
        {!isMe && (
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={onRemove}
              title="Remover membro"
              className="grid size-7 place-items-center rounded text-red-500/60 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

// ─── InviteRow ────────────────────────────────────────────────────────────────

function InviteRow({
  invite,
  onCancel,
  isCancelling,
}: {
  invite: InviteResponseDto;
  onCancel: () => void;
  isCancelling: boolean;
}) {
  const ini = invite.email[0].toUpperCase();

  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors group">
      <td className="px-6 py-3">
        <div className="flex items-center gap-2.5">
          <div className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground border border-dashed border-border">
            {ini}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-muted-foreground">{invite.email}</span>
            <span className="rounded-sm bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-amber-400">
              Pendente
            </span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{invite.email}</td>
      <td className="px-4 py-3 text-muted-foreground">{roleLabel(invite.role)}</td>
      <td className="px-4 py-3 text-muted-foreground">—</td>
      <td className="px-4 py-3">
        <span className="text-[11px] font-medium text-amber-400">
          Expira {formatDate(invite.expiresAt)}
        </span>
      </td>
      <td className="px-2 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={onCancel}
            disabled={isCancelling}
            title="Cancelar convite"
            className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
