"use client";

/**
 * SpaceTree — árvore hierárquica Space -> Folder -> List conectada ao backend real.
 *
 * Usa os hooks `useSpaces`, `useFolders`, `useLists` (que chamam GET /projects)
 * e persiste o estado de colapso em localStorage com chave `scrumban:sidebar:expanded`.
 *
 * Fase C4 — criação de Folder/List + inline rename (ADR-V2-051).
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Plus, Lock, MoreHorizontal, Star, Pencil, Copy, Trash2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Active,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  useSpaces,
  useFolders,
  useLists,
  useRenameProject,
  useArchiveProject,
  useMoveProject,
} from "@/hooks/use-projects";
import { useIsBookmarked, useToggleBookmark } from "@/hooks/use-bookmarks";
import type { BookmarkTargetType } from "@/lib/types/api";
import { CreateSpaceDialog } from "./create-space-dialog";
import { CreateSpaceChooserDialog } from "./create-space-chooser";
import { SpaceTemplateGalleryDialog } from "./space-template-gallery";
import { CreateFolderDialog } from "./create-folder-dialog";
import { CreateListDialog } from "./create-list-dialog";
import type { DProjectDto } from "@/lib/types/api";

// ─── Constantes ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "scrumban:sidebar:expanded";

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadExpandedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return new Set(parsed as string[]);
  } catch {
    // ignora parse error
  }
  return new Set();
}

function saveExpandedIds(ids: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // ignora erros de cota
  }
}

// ─── Hook de estado de colapso ────────────────────────────────────────────────

function useExpandedState() {
  const [expanded, setExpanded] = useState<Set<string>>(loadExpandedIds);

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      saveExpandedIds(next);
      return next;
    });
  }, []);

  // Expande sem alternar — usado após mover um item por DnD para revelar
  // onde ele caiu, sem o risco de fechar um nó que já estava aberto.
  const expand = useCallback((id: string) => {
    setExpanded((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      saveExpandedIds(next);
      return next;
    });
  }, []);

  const isExpanded = useCallback(
    (id: string) => expanded.has(id),
    [expanded],
  );

  return { isExpanded, toggle, expand };
}

// ─── Validação de drop (hierarquia ADR-V2-051) ─────────────────────────────────

/**
 * Decide se o item arrastado pode ser solto sobre `target`, espelhando as
 * regras de hierarquia do backend (sem chamar a API):
 * - LIST (-352)   → aceita FOLDER (-351) ou SPACE (-350) como destino
 * - FOLDER (-351) → aceita apenas SPACE (-350) como destino
 *
 * Rejeita soltar sobre si mesmo ou sobre o pai atual (movimento nulo).
 */
function canDropOn(active: Active | null, target: DProjectDto): boolean {
  const dragged = active?.data.current?.project as DProjectDto | undefined;
  if (!dragged) return false;
  if (dragged.id === target.id) return false;
  if (dragged.idPai === target.id) return false;
  if (dragged.idClasse === "-352") {
    return target.idClasse === "-351" || target.idClasse === "-350";
  }
  if (dragged.idClasse === "-351") {
    return target.idClasse === "-350";
  }
  return false;
}

// ─── Hook de inline rename ────────────────────────────────────────────────────

/**
 * Gerencia o estado de edição inline de um item.
 * Confirma com Enter ou blur; cancela com Escape.
 */
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

function IcFolder({ className }: { className?: string }) {
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

function IcFolderOpen({ className }: { className?: string }) {
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

function IcList({ className }: { className?: string }) {
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

function SpaceTreeSkeleton() {
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

  const [createListOpen, setCreateListOpen] = useState(false);

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
              onCreateList={() => setCreateListOpen(true)}
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

      {/* Dialog de criação de List */}
      <CreateListDialog
        parentId={folder.id}
        parentName={folder.nome}
        open={createListOpen}
        onOpenChange={setCreateListOpen}
      />
    </div>
  );
}

// ─── SpaceNode ────────────────────────────────────────────────────────────────

function SpaceNode({
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
  const [createListOpen, setCreateListOpen] = useState(false);

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
              onCreateList={() => setCreateListOpen(true)}
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
      <CreateListDialog
        parentId={space.id}
        parentName={space.nome}
        open={createListOpen}
        onOpenChange={setCreateListOpen}
      />
    </div>
  );
}

// ─── MoreMenu ("...") ─────────────────────────────────────────────────────────

function MoreMenu({
  project,
  onRename,
}: {
  project: DProjectDto;
  onRename: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { mutate: archive } = useArchiveProject();

  const targetType: BookmarkTargetType =
    project.idClasse === "-350" ? "space"
    : project.idClasse === "-351" ? "folder"
    : "list";
  const { isBookmarked, bookmark } = useIsBookmarked(project.id, targetType);
  const { toggle: toggleBookmark, isPending: isTogglingBookmark } = useToggleBookmark();

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function openMenu(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.bottom + 4, left: rect.left });
    setOpen((v) => !v);
  }

  function Item({
    icon, label, onClick, danger,
  }: {
    icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean;
  }) {
    return (
      <button
        type="button"
        role="menuitem"
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-left text-[13px] transition-colors hover:bg-[#2a2a2f]",
          danger ? "text-red-400 hover:text-red-300" : "text-[#e4e4e7]",
        )}
      >
        <span className="shrink-0 text-[#71717a]">{icon}</span>
        {label}
      </button>
    );
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label="Mais ações"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={openMenu}
        className="grid size-4 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <MoreHorizontal className="size-3" />
      </button>

      {open && typeof window !== "undefined" && createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}
          className="w-[200px] overflow-hidden rounded-xl border border-[#2a2a2f] bg-[#1a1a1f] py-1.5 shadow-2xl"
        >
          <Item
            icon={
              <Star
                className={cn(
                  "size-3.5 transition-colors",
                  isBookmarked ? "fill-yellow-400 text-yellow-400" : "",
                )}
              />
            }
            label={isBookmarked ? "Remover favorito" : "Favorito"}
            onClick={() => {
              if (!isTogglingBookmark) {
                toggleBookmark({ targetId: project.id, targetType, bookmarkId: bookmark?.id });
              }
              setOpen(false);
            }}
          />
          <Item
            icon={<Pencil className="size-3.5" />}
            label="Renomear"
            onClick={() => { setOpen(false); onRename(); }}
          />
          <Item
            icon={<Copy className="size-3.5" />}
            label="Duplicar"
            onClick={() => setOpen(false)}
          />

          <div className="my-1 h-px bg-[#2a2a2f]" />

          <Item
            icon={<Trash2 className="size-3.5" />}
            label="Excluir"
            danger
            onClick={() => {
              setOpen(false);
              archive({ id: project.id, idClasse: project.idClasse, idPai: project.idPai });
            }}
          />
        </div>,
        document.body,
      )}
    </>
  );
}

// ─── PlusMenu (Space e Folder) ────────────────────────────────────────────────

/**
 * Menu "Criar" estilo ClickUp.
 * `showFolder=true`  → Space (Lista + Pasta + itens mockados)
 * `showFolder=false` → Folder (Lista + itens mockados, sem Pasta)
 */
function SpacePlusMenu({
  spaceName,
  onCreateFolder,
  onCreateList,
  showFolder = true,
}: {
  spaceName: string;
  onCreateFolder: () => void;
  onCreateList: () => void;
  showFolder?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  function openMenu(e: React.MouseEvent) {
    e.stopPropagation();
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      setPos({ top: rect.bottom + 4, left: rect.right + 4 });
    }
    setMenuOpen((v) => !v);
  }

  function MenuItem({
    icon, label, description, onClick, highlight,
  }: {
    icon: React.ReactNode; label: string; description?: string;
    onClick: () => void; highlight?: boolean;
  }) {
    return (
      <button
        type="button"
        role="menuitem"
        onClick={onClick}
        className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-[#2a2a2f]"
      >
        <span className="mt-0.5 shrink-0">{icon}</span>
        <span className="flex flex-col">
          <span className="text-[13px] font-medium text-[#e4e4e7]">{label}</span>
          {description && (
            <span className="mt-0.5 text-[11px] leading-snug text-[#71717a]">{description}</span>
          )}
        </span>
      </button>
    );
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={`Adicionar em ${spaceName}`}
        aria-haspopup="true"
        aria-expanded={menuOpen}
        onClick={openMenu}
        className="grid size-4 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Plus className="size-3" />
      </button>

      {menuOpen && typeof window !== "undefined" && createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}
          className="w-[240px] overflow-hidden rounded-xl border border-[#2a2a2f] bg-[#1a1a1f] py-2 shadow-2xl"
        >
          {/* cabeçalho */}
          <div className="flex items-center gap-2 px-3 pb-1.5 pt-1">
            <Plus className="size-3 text-[#71717a]" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#52525b]">
              Criar
            </span>
          </div>

          <div className="px-2">
            <MenuItem
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>}
              label="Lista"
              description="Acompanhe tarefas, projetos, pessoas e muito mais"
              onClick={() => { setMenuOpen(false); onCreateList(); }}
              highlight
            />
            {showFolder && (
              <MenuItem
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>}
                label="Pasta"
                description="Agrupe listas, documentos e muito mais"
                onClick={() => { setMenuOpen(false); onCreateFolder(); }}
              />
            )}
          </div>

          <div className="my-1.5 h-px bg-[#2a2a2f]" />

          <div className="px-2">
            <MenuItem
              icon={
                <span className="flex size-5 items-center justify-center rounded-md bg-blue-600">
                  {/* Documento — ícone página/doc */}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </span>
              }
              label="Documento"
              onClick={() => setMenuOpen(false)}
            />
            <MenuItem
              icon={
                <span className="flex size-5 items-center justify-center rounded-md bg-purple-600">
                  {/* Painéis — ícone dashboard/grid */}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                </span>
              }
              label="Painéis"
              onClick={() => setMenuOpen(false)}
            />
            <MenuItem
              icon={
                <span className="flex size-5 items-center justify-center rounded-md bg-orange-500">
                  {/* Quadro branco — ícone pentágono/whiteboard */}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                </span>
              }
              label="Quadro branco"
              onClick={() => setMenuOpen(false)}
            />
            <MenuItem
              icon={
                <span className="flex size-5 items-center justify-center rounded-md bg-violet-600">
                  {/* Formulário — ícone clipboard/form */}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="12" y2="16"/></svg>
                </span>
              }
              label="Formulário"
              onClick={() => setMenuOpen(false)}
            />
          </div>

          <div className="my-1.5 h-px bg-[#2a2a2f]" />

          <div className="px-2">
            <button type="button" role="menuitem" onClick={() => setMenuOpen(false)}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 hover:bg-[#2a2a2f]">
              <div className="flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span className="text-[13px] text-[#e4e4e7]">Importações</span>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <MenuItem
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>}
              label="Modelos"
              onClick={() => setMenuOpen(false)}
            />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

// ─── SpaceTree (raiz) ─────────────────────────────────────────────────────────

/**
 * Arvore hierarquica conectada ao backend real.
 *
 * Renderiza Space -> Folder -> List usando os hooks `useSpaces`,
 * `useFolders` e `useLists`. Estado de colapso persistido em
 * `localStorage` com chave `scrumban:sidebar:expanded`.
 *
 * Fase C4: botoes "+" funcionais em SpaceNode e FolderNode,
 * dialogs de criacao de Folder e List, e inline rename com duplo-clique.
 */
export function SpaceTree() {
  const [sectionOpen, setSectionOpen] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  // Fluxo de criação: "+" abre o chooser; daí vai p/ modal em branco ou galeria.
  const [chooserOpen, setChooserOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const { isExpanded, toggle, expand } = useExpandedState();

  const { data: spaces, isLoading } = useSpaces();

  // ─── Drag & drop: mover Listas/Pastas para um novo pai ───────────────────────
  const { mutate: moveProject } = useMoveProject();
  const [activeDrag, setActiveDrag] = useState<DProjectDto | null>(null);

  // Distância de 5px antes de iniciar o arraste — preserva cliques (navegação,
  // toggle de colapso, menus) sem disparar drag acidental.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    const project = event.active.data.current?.project as DProjectDto | undefined;
    setActiveDrag(project ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    const dragged = event.active.data.current?.project as DProjectDto | undefined;
    const target = event.over?.data.current?.project as DProjectDto | undefined;
    if (!dragged || !target || !canDropOn(event.active, target)) return;

    moveProject(
      {
        id: dragged.id,
        idClasse: dragged.idClasse,
        fromParentId: dragged.idPai,
        toParentId: target.id,
      },
      {
        onSuccess: () => {
          expand(target.id);
          toast.success(`"${dragged.nome}" movido para "${target.nome}"`);
        },
        onError: () => toast.error("Não foi possível mover. Tente novamente."),
      },
    );
  }

  return (
    <div>
      {/* cabeçalho da seção "Espaços" */}
      <div className="mb-1 flex h-7 items-center justify-between px-3">
        <button
          type="button"
          onClick={() => setSectionOpen((v) => !v)}
          className="flex flex-1 items-center gap-1 text-[12px] font-semibold text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground"
        >
          <ChevronRight
            className={cn(
              "size-3 shrink-0 transition-transform duration-150",
              sectionOpen && "rotate-90",
            )}
          />
          Espaços
        </button>

        {/* botão "+" ao lado do header */}
        <button
          type="button"
          aria-label="Novo espaço"
          onClick={() => setChooserOpen(true)}
          className="grid size-4 place-items-center rounded text-muted-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Plus className="size-3" />
        </button>
      </div>

      {/* lista de spaces */}
      {sectionOpen && (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveDrag(null)}
        >
          <div className="space-y-0.5">
            {isLoading && <SpaceTreeSkeleton />}
            {!isLoading && spaces?.map((space) => (
              <SpaceNode
                key={space.id}
                space={space}
                depth={0}
                isExpanded={isExpanded}
                onToggle={toggle}
              />
            ))}
            {/* "+ Novo Espaço" sempre visível no final */}
            {!isLoading && (
              <button
                type="button"
                onClick={() => setChooserOpen(true)}
                className="flex h-[34px] w-full items-center gap-2 rounded-[5px] px-3 text-[13px] text-muted-foreground/60 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              >
                <Plus className="size-3.5 shrink-0" />
                Novo Espaço
              </button>
            )}
          </div>

          {/* Pré-visualização flutuante do item sendo arrastado */}
          <DragOverlay dropAnimation={null}>
            {activeDrag ? (
              <div className="flex h-[34px] max-w-[220px] items-center gap-2 rounded-[6px] border border-border bg-sidebar px-2.5 text-[13px] font-medium text-sidebar-foreground shadow-xl">
                {activeDrag.idClasse === "-351" ? (
                  <IcFolder className="shrink-0 text-muted-foreground" />
                ) : (
                  <IcList className="shrink-0 text-violet-400" />
                )}
                <span className="truncate">{activeDrag.nome}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Passo 1: escolher em branco ou template */}
      <CreateSpaceChooserDialog
        open={chooserOpen}
        onOpenChange={setChooserOpen}
        onChooseBlank={() => {
          setChooserOpen(false);
          setCreateDialogOpen(true);
        }}
        onChooseTemplate={() => {
          setChooserOpen(false);
          setGalleryOpen(true);
        }}
      />

      {/* Passo 2a: galeria de templates (criação real pendente) */}
      <SpaceTemplateGalleryDialog
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        onBack={() => {
          setGalleryOpen(false);
          setChooserOpen(true);
        }}
      />

      {/* Passo 2b: modal de criação de space "em branco" */}
      <CreateSpaceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
