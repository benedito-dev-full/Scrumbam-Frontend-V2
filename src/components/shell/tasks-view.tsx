"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ListTodo,
  Flag,
  GitFork,
  MessageSquare,
  ChevronDown,
  Settings2,
  Plus,
  Filter,
} from "lucide-react";

// ─── Internos ─────────────────────────────────────────────────────────────────
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMyTasks } from "@/hooks/use-tasks";
import { isOverdue, priorityToColor, priorityToLabel } from "@/lib/mappers/task-status.mapper";

// ─── Types ────────────────────────────────────────────────────────────────────
import type { TaskResponseDto, V3Intention } from "@/lib/types/api";

// ─── Constantes ───────────────────────────────────────────────────────────────

const COL_GRID = "grid-cols-[minmax(0,1fr)_140px_110px_110px_28px]";

/**
 * Mapeamento de V3 Intention para label + classes CSS das tabs.
 * Só usamos as intentions relevantes para "minhas tarefas".
 */
const STATUS_LABEL: Record<string, string> = {
  INBOX: "Backlog",
  READY: "Ready",
  EXECUTING: "Em andamento",
  VALIDATING: "Validando",
  DONE: "Concluídas",
  FAILED: "Falhou",
  CANCELLED: "Canceladas",
  DISCARDED: "Descartadas",
  VALIDATED: "Validadas",
};

const STATUS_DOT: Record<string, string> = {
  INBOX: "bg-gray-400",
  READY: "bg-blue-400",
  EXECUTING: "bg-violet-500",
  VALIDATING: "bg-amber-400",
  DONE: "bg-emerald-400",
  FAILED: "bg-red-400",
  CANCELLED: "bg-gray-500",
  DISCARDED: "bg-gray-600",
  VALIDATED: "bg-emerald-500",
};

const allTabs = [
  { label: "Todas", href: "/tasks", filter: null as V3Intention | null },
  { label: "Em andamento", href: "/tasks/in-progress", filter: "EXECUTING" as V3Intention },
  { label: "Pendentes", href: "/tasks/pending", filter: "INBOX" as V3Intention },
  { label: "Concluídas", href: "/tasks/done", filter: "DONE" as V3Intention },
];

// ─── Componente principal ─────────────────────────────────────────────────────

export function TasksView({ filtro }: { filtro: V3Intention | null }) {
  const pathname = usePathname();
  const { data: allTasks = [], isLoading } = useMyTasks(filtro ?? undefined);

  return (
    <>
      <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4">
        <div className="flex items-center gap-2">
          <ListTodo className="size-4 text-muted-foreground" />
          <h1 className="text-sm font-semibold text-foreground">Minhas tarefas</h1>
          <span className="rounded bg-muted px-1.5 text-[11px] font-medium text-muted-foreground">
            {allTasks.length}
          </span>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-3.5" />
          Nova tarefa
        </Button>
      </header>

      <div className="flex h-10 items-center gap-px border-b border-border bg-background px-4">
        {allTabs.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "relative flex h-10 items-center gap-1.5 px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground",
                active &&
                  "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-t-sm after:bg-primary",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <div className="flex h-10 items-center gap-2 border-b border-border bg-background/60 px-4">
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
          <Settings2 className="size-3.5 text-muted-foreground" />
          Colunas
        </button>
        <button
          type="button"
          className="inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Filter className="size-3.5" />
          Filtro
        </button>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {allTasks.length} tarefas
        </span>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-4">
        {isLoading ? (
          <TaskListSkeleton />
        ) : allTasks.length === 0 ? (
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
              <div className="py-2">Status</div>
              <div className="py-2">Prioridade</div>
              <div className="py-2">Vencimento</div>
              <div />
            </div>
            {allTasks.map((t) => (
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

// ─── TaskRow ──────────────────────────────────────────────────────────────────

function TaskRow({ tarefa }: { tarefa: TaskResponseDto }) {
  const dotClass = STATUS_DOT[tarefa.status] ?? "bg-gray-400";
  const statusLabel = STATUS_LABEL[tarefa.status] ?? tarefa.status;
  const prioLabel = priorityToLabel(tarefa.priority);
  const prioColor = priorityToColor(tarefa.priority);
  const overdue = isOverdue(tarefa.dueDate, tarefa.status as V3Intention);

  let dataTone = "text-muted-foreground";
  let dataLabel = "—";
  if (tarefa.dueDate) {
    const d = new Date(tarefa.dueDate);
    dataLabel = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    if (overdue) dataTone = "text-amber-400";
  }

  return (
    <div
      className={cn(
        "group grid items-center border-t border-border px-3 text-[13px] transition-colors hover:bg-muted/40",
        COL_GRID,
      )}
    >
      {/* Nome / título */}
      <div className="flex h-9 items-center gap-2 truncate">
        <span className={cn("size-1.5 shrink-0 rounded-full", dotClass)} />
        <span className="font-mono text-[11px] text-muted-foreground shrink-0">
          {tarefa.identifier}
        </span>
        <span className="truncate text-foreground">{tarefa.title}</span>
        {tarefa.idPai && (
          <span className="inline-flex h-4 items-center gap-0.5 rounded bg-muted px-1 text-[10px] font-medium text-muted-foreground">
            <GitFork className="size-3" />
          </span>
        )}
      </div>

      {/* Status */}
      <div className="flex h-9 items-center">
        <span className="inline-flex h-5 items-center gap-1.5 rounded-full bg-muted px-2 text-[11px] font-medium">
          <span className={cn("size-1.5 rounded-full", dotClass)} />
          {statusLabel}
        </span>
      </div>

      {/* Prioridade */}
      <div className="flex h-9 items-center gap-1.5">
        {tarefa.priority ? (
          <>
            <Flag className="size-3.5" style={{ color: prioColor }} />
            <span className="text-[12px] text-foreground">{prioLabel}</span>
          </>
        ) : (
          <span className="text-[12px] text-muted-foreground/40">—</span>
        )}
      </div>

      {/* Vencimento */}
      <div className="flex h-9 items-center">
        <span className={cn("text-[12px]", dataTone)}>
          {overdue && tarefa.dueDate ? "⚠ " : ""}
          {dataLabel}
        </span>
      </div>

      {/* Ações */}
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

// ─── TaskListSkeleton ─────────────────────────────────────────────────────────

function TaskListSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex h-9 items-center gap-3 border-t border-border px-3 first:border-t-0"
        >
          <div className="size-1.5 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-[180px] animate-pulse rounded bg-muted" />
          <div className="ml-auto h-3 w-16 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-14 text-center">
      <div className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
        <ListTodo className="size-5" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-foreground">Nenhuma tarefa</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Crie sua primeira tarefa para começar.
        </p>
      </div>
      <Button size="sm" className="mt-1 gap-1.5">
        <Plus className="size-3.5" />
        Nova tarefa
      </Button>
    </div>
  );
}
