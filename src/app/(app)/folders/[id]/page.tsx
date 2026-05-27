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
} from "lucide-react";
import {
  IcList,
  IcFolder,
  IcDoc,
  IcCaret,
  IcMenu,
  IcVoice,
  TopBtn,
  ListRow,
  AddListRow,
  DeleteListDialog,
} from "@/components/shell/entity-page";
import Link from "next/link";
import { AgentPopover } from "@/components/spaces/agent-popover";
import { CreateListDialog } from "@/components/spaces/create-list-dialog";
import { useProject, useLists, useArchiveProject } from "@/hooks/use-projects";
import {
  useBookmarks,
  useIsBookmarked,
  useToggleBookmark,
} from "@/hooks/use-bookmarks";
import { CommentsPanel } from "@/components/comments/CommentsPanel";
import { CommentTargetType } from "@/lib/types/comment";

/* ─── Tabs ────────────────────────────────────────────────────────────────── */
type TabId =
  | "overview"
  | "lista"
  | "quadro"
  | "calendario"
  | "gantt"
  | "tabela"
  | "comentarios";

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
  {
    id: "comentarios",
    label: "Comentários",
    icon: (
      <svg
        width={12}
        height={12}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#38bdf8"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

/* Render do painel de comentários — usado dentro do scroll container abaixo. */
function CommentsTab({ projectId }: { projectId: string }) {
  return (
    <div style={{ padding: "16px 0" }}>
      <CommentsPanel
        targetType={CommentTargetType.FOLDER}
        targetId={projectId}
      />
    </div>
  );
}

/* ─── Página ──────────────────────────────────────────────────────────────── */
export default function FolderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    nome: string;
  } | null>(null);
  const { mutate: archiveList, isPending: isDeleting } = useArchiveProject();

  const { data: entidade, isLoading } = useProject(id);
  const { data: listas = [] } = useLists(entidade ? id : null);
  const { data: bookmarks = [] } = useBookmarks();
  const { isBookmarked: folderBookmarked, bookmark: folderBookmark } =
    useIsBookmarked(id, "folder");
  const { toggle: toggleBookmark, isPending: isTogglingBookmark } =
    useToggleBookmark();
  const docs: typeof listas = [];
  const recentes = [...listas].slice(0, 6);

  // Favoritos que são filhos desta pasta (só listas — a própria pasta não aparece aqui)
  const childIds = new Set(listas.map((l) => l.id));
  const folderBookmarks = bookmarks.filter((bm) => childIds.has(bm.targetId));

  function bookmarkHref(bm: { targetId: string; targetType: string }): string {
    if (bm.targetType === "list") return `/lists/${bm.targetId}`;
    if (bm.targetType === "folder") return `/folders/${bm.targetId}`;
    return "/";
  }

  function bookmarkName(bm: { targetId: string; targetType: string }): string {
    if (bm.targetType === "folder") return entidade?.nome ?? "Pasta";
    return listas.find((l) => l.id === bm.targetId)?.nome ?? "Lista";
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
        Pasta não encontrada.
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
      {/* ── Topbar da pasta ── */}
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
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              display: "grid",
              placeItems: "center",
              width: 22,
              height: 22,
              borderRadius: 5,
              background: "var(--accent)",
            }}
          >
            <IcFolder />
          </div>
          <button
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              border: 0,
              background: "none",
              cursor: "pointer",
              color: "var(--foreground)",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {entidade.nome}
            <IcCaret />
          </button>
          <button
            type="button"
            aria-label={
              folderBookmarked
                ? "Remover dos favoritos"
                : "Adicionar aos favoritos"
            }
            disabled={isTogglingBookmark}
            onClick={() =>
              toggleBookmark({
                targetId: id,
                targetType: "folder",
                bookmarkId: folderBookmark?.id,
              })
            }
            style={{
              display: "grid",
              width: 24,
              height: 24,
              placeItems: "center",
              borderRadius: 5,
              border: 0,
              background: "none",
              cursor: "pointer",
              color: folderBookmarked ? "#f59e0b" : "var(--muted-foreground)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#f59e0b";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = folderBookmarked
                ? "#f59e0b"
                : "var(--muted-foreground)";
            }}
          >
            <Star size={14} fill={folderBookmarked ? "#f59e0b" : "none"} />
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
            href="https://scrumban.com.br/ia"
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
        {activeTab === "comentarios" && <CommentsTab projectId={id} />}
        {activeTab !== "comentarios" && (
          <>
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
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--foreground)";
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
                marginTop: "var(--section-gap)",
                marginBottom: "var(--section-gap)",
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
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 2 }}
                >
                  {recentes.length > 0 ? (
                    recentes.map((item) => (
                      <Link
                        key={item.id}
                        href={`/lists/${item.id}`}
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
                        <IcList />
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
                    ))
                  ) : (
                    <p
                      style={{ fontSize: 12, color: "var(--muted-foreground)" }}
                    >
                      Nada por aqui ainda
                    </p>
                  )}
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
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 2 }}
                >
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
                    <p
                      style={{ fontSize: 12, color: "var(--muted-foreground)" }}
                    >
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
                {folderBookmarks.length > 0 ? (
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    {folderBookmarks.map((bm) => (
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
                          (e.currentTarget as HTMLElement).style.background =
                            "var(--accent)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background =
                            "transparent";
                        }}
                      >
                        <span style={{ flexShrink: 0 }}>
                          {bm.targetType === "list" ? <IcList /> : <IcFolder />}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            color: "var(--foreground)",
                            fontWeight: 500,
                          }}
                        >
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
                    minHeight: "calc(var(--row-h) - 6px)",
                    borderBottom: "1px solid var(--border)",
                    padding: "0 16px",
                    background: "var(--card)",
                    alignItems: "center",
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
                  listas.map((lista) => {
                    const bm = bookmarks.find(
                      (b) => b.targetId === lista.id && b.targetType === "list",
                    );
                    return (
                      <ListRow
                        key={lista.id}
                        id={lista.id}
                        nome={lista.nome}
                        isBookmarked={!!bm}
                        onBookmark={() =>
                          toggleBookmark({
                            targetId: lista.id,
                            targetType: "list",
                            bookmarkId: bm?.id,
                          })
                        }
                        onDelete={() =>
                          setDeleteTarget({ id: lista.id, nome: lista.nome })
                        }
                      />
                    );
                  })
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
          </>
        )}
      </div>

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
