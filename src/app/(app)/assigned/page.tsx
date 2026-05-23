"use client";

import { useState } from "react";
import {
  UserCheck,
  Flag,
  GitFork,
  MessageSquare,
  ChevronDown,
  Plus,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpaceChip } from "@/components/shell/space-chip";
import { cn } from "@/lib/utils";
import { mockTarefas, diasUntil } from "@/lib/mocks/tarefas";
import { mockEntidades } from "@/lib/mocks/entidades";
import { PRIORIDADE_META, STATUS_META, type StatusTarefa, type Tarefa } from "@/lib/types/tarefa";
import { isEspaco } from "@/lib/types/entidade";

const ME = "u1";

type TabId = "abertas" | "concluidas" | "todas";

const tabs: { id: TabId; label: string }[] = [
  { id: "abertas", label: "Abertas" },
  { id: "concluidas", label: "Concluídas" },
  { id: "todas", label: "Todas" },
];

const STATUS_FECHADOS: StatusTarefa[] = ["concluido"];

function getEspaco(id: string) {
  return mockEntidades.find((e) => isEspaco(e) && e.id === id) ?? null;
}

const COL_GRID = "grid-cols-[minmax(0,1fr)_140px_120px_110px_120px_28px]";

export default function AssignedPage() {
  const [tab, setTab] = useState<TabId>("abertas");

  const tarefasMinhas = mockTarefas.filter((t) => t.responsavelId === ME);

  const filtradas = tarefasMinhas.filter((t) => {
    if (tab === "abertas") return !STATUS_FECHADOS.includes(t.status);
    if (tab === "concluidas") return STATUS_FECHADOS.includes(t.status);
    return true;
  });

  const count = filtradas.length;

  return (
    <>
      <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4">
        <div className="flex items-center gap-2">
          <UserCheck className="size-4 text-muted-foreground" />
          <h1 className="text-sm font-semibold text-foreground">Atribuídas a mim</h1>
          <span className="rounded bg-muted px-1.5 text-[11px] font-medium text-muted-foreground">
            {count}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="xs" className="gap-1.5">
            <Filter className="size-3.5" />
            Filtro
          </Button>
          <Button size="sm" className="gap-1.5">
            <Plus className="size-3.5" />
            Nova tarefa
          </Button>
        </div>
      </header>

      <div className="flex h-10 items-center gap-px border-b border-border bg-background px-4">
        {tabs.map((t) => {
          const active = tab === t.id;
          const c = tarefasMinhas.filter((tr) => {
            if (t.id === "abertas") return !STATUS_FECHADOS.includes(tr.status);
            if (t.id === "concluidas") return STATUS_FECHADOS.includes(tr.status);
            return true;
          }).length;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "relative flex h-10 items-center gap-1.5 px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground",
                active &&
                  "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-t-sm after:bg-primary",
              )}
            >
              {t.label}
              {c > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-px text-[10px] font-semibold leading-none",
                    active
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {c}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex h-10 items-center gap-2 border-b border-border bg-background/60 px-4">
        <button
          type="button"
          className="inline-flex h-7 items-center gap-1.5 rounded-md bg-primary/15 px-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
        >
          <span className="text-muted-foreground/80">Grupo:</span>
          Espaço
          <ChevronDown className="size-3" />
        </button>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {count} tarefas
        </span>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-4">
        {filtradas.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <div
              className={cn(
                "grid items-center bg-muted/30 px-3 text-[11px] uppercase tracking-wider text-muted-foreground",
                COL_GRID,
              )}
            >
              <div className="py-2">Nome</div>
              <div className="py-2">Espaço</div>
              <div className="py-2">Status</div>
              <div className="py-2">Prioridade</div>
              <div className="py-2">Vencimento</div>
              <div />
            </div>
            {filtradas.map((t) => (
              <TaskRow key={t.id} tarefa={t} />
            ))}
            <button
              type="button"
              className="flex h-8 w-full items-center gap-2 border-t border-border px-3 text-[13px] text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            >
              <Plus className="size-3.5" />
              Adicionar tarefa
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function TaskRow({ tarefa }: { tarefa: Tarefa }) {
  const statusMeta = STATUS_META[tarefa.status];
  const prioMeta = tarefa.prioridade ? PRIORIDADE_META[tarefa.prioridade] : null;
  const espaco = getEspaco(tarefa.espacoId);
  const dias = diasUntil(tarefa.dataVencimento);

  let dataTone = "text-muted-foreground";
  let dataLabel = "—";
  if (tarefa.dataVencimento) {
    const d = new Date(tarefa.dataVencimento + "T00:00:00.000Z");
    dataLabel = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    if (dias != null) {
      if (dias < 0) dataTone = "text-amber-400";
      else if (dias === 0) dataTone = "text-primary";
      else if (dias <= 3) dataTone = "text-foreground";
    }
  }

  return (
    <div
      className={cn(
        "group grid items-center border-t border-border px-3 text-[13px] transition-colors hover:bg-muted/40",
        COL_GRID,
      )}
    >
      <div className="flex h-9 items-center gap-2 truncate">
        <span className={cn("size-1.5 shrink-0 rounded-full", statusMeta.dotClass)} />
        <span className="truncate text-foreground">{tarefa.nome}</span>
        {tarefa.subtarefas > 0 && (
          <span className="inline-flex h-4 items-center gap-0.5 rounded bg-muted px-1 text-[10px] font-medium text-muted-foreground">
            <GitFork className="size-3" />
            {tarefa.subtarefas}
          </span>
        )}
      </div>

      <div className="flex h-9 items-center gap-2">
        {espaco && isEspaco(espaco) && (
          <>
            <SpaceChip
              iniciais={espaco.meta.iniciais}
              cor={espaco.meta.cor}
              iconName={espaco.meta.iconName}
              size="xs"
            />
            <span className="text-[12px] text-muted-foreground">{espaco.nome}</span>
          </>
        )}
      </div>

      <div className="flex h-9 items-center">
        <span
          className={cn(
            "inline-flex h-5 items-center gap-1.5 rounded-full px-2 text-[11px] font-medium uppercase tracking-wider",
            statusMeta.bgClass,
            statusMeta.textClass,
          )}
        >
          <span className={cn("size-1.5 rounded-full", statusMeta.dotClass)} />
          {statusMeta.label}
        </span>
      </div>

      <div className="flex h-9 items-center gap-1.5">
        {prioMeta ? (
          <>
            <Flag className={cn("size-3.5", prioMeta.flagClass)} />
            <span className="text-[12px] text-foreground">{prioMeta.label}</span>
          </>
        ) : (
          <span className="text-[12px] text-muted-foreground/40">—</span>
        )}
      </div>

      <div className="flex h-9 items-center">
        <span className={cn("text-[12px]", dataTone)}>{dataLabel}</span>
      </div>

      <div className="grid h-9 place-items-center">
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-14 text-center">
      <div className="grid size-10 place-items-center rounded-full bg-emerald-500/10 text-emerald-400">
        <UserCheck className="size-5" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-foreground">Nenhuma tarefa nesta categoria</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Quando alguém te atribuir uma tarefa, ela aparecerá aqui.
        </p>
      </div>
    </div>
  );
}
