"use client";

import { use } from "react";
import {
  ChevronDown,
  ChevronRight,
  Star,
  Filter,
  Settings2,
  Search,
  Plus,
  Sparkles,
  Share2,
  Bot,
  CalendarPlus,
  UserPlus,
  Flag,
  MessageSquare,
  GitFork,
  type LucideIcon,
} from "lucide-react";

import { ViewSwitcher } from "@/components/shell/view-switcher";
import { SpaceChip } from "@/components/shell/space-chip";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useEntidadesStore } from "@/lib/stores/entidades";
import { mockMembros } from "@/lib/mocks/entidades";
import {
  agruparPorStatus,
  diasUntil,
  tarefasPorEspaco,
} from "@/lib/mocks/tarefas";
import {
  PRIORIDADE_META,
  STATUS_META,
  type Prioridade,
  type StatusTarefa,
  type Tarefa,
} from "@/lib/types/tarefa";
import { isEspaco } from "@/lib/types/entidade";
import { cn } from "@/lib/utils";

const COL_GRID =
  "grid-cols-[40px_minmax(0,1fr)_120px_140px_120px_140px_40px]";

export default function SpacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const entidade = useEntidadesStore(
    (s) => s.entidades.find((e) => e.id === id) ?? null,
  );

  if (!entidade || !isEspaco(entidade)) {
    return (
      <div className="grid h-full place-items-center p-8 text-sm text-muted-foreground">
        Espaço não encontrado.
      </div>
    );
  }

  const tarefas = tarefasPorEspaco(id);
  const grupos = agruparPorStatus(tarefas);

  return (
    <>
      <PageHeader
        nome={entidade.nome}
        iniciais={entidade.meta.iniciais}
        cor={entidade.meta.cor}
        iconName={entidade.meta.iconName}
      />
      <ViewSwitcher defaultValue="list" />
      <ListToolbar tarefasCount={tarefas.length} />

      <div className="px-4 pb-8">
        {grupos.length === 0 ? (
          <EmptyState />
        ) : (
          grupos.map((grupo) => (
            <StatusGroup
              key={grupo.status}
              status={grupo.status}
              tarefas={grupo.tarefas}
            />
          ))
        )}

        <button
          type="button"
          className="mt-4 inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Plus className="size-3.5" />
          Novo status
        </button>
      </div>
    </>
  );
}

function PageHeader({
  nome,
  iniciais,
  cor,
  iconName,
}: {
  nome: string;
  iniciais: string;
  cor: string;
  iconName?: string | null;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4">
      <div className="flex min-w-0 items-center gap-1.5">
        <SpaceChip
          iniciais={iniciais}
          cor={cor}
          iconName={iconName}
          size="sm"
        />
        <h1 className="truncate text-sm font-semibold text-foreground">
          {nome}
        </h1>
        <button
          type="button"
          aria-label="Mudar espaço"
          className="grid size-5 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronDown className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label="Favoritar"
          className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-amber-400"
        >
          <Star className="size-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="xs" className="gap-1.5">
          <Bot className="size-3.5" />
          Agentes
        </Button>
        <Button variant="ghost" size="xs" className="gap-1.5">
          <Sparkles className="size-3.5" />
          Pergunte à IA
        </Button>
        <Separator orientation="vertical" className="mx-1 h-4" />
        <Button variant="outline" size="xs" className="gap-1.5">
          <Share2 className="size-3.5" />
          Compartilhar
        </Button>
      </div>
    </header>
  );
}

function ListToolbar({ tarefasCount }: { tarefasCount: number }) {
  return (
    <div className="flex h-11 items-center justify-between gap-2 border-b border-border bg-background/60 px-4">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="inline-flex h-7 items-center gap-1.5 rounded-md bg-primary/15 px-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
        >
          <span className="text-muted-foreground/80">Grupo:</span>
          Status
          <ChevronDown className="size-3" />
        </button>
        <button
          type="button"
          className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <GitFork className="size-3.5 text-muted-foreground" />
          Subtarefas
        </button>
        <button
          type="button"
          className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Settings2 className="size-3.5 text-muted-foreground" />
          Colunas
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Filter className="size-3.5" />
          Filtro
        </button>
        <button
          type="button"
          className="inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Fechado
        </button>
        <button
          type="button"
          className="inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <UserPlus className="size-3.5" />
          Responsável
        </button>
        <button
          type="button"
          aria-label="Buscar"
          className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Search className="size-3.5" />
        </button>
        <span className="text-[11px] text-muted-foreground">
          {tarefasCount} {tarefasCount === 1 ? "tarefa" : "tarefas"}
        </span>
        <Button size="sm" className="ml-1 gap-1">
          <Plus className="size-3.5" />
          Add Tarefa
        </Button>
      </div>
    </div>
  );
}

function StatusGroup({
  status,
  tarefas,
}: {
  status: StatusTarefa;
  tarefas: Tarefa[];
}) {
  const meta = STATUS_META[status];

  return (
    <section className="mt-4">
      <header className="mb-1.5 flex h-7 items-center gap-2">
        <button
          type="button"
          className="grid size-5 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Colapsar grupo"
        >
          <ChevronDown className="size-3.5" />
        </button>
        <StatusPill status={status} />
        <span className="text-[12px] font-medium text-muted-foreground">
          {tarefas.length}
        </span>
      </header>

      <div className="rounded-md border border-border overflow-hidden">
        <ColumnsHeader />
        <div>
          {tarefas.map((tarefa) => (
            <TaskRow key={tarefa.id} tarefa={tarefa} accent={meta.dotClass} />
          ))}
          <AddTaskRow />
        </div>
      </div>
    </section>
  );
}

function ColumnsHeader() {
  return (
    <div
      className={cn(
        "grid items-center bg-muted/30 px-2 text-[11px] uppercase tracking-wider text-muted-foreground",
        COL_GRID,
      )}
    >
      <div />
      <div className="py-2">Nome</div>
      <div className="py-2">Responsável</div>
      <div className="py-2">Data de vencimento</div>
      <div className="py-2">Prioridade</div>
      <div className="py-2">Status</div>
      <div className="py-2 text-center">
        <MessageSquare className="mx-auto size-3.5" aria-label="Comentários" />
      </div>
    </div>
  );
}

function TaskRow({ tarefa, accent }: { tarefa: Tarefa; accent: string }) {
  return (
    <div
      className={cn(
        "group grid items-center border-t border-border px-2 text-[13px] text-foreground transition-colors hover:bg-muted/40",
        COL_GRID,
      )}
    >
      <div className="grid h-8 place-items-center">
        {tarefa.subtarefas > 0 ? (
          <button
            type="button"
            aria-label="Expandir subtarefas"
            className="grid size-5 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="size-3.5" />
          </button>
        ) : (
          <span className="size-5" />
        )}
      </div>

      <div className="flex h-8 items-center gap-2 truncate">
        <span
          className={cn("size-1.5 shrink-0 rounded-full", accent)}
          aria-hidden
        />
        <span className="truncate">{tarefa.nome}</span>
        {tarefa.subtarefas > 0 && (
          <span className="inline-flex h-4 items-center gap-0.5 rounded bg-muted px-1 text-[10px] font-medium text-muted-foreground">
            <GitFork className="size-3" /> {tarefa.subtarefas}
          </span>
        )}
      </div>

      <ResponsavelCell responsavelId={tarefa.responsavelId} />
      <DataVencimentoCell iso={tarefa.dataVencimento} />
      <PrioridadeCell prioridade={tarefa.prioridade} />
      <div className="flex h-8 items-center">
        <StatusPill status={tarefa.status} />
      </div>
      <div className="grid h-8 place-items-center">
        <button
          type="button"
          aria-label="Comentários"
          className="grid size-5 place-items-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
        >
          <MessageSquare className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function AddTaskRow() {
  return (
    <button
      type="button"
      className="flex h-8 w-full items-center gap-2 border-t border-border px-2 text-[13px] text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
    >
      <Plus className="size-3.5" />
      Adicionar Tarefa
    </button>
  );
}

function StatusPill({ status }: { status: StatusTarefa }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1.5 rounded-full px-2 text-[11px] font-medium uppercase tracking-wider",
        meta.bgClass,
        meta.textClass,
      )}
    >
      <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
      {meta.label}
    </span>
  );
}

function ResponsavelCell({
  responsavelId,
}: {
  responsavelId: string | null;
}) {
  if (!responsavelId) {
    return (
      <div className="flex h-8 items-center">
        <Placeholder icon={UserPlus} label="Atribuir" />
      </div>
    );
  }
  const membro = mockMembros.find((m) => m.id === responsavelId);
  if (!membro) {
    return (
      <div className="flex h-8 items-center">
        <Placeholder icon={UserPlus} label="Atribuir" />
      </div>
    );
  }
  return (
    <div className="flex h-8 items-center gap-1.5">
      <Avatar size="sm" aria-label={membro.nome}>
        <AvatarFallback>{membro.iniciais}</AvatarFallback>
      </Avatar>
    </div>
  );
}

function DataVencimentoCell({ iso }: { iso: string | null }) {
  if (!iso) {
    return (
      <div className="flex h-8 items-center">
        <Placeholder icon={CalendarPlus} label="Definir" />
      </div>
    );
  }
  const dias = diasUntil(iso);
  const formatted = formatDate(iso);
  let extra: string | null = null;
  let tone = "text-muted-foreground";
  if (dias != null) {
    if (dias < 0) {
      extra = `atrasado ${Math.abs(dias)}d`;
      tone = "text-amber-400";
    } else if (dias === 0) {
      extra = "hoje";
      tone = "text-primary";
    } else if (dias <= 3) {
      tone = "text-foreground";
    }
  }
  return (
    <div className="flex h-8 flex-col justify-center text-[12px]">
      <span className={tone}>{formatted}</span>
      {extra && (
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {extra}
        </span>
      )}
    </div>
  );
}

function PrioridadeCell({ prioridade }: { prioridade: Prioridade | null }) {
  if (!prioridade) {
    return (
      <div className="flex h-8 items-center">
        <Placeholder icon={Flag} label="Definir" />
      </div>
    );
  }
  const meta = PRIORIDADE_META[prioridade];
  return (
    <div className="flex h-8 items-center gap-1.5 text-[12px] text-foreground">
      <Flag className={cn("size-3.5", meta.flagClass)} />
      {meta.label}
    </div>
  );
}

function Placeholder({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      className="inline-flex h-6 items-center gap-1 rounded px-1 text-[11px] text-muted-foreground/70 opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
      aria-label={label}
    >
      <Icon className="size-3.5" />
    </button>
  );
}

function EmptyState() {
  return (
    <div className="mt-8 flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-10 text-center">
      <div className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
        <Plus className="size-5" />
      </div>
      <h3 className="text-sm font-medium text-foreground">
        Nenhuma tarefa neste espaço ainda
      </h3>
      <p className="max-w-sm text-xs text-muted-foreground">
        Crie a primeira tarefa pra começar a popular este espaço.
      </p>
      <Button size="sm" className="mt-2 gap-1">
        <Plus className="size-3.5" />
        Add Tarefa
      </Button>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00.000Z");
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}
