"use client";

import { useState } from "react";
import {
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Flag,
  GitFork,
  MessageSquare,
  Plus,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SpaceChip } from "@/components/shell/space-chip";
import { cn } from "@/lib/utils";
import { mockTarefas } from "@/lib/mocks/tarefas";
import { mockMembros, mockEntidades } from "@/lib/mocks/entidades";
import { PRIORIDADE_META, STATUS_META, type Tarefa } from "@/lib/types/tarefa";
import { isEspaco } from "@/lib/types/entidade";

const TODAY = "2026-05-22";

function tarefasDeHoje(): Tarefa[] {
  return mockTarefas.filter(
    (t) => t.dataVencimento === TODAY || t.status === "atrasado",
  );
}

function agruparPorEspaco(tarefas: Tarefa[]): { espacoId: string; tarefas: Tarefa[] }[] {
  const map = new Map<string, Tarefa[]>();
  for (const t of tarefas) {
    const arr = map.get(t.espacoId) ?? [];
    arr.push(t);
    map.set(t.espacoId, arr);
  }
  return Array.from(map.entries()).map(([espacoId, lista]) => ({ espacoId, tarefas: lista }));
}

function getEspaco(id: string) {
  return mockEntidades.find((e) => isEspaco(e) && e.id === id) ?? null;
}

const COL_GRID = "grid-cols-[minmax(0,1fr)_100px_120px_100px_28px]";

export default function TodayPage() {
  const tarefas = tarefasDeHoje();
  const grupos = agruparPorEspaco(tarefas);
  const concluidas = tarefas.filter((t) => t.status === "concluido").length;
  const pct = tarefas.length > 0 ? Math.round((concluidas / tarefas.length) * 100) : 0;

  return (
    <>
      <PageHeader total={tarefas.length} concluidas={concluidas} pct={pct} />

      <div className="mx-auto w-full max-w-4xl px-4 py-4">
        {tarefas.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {grupos.map((g) => {
              const espaco = getEspaco(g.espacoId);
              if (!espaco || !isEspaco(espaco)) return null;
              return (
                <EspacoGrupo
                  key={g.espacoId}
                  espacoNome={espaco.nome}
                  espacoIniciais={espaco.meta.iniciais}
                  espacoCor={espaco.meta.cor}
                  espacoIconName={espaco.meta.iconName}
                  tarefas={g.tarefas}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function PageHeader({
  total,
  concluidas,
  pct,
}: {
  total: number;
  concluidas: number;
  pct: number;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        <CalendarClock className="size-4 text-muted-foreground" />
        <h1 className="text-sm font-semibold text-foreground">Hoje</h1>
        <span className="text-xs text-muted-foreground">
          {concluidas}/{total} tarefas
        </span>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[11px] font-medium text-emerald-400">{pct}%</span>
        </div>
      </div>
      <Button variant="ghost" size="xs" className="gap-1.5">
        <Sparkles className="size-3.5" />
        Planejamento IA
      </Button>
    </header>
  );
}

function EspacoGrupo({
  espacoNome,
  espacoIniciais,
  espacoCor,
  espacoIconName,
  tarefas,
}: {
  espacoNome: string;
  espacoIniciais: string;
  espacoCor: string;
  espacoIconName?: string | null;
  tarefas: Tarefa[];
}) {
  const [open, setOpen] = useState(true);

  return (
    <section>
      <header className="mb-1.5 flex h-7 items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="grid size-5 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {open ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          )}
        </button>
        <SpaceChip iniciais={espacoIniciais} cor={espacoCor} iconName={espacoIconName} size="xs" />
        <span className="text-[13px] font-semibold text-foreground">{espacoNome}</span>
        <span className="text-[12px] text-muted-foreground">{tarefas.length}</span>
      </header>

      {open && (
        <div className="overflow-hidden rounded-md border border-border">
          <div
            className={cn(
              "grid items-center bg-muted/30 px-3 text-[11px] uppercase tracking-wider text-muted-foreground",
              COL_GRID,
            )}
          >
            <div className="py-2">Nome</div>
            <div className="py-2">Responsável</div>
            <div className="py-2">Status</div>
            <div className="py-2">Prioridade</div>
            <div />
          </div>
          {tarefas.map((t) => (
            <TodayTaskRow key={t.id} tarefa={t} />
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
    </section>
  );
}

function TodayTaskRow({ tarefa }: { tarefa: Tarefa }) {
  const statusMeta = STATUS_META[tarefa.status];
  const prioMeta = tarefa.prioridade ? PRIORIDADE_META[tarefa.prioridade] : null;
  const membro = tarefa.responsavelId
    ? mockMembros.find((m) => m.id === tarefa.responsavelId)
    : null;

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

      <div className="flex h-9 items-center">
        {membro ? (
          <Avatar size="sm">
            <AvatarFallback>{membro.iniciais}</AvatarFallback>
          </Avatar>
        ) : (
          <span className="text-[12px] text-muted-foreground/40">—</span>
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
        <CalendarClock className="size-5" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-foreground">Nenhuma tarefa para hoje</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Aproveite o dia ou adicione novas tarefas.
        </p>
      </div>
    </div>
  );
}
