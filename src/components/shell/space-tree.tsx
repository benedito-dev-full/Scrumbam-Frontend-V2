"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Folder,
  Columns3,
  ListTodo,
  FileText,
  Lock,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { Entidade } from "@/lib/types/entidade";
import { useEspacos, useFilhosDe } from "@/lib/stores/entidades";
import { useNewSpaceDialogStore } from "@/lib/stores/new-space-dialog";
import { CreateMenu } from "./create-menu";
import { SpaceChip } from "./space-chip";

const NON_SPACE_ICONS: Record<
  Exclude<Entidade["idClasse"], "espaco">,
  LucideIcon
> = {
  pasta: Folder,
  board: Columns3,
  backlog: ListTodo,
  doc: FileText,
};

function hrefFor(entidade: Entidade): string {
  switch (entidade.idClasse) {
    case "espaco":
      return `/spaces/${entidade.id}`;
    case "pasta":
      return `/folders/${entidade.id}`;
    case "board":
      return `/boards/${entidade.id}`;
    case "backlog":
      return `/backlogs/${entidade.id}`;
    case "doc":
      return `/docs/${entidade.id}`;
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
  const active = pathname === href;
  const isEspaco = entidade.idClasse === "espaco";
  const isPasta = entidade.idClasse === "pasta";
  const canHaveChildren = isEspaco || isPasta;
  const Icon = isEspaco ? null : NON_SPACE_ICONS[entidade.idClasse];
  const privado = isEspaco && entidade.meta.visibilidade === "privado";

  return (
    <div>
      <div
        className={cn(
          "group flex h-7 items-center rounded text-[13px] text-sidebar-foreground/85 transition-colors",
          "hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
          active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
        )}
        style={{ paddingLeft: `${0.125 + depth * 0.875}rem` }}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-label={open ? "Colapsar" : "Expandir"}
            onClick={() => setOpen((v) => !v)}
            className="grid h-7 w-4 shrink-0 place-items-center text-muted-foreground hover:text-foreground"
          >
            {open ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        <div className="ml-1 shrink-0">
          {isEspaco ? (
            <SpaceChip
              iniciais={entidade.meta.iniciais}
              cor={entidade.meta.cor}
              iconName={entidade.meta.iconName}
              size="sm"
            />
          ) : (
            Icon && (
              <Icon
                className={cn(
                  "size-4 text-muted-foreground",
                  active && "text-sidebar-accent-foreground",
                )}
              />
            )
          )}
        </div>

        <Link
          href={href}
          className="ml-2 flex h-7 flex-1 items-center truncate outline-none"
        >
          {entidade.nome}
        </Link>

        {privado && (
          <Lock className="mr-1 size-3 shrink-0 text-muted-foreground" aria-label="Privado" />
        )}

        {canHaveChildren && (
          <div className="mr-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 has-data-[popup-open]:opacity-100">
            {isEspaco && (
              <button
                type="button"
                aria-label="Mais ações"
                className="grid size-5 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <MoreHorizontal className="size-3.5" />
              </button>
            )}
            <CreateMenu parent={entidade}>
              <button
                type="button"
                aria-label={`Adicionar em ${entidade.nome}`}
                className="grid size-5 place-items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-popup-open:bg-muted data-popup-open:text-foreground"
              >
                <Plus className="size-3.5" />
              </button>
            </CreateMenu>
          </div>
        )}
      </div>

      {open && hasChildren && (
        <div className="mt-px space-y-px">
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
      <div className="group flex h-7 items-center justify-between pr-1 pl-1">
        <button
          type="button"
          onClick={() => setSectionOpen((v) => !v)}
          className="flex h-full flex-1 items-center gap-1 rounded px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          {sectionOpen ? (
            <ChevronDown className="size-3" />
          ) : (
            <ChevronRight className="size-3" />
          )}
          Espaços
        </button>
        <button
          type="button"
          aria-label="Novo espaço"
          onClick={openNewSpaceDialog}
          className="grid size-5 place-items-center rounded text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      {sectionOpen && (
        <div className="mt-0.5 space-y-px">
          {allEspacos.map((esp) => (
            <EntidadeNode key={esp.id} entidade={esp} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
}
