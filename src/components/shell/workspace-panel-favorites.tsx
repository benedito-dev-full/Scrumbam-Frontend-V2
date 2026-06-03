"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Folder, List, Search, Star, Users } from "lucide-react";

import { useBookmarks, useToggleBookmark } from "@/hooks/use-bookmarks";
import { useSpaces } from "@/hooks/use-projects";
import { useTeams } from "@/hooks/use-teams";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { useAuthStore } from "@/lib/stores/auth";
import type { DProjectDto } from "@/lib/types/api";
import { cn } from "@/lib/utils";

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

function SpaceChipMini({
  name,
  color,
}: {
  name: string;
  color?: string | null;
}) {
  const FALLBACK_COLORS = [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#ef4444",
    "#14b8a6",
  ];
  const bg =
    color ?? FALLBACK_COLORS[name.charCodeAt(0) % FALLBACK_COLORS.length];
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
export function FavoritesList() {
  const { data: bookmarks = [], isLoading } = useBookmarks();
  const { data: spaces = [] } = useSpaces();
  const { data: teamsData } = useTeams();
  const teams = teamsData ?? [];
  const { toggle, isPending } = useToggleBookmark();
  const pathname = usePathname();

  const spaceIds = useMemo(() => spaces.map((s) => s.id), [spaces]);
  const { folders, lists } = useAllFoldersAndLists(
    spaceIds,
    bookmarks.length > 0,
  );

  if (isLoading || bookmarks.length === 0) return null;

  const spaceMap = new Map(spaces.map((s) => [s.id, s]));
  const folderMap = new Map((folders as DProjectDto[]).map((f) => [f.id, f]));
  const listMap = new Map((lists as DProjectDto[]).map((l) => [l.id, l]));
  const teamMap = new Map(
    (teams as { id: string; nome: string }[]).map((t) => [t.id, t]),
  );

  function resolveHref(bm: { targetId: string; targetType: string }): string {
    switch (bm.targetType) {
      case "space":
        return `/spaces/${bm.targetId}`;
      case "folder":
        return `/folders/${bm.targetId}`;
      case "list":
        return `/lists/${bm.targetId}`;
      case "team":
        return `/teams/${bm.targetId}`;
      default:
        return "/";
    }
  }

  function resolveName(bm: { targetId: string; targetType: string }): string {
    switch (bm.targetType) {
      case "space":
        return spaceMap.get(bm.targetId)?.nome ?? "Espaço";
      case "folder":
        return folderMap.get(bm.targetId)?.nome ?? "Pasta";
      case "list":
        return listMap.get(bm.targetId)?.nome ?? "Lista";
      case "team":
        return teamMap.get(bm.targetId)?.nome ?? "Time";
      default:
        return "Favorito";
    }
  }

  function renderIcon(bm: { targetId: string; targetType: string }) {
    if (bm.targetType === "space") {
      const space = spaceMap.get(bm.targetId);
      return <SpaceChipMini name={space?.nome ?? "S"} color={space?.color} />;
    }
    if (bm.targetType === "folder")
      return <Folder className="size-3.5 shrink-0 text-muted-foreground" />;
    if (bm.targetType === "list")
      return <List className="size-3.5 shrink-0 text-muted-foreground" />;
    if (bm.targetType === "team")
      return <Users className="size-3.5 shrink-0 text-muted-foreground" />;
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
                "flex h-[calc(var(--row-h)-6px)] items-center gap-2 rounded-[5px] px-3 text-[13px] text-sidebar-foreground/80 outline-none transition-colors",
                "hover:bg-sidebar-accent/50 hover:text-sidebar-foreground pr-8",
                "data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground data-active:font-medium",
              )}
            >
              <span className="shrink-0 text-muted-foreground">
                {renderIcon(bm)}
              </span>
              <span className="flex-1 truncate">{name}</span>
            </Link>
            <button
              type="button"
              aria-label="Remover dos favoritos"
              disabled={isPending}
              onClick={() =>
                toggle({
                  targetId: bm.targetId,
                  targetType: bm.targetType as
                    | "space"
                    | "folder"
                    | "list"
                    | "team",
                  bookmarkId: bm.id,
                })
              }
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
export function AddFavoriteDropdown() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: spaces = [] } = useSpaces();
  const spaceIds = useMemo(() => spaces.map((s) => s.id), [spaces]);
  const { folders: allFolders, lists: allLists } = useAllFoldersAndLists(
    spaceIds,
    open,
  );
  const { data: teamsData } = useTeams();
  const teams = teamsData ?? [];

  const { data: bookmarks = [] } = useBookmarks();
  const bookmarkedIds = useMemo(
    () => new Set(bookmarks.map((b) => b.targetId)),
    [bookmarks],
  );

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
  const filteredFolders = (allFolders as DProjectDto[]).filter((f) =>
    f.nome.toLowerCase().includes(q),
  );
  const filteredLists = (allLists as DProjectDto[]).filter((l) =>
    l.nome.toLowerCase().includes(q),
  );
  const filteredTeams = teams.filter((t: { nome: string }) =>
    t.nome.toLowerCase().includes(q),
  );

  const hasResults =
    filteredSpaces.length +
      filteredFolders.length +
      filteredLists.length +
      filteredTeams.length >
    0;

  function handleToggle(
    targetId: string,
    targetType: "space" | "folder" | "list" | "team",
  ) {
    const existing = bookmarks.find(
      (b) => b.targetId === targetId && b.targetType === targetType,
    );
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
          "group flex h-[calc(var(--row-h)-6px)] w-full items-center gap-2 rounded-[5px] px-3 text-[13px] text-sidebar-foreground/80 transition-colors",
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
                        className="flex h-[calc(var(--row-h)-4px)] w-full items-center gap-2.5 px-3 text-[13px] text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <SpaceChipMini name={space.nome} color={space.color} />
                        <span className="flex-1 truncate text-left">
                          {space.nome}
                        </span>
                        <Star
                          className={cn(
                            "size-3.5 shrink-0 transition-colors",
                            active
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground/40",
                          )}
                        />
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
                        className="flex h-[calc(var(--row-h)-4px)] w-full items-center gap-2.5 px-3 text-[13px] text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Folder className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate text-left">
                          {folder.nome}
                        </span>
                        <Star
                          className={cn(
                            "size-3.5 shrink-0 transition-colors",
                            active
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground/40",
                          )}
                        />
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
                        className="flex h-[calc(var(--row-h)-4px)] w-full items-center gap-2.5 px-3 text-[13px] text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <List className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate text-left">
                          {list.nome}
                        </span>
                        <Star
                          className={cn(
                            "size-3.5 shrink-0 transition-colors",
                            active
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground/40",
                          )}
                        />
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
                        className="flex h-[calc(var(--row-h)-4px)] w-full items-center gap-2.5 px-3 text-[13px] text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Users className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate text-left">
                          {team.nome}
                        </span>
                        <Star
                          className={cn(
                            "size-3.5 shrink-0 transition-colors",
                            active
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground/40",
                          )}
                        />
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
