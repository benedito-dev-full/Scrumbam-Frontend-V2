"use client";

import {
  Folder,
  Columns3,
  ListTodo,
  FileText,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { ClasseId, Entidade } from "@/lib/types/entidade";

type CreatableType = Exclude<ClasseId, "espaco">;

type TypeDef = {
  label: string;
  icon: LucideIcon;
  description: string;
};

const TYPE_DEFS: Record<CreatableType, TypeDef> = {
  pasta: {
    label: "Pasta",
    icon: Folder,
    description: "Agrupe boards, backlogs e documentos.",
  },
  board: {
    label: "Board",
    icon: Columns3,
    description: "Kanban da sprint com swimlanes.",
  },
  backlog: {
    label: "Backlog",
    icon: ListTodo,
    description: "Lista priorizada de tarefas.",
  },
  doc: {
    label: "Documento",
    icon: FileText,
    description: "Texto rico, specs, runbooks.",
  },
};

function allowedChildTypes(parent: Entidade): CreatableType[] {
  if (parent.idClasse === "espaco") {
    return ["pasta", "board", "backlog", "doc"];
  }
  if (parent.idClasse === "pasta") {
    return ["board", "backlog", "doc"];
  }
  return [];
}

type CreateMenuProps = {
  parent: Entidade;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
};

export function CreateMenu({
  parent,
  children,
  align = "start",
  side = "bottom",
}: CreateMenuProps) {
  const types = allowedChildTypes(parent);
  if (types.length === 0) return null;

  const handleCreate = (type: CreatableType) => {
    const def = TYPE_DEFS[type];
    toast.success(`Criar ${def.label} em "${parent.nome}"`, {
      description: "Fluxo de criação entra na Phase B.",
    });
  };

  const pastaType = types.find((t) => t === "pasta");
  const itemTypes = types.filter((t) => t !== "pasta") as CreatableType[];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={children as React.ReactElement} />
      <DropdownMenuContent
        align={align}
        side={side}
        sideOffset={6}
        className="w-72"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
            Criar em {parent.nome}
          </DropdownMenuLabel>

          {pastaType && (
            <>
              <CreateMenuItem
                def={TYPE_DEFS.pasta}
                onSelect={() => handleCreate("pasta")}
              />
              <DropdownMenuSeparator />
            </>
          )}

          {itemTypes.map((type) => (
            <CreateMenuItem
              key={type}
              def={TYPE_DEFS[type]}
              onSelect={() => handleCreate(type)}
            />
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CreateMenuItem({
  def,
  onSelect,
}: {
  def: TypeDef;
  onSelect: () => void;
}) {
  const Icon = def.icon;
  return (
    <DropdownMenuItem onClick={onSelect} className="items-start gap-2.5 py-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">
          {def.label}
        </span>
        <span className="text-[11px] leading-snug text-muted-foreground">
          {def.description}
        </span>
      </div>
    </DropdownMenuItem>
  );
}

export function CreateSpaceTriggerIcon() {
  return <Plus className="size-3.5" />;
}
