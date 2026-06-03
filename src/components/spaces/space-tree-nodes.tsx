"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Lock } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useDraggable, useDroppable } from "@dnd-kit/core";

import { cn } from "@/lib/utils";
import { useFolders, useLists, useRenameProject } from "@/hooks/use-projects";
import type { DProjectDto } from "@/lib/types/api";
import { CreateFolderDialog } from "./create-folder-dialog";
import { useCreateListFlowStore } from "@/lib/stores/create-list-flow";
import { canDropOn } from "./space-tree-state";
import { MoreMenu, SpacePlusMenu } from "./space-tree-menus";

function useInlineRename(project: DProjectDto) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate: rename, isPending } = useRenameProject();

  // Foca o input quando entra em modo de edição
  useEffect(() => {
    if (editing) {
      // Aguarda o render antes de focar
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [editing]);

  function startEdit() {
    // Renomear é operação estrutural — exige MANAGER (canManage no DTO). Trava
    // funcional que cobre tanto o menu quanto o duplo-clique no nó; o MoreMenu
    // já desabilita visualmente o item. Default permissivo quando ausente
    // (mock/resposta antiga) — backend continua sendo a verdade (403).
    if (project.canManage === false) return;
    setDraft(project.nome);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft("");
  }

  function commitEdit() {
    const trimmed = draft.trim();
    // Ignora se vazio ou igual ao original
    if (!trimmed || trimmed === project.nome) {
      cancelEdit();
      return;
    }
    rename(
      {
        id: project.id,
        idClasse: project.idClasse,
        idPai: project.idPai ?? undefined,
        dto: { nome: trimmed },
      },
      {
        onSuccess: () => setEditing(false),
        onError: () => cancelEdit(),
      },
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  }

  return { editing, draft, setDraft, inputRef, isPending, startEdit, handleKeyDown, commitEdit };
}

// ─── Mapa de ícones do picker → Lucide ───────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  zap: LucideIcons.Zap, rocket: LucideIcons.Rocket, target: LucideIcons.Target,
  lightbulb: LucideIcons.Lightbulb, flame: LucideIcons.Flame, star: LucideIcons.Star,
  sparkles: LucideIcons.Sparkles, trophy: LucideIcons.Trophy, palette: LucideIcons.Palette,
  drama: LucideIcons.Drama, music: LucideIcons.Music, film: LucideIcons.Film,
  mic: LucideIcons.Mic, guitar: LucideIcons.Guitar, radio: LucideIcons.Radio,
  headphones: LucideIcons.Headphones, smartphone: LucideIcons.Smartphone,
  laptop: LucideIcons.Laptop, monitor: LucideIcons.Monitor, keyboard: LucideIcons.Keyboard,
  mouse: LucideIcons.Mouse, printer: LucideIcons.Printer, camera: LucideIcons.Camera,
  scanline: LucideIcons.ScanLine, barchart: LucideIcons.BarChart2,
  "trending-up": LucideIcons.TrendingUp, "trending-dn": LucideIcons.TrendingDown,
  clipboard: LucideIcons.ClipboardList, pin: LucideIcons.Pin, "map-pin": LucideIcons.MapPin,
  map: LucideIcons.Map, calendar: LucideIcons.Calendar, key: LucideIcons.Key,
  lock: LucideIcons.Lock, unlock: LucideIcons.Unlock, bell: LucideIcons.Bell,
  "bell-off": LucideIcons.BellOff, megaphone: LucideIcons.Megaphone,
  volume: LucideIcons.Volume2, "volume-x": LucideIcons.VolumeX, medal: LucideIcons.Medal,
  award: LucideIcons.Award, ribbon: LucideIcons.Ribbon, gift: LucideIcons.Gift,
  globe: LucideIcons.Globe, compass: LucideIcons.Compass, mountain: LucideIcons.Mountain,
  home: LucideIcons.Home, building: LucideIcons.Building2, hospital: LucideIcons.Hospital,
  store: LucideIcons.Store, hotel: LucideIcons.Hotel, car: LucideIcons.Car,
  plane: LucideIcons.Plane, ship: LucideIcons.Ship, anchor: LucideIcons.Anchor,
  bike: LucideIcons.Bike, bus: LucideIcons.Bus, pizza: LucideIcons.Pizza,
  apple: LucideIcons.Apple, coffee: LucideIcons.Coffee, cart: LucideIcons.ShoppingCart,
  package: LucideIcons.Package, boxes: LucideIcons.Boxes, dumbbell: LucideIcons.Dumbbell,
  gamepad: LucideIcons.Gamepad2, puzzle: LucideIcons.Puzzle, swords: LucideIcons.Swords,
  shield: LucideIcons.Shield, flag: LucideIcons.Flag, leaf: LucideIcons.Leaf,
  flower: LucideIcons.Flower, trees: LucideIcons.Trees, sun: LucideIcons.Sun,
  moon: LucideIcons.Moon, cloud: LucideIcons.Cloud, umbrella: LucideIcons.Umbrella,
  snowflake: LucideIcons.Snowflake, diamond: LucideIcons.Diamond, crown: LucideIcons.Crown,
  heart: LucideIcons.Heart, smile: LucideIcons.Smile, users: LucideIcons.Users,
  user: LucideIcons.User, baby: LucideIcons.Baby, dog: LucideIcons.Dog,
  microscope: LucideIcons.Microscope, flask: LucideIcons.FlaskConical, atom: LucideIcons.Atom,
  cpu: LucideIcons.Cpu, database: LucideIcons.Database, code: LucideIcons.Code,
  terminal: LucideIcons.Terminal, git: LucideIcons.GitBranch, book: LucideIcons.BookOpen,
  bookmark: LucideIcons.BookMarked, pen: LucideIcons.Pen, file: LucideIcons.FileText,
  folder: LucideIcons.Folder, archive: LucideIcons.Archive, paperclip: LucideIcons.Paperclip,
  search: LucideIcons.Search,
};

// ─── Ícones SVG ───────────────────────────────────────────────────────────────

export function IcFolder({ className }: { className?: string }) {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function IcFolderOpen({ className }: { className?: string }) {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 19a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v1" />
      <path d="M3 19l2.5-7H21l-2.5 7H3z" />
    </svg>
  );
}

export function IcList({ className }: { className?: string }) {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

// ─── Skeleton de loading ──────────────────────────────────────────────────────

function SkeletonRow({ width }: { width: string }) {
  return (
    <div className="flex h-[34px] items-center gap-2 px-2">
      <div className="size-4 shrink-0 animate-pulse rounded bg-zinc-800" />
      <div
        className="h-3 animate-pulse rounded bg-zinc-800"
        style={{ width }}
      />
    </div>
  );
}

export function SpaceTreeSkeleton() {
  return (
    <div className="space-y-0.5">
      <SkeletonRow width="70%" />
      <SkeletonRow width="55%" />
      <SkeletonRow width="80%" />
    </div>
  );
}

// ─── Linha de indentação vertical ─────────────────────────────────────────────

function IndentGuide({ depth }: { depth: number }) {
  if (depth === 0) return null;
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        left: 8 + (depth - 1) * 14 + 8,
        top: 0,
        bottom: 0,
        width: 1,
        background: "var(--accent)",
        borderRadius: 1,
        pointerEvents: "none",
      }}
    />
  );
}

// ─── Chevron animado ──────────────────────────────────────────────────────────

function Chevron({ open }: { open: boolean }) {
  return (
    <ChevronRight
      strokeWidth={3.5}
      className={cn(
        "size-3.5 shrink-0 text-sidebar-foreground/70 transition-transform duration-150",
        open && "rotate-90",
      )}
    />
  );
}

// ─── ListNode ─────────────────────────────────────────────────────────────────

function ListNode({
  list,
  depth,
}: {
  list: DProjectDto;
  depth: number;
}) {
  const pathname = usePathname();
  const href = `/lists/${list.id}`;
  const active = pathname === href || pathname.startsWith(href + "/");
  const paddingLeft = 8 + depth * 20;

  const { editing, draft, setDraft, inputRef, isPending, startEdit, handleKeyDown, commitEdit } =
    useInlineRename(list);

  const { listeners, setNodeRef, isDragging } = useDraggable({
    id: list.id,
    data: { type: "list", project: list },
    disabled: editing,
  });

  return (
    <div
      ref={setNodeRef}
      {...(editing ? {} : listeners)}
      className={cn(
        "group flex h-[34px] items-center rounded-[4px] text-[13px] text-sidebar-foreground/85 transition-colors",
        "hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
        isDragging && "opacity-40",
      )}
      style={{ paddingLeft }}
    >
      {/* ícone de lista — sem chevron, lista não tem filhos */}
      <span className="mr-0.5 flex size-4 shrink-0 items-center justify-center">
        <IcList className="text-violet-400" />
      </span>

      {editing ? (
        <input
          ref={inputRef}
          className="flex h-full flex-1 min-w-0 bg-transparent text-[13px] outline-none ring-1 ring-ring rounded-sm px-1"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitEdit}
          disabled={isPending}
          aria-label="Renomear lista"
        />
      ) : (
        <Link
          href={href}
          className="flex h-full flex-1 min-w-0 items-center truncate outline-none"
          onDoubleClick={(e) => {
            e.preventDefault();
            startEdit();
          }}
        >
          <span className="truncate">{list.nome}</span>
        </Link>
      )}

      {!editing && (
        <div className="mr-1 flex shrink-0 items-center gap-0.5">
          <MoreMenu project={list} onRename={startEdit} />
        </div>
      )}
    </div>
  );
}

// ─── FolderNode ───────────────────────────────────────────────────────────────

function FolderNode({
  folder,
  depth,
  isExpanded,
  onToggle,
}: {
  folder: DProjectDto;
  depth: number;
  isExpanded: (id: string) => boolean;
  onToggle: (id: string) => void;
}) {
  const pathname = usePathname();
  const href = `/folders/${folder.id}`;
  const active = pathname === href || pathname.startsWith(href + "/");
  const open = isExpanded(folder.id);
  const paddingLeft = 8 + depth * 20;

  const { data: lists, isLoading } = useLists(open ? folder.id : null);

  const openCreateList = useCreateListFlowStore((s) => s.openCreateList);

  const { editing, draft, setDraft, inputRef, isPending, startEdit, handleKeyDown, commitEdit } =
    useInlineRename(folder);

  const { listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: folder.id,
    data: { type: "folder", project: folder },
    disabled: editing,
  });
  const { setNodeRef: setDropRef, isOver, active: dndActive } = useDroppable({
    id: `drop-${folder.id}`,
    data: { type: "folder", project: folder },
  });
  const showDrop = isOver && canDropOn(dndActive, folder);

  return (
    <div>
      <div
        ref={(node) => {
          setDragRef(node);
          setDropRef(node);
        }}
        {...(editing ? {} : listeners)}
        className={cn(
          "group flex h-[34px] items-center rounded-[4px] text-[13px] text-sidebar-foreground/85 transition-colors",
          "hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
          active && !isDragging && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
          isDragging && "opacity-40",
          showDrop && "ring-1 ring-inset ring-primary bg-primary/10",
        )}
        style={{ paddingLeft }}
      >
        {/* ícone + chevron sobrepostos: hover substitui ícone pelo chevron */}
        <button
          type="button"
          aria-label={open ? "Colapsar folder" : "Expandir folder"}
          onClick={() => onToggle(folder.id)}
          className="relative mr-0.5 size-4 shrink-0"
        >
          <span className="absolute inset-0 flex items-center justify-center transition-opacity duration-100 group-hover:opacity-0">
            {open ? (
              <IcFolderOpen
                className={cn(
                  "text-muted-foreground",
                  active && "text-sidebar-accent-foreground",
                )}
              />
            ) : (
              <IcFolder
                className={cn(
                  "text-muted-foreground",
                  active && "text-sidebar-accent-foreground",
                )}
              />
            )}
          </span>
          <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-100 group-hover:opacity-100">
            <Chevron open={open} />
          </span>
        </button>

        {editing ? (
          <input
            ref={inputRef}
            className="flex h-full flex-1 min-w-0 bg-transparent text-[13px] outline-none ring-1 ring-ring rounded-sm px-1"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commitEdit}
            disabled={isPending}
            aria-label="Renomear pasta"
          />
        ) : (
          <Link
            href={href}
            className="flex h-full flex-1 min-w-0 items-center truncate outline-none"
            onDoubleClick={(e) => {
              e.preventDefault();
              startEdit();
            }}
          >
            <span className="truncate">{folder.nome}</span>
          </Link>
        )}

        {!editing && (
          <div className="mr-1 flex shrink-0 items-center gap-0.5">
            <MoreMenu project={folder} onRename={startEdit} />
            <SpacePlusMenu
              spaceName={folder.nome}
              onCreateFolder={() => {}}
              onCreateList={() => openCreateList(folder.id, folder.nome)}
              showFolder={false}
            />
          </div>
        )}
      </div>

      {open && (
        <div className="relative mt-0.5 space-y-0.5">
          <IndentGuide depth={depth + 1} />
          {isLoading && (
            <div className="space-y-0.5" style={{ paddingLeft: 8 + (depth + 1) * 14 }}>
              <SkeletonRow width="60%" />
            </div>
          )}
          {!isLoading && lists?.map((list) => (
            <ListNode key={list.id} list={list} depth={depth + 1} />
          ))}
        </div>
      )}

    </div>
  );
}

// ─── SpaceNode ────────────────────────────────────────────────────────────────

export function SpaceNode({
  space,
  depth,
  isExpanded,
  onToggle,
}: {
  space: DProjectDto;
  depth: number;
  isExpanded: (id: string) => boolean;
  onToggle: (id: string) => void;
}) {
  const pathname = usePathname();
  const href = `/spaces/${space.id}`;
  const active = pathname === href || pathname.startsWith(href + "/");
  const open = isExpanded(space.id);
  const paddingLeft = 8 + depth * 20;

  const { data: folders, isLoading } = useFolders(open ? space.id : null);
  const { data: directLists, isLoading: isLoadingLists } = useLists(open ? space.id : null);

  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const openCreateList = useCreateListFlowStore((s) => s.openCreateList);

  const { editing, draft, setDraft, inputRef, isPending, startEdit, handleKeyDown, commitEdit } =
    useInlineRename(space);

  const { setNodeRef: setDropRef, isOver, active: dndActive } = useDroppable({
    id: `drop-${space.id}`,
    data: { type: "space", project: space },
  });
  const showDrop = isOver && canDropOn(dndActive, space);

  // Avatar: usa color/icon salvos ou fallback determinístico
  const inicial = (space.nome.trim().charAt(0) || "?").toUpperCase();
  const FALLBACK_COLORS = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#14b8a6"];
  const chipColor = space.color ?? FALLBACK_COLORS[parseInt(space.id, 10) % FALLBACK_COLORS.length] ?? "#6366f1";
  const SpaceIcon = space.icon ? ICON_MAP[space.icon] ?? null : null;

  return (
    <div>
      <div
        ref={setDropRef}
        className={cn(
          "group flex h-[34px] items-center rounded-[4px] text-[13px] text-sidebar-foreground/85 transition-colors",
          "hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
          active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
          showDrop && "ring-1 ring-inset ring-primary bg-primary/10",
        )}
        style={{ paddingLeft }}
      >
        {/* chip + chevron sobrepostos: hover substitui chip pelo chevron */}
        <button
          type="button"
          aria-label={open ? "Colapsar space" : "Expandir space"}
          onClick={() => onToggle(space.id)}
          className="relative mr-1.5 size-6 shrink-0"
        >
          <span className="absolute inset-0 flex items-center justify-center transition-opacity duration-100 group-hover:opacity-0">
            <span
              className="grid size-6 place-items-center rounded-md text-[11px] font-bold text-white"
              style={{ background: chipColor }}
            >
              {SpaceIcon
                ? <SpaceIcon size={13} strokeWidth={1.75} color="white" />
                : inicial
              }
            </span>
          </span>
          <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-100 group-hover:opacity-100">
            <Chevron open={open} />
          </span>
        </button>

        {editing ? (
          <input
            ref={inputRef}
            className="flex h-full flex-1 min-w-0 bg-transparent text-[13px] outline-none ring-1 ring-ring rounded-sm px-1"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commitEdit}
            disabled={isPending}
            aria-label="Renomear space"
          />
        ) : (
          <Link
            href={href}
            className="flex h-full flex-1 min-w-0 items-center truncate outline-none"
            onDoubleClick={(e) => {
              e.preventDefault();
              startEdit();
            }}
          >
            <span className="truncate">{space.nome}</span>
          </Link>
        )}

        {/* cadeado para spaces privados */}
        {!editing && space.privado && (
          <Lock
            className="mr-1 size-3 shrink-0 text-muted-foreground/60"
            aria-label="Space privado"
          />
        )}

        {!editing && (
          <div className="mr-1 flex shrink-0 items-center gap-0.5">
            <MoreMenu project={space} onRename={startEdit} />
            <SpacePlusMenu
              spaceName={space.nome}
              onCreateFolder={() => setCreateFolderOpen(true)}
              onCreateList={() => openCreateList(space.id, space.nome)}
            />
          </div>
        )}
      </div>

      {open && (
        <div className="relative mt-0.5 space-y-0.5">
          <IndentGuide depth={depth + 1} />
          {(isLoading || isLoadingLists) && (
            <div className="space-y-0.5" style={{ paddingLeft: 8 + (depth + 1) * 14 }}>
              <SkeletonRow width="65%" />
            </div>
          )}
          {!isLoading && folders?.map((folder) => (
            <FolderNode
              key={folder.id}
              folder={folder}
              depth={depth + 1}
              isExpanded={isExpanded}
              onToggle={onToggle}
            />
          ))}
          {!isLoadingLists && directLists?.map((list) => (
            <ListNode key={list.id} list={list} depth={depth + 1} />
          ))}
        </div>
      )}

      {/* Dialogs de criação */}
      <CreateFolderDialog
        spaceId={space.id}
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
      />
    </div>
  );
}

// ─── MoreMenu ("...") ─────────────────────────────────────────────────────────

