"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, ChevronDown } from "lucide-react";
import {
  useCreateTeam,
  useTeams,
  useMyTeams,
  useDeleteTeam,
} from "@/hooks/use-teams";
import { useAuthStore } from "@/lib/stores/auth";

import type {
  TeamLocal,
  CreateTeamPayloadLocal,
  SidebarView,
} from "./_lib/teams-local";
import { loadTeams, saveTeams, randomColor } from "./_lib/teams-local";
import { EmptyState } from "./_components/previews";
import {
  CreateTeamModal,
  EditTeamModal,
  DeleteTeamModal,
} from "./_components/team-modals";
import { TeamsListView } from "./_components/teams-list";
import { AllPeopleView } from "./_components/people-view";

/* ══════════════════════════════════════════════════════════════════
   SIDEBAR — painel lateral de navegacao
══════════════════════════════════════════════════════════════════ */

function TeamsPanel({
  teams,
  myTeamIds,
  isAdmin,
  onTeamClick,
  activeView,
  onViewChange,
}: {
  teams: TeamLocal[];
  myTeamIds: ReadonlySet<string>;
  /** ADMIN vê todas as equipes do workspace; membro só as suas. */
  isAdmin: boolean;
  onTeamClick?: (id: string) => void;
  activeView: SidebarView;
  onViewChange: (v: SidebarView) => void;
}) {
  // Equipes das quais o usuário participa — usado na seção "Minhas equipes" e,
  // para membros, também como a unica lista visível no nav.
  const myTeams = teams.filter(
    (t) => t.myCargo != null || myTeamIds.has(t.id),
  );
  const visibleTeams = isAdmin ? teams : myTeams;

  const navItems: {
    id: SidebarView | null;
    label: string;
    badge?: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "equipes",
      label: isAdmin ? "Todas as equipes" : "Minhas equipes",
      badge: visibleTeams.length > 0 ? String(visibleTeams.length) : undefined,
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

        {myTeams.length === 0 ? (
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
            {myTeams.map((t) => (
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
  const isAdmin = user?.orgRole === "ADMIN";
  const { data: apiTeams } = useTeams();
  const { data: myTeams = [] } = useMyTeams();
  const myTeamIds = useMemo(
    () => new Set(myTeams.map((team) => team.id)),
    [myTeams],
  );

  // Mock de pessoas — apenas o usuário logado por enquanto
  const mockPessoas = user
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
        myCargo: created.myCargo ?? "LEAD",
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
          myTeamIds={myTeamIds}
          isAdmin={isAdmin}
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
          myTeamIds={myTeamIds}
          isAdmin={isAdmin}
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
