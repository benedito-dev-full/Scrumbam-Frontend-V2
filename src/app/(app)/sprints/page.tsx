"use client";

import { useState } from "react";
import {
  Zap,
  Plus,
  ChevronDown,
  ChevronRight,
  CalendarRange,
  Flag,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  GitFork,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpaceChip } from "@/components/shell/space-chip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type SprintStatus = "ativo" | "planejado" | "concluido";

type SprintItem = {
  id: string;
  nome: string;
  espaco: string;
  espacoIniciais: string;
  espacoCor: string;
  status: SprintStatus;
  inicio: string;
  fim: string;
  total: number;
  concluidas: number;
  membros: string[];
  descricao?: string;
};

const mockSprints: SprintItem[] = [
  {
    id: "sp1",
    nome: "Sprint Q2 — Semana 1",
    espaco: "Produto",
    espacoIniciais: "P",
    espacoCor: "oklch(0.66 0.19 264)",
    status: "ativo",
    inicio: "2026-05-19",
    fim: "2026-05-30",
    total: 8,
    concluidas: 2,
    membros: ["RB", "AC", "JM"],
    descricao: "Autenticação, SSO e migração de banco.",
  },
  {
    id: "sp2",
    nome: "Sprint Q2 — Semana 2",
    espaco: "Produto",
    espacoIniciais: "P",
    espacoCor: "oklch(0.66 0.19 264)",
    status: "planejado",
    inicio: "2026-06-02",
    fim: "2026-06-13",
    total: 6,
    concluidas: 0,
    membros: ["RB", "AC"],
    descricao: "APIs v2 e dashboard de analytics.",
  },
  {
    id: "sp3",
    nome: "Sprint Marketing — Junho",
    espaco: "Marketing",
    espacoIniciais: "M",
    espacoCor: "oklch(0.65 0.18 145)",
    status: "ativo",
    inicio: "2026-05-20",
    fim: "2026-06-06",
    total: 6,
    concluidas: 1,
    membros: ["RB", "PS"],
  },
  {
    id: "sp4",
    nome: "Sprint Q1 — Final",
    espaco: "Produto",
    espacoIniciais: "P",
    espacoCor: "oklch(0.66 0.19 264)",
    status: "concluido",
    inicio: "2026-04-28",
    fim: "2026-05-09",
    total: 10,
    concluidas: 10,
    membros: ["RB", "AC", "JM"],
  },
  {
    id: "sp5",
    nome: "Sprint Marketing — Maio",
    espaco: "Marketing",
    espacoIniciais: "M",
    espacoCor: "oklch(0.65 0.18 145)",
    status: "concluido",
    inicio: "2026-05-05",
    fim: "2026-05-16",
    total: 7,
    concluidas: 6,
    membros: ["PS"],
  },
];

const STATUS_META: Record<SprintStatus, { label: string; dotClass: string; bgClass: string; textClass: string }> = {
  ativo: { label: "Ativo", dotClass: "bg-primary", bgClass: "bg-primary/12", textClass: "text-primary" },
  planejado: { label: "Planejado", dotClass: "bg-amber-400", bgClass: "bg-amber-400/12", textClass: "text-amber-400" },
  concluido: { label: "Concluído", dotClass: "bg-emerald-500", bgClass: "bg-emerald-500/12", textClass: "text-emerald-400" },
};

type TabId = "todos" | "ativos" | "planejados" | "concluidos";

const tabs: { id: TabId; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "ativos", label: "Ativos" },
  { id: "planejados", label: "Planejados" },
  { id: "concluidos", label: "Concluídos" },
];

const filtroMap: Record<TabId, SprintStatus | null> = {
  todos: null,
  ativos: "ativo",
  planejados: "planejado",
  concluidos: "concluido",
};

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export default function SprintsPage() {
  const [tab, setTab] = useState<TabId>("todos");
  const filtro = filtroMap[tab];
  const sprints = filtro ? mockSprints.filter((s) => s.status === filtro) : mockSprints;
  const ativos = sprints.filter((s) => s.status === "ativo");
  const resto = sprints.filter((s) => s.status !== "ativo");

  return (
    <>
      <PageHeader />

      <div className="flex h-10 items-center gap-px border-b border-border bg-background px-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "relative flex h-10 items-center gap-1.5 px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground",
              tab === t.id &&
                "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-t-sm after:bg-primary",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-5 space-y-6">
        {ativos.length > 0 && (
          <SprintGrupo titulo="Ativos" sprints={ativos} defaultOpen />
        )}
        {resto.length > 0 && (
          <SprintGrupo
            titulo={filtro === "planejado" ? "Planejados" : filtro === "concluido" ? "Concluídos" : "Outros"}
            sprints={resto}
            defaultOpen={filtro !== null}
          />
        )}
        {sprints.length === 0 && <EmptyState />}
      </div>
    </>
  );
}

function PageHeader() {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        <Zap className="size-4 text-muted-foreground" />
        <h1 className="text-sm font-semibold text-foreground">Sprints</h1>
      </div>
      <Button size="sm" className="gap-1.5">
        <Plus className="size-3.5" />
        Novo sprint
      </Button>
    </header>
  );
}

function SprintGrupo({
  titulo,
  sprints,
  defaultOpen = true,
}: {
  titulo: string;
  sprints: SprintItem[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-muted-foreground hover:text-foreground"
      >
        {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        {titulo}
        <span className="text-[12px] font-normal">{sprints.length}</span>
      </button>

      {open && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sprints.map((s) => (
            <SprintCard key={s.id} sprint={s} />
          ))}
        </div>
      )}
    </section>
  );
}

function SprintCard({ sprint: s }: { sprint: SprintItem }) {
  const meta = STATUS_META[s.status];
  const pct = s.total > 0 ? Math.round((s.concluidas / s.total) * 100) : 0;

  return (
    <button
      type="button"
      className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/30"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <SpaceChip iniciais={s.espacoIniciais} cor={s.espacoCor} size="xs" />
          <span className="truncate text-[13px] font-semibold text-foreground">
            {s.nome}
          </span>
        </div>
        <button
          type="button"
          aria-label="Mais ações"
          onClick={(e) => e.stopPropagation()}
          className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
        >
          <MoreHorizontal className="size-3.5" />
        </button>
      </div>

      {s.descricao && (
        <p className="text-[12px] text-muted-foreground line-clamp-1">{s.descricao}</p>
      )}

      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <CalendarRange className="size-3.5" />
        <span>{formatDate(s.inicio)} → {formatDate(s.fim)}</span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1 text-muted-foreground">
            <GitFork className="size-3" />
            <span>{s.concluidas}/{s.total} tarefas</span>
          </div>
          <span className={cn("font-semibold", meta.textClass)}>{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              s.status === "concluido" ? "bg-emerald-500" : "bg-primary",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex -space-x-1">
          {s.membros.slice(0, 4).map((iniciais) => (
            <Avatar key={iniciais} size="sm" className="border-2 border-card">
              <AvatarFallback className="text-[9px]">{iniciais}</AvatarFallback>
            </Avatar>
          ))}
          {s.membros.length > 4 && (
            <div className="flex size-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[9px] font-medium text-muted-foreground">
              +{s.membros.length - 4}
            </div>
          )}
        </div>

        <span
          className={cn(
            "inline-flex h-5 items-center gap-1.5 rounded-full px-2 text-[10px] font-medium uppercase tracking-wider",
            meta.bgClass,
            meta.textClass,
          )}
        >
          <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
          {meta.label}
        </span>
      </div>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-14 text-center">
      <div className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
        <Zap className="size-5" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-foreground">Nenhum sprint nesta categoria</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Crie um novo sprint para organizar o trabalho do time.
        </p>
      </div>
      <Button size="sm" className="mt-1 gap-1.5">
        <Plus className="size-3.5" />
        Novo sprint
      </Button>
    </div>
  );
}
