"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, ChevronRight, Plus, Star, Settings2, Search, Folder, List, Users } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { SpaceTree } from "@/components/spaces/space-tree";
import { PlannerPanel } from "./planner-panel";
import { FormsPanel } from "./forms-panel";
import { DocsPanel } from "./docs-panel";
import { useMe } from "@/hooks/use-auth";
import { useQueries } from "@tanstack/react-query";
import { useSpaces } from "@/hooks/use-projects";
import { useTeams } from "@/hooks/use-teams";
import { useToggleBookmark, useBookmarks } from "@/hooks/use-bookmarks";
import { useAuthStore } from "@/lib/stores/auth";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { DProjectDto } from "@/lib/types/api";

/* ─── Ícones SVG custom — pixel-perfect ClickUp ──────────────────────────── */

/* Caixa de entrada — bandeja com seta entrando */
function IcInbox() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-6l-2 3H10l-2-3H2" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

/* Respostas — seta de reply curvada */
function IcReply() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 17L4 12l5-5" />
      <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
  );
}

/* Comentários atribuídos — balão de chat com @ */
function IcMentions() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
    </svg>
  );
}

/* Minhas tarefas — pessoa com check mark */
function IcMyTasks() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M16 11l2 2 4-4" />
    </svg>
  );
}

/* Mais — três pontos */
function IcMore() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

/* Favoritos — estrela outline */
function IcStar() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

/* Canal de anúncio — antena com sinal (igual ClickUp Geral) */
function IcChannel() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35z" />
      <path d="M6 18h12" />
      <path d="M6 14h12" />
      <path d="M6 10h12" />
    </svg>
  );
}

/* Canal público — hashtag */
function IcHash() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}

/* ─── Tipos ───────────────────────────────────────────────────────────────── */
type LeafItem = {
  href: string;
  label: string;
  suffix?: string;
  renderIcon: () => React.ReactNode;
  badge?: string;
};

type TreeItem = LeafItem & {
  children?: LeafItem[];
};

/* ─── Dados de navegação ─────────────────────────────────────────────────── */
const homeItems: TreeItem[] = [
  { href: "/inbox", label: "Caixa de entrada", renderIcon: () => <IcInbox /> },
  { href: "/replies", label: "Respostas", renderIcon: () => <IcReply /> },
  {
    href: "/mentions",
    label: "Comentários atribuídos",
    renderIcon: () => <IcMentions />,
  },
  {
    href: "/assigned",
    label: "Minhas tarefas",
    renderIcon: () => <IcMyTasks />,
  },
];

type Section = {
  id: string;
  label: string;
  items: LeafItem[];
  showAddButton?: boolean;
};

function buildSections(orgName?: string): Section[] {
  return [
    {
      id: "favoritos",
      label: "Favoritos",
      items: [
        {
          href: "/favorites",
          label: "Adicione à sua barra lateral",
          renderIcon: () => <IcStar />,
        },
      ],
    },
    {
      id: "canais",
      label: "Canais",
      showAddButton: true,
      items: [
        {
          href: "/channels/geral",
          label: "Geral",
          suffix: orgName,
          renderIcon: () => <IcChannel />,
        },
        {
          href: "/channels/welcome",
          label: "Welcome",
          suffix: orgName,
          renderIcon: () => <IcHash />,
        },
      ],
    },
  ];
}

/* ─── Mais — dropdown ────────────────────────────────────────────────────── */

type MoreEntry = {
  id: string;
  label: string;
  renderIcon: () => React.ReactNode;
  href?: string;
};

const MORE_ENTRIES: MoreEntry[] = [
  {
    id: "chat-activity",
    label: "Atividade do chat",
    href: "/chat-activity",
    renderIcon: () => (
      <svg
        width={15}
        height={15}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "drafts",
    label: "Rascunhos e enviadas",
    href: "/drafts",
    renderIcon: () => (
      <svg
        width={15}
        height={15}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 2L11 13" />
        <path d="M22 2L15 22l-4-9-9-4 20-7z" />
      </svg>
    ),
  },
  {
    id: "posts",
    label: "Posts",
    href: "/posts",
    renderIcon: () => (
      <svg
        width={15}
        height={15}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    id: "all-channels",
    label: "Todos os canais",
    href: "/channels/geral",
    renderIcon: () => (
      <svg
        width={15}
        height={15}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="4" y1="9" x2="20" y2="9" />
        <line x1="4" y1="15" x2="20" y2="15" />
        <line x1="10" y1="3" x2="8" y2="21" />
        <line x1="16" y1="3" x2="14" y2="21" />
      </svg>
    ),
  },
  {
    id: "all-spaces",
    label: "Todos os Espaços",
    href: "/spaces",
    renderIcon: () => (
      <svg
        width={15}
        height={15}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: "all-tasks",
    label: "Minhas tarefas",
    href: "/assigned",
    renderIcon: () => (
      <svg
        width={15}
        height={15}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function MoreItem() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "group flex h-[34px] w-full items-center gap-2 rounded-[5px] px-3 text-[13px] text-sidebar-foreground/80 transition-colors",
          "hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
          open && "bg-sidebar-accent text-sidebar-accent-foreground",
        )}
      >
        <span className="shrink-0 text-muted-foreground">
          <IcMore />
        </span>
        <span className="flex-1 text-left">Mais</span>
      </button>

      {open && (
        <div
          className="absolute z-50 overflow-hidden rounded-lg border border-border bg-popover shadow-xl"
          style={{ left: "100%", top: 0, marginLeft: 6, width: 240 }}
        >
          {/* itens principais */}
          <div className="py-1.5">
            {MORE_ENTRIES.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (entry.href) router.push(entry.href);
                }}
                className="group flex h-9 w-full items-center gap-3 px-3 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <span className="shrink-0">{entry.renderIcon()}</span>
                <span className="flex-1 text-left">{entry.label}</span>
                <Star className="size-3.5 shrink-0 opacity-0 group-hover:opacity-40 transition-opacity" />
              </button>
            ))}
          </div>

          {/* divisor + Personalizar */}
          <div className="border-t border-border py-1.5">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-9 w-full items-center gap-3 px-3 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Settings2 className="size-3.5 shrink-0" />
              <span>Personalizar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Item folha ──────────────────────────────────────────────────────────── */
function Leaf({
  item,
  depth = 0,
  active,
}: {
  item: LeafItem;
  depth?: number;
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      data-active={active ? "" : undefined}
      style={depth ? { paddingLeft: `${0.5 + depth * 1.125}rem` } : undefined}
      className={cn(
        "group flex h-[34px] items-center gap-2 rounded-[5px] px-3 text-[13px] text-sidebar-foreground/80 outline-none transition-colors",
        "hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        "focus-visible:bg-sidebar-accent focus-visible:text-sidebar-accent-foreground focus-visible:ring-1 focus-visible:ring-sidebar-ring",
        "data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground data-active:font-medium",
      )}
    >
      <span className="shrink-0 text-muted-foreground group-data-active:text-sidebar-accent-foreground">
        {item.renderIcon()}
      </span>
      <span className="flex-1 truncate">
        {item.label}
        {item.suffix && (
          <span className="ml-1 text-[13px] text-sidebar-foreground/50">{`- ${item.suffix}`}</span>
        )}
      </span>
      {item.badge && (
        <span className="rounded bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

/* ─── Item expansível (com filhos) ───────────────────────────────────────── */
function ExpandableItem({
  item,
  active,
  activeHref,
}: {
  item: TreeItem;
  active: boolean;
  activeHref: string;
}) {
  const [open, setOpen] = useState(true);

  if (!item.children) {
    return <Leaf item={item} active={active} />;
  }

  return (
    <div>
      <div
        className={cn(
          "group flex h-[34px] items-center rounded-[4px] text-[13px] text-sidebar-foreground/80 transition-colors",
          "hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
          active &&
            "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
        )}
      >
        <button
          type="button"
          aria-label={open ? "Colapsar" : "Expandir"}
          onClick={() => setOpen((v) => !v)}
          className="grid h-full w-5 place-items-center text-muted-foreground hover:text-foreground"
        >
          {open ? (
            <ChevronDown className="size-3" />
          ) : (
            <ChevronRight className="size-3" />
          )}
        </button>
        <Link
          href={item.href}
          className="flex h-full flex-1 items-center gap-2 pr-2 outline-none"
        >
          <span className="shrink-0 text-muted-foreground">
            {item.renderIcon()}
          </span>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && (
            <span className="rounded bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
              {item.badge}
            </span>
          )}
        </Link>
      </div>

      {open && (
        <ul className="mt-px space-y-px">
          {item.children.map((child) => (
            <li key={child.href}>
              <Leaf item={child} depth={1} active={activeHref === child.href} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ─── Ícone de Space (chip colorido mini) ─────────────────────────────────── */
function SpaceChipMini({ name, color }: { name: string; color?: string | null }) {
  const FALLBACK_COLORS = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#14b8a6"];
  const bg = color ?? FALLBACK_COLORS[name.charCodeAt(0) % FALLBACK_COLORS.length];
  return (
    <span
      className="grid size-4 shrink-0 place-items-center rounded text-[9px] font-bold text-white"
      style={{ background: bg }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

/* ─── Sub-hook: agrega pastas e listas de todos os espaços ───────────────── */
function useAllFoldersAndLists(spaceIds: string[], enabled: boolean) {
  const accessToken = useAuthStore((s) => s.accessToken);

  // Pastas de cada espaço
  const folderQueries = useQueries({
    queries: spaceIds.map((id) => ({
      queryKey: qk.projects.folders(id),
      queryFn: async () => {
        const res = await api.get<{ items: DProjectDto[] }>("/projects", {
          params: { idClasse: "-351", idPai: id, limit: 100 },
        });
        return res.data.items;
      },
      enabled: enabled && !!accessToken,
      staleTime: 30_000,
    })),
  });

  // Listas diretas de cada espaço (Space → List)
  const spaceListQueries = useQueries({
    queries: spaceIds.map((id) => ({
      queryKey: qk.projects.lists(id),
      queryFn: async () => {
        const res = await api.get<{ items: DProjectDto[] }>("/projects", {
          params: { idClasse: "-352", idPai: id, limit: 100 },
        });
        return res.data.items;
      },
      enabled: enabled && !!accessToken,
      staleTime: 30_000,
    })),
  });

  const folders = folderQueries.flatMap((q) => q.data ?? []);
  const folderIds = folders.map((f) => f.id);

  // Listas dentro de cada pasta (Folder → List)
  const folderListQueries = useQueries({
    queries: folderIds.map((fid) => ({
      queryKey: qk.projects.lists(fid),
      queryFn: async () => {
        const res = await api.get<{ items: DProjectDto[] }>("/projects", {
          params: { idClasse: "-352", idPai: fid, limit: 100 },
        });
        return res.data.items;
      },
      enabled: enabled && !!accessToken && folderIds.length > 0,
      staleTime: 30_000,
    })),
  });

  const spaceLists = spaceListQueries.flatMap((q) => q.data ?? []);
  const folderLists = folderListQueries.flatMap((q) => q.data ?? []);
  // Dedup por ID caso uma lista apareça em ambas as queries
  const listMap = new Map<string, DProjectDto>();
  [...spaceLists, ...folderLists].forEach((l) => listMap.set(l.id, l));
  const lists = Array.from(listMap.values());

  return { folders, lists };
}

/* ─── Lista global de favoritos na sidebar ────────────────────────────────── */
function FavoritesList() {
  const { data: bookmarks = [], isLoading } = useBookmarks();
  const { data: spaces = [] } = useSpaces();
  const { data: teamsData } = useTeams();
  const teams = teamsData ?? [];
  const { toggle, isPending } = useToggleBookmark();
  const pathname = usePathname();

  const spaceIds = useMemo(() => spaces.map((s) => s.id), [spaces]);
  const { folders, lists } = useAllFoldersAndLists(spaceIds, bookmarks.length > 0);

  if (isLoading || bookmarks.length === 0) return null;

  const spaceMap = new Map(spaces.map((s) => [s.id, s]));
  const folderMap = new Map((folders as DProjectDto[]).map((f) => [f.id, f]));
  const listMap = new Map((lists as DProjectDto[]).map((l) => [l.id, l]));
  const teamMap = new Map((teams as { id: string; nome: string }[]).map((t) => [t.id, t]));

  function resolveHref(bm: { targetId: string; targetType: string }): string {
    switch (bm.targetType) {
      case "space": return `/spaces/${bm.targetId}`;
      case "folder": return `/folders/${bm.targetId}`;
      case "list": return `/lists/${bm.targetId}`;
      case "team": return `/teams/${bm.targetId}`;
      default: return "/";
    }
  }

  function resolveName(bm: { targetId: string; targetType: string }): string {
    switch (bm.targetType) {
      case "space": return spaceMap.get(bm.targetId)?.nome ?? "Espaço";
      case "folder": return folderMap.get(bm.targetId)?.nome ?? "Pasta";
      case "list": return listMap.get(bm.targetId)?.nome ?? "Lista";
      case "team": return teamMap.get(bm.targetId)?.nome ?? "Time";
      default: return "Favorito";
    }
  }

  function renderIcon(bm: { targetId: string; targetType: string }) {
    if (bm.targetType === "space") {
      const space = spaceMap.get(bm.targetId);
      return <SpaceChipMini name={space?.nome ?? "S"} color={space?.color} />;
    }
    if (bm.targetType === "folder") return <Folder className="size-3.5 shrink-0 text-muted-foreground" />;
    if (bm.targetType === "list") return <List className="size-3.5 shrink-0 text-muted-foreground" />;
    if (bm.targetType === "team") return <Users className="size-3.5 shrink-0 text-muted-foreground" />;
    return <IcStar />;
  }

  return (
    <>
      {bookmarks.map((bm) => {
        const href = resolveHref(bm);
        const name = resolveName(bm);
        const isActive = pathname === href;
        return (
          <li key={bm.id} className="group relative">
            <Link
              href={href}
              data-active={isActive ? "" : undefined}
              className={cn(
                "flex h-[34px] items-center gap-2 rounded-[5px] px-3 text-[13px] text-sidebar-foreground/80 outline-none transition-colors",
                "hover:bg-sidebar-accent/50 hover:text-sidebar-foreground pr-8",
                "data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground data-active:font-medium",
              )}
            >
              <span className="shrink-0 text-muted-foreground">{renderIcon(bm)}</span>
              <span className="flex-1 truncate">{name}</span>
            </Link>
            <button
              type="button"
              aria-label="Remover dos favoritos"
              disabled={isPending}
              onClick={() => toggle({ targetId: bm.targetId, targetType: bm.targetType as "space" | "folder" | "list" | "team", bookmarkId: bm.id })}
              className="absolute right-2 top-1/2 -translate-y-1/2 grid size-5 place-items-center rounded text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <Star className="size-3 fill-yellow-400 text-yellow-400" />
            </button>
          </li>
        );
      })}
    </>
  );
}

/* ─── Dropdown "Adicionar à sua barra lateral" ────────────────────────────── */
function AddFavoriteDropdown() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: spaces = [] } = useSpaces();
  const spaceIds = useMemo(() => spaces.map((s) => s.id), [spaces]);
  const { folders: allFolders, lists: allLists } = useAllFoldersAndLists(spaceIds, open);
  const { data: teamsData } = useTeams();
  const teams = teamsData ?? [];

  const { data: bookmarks = [] } = useBookmarks();
  const bookmarkedIds = useMemo(() => new Set(bookmarks.map((b) => b.targetId)), [bookmarks]);

  const { toggle, isPending } = useToggleBookmark();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const q = search.toLowerCase();

  const filteredSpaces = spaces.filter((s) => s.nome.toLowerCase().includes(q));
  const filteredFolders = (allFolders as DProjectDto[]).filter((f) => f.nome.toLowerCase().includes(q));
  const filteredLists = (allLists as DProjectDto[]).filter((l) => l.nome.toLowerCase().includes(q));
  const filteredTeams = teams.filter((t: { nome: string }) => t.nome.toLowerCase().includes(q));

  const hasResults =
    filteredSpaces.length + filteredFolders.length + filteredLists.length + filteredTeams.length > 0;

  function handleToggle(targetId: string, targetType: "space" | "folder" | "list" | "team") {
    const existing = bookmarks.find((b) => b.targetId === targetId && b.targetType === targetType);
    toggle({ targetId, targetType, bookmarkId: existing?.id });
  }

  return (
    <div ref={ref}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => {
          const rect = btnRef.current?.getBoundingClientRect();
          if (rect) setPos({ top: rect.top, left: rect.right + 6 });
          setOpen((v) => !v);
        }}
        className={cn(
          "group flex h-[34px] w-full items-center gap-2 rounded-[5px] px-3 text-[13px] text-sidebar-foreground/80 transition-colors",
          "hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
          open && "bg-sidebar-accent/50 text-sidebar-foreground",
        )}
      >
        <span className="shrink-0 text-muted-foreground group-hover:text-sidebar-foreground">
          <IcStar />
        </span>
        <span className="flex-1 text-left">Adicione à sua barra lateral</span>
      </button>

      {open && typeof window !== "undefined" && (
        <div
          className="fixed z-50 flex flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-2xl"
          style={{
            top: pos.top,
            left: pos.left,
            width: 260,
          }}
          ref={ref}
        >
          {/* campo de busca */}
          <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/60 outline-none"
            />
          </div>

          <div
            style={{
              overflowY: "auto",
              maxHeight: Math.min(360, window.innerHeight - pos.top - 48),
            }}
          >
            <div className="py-1.5">
              {!hasResults && (
                <p className="px-3 py-4 text-center text-[12px] text-muted-foreground">
                  Nenhum resultado
                </p>
              )}

              {/* Espaços */}
              {filteredSpaces.length > 0 && (
                <div>
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Espaços
                  </p>
                  {filteredSpaces.map((space) => {
                    const active = bookmarkedIds.has(space.id);
                    return (
                      <button
                        key={space.id}
                        type="button"
                        disabled={isPending}
                        onClick={() => handleToggle(space.id, "space")}
                        className="flex h-9 w-full items-center gap-2.5 px-3 text-[13px] text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <SpaceChipMini name={space.nome} color={space.color} />
                        <span className="flex-1 truncate text-left">{space.nome}</span>
                        <Star className={cn("size-3.5 shrink-0 transition-colors", active ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40")} />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Pastas */}
              {filteredFolders.length > 0 && (
                <div>
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Pastas
                  </p>
                  {filteredFolders.map((folder) => {
                    const active = bookmarkedIds.has(folder.id);
                    return (
                      <button
                        key={folder.id}
                        type="button"
                        disabled={isPending}
                        onClick={() => handleToggle(folder.id, "folder")}
                        className="flex h-9 w-full items-center gap-2.5 px-3 text-[13px] text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Folder className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate text-left">{folder.nome}</span>
                        <Star className={cn("size-3.5 shrink-0 transition-colors", active ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40")} />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Listas */}
              {filteredLists.length > 0 && (
                <div>
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Listas
                  </p>
                  {filteredLists.map((list) => {
                    const active = bookmarkedIds.has(list.id);
                    return (
                      <button
                        key={list.id}
                        type="button"
                        disabled={isPending}
                        onClick={() => handleToggle(list.id, "list")}
                        className="flex h-9 w-full items-center gap-2.5 px-3 text-[13px] text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <List className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate text-left">{list.nome}</span>
                        <Star className={cn("size-3.5 shrink-0 transition-colors", active ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40")} />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Times */}
              {filteredTeams.length > 0 && (
                <div>
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Times
                  </p>
                  {filteredTeams.map((team: { id: string; nome: string }) => {
                    const active = bookmarkedIds.has(team.id);
                    return (
                      <button
                        key={team.id}
                        type="button"
                        disabled={isPending}
                        onClick={() => handleToggle(team.id, "team")}
                        className="flex h-9 w-full items-center gap-2.5 px-3 text-[13px] text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Users className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate text-left">{team.nome}</span>
                        <Star className={cn("size-3.5 shrink-0 transition-colors", active ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40")} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Bloco de seção colapsável ───────────────────────────────────────────── */
function SectionBlock({ section }: { section: Section }) {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();

  return (
    <div>
      <div className="mb-1 flex h-7 items-center justify-between px-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-1 text-[12px] font-semibold text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground"
        >
          {section.label}
        </button>
        {section.showAddButton && (
          <button
            type="button"
            aria-label={`Adicionar em ${section.label}`}
            className="grid size-4 place-items-center rounded text-muted-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Plus className="size-3" />
          </button>
        )}
      </div>

      {open && (
        <ul className="space-y-1">
          {section.id === "favoritos" ? (
            <>
              <FavoritesList />
              <li>
                <AddFavoriteDropdown />
              </li>
            </>
          ) : (
            section.items.map((item) => (
              <li key={item.href}>
                <Leaf item={item} active={pathname === item.href} />
              </li>
            ))
          )}
          {section.id === "canais" && (
            <li>
              <button
                type="button"
                className="flex h-[34px] w-full items-center gap-2 rounded-[5px] px-3 text-[13px] text-muted-foreground/60 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              >
                <Plus className="size-3.5 shrink-0" />
                Adicionar canal
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

/* ─── Seção Mensagens Diretas ─────────────────────────────────────────────── */
function DirectMessagesSection({ userName }: { userName?: string }) {
  const [open, setOpen] = useState(true);
  const initials = userName
    ? userName
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div>
      <div className="mb-1 flex h-7 items-center justify-between px-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-1 text-[12px] font-semibold text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground"
        >
          Mensagens diretas
        </button>
      </div>
      {open && (
        <ul className="space-y-1">
          {userName && (
            <li>
              <Link
                href={`/dm/${encodeURIComponent(userName)}`}
                className="flex h-[34px] items-center gap-2 rounded-[5px] px-3 text-[13px] text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              >
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-indigo-600 text-[9px] font-bold text-white">
                  {initials}
                </span>
                <span className="flex-1 truncate">
                  {userName}
                  <span className="ml-1 text-muted-foreground/50">— Você</span>
                </span>
              </Link>
            </li>
          )}
          <li>
            <button
              type="button"
              className="flex h-[34px] w-full items-center gap-2 rounded-[5px] px-3 text-[13px] text-muted-foreground/60 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            >
              <Plus className="size-3.5 shrink-0" />
              Nova mensagem
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}

/* ─── Painel principal ────────────────────────────────────────────────────── */
export function WorkspacePanel() {
  const pathname = usePathname();
  const [homeOpen, setHomeOpen] = useState(true);
  const { data: me } = useMe();

  const sections = buildSections(me?.organizationName);

  /* painéis alternativos por rota */
  if (pathname.startsWith("/planner")) {
    return (
      <aside
        aria-label="Painel do planejador"
        className="flex h-full w-[260px] shrink-0 flex-col bg-sidebar border-r border-border"
      >
        <PlannerPanel />
      </aside>
    );
  }

  if (pathname.startsWith("/forms")) {
    return (
      <aside
        aria-label="Painel de formulários"
        className="flex h-full w-[260px] shrink-0 flex-col bg-sidebar border-r border-border"
      >
        <FormsPanel />
      </aside>
    );
  }

  if (pathname.startsWith("/ia")) {
    return null;
  }

  if (pathname.startsWith("/teams")) {
    return null;
  }

  if (pathname === "/docs") {
    return (
      <aside
        aria-label="Painel de documentos"
        className="flex h-full w-[260px] shrink-0 flex-col bg-sidebar border-r border-border overflow-y-auto"
      >
        <DocsPanel />
      </aside>
    );
  }

  if (pathname.startsWith("/docs/")) {
    return null;
  }

  return (
    <aside
      aria-label="Painel do workspace"
      className="flex h-full w-[260px] shrink-0 flex-col bg-sidebar"
    >
      {/* header "Início" */}
      <header className="flex h-10 items-center justify-between gap-1 px-3">
        <button
          type="button"
          onClick={() => setHomeOpen((v) => !v)}
          className="flex h-7 flex-1 items-center gap-1 rounded px-1 text-[13px] font-semibold text-sidebar-foreground transition-colors hover:text-foreground"
        >
          Início
        </button>
        <button
          type="button"
          aria-label="Adicionar"
          className="grid size-5 place-items-center rounded text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Plus className="size-3.5" />
        </button>
      </header>

      <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-scrollbar]]:hidden">
        <div className="space-y-5 px-2 pb-4">
          {/* seção Início */}
          {homeOpen && (
            <div className="space-y-1">
              {homeItems.map((item) => (
                <ExpandableItem
                  key={item.href}
                  item={item}
                  active={pathname === item.href}
                  activeHref={pathname}
                />
              ))}
              {/* MoreItem oculto até as rotas filhas existirem (chat-activity, drafts, posts). */}
              {/* <MoreItem /> */}
            </div>
          )}

          {/* seções + SpaceTree após favoritos */}
          {sections.map((section) => (
            <Fragment key={section.id}>
              <SectionBlock section={section} />
              {section.id === "favoritos" && <SpaceTree />}
            </Fragment>
          ))}

          {/* Mensagens diretas */}
          <DirectMessagesSection userName={me?.name} />
        </div>
      </ScrollArea>

      {/* footer fixo — Personalizar a barra lateral */}
      <div className="shrink-0 border-t border-border px-2 py-2">
        <button
          type="button"
          className="flex h-[34px] w-full items-center gap-2 rounded-[5px] px-3 text-[12px] text-muted-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        >
          <Settings2 className="size-3.5 shrink-0" />
          Personalizar a barra lateral
        </button>
      </div>
    </aside>
  );
}
