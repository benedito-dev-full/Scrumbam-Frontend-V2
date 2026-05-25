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
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Plus, Lock, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  useSpaces,
  useFolders,
  useLists,
  useRenameProject,
} from "@/hooks/use-projects";
import { CreateSpaceDialog } from "./create-space-dialog";
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

  const isExpanded = useCallback(
    (id: string) => expanded.has(id),
    [expanded],
  );

  return { isExpanded, toggle };
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
        background: "#2a2a2a",
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
      className={cn(
        "size-3 shrink-0 text-muted-foreground transition-transform duration-150",
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
  const paddingLeft = 8 + depth * 14;

  const { editing, draft, setDraft, inputRef, isPending, startEdit, handleKeyDown, commitEdit } =
    useInlineRename(list);

  return (
    <div
      className={cn(
        "group flex h-[34px] items-center rounded-[4px] text-[13px] text-sidebar-foreground/85 transition-colors",
        "hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
      )}
      style={{ paddingLeft }}
    >
      {/* espaço do chevron (sem filho = sem botão) */}
      <span className="mr-0.5 size-4 shrink-0" />

      {/* ícone de lista */}
      <span className="mr-1.5 shrink-0">
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
  const paddingLeft = 8 + depth * 14;

  const { data: lists, isLoading } = useLists(open ? folder.id : null);

  const [createListOpen, setCreateListOpen] = useState(false);

  const { editing, draft, setDraft, inputRef, isPending, startEdit, handleKeyDown, commitEdit } =
    useInlineRename(folder);

  return (
    <div>
      <div
        className={cn(
          "group flex h-[34px] items-center rounded-[4px] text-[13px] text-sidebar-foreground/85 transition-colors",
          "hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
          active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
        )}
        style={{ paddingLeft }}
      >
        {/* botão chevron */}
        <button
          type="button"
          aria-label={open ? "Colapsar folder" : "Expandir folder"}
          onClick={() => onToggle(folder.id)}
          className="mr-0.5 grid size-4 shrink-0 place-items-center text-muted-foreground hover:text-foreground"
        >
          <Chevron open={open} />
        </button>

        {/* ícone de pasta */}
        <span className="mr-1.5 shrink-0">
          <IcFolder
            className={cn(
              "text-muted-foreground",
              active && "text-sidebar-accent-foreground",
            )}
          />
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

        {/* ações flutuantes no hover */}
        {!editing && (
          <div className="mr-1 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              aria-label="Mais ações"
              className="grid size-4 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <MoreHorizontal className="size-3" />
            </button>
            <button
              type="button"
              aria-label={`Adicionar lista em ${folder.nome}`}
              onClick={() => setCreateListOpen(true)}
              className="grid size-4 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Plus className="size-3" />
            </button>
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
  const paddingLeft = 8 + depth * 14;

  const { data: folders, isLoading } = useFolders(open ? space.id : null);

  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createListOpen, setCreateListOpen] = useState(false);

  const { editing, draft, setDraft, inputRef, isPending, startEdit, handleKeyDown, commitEdit } =
    useInlineRename(space);

  // Gera iniciais do nome do space para o chip colorido
  const iniciais = space.nome
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase() || "?";

  // Cor determinística baseada no ID
  const COLORS = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
    "#10b981", "#3b82f6", "#ef4444", "#14b8a6",
  ];
  const colorIndex = parseInt(space.id, 10) % COLORS.length;
  const chipColor = COLORS[isNaN(colorIndex) ? 0 : colorIndex];

  return (
    <div>
      <div
        className={cn(
          "group flex h-[34px] items-center rounded-[4px] text-[13px] text-sidebar-foreground/85 transition-colors",
          "hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
          active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
        )}
        style={{ paddingLeft }}
      >
        {/* chevron expand/collapse */}
        <button
          type="button"
          aria-label={open ? "Colapsar space" : "Expandir space"}
          onClick={() => onToggle(space.id)}
          className="mr-0.5 grid size-4 shrink-0 place-items-center text-muted-foreground hover:text-foreground"
        >
          <Chevron open={open} />
        </button>

        {/* chip colorido com iniciais */}
        <span
          className="mr-1.5 grid size-4 shrink-0 place-items-center rounded text-[9px] font-semibold text-white"
          style={{ background: chipColor }}
          aria-hidden
        >
          {iniciais}
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

        {/* ações flutuantes no hover */}
        {!editing && (
          <div className="mr-1 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              aria-label="Mais ações"
              className="grid size-4 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <MoreHorizontal className="size-3" />
            </button>
            {/* Menu "+" — abre folder ou list direto no space */}
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
          {isLoading && (
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
        open={createListOpen}
        onOpenChange={setCreateListOpen}
      />
    </div>
  );
}

// ─── SpacePlusMenu ────────────────────────────────────────────────────────────

/**
 * Menu "Criar" estilo ClickUp — abre ao clicar no "+" de um SpaceNode.
 * Itens principais (Lista, Pasta) são funcionais; demais são mockados.
 */
function SpacePlusMenu({
  spaceName,
  onCreateFolder,
  onCreateList,
}: {
  spaceName: string;
  onCreateFolder: () => void;
  onCreateList: () => void;
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
        className={`flex w-full items-start gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-[#2a2a2f] ${highlight ? "bg-[#232329]" : ""}`}
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

      {menuOpen && typeof window !== "undefined" && (
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
            <MenuItem
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>}
              label="Pasta"
              description="Agrupe listas, documentos e muito mais"
              onClick={() => { setMenuOpen(false); onCreateFolder(); }}
            />
          </div>

          <div className="my-1.5 h-px bg-[#2a2a2f]" />

          <div className="px-2">
            <MenuItem icon={<span className="flex size-4 items-center justify-center rounded bg-blue-600 text-[9px] font-bold text-white">D</span>} label="Documento" onClick={() => setMenuOpen(false)} />
            <MenuItem icon={<span className="flex size-4 items-center justify-center rounded bg-purple-600 text-[9px] font-bold text-white">P</span>} label="Painéis" onClick={() => setMenuOpen(false)} />
            <MenuItem icon={<span className="flex size-4 items-center justify-center rounded bg-orange-500 text-[9px] font-bold text-white">Q</span>} label="Quadro branco" onClick={() => setMenuOpen(false)} />
            <MenuItem icon={<span className="flex size-4 items-center justify-center rounded bg-violet-600 text-[9px] font-bold text-white">F</span>} label="Formulário" onClick={() => setMenuOpen(false)} />
          </div>

          <div className="my-1.5 h-px bg-[#2a2a2f]" />

          <div className="px-2">
            <button type="button" role="menuitem" onClick={() => setMenuOpen(false)}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 hover:bg-[#2a2a2f]">
              <div className="flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span className="text-[13px] text-[#e4e4e7]">Importações</span>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <MenuItem
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>}
              label="Modelos"
              onClick={() => setMenuOpen(false)}
            />
          </div>
        </div>
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
  const { isExpanded, toggle } = useExpandedState();

  const { data: spaces, isLoading } = useSpaces();

  return (
    <div>
      {/* cabeçalho da seção "Espaços" */}
      <div className="group mb-1 flex h-7 items-center justify-between px-3">
        <button
          type="button"
          onClick={() => setSectionOpen((v) => !v)}
          className="flex flex-1 items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 transition-colors hover:text-muted-foreground"
        >
          <ChevronRight
            className={cn(
              "size-2.5 transition-transform duration-150",
              sectionOpen && "rotate-90",
            )}
          />
          Espaços
        </button>

        {/* botão "+ Novo Space" */}
        <button
          type="button"
          aria-label="Novo espaço"
          onClick={() => setCreateDialogOpen(true)}
          className="grid size-4 place-items-center rounded text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Plus className="size-3" />
        </button>
      </div>

      {/* lista de spaces */}
      {sectionOpen && (
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
          {!isLoading && spaces?.length === 0 && (
            <p className="px-3 py-2 text-[12px] text-muted-foreground/60">
              Nenhum space ainda.{" "}
              <button
                type="button"
                onClick={() => setCreateDialogOpen(true)}
                className="underline hover:text-muted-foreground"
              >
                Criar o primeiro
              </button>
            </p>
          )}
        </div>
      )}

      {/* dialog de criação de space */}
      <CreateSpaceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
