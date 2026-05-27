"use client";

import { use, useState } from "react";
import {
  Star,
  Share2,
  Sparkles,
  Plus,
  Filter,
  RefreshCw,
  LayoutGrid,
  Maximize2,
} from "lucide-react";
import { SpaceChip } from "@/components/shell/space-chip";
import {
  IcList,
  IcFolder,
  IcDoc,
  IcMenu,
  IcVoice,
  TopBtn,
  ListRow,
  AddListRow,
  DeleteListDialog,
} from "@/components/shell/entity-page";
import Link from "next/link";
import { AgentPopover } from "@/components/spaces/agent-popover";
import { SpaceSwitcher } from "@/components/spaces/space-switcher";
import { CreateFolderDialog } from "@/components/spaces/create-folder-dialog";
import { CreateListDialog } from "@/components/spaces/create-list-dialog";
import { useSpaces, useFolders, useLists, useArchiveProject } from "@/hooks/use-projects";
import { useBookmarks } from "@/hooks/use-bookmarks";

/* ─── Tabs ────────────────────────────────────────────────────────────────── */
type TabId =
  | "overview"
  | "lista"
  | "quadro"
  | "calendario"
  | "gantt"
  | "tabela";

const TABS: { id: TabId; label: string; icon?: React.ReactNode }[] = [
  { id: "overview", label: "Overview" },
  {
    id: "lista",
    label: "Lista",
    icon: (
      <svg width={12} height={12} viewBox="0 0 18 18" fill="none">
        <path
          d="M2 4.5 L4.5 7 L7 3"
          stroke="#e879f9"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line
          x1="9"
          y1="5"
          x2="16"
          y2="5"
          stroke="#e879f9"
          strokeWidth={1.6}
          strokeLinecap="round"
        />
        <path
          d="M2 10.5 L4.5 13 L7 9"
          stroke="#e879f9"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line
          x1="9"
          y1="11"
          x2="16"
          y2="11"
          stroke="#e879f9"
          strokeWidth={1.6}
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "quadro",
    label: "Quadro",
    icon: (
      <svg
        width={12}
        height={12}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#60a5fa"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="5" height="18" rx="1" />
        <rect x="10" y="3" width="5" height="12" rx="1" />
        <rect x="17" y="3" width="5" height="15" rx="1" />
      </svg>
    ),
  },
  {
    id: "calendario",
    label: "Calendário",
    icon: (
      <svg
        width={12}
        height={12}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#f97316"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
    ),
  },
  {
    id: "gantt",
    label: "Gantt",
    icon: (
      <svg
        width={12}
        height={12}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#22c55e"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="3" y1="6" x2="14" y2="6" />
        <line x1="7" y1="12" x2="20" y2="12" />
        <line x1="3" y1="18" x2="16" y2="18" />
      </svg>
    ),
  },
  {
    id: "tabela",
    label: "Tabela",
    icon: (
      <svg
        width={12}
        height={12}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#a78bfa"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M3 15h18M9 3v18" />
      </svg>
    ),
  },
];

/* ─── Página ──────────────────────────────────────────────────────────────── */
export default function SpacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nome: string } | null>(null);
  const { mutate: archiveList, isPending: isDeleting } = useArchiveProject();

  const { data: spaces, isLoading } = useSpaces();
  const entidade = spaces?.find((s) => s.id === id) ?? null;
  const { data: pastas = [] } = useFolders(entidade ? id : null);
  const { data: listas = [] } = useLists(entidade ? id : null);
  const { data: bookmarks = [] } = useBookmarks();
  const docs: typeof listas = [];
  const recentes = [...pastas, ...listas].slice(0, 6);

  // Favoritos que são filhos deste espaço (pasta ou lista) ou o próprio espaço
  const childIds = new Set([
    id,
    ...pastas.map((p) => p.id),
    ...listas.map((l) => l.id),
  ]);
  const spaceBookmarks = bookmarks.filter((bm) => childIds.has(bm.targetId));

  function bookmarkHref(bm: { targetId: string; targetType: string }): string {
    if (bm.targetType === "folder") return `/folders/${bm.targetId}`;
    if (bm.targetType === "list") return `/lists/${bm.targetId}`;
    if (bm.targetType === "space") return `/spaces/${bm.targetId}`;
    return "/";
  }

  function bookmarkName(bm: { targetId: string; targetType: string }): string {
    if (bm.targetType === "space") return entidade?.nome ?? "Espaço";
    const pasta = pastas.find((p) => p.id === bm.targetId);
    if (pasta) return pasta.nome;
    const lista = listas.find((l) => l.id === bm.targetId);
    if (lista) return lista.nome;
    return "Favorito";
  }

  if (isLoading) {
    return (
      <div style={{ color: "var(--muted-foreground)", padding: 40 }}>
        Carregando…
      </div>
    );
  }

  if (!entidade) {
    return (
      <div style={{ color: "var(--muted-foreground)", padding: 40 }}>
        Espaço não encontrado.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--background)",
        overflow: "hidden",
      }}
    >
      {/* ── Topbar do espaço ── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          height: 44,
          flexShrink: 0,
          borderBottom: "1px solid var(--border)",
          background: "var(--background)",
        }}
      >
        {/* esquerda: chip + nome + estrela + menu */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <SpaceChip
            iniciais={entidade.nome.slice(0, 2).toUpperCase()}
            cor={entidade.color ?? "#6366f1"}
            iconName={entidade.icon}
            size="sm"
          />
          <SpaceSwitcher currentSpaceId={id} currentSpaceName={entidade.nome} />
          <button
            type="button"
            style={{
              display: "grid",
              width: 24,
              height: 24,
              placeItems: "center",
              borderRadius: 5,
              border: 0,
              background: "none",
              cursor: "pointer",
              color: "var(--muted-foreground)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#f59e0b";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--muted-foreground)";
            }}
          >
            <Star size={14} />
          </button>
          <button
            type="button"
            style={{
              display: "grid",
              width: 24,
              height: 24,
              placeItems: "center",
              borderRadius: 5,
              border: 0,
              background: "none",
              cursor: "pointer",
              color: "var(--muted-foreground)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--foreground)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--muted-foreground)";
            }}
          >
            <IcMenu />
          </button>
        </div>

        {/* direita: ações */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <TopBtn icon={<IcVoice />} />
          <div
            style={{
              width: 1,
              height: 16,
              background: "var(--border)",
              margin: "0 4px",
            }}
          />
          <AgentPopover projectId={id} projectName={entidade.nome} />
          <TopBtn icon={<Sparkles size={14} />} />
          <TopBtn
            icon={<span style={{ fontSize: 13 }}>✦</span>}
            label="Pergunte à IA"
          />
          <div
            style={{
              width: 1,
              height: 16,
              background: "var(--border)",
              margin: "0 4px",
            }}
          />
          <button
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              height: 28,
              padding: "0 12px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "none",
              cursor: "pointer",
              color: "var(--foreground)",
              fontSize: 12,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
            }}
          >
            <Share2 size={13} />
            Compartilhar
          </button>
        </div>
      </header>

      {/* ── Tabs ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          padding: "0 16px",
          height: 38,
          flexShrink: 0,
          borderBottom: "1px solid var(--border)",
          background: "var(--background)",
          overflowX: "auto",
        }}
      >
        {/* Adicionar canal */}
        <button
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            height: 36,
            padding: "0 10px",
            border: 0,
            background: "none",
            cursor: "pointer",
            color: "var(--muted-foreground)",
            fontSize: 12,
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--foreground)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--muted-foreground)";
          }}
        >
          <Plus size={12} />
          Adicionar canal
        </button>

        <div
          style={{
            width: 1,
            height: 16,
            background: "var(--border)",
            margin: "0 2px",
          }}
        />

        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              height: 36,
              padding: "0 10px",
              borderRadius: 0,
              border: 0,
              background: "none",
              cursor: "pointer",
              color:
                activeTab === tab.id
                  ? "var(--foreground)"
                  : "var(--muted-foreground)",
              fontSize: 12,
              fontWeight: activeTab === tab.id ? 600 : 400,
              borderBottom:
                activeTab === tab.id
                  ? "2px solid #7c3aed"
                  : "2px solid transparent",
              whiteSpace: "nowrap",
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
            {tab.icon && <span>{tab.icon}</span>}
            {tab.label}
          </button>
        ))}

        <button
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            height: 36,
            padding: "0 10px",
            border: 0,
            background: "none",
            cursor: "pointer",
            color: "var(--muted-foreground)",
            fontSize: 12,
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--foreground)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--muted-foreground)";
          }}
        >
          <Plus size={12} />
          Visualização
        </button>
      </div>

      {/* ── Conteúdo scrollável ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 40px" }}>
        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 44,
            borderBottom: "1px solid var(--border)",
          }}
        >
          <button
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              height: 28,
              padding: "0 10px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "none",
              cursor: "pointer",
              color: "var(--muted-foreground)",
              fontSize: 12,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
            }}
          >
            <Filter size={11} />
            Filtros
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                color: "var(--muted-foreground)",
              }}
            >
              <RefreshCw size={11} />
              Atualização: 10 minutos atrás
            </span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                color: "var(--muted-foreground)",
              }}
            >
              <RefreshCw size={11} style={{ color: "#22c55e" }} />
              Atualização automática: Ligado
            </span>
            <button
              type="button"
              style={{
                fontSize: 12,
                color: "var(--muted-foreground)",
                border: 0,
                background: "none",
                cursor: "pointer",
                padding: "0 6px",
              }}
            >
              Personalizar
            </button>
            <button
              type="button"
              style={{
                height: 28,
                padding: "0 12px",
                borderRadius: 6,
                border: 0,
                background: "var(--primary)",
                cursor: "pointer",
                color: "var(--primary-foreground)",
                fontSize: 12,
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
              Adicionar cartão
            </button>
          </div>
        </div>

        {/* ── Cards: Recent | Docs | Bookmarks ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
            marginTop: 16,
            marginBottom: 16,
          }}
        >
          {/* Recent */}
          <div
            style={{
              background: "var(--card)",
              borderRadius: 10,
              border: "1px solid var(--border)",
              padding: "16px 18px",
              minHeight: 200,
            }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--muted-foreground)",
                marginBottom: 12,
              }}
            >
              Recent
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {recentes.map((item) => {
                const href =
                  item.idClasse === "-351"
                    ? `/folders/${item.id}`
                    : item.idClasse === "-352"
                      ? `/lists/${item.id}`
                      : `/docs/${item.id}`;
                return (
                  <Link
                    key={item.id}
                    href={href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      padding: "5px 8px",
                      margin: "0 -8px",
                      borderRadius: 6,
                      textDecoration: "none",
                      transition: "background 120ms",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "var(--accent)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "transparent";
                    }}
                  >
                    <span style={{ flexShrink: 0 }}>
                      {item.idClasse === "-351" ? (
                        <IcFolder />
                      ) : item.idClasse === "-352" ? (
                        <IcList />
                      ) : (
                        <IcDoc />
                      )}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--foreground)",
                        fontWeight: 500,
                      }}
                    >
                      {item.nome}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Docs */}
          <div
            style={{
              background: "var(--card)",
              borderRadius: 10,
              border: "1px solid var(--border)",
              padding: "16px 18px",
              minHeight: 200,
            }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--muted-foreground)",
                marginBottom: 12,
              }}
            >
              Docs
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {docs.length > 0 ? (
                docs.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/docs/${doc.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      padding: "5px 8px",
                      margin: "0 -8px",
                      borderRadius: 6,
                      textDecoration: "none",
                      transition: "background 120ms",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "var(--accent)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "transparent";
                    }}
                  >
                    <IcDoc />
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--foreground)",
                        fontWeight: 500,
                      }}
                    >
                      {doc.nome}
                    </span>
                  </Link>
                ))
              ) : (
                <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                  Nenhum documento ainda
                </p>
              )}
            </div>
          </div>

          {/* Bookmarks */}
          <div
            style={{
              background: "var(--card)",
              borderRadius: 10,
              border: "1px solid var(--border)",
              padding: "16px 18px",
              minHeight: 200,
            }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--muted-foreground)",
                marginBottom: 12,
              }}
            >
              Bookmarks
            </p>
            {spaceBookmarks.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {spaceBookmarks.map((bm) => (
                  <Link
                    key={bm.id}
                    href={bookmarkHref(bm)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      padding: "5px 8px",
                      margin: "0 -8px",
                      borderRadius: 6,
                      textDecoration: "none",
                      transition: "background 120ms",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "var(--accent)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <span style={{ flexShrink: 0 }}>
                      {bm.targetType === "folder" ? (
                        <IcFolder />
                      ) : bm.targetType === "list" ? (
                        <IcList />
                      ) : (
                        <IcDoc />
                      )}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--foreground)", fontWeight: 500 }}>
                      {bookmarkName(bm)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                Nenhum favorito ainda
              </p>
            )}
          </div>
        </div>

        {/* ── Folders — container próprio com borda ── */}
        {pastas.length > 0 && (
          <section
            style={{
              marginBottom: 12,
              border: "1px solid var(--border)",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                borderBottom: "1px solid var(--border)",
                background: "var(--card)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <LayoutGrid
                  size={13}
                  style={{ color: "var(--muted-foreground)" }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--foreground)",
                  }}
                >
                  Folders
                </span>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  type="button"
                  style={{
                    width: 24,
                    height: 24,
                    display: "grid",
                    placeItems: "center",
                    border: 0,
                    background: "none",
                    cursor: "pointer",
                    color: "var(--muted-foreground)",
                    borderRadius: 5,
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
                  <Maximize2 size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => setFolderDialogOpen(true)}
                  title="Criar pasta"
                  aria-label="Criar pasta"
                  style={{
                    width: 24,
                    height: 24,
                    display: "grid",
                    placeItems: "center",
                    border: 0,
                    background: "none",
                    cursor: "pointer",
                    color: "var(--muted-foreground)",
                    borderRadius: 5,
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
                  <Plus size={13} />
                </button>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                padding: "14px 16px",
                background: "var(--background)",
                minHeight: "28vh",
                maxHeight: "33vh",
                overflowY: "auto",
                alignContent: "flex-start",
              }}
            >
              {pastas.map((pasta) => (
                <Link
                  key={pasta.id}
                  href={`/folders/${pasta.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: 200,
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--card)";
                  }}
                >
                  <IcFolder color="#9ca3af" />
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--foreground)",
                      fontWeight: 500,
                    }}
                  >
                    {pasta.nome}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Lists — container próprio com borda ── */}
        <section
          style={{
            border: "1px solid var(--border)",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 16px",
              borderBottom: "1px solid var(--border)",
              background: "var(--card)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <LayoutGrid
                size={13}
                style={{ color: "var(--muted-foreground)" }}
              />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--foreground)",
                }}
              >
                Lists
              </span>
            </div>
          </div>

          <div
            style={{
              background: "var(--background)",
              minHeight: "28vh",
              maxHeight: "33vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(0,1fr) 80px 180px 120px 120px 100px 100px 36px",
                height: 34,
                borderBottom: "1px solid var(--border)",
                padding: "0 16px",
                background: "var(--card)",
              }}
            >
              {[
                "Nome",
                "Cor",
                "Progresso",
                "Início",
                "Término",
                "Prioridade",
                "Proprietário",
                "",
              ].map((col, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: 11,
                    color: "var(--muted-foreground)",
                    fontWeight: 500,
                  }}
                >
                  {col}
                </div>
              ))}
            </div>

            {listas.length > 0 ? (
              listas.map((lista) => (
                <ListRow
                  key={lista.id}
                  id={lista.id}
                  nome={lista.nome}
                  onDelete={() => setDeleteTarget({ id: lista.id, nome: lista.nome })}
                />
              ))
            ) : (
              <div
                style={{
                  padding: "20px 16px",
                  fontSize: 12,
                  color: "var(--muted-foreground)",
                }}
              >
                Nenhuma lista ainda
              </div>
            )}

            <AddListRow onClick={() => setListDialogOpen(true)} />
          </div>
        </section>
      </div>

      <CreateFolderDialog
        spaceId={id}
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
      />
      <CreateListDialog
        parentId={id}
        parentName={entidade?.nome ?? ""}
        open={listDialogOpen}
        onOpenChange={setListDialogOpen}
      />
      <DeleteListDialog
        open={!!deleteTarget}
        listName={deleteTarget?.nome ?? ""}
        isPending={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          archiveList(
            { id: deleteTarget.id, idClasse: "-352", idPai: id },
            { onSuccess: () => setDeleteTarget(null) },
          );
        }}
      />
    </div>
  );
}
