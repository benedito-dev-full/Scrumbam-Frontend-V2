"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, MoreHorizontal, Pencil, Plus, Star, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { useArchiveProject } from "@/hooks/use-projects";
import { useIsBookmarked, useToggleBookmark } from "@/hooks/use-bookmarks";
import type { BookmarkTargetType, DProjectDto } from "@/lib/types/api";

interface MoreMenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

function MoreMenuItem({ icon, label, onClick, danger }: MoreMenuItemProps) {
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

interface CreateMenuItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick: () => void;
}

function CreateMenuItem({
  icon,
  label,
  description,
  onClick,
}: CreateMenuItemProps) {
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
          <span className="mt-0.5 text-[11px] leading-snug text-[#71717a]">
            {description}
          </span>
        )}
      </span>
    </button>
  );
}

export function MoreMenu({
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
          <MoreMenuItem
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
          <MoreMenuItem
            icon={<Pencil className="size-3.5" />}
            label="Renomear"
            onClick={() => { setOpen(false); onRename(); }}
          />
          <MoreMenuItem
            icon={<Copy className="size-3.5" />}
            label="Duplicar"
            onClick={() => setOpen(false)}
          />

          <div className="my-1 h-px bg-[#2a2a2f]" />

          <MoreMenuItem
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
export function SpacePlusMenu({
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
            <CreateMenuItem
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>}
              label="Lista"
              description="Acompanhe tarefas, projetos, pessoas e muito mais"
              onClick={() => { setMenuOpen(false); onCreateList(); }}
            />
            {showFolder && (
              <CreateMenuItem
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>}
                label="Pasta"
                description="Agrupe listas, documentos e muito mais"
                onClick={() => { setMenuOpen(false); onCreateFolder(); }}
              />
            )}
          </div>

          <div className="my-1.5 h-px bg-[#2a2a2f]" />

          <div className="px-2">
            <CreateMenuItem
              icon={
                <span className="flex size-5 items-center justify-center rounded-md bg-blue-600">
                  {/* Documento — ícone página/doc */}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </span>
              }
              label="Documento"
              onClick={() => setMenuOpen(false)}
            />
            <CreateMenuItem
              icon={
                <span className="flex size-5 items-center justify-center rounded-md bg-purple-600">
                  {/* Painéis — ícone dashboard/grid */}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                </span>
              }
              label="Painéis"
              onClick={() => setMenuOpen(false)}
            />
            <CreateMenuItem
              icon={
                <span className="flex size-5 items-center justify-center rounded-md bg-orange-500">
                  {/* Quadro branco — ícone pentágono/whiteboard */}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                </span>
              }
              label="Quadro branco"
              onClick={() => setMenuOpen(false)}
            />
            <CreateMenuItem
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
            <CreateMenuItem
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
