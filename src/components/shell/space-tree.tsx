"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Lock,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { Entidade } from "@/lib/types/entidade";
import { useEspacos, useFilhosDe } from "@/lib/stores/entidades";
import { useNewSpaceDialogStore } from "@/lib/stores/new-space-dialog";
import { CreateMenu } from "./create-menu";
import { SpaceChip } from "./space-chip";

/* ─── Ícones SVG custom — pixel-perfect ClickUp ──────────────────────────── */

/* Pasta fechada — folder outline */
function IcFolder({ className }: { className?: string }) {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/* Pasta aberta — folder com topo aberto */
function IcFolderOpen({ className }: { className?: string }) {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 14l1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

/* Board — colunas Kanban (3 barras verticais), azul */
function IcBoard({ className }: { className?: string }) {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="5" height="18" rx="1" />
      <rect x="10" y="3" width="5" height="12" rx="1" />
      <rect x="17" y="3" width="5" height="15" rx="1" />
    </svg>
  );
}

/* Backlog — lista com checkboxes, violeta */
function IcBacklog({ className }: { className?: string }) {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

/* Doc — documento com linhas de texto */
function IcDoc({ className }: { className?: string }) {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

function ItemIcon({ classe, active }: { classe: Exclude<Entidade["idClasse"], "espaco">; active: boolean }) {
  const activeClass = active ? "text-sidebar-accent-foreground" : "";
  switch (classe) {
    case "pasta":   return <IcFolder  className={cn("text-muted-foreground", activeClass)} />;
    case "board":   return <IcBoard   className={cn("text-blue-400", activeClass)} />;
    case "backlog": return <IcBacklog className={cn("text-violet-400", activeClass)} />;
    case "doc":     return <IcDoc     className={cn("text-zinc-400", activeClass)} />;
  }
}

function hrefFor(entidade: Entidade): string {
  switch (entidade.idClasse) {
    case "espaco":  return `/spaces/${entidade.id}`;
    case "pasta":   return `/folders/${entidade.id}`;
    case "board":   return `/lists/${entidade.id}`;
    case "backlog": return `/lists/${entidade.id}`;
    case "doc":     return `/docs/${entidade.id}`;
  }
}

function EntidadeNode({
  entidade,
  depth,
}: {
  entidade: Entidade;
  depth: number;
}) {
  const [open, setOpen] = useState(depth === 0);
  const pathname = usePathname();
  const filhos = useFilhosDe(entidade.id);
  const hasChildren = filhos.length > 0;
  const href = hrefFor(entidade);
  const active = pathname === href || pathname.startsWith(href + "/");
  const isEspaco = entidade.idClasse === "espaco";
  const isPasta = entidade.idClasse === "pasta";
  const canHaveChildren = isEspaco || isPasta;
  const privado = isEspaco && entidade.meta.visibilidade === "privado";

  /* indentação progressiva — 12px por nível, exatamente como ClickUp */
  const paddingLeft = 8 + depth * 14;

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
        {/* ── Para PASTAS: o ícone de pasta fica no lugar do chevron.
             No hover o ícone some e o chevron aparece no mesmo espaço.
             Para demais itens: chevron separado + ícone separado. ── */}
        {isPasta ? (
          /* Pasta: botão único que contém ícone/chevron sobrepostos */
          <button
            type="button"
            aria-label={open ? "Colapsar" : "Expandir"}
            onClick={() => setOpen((v) => !v)}
            className="relative mr-1.5 grid size-[18px] shrink-0 place-items-center text-muted-foreground hover:text-foreground"
          >
            {/* ícone da pasta — some no hover, substituído pelo chevron */}
            <span className="group-hover:hidden flex items-center justify-center">
              {open
                ? <IcFolderOpen className={active ? "text-sidebar-accent-foreground" : "text-muted-foreground"} />
                : <IcFolder     className={active ? "text-sidebar-accent-foreground" : "text-muted-foreground"} />
              }
            </span>
            {/* chevron — aparece no hover no mesmo espaço */}
            <span className="hidden group-hover:flex items-center justify-center absolute inset-0">
              {open
                ? <ChevronDown  className="size-3" />
                : <ChevronRight className="size-3" />
              }
            </span>
          </button>
        ) : isEspaco ? (
          /* Espaço: sem chevron de arquivo, chip fica no lugar do ícone */
          <>
            {hasChildren ? (
              <button
                type="button"
                aria-label={open ? "Colapsar" : "Expandir"}
                onClick={() => setOpen((v) => !v)}
                className="mr-0.5 grid size-4 shrink-0 place-items-center text-muted-foreground hover:text-foreground"
              >
                {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
              </button>
            ) : (
              <span className="mr-0.5 size-4 shrink-0" />
            )}
            <span className="mr-1.5 shrink-0">
              <SpaceChip
                iniciais={entidade.meta.iniciais}
                cor={entidade.meta.cor}
                iconName={entidade.meta.iconName}
                size="xs"
              />
            </span>
          </>
        ) : (
          /* Demais (board, backlog, doc): chevron + ícone separados */
          <>
            {hasChildren ? (
              <button
                type="button"
                aria-label={open ? "Colapsar" : "Expandir"}
                onClick={() => setOpen((v) => !v)}
                className="mr-0.5 grid size-4 shrink-0 place-items-center text-muted-foreground hover:text-foreground"
              >
                {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
              </button>
            ) : (
              <span className="mr-0.5 size-4 shrink-0" />
            )}
            <span className="mr-1.5 shrink-0">
              <ItemIcon classe={entidade.idClasse} active={active} />
            </span>
          </>
        )}

        {/* nome — link clicável */}
        <Link
          href={href}
          className="flex h-full flex-1 min-w-0 items-center truncate outline-none"
        >
          <span className="truncate">{entidade.nome}</span>
        </Link>

        {/* cadeado para espaços privados */}
        {privado && (
          <Lock
            className="mr-1 size-3 shrink-0 text-muted-foreground/60"
            aria-label="Privado"
          />
        )}

        {/* ações flutuantes (aparecem no hover) */}
        {canHaveChildren && (
          <div className="mr-1 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 has-data-[popup-open]:opacity-100">
            {isEspaco && (
              <button
                type="button"
                aria-label="Mais ações"
                className="grid size-4 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <MoreHorizontal className="size-3" />
              </button>
            )}
            <CreateMenu parent={entidade}>
              <button
                type="button"
                aria-label={`Adicionar em ${entidade.nome}`}
                className="grid size-4 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground data-popup-open:bg-muted data-popup-open:text-foreground"
              >
                <Plus className="size-3" />
              </button>
            </CreateMenu>
          </div>
        )}
      </div>

      {open && hasChildren && (
        <div className="relative mt-0.5 space-y-0.5" style={{
          // linha vertical de indentação — alinhada com o centro do chevron do pai
          ["--indent-line-left" as string]: `${8 + depth * 14 + 8}px`,
        }}>
          {/* indent guide — linha fina vertical igual ao ClickUp */}
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: `${8 + depth * 14 + 8}px`,
              top: 0,
              bottom: 0,
              width: 1,
              background: "var(--accent)",
              borderRadius: 1,
              pointerEvents: "none",
            }}
          />
          {filhos.map((filho) => (
            <EntidadeNode key={filho.id} entidade={filho} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function SpaceTree() {
  const [sectionOpen, setSectionOpen] = useState(true);
  const allEspacos = useEspacos();
  const openNewSpaceDialog = useNewSpaceDialogStore((s) => s.openDialog);

  return (
    <div>
      {/* label de seção — igual ao ClickUp: uppercase, pequeno, com chevron */}
      <div className="group mb-1 flex h-7 items-center justify-between px-3">
        <button
          type="button"
          onClick={() => setSectionOpen((v) => !v)}
          className="flex flex-1 items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 transition-colors hover:text-muted-foreground"
        >
          {sectionOpen ? (
            <ChevronDown className="size-2.5" />
          ) : (
            <ChevronRight className="size-2.5" />
          )}
          Espaços
        </button>
        <button
          type="button"
          aria-label="Novo espaço"
          onClick={openNewSpaceDialog}
          className="grid size-4 place-items-center rounded text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Plus className="size-3" />
        </button>
      </div>

      {sectionOpen && (
        <div className="space-y-1">
          {allEspacos.map((esp) => (
            <EntidadeNode key={esp.id} entidade={esp} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
}
