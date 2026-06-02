"use client";

import { Pencil, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { Entidade } from "@/lib/types/entidade";

/**
 * Menu de ações de uma entidade da árvore (espaço/pasta/item).
 *
 * Disparado pelo botão de três pontinhos na sidebar. Oferece Editar,
 * Duplicar e Excluir. As ações ainda emitem apenas `toast` — a integração
 * com mutations do backend será ligada quando os endpoints existirem.
 *
 * @example
 * <EntityActionsMenu entity={espaco}>
 *   <button aria-label="Mais ações"><MoreHorizontal /></button>
 * </EntityActionsMenu>
 */
type EntityActionsMenuProps = {
  entity: Entidade;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
};

export function EntityActionsMenu({
  entity,
  children,
  align = "start",
  side = "bottom",
}: EntityActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={children as React.ReactElement} />
      <DropdownMenuContent align={align} side={side} sideOffset={6} className="w-44 p-1">
        <DropdownMenuItem onClick={() => toast(`Editar "${entity.nome}"`)}>
          <Pencil />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast(`Duplicar "${entity.nome}"`)}>
          <Copy />
          Duplicar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => toast.error(`Excluir "${entity.nome}"`)}
        >
          <Trash2 />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
