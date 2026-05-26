"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronDown, Flag } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMyTasks } from "@/hooks/use-tasks";
import {
  isTerminalIntention,
  priorityToColor,
} from "@/lib/mappers/task-status.mapper";
import {
  usePlannerPrefs,
  type PriorityThreshold,
} from "@/lib/stores/planner-prefs";
import type { TaskResponseDto } from "@/lib/types/api";
import { cn } from "@/lib/utils";

/**
 * Secao "Prioridades" do PlannerPanel.
 *
 * Lista plana (sem agrupamento) de tasks do usuario logado cuja prioridade
 * atinge ou supera o threshold escolhido no dropdown. Threshold persistido
 * em localStorage via `usePlannerPrefs`.
 *
 * Exemplo: threshold = "medium" -> mostra URGENT + HIGH + MEDIUM numa
 * unica lista, ordenada por prioridade desc + dueDate asc. Tasks em
 * estado terminal sao descartadas.
 */
export function PrioridadesSection() {
  const threshold = usePlannerPrefs((s) => s.priorityThreshold);
  const setThreshold = usePlannerPrefs((s) => s.setPriorityThreshold);
  const { data: tasks = [], isLoading } = useMyTasks();

  const filtered = useMemo(() => {
    const allowed = ALLOWED_BY_THRESHOLD[threshold];
    return tasks
      .filter((t) => {
        if (isTerminalIntention(t.status)) return false;
        const p = t.priority as AllowedPriority | undefined;
        return !!p && allowed.includes(p);
      })
      .sort((a, b) => {
        const ra = PRIORITY_RANK[a.priority as AllowedPriority] ?? 0;
        const rb = PRIORITY_RANK[b.priority as AllowedPriority] ?? 0;
        if (ra !== rb) return rb - ra;
        const ad = a.dueDate ?? "9999-12-31";
        const bd = b.dueDate ?? "9999-12-31";
        return ad.localeCompare(bd);
      });
  }, [tasks, threshold]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-[14px]">
        <div className="flex items-center gap-1.5">
          <Flag size={12} className="text-rose-400" />
          <span className="text-[12px] font-semibold text-foreground">
            Prioridades
          </span>
          {!isLoading && filtered.length > 0 && (
            <span className="text-[11px] text-muted-foreground">
              ({filtered.length})
            </span>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex items-center gap-1 rounded-md border border-border bg-transparent px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Selecionar nivel de prioridade"
              >
                {THRESHOLD_LABEL[threshold]}
                <ChevronDown size={11} strokeWidth={2} />
              </button>
            }
          />
          <DropdownMenuContent align="end" sideOffset={4} className="w-40">
            <DropdownMenuGroup>
              {(Object.keys(THRESHOLD_LABEL) as PriorityThreshold[]).map((t) => (
                <DropdownMenuItem
                  key={t}
                  className={cn(
                    "text-[12px]",
                    threshold === t && "font-semibold",
                  )}
                  onClick={() => setThreshold(t)}
                >
                  <span
                    className="mr-2 inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: THRESHOLD_COLOR[t] }}
                  />
                  {THRESHOLD_LABEL[t]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading ? (
        <div className="px-[14px] py-2 text-[12px] text-muted-foreground">
          Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <div className="mx-3 mb-2 rounded-md border border-dashed border-border px-3 py-4 text-center">
          <Flag size={16} className="mx-auto mb-2 block text-rose-400" />
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            Nenhuma tarefa nesse nivel de prioridade.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-px px-[14px] pb-2">
          {filtered.map((t) => (
            <li key={t.id}>
              <TaskRow task={t} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type AllowedPriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW";

const PRIORITY_RANK: Record<AllowedPriority, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const ALLOWED_BY_THRESHOLD: Record<PriorityThreshold, AllowedPriority[]> = {
  urgent: ["URGENT"],
  high: ["URGENT", "HIGH"],
  medium: ["URGENT", "HIGH", "MEDIUM"],
  low: ["URGENT", "HIGH", "MEDIUM", "LOW"],
};

const THRESHOLD_LABEL: Record<PriorityThreshold, string> = {
  urgent: "Urgente",
  high: "Alta+",
  medium: "Media+",
  low: "Baixa+",
};

const THRESHOLD_COLOR: Record<PriorityThreshold, string> = {
  urgent: priorityToColor("URGENT"),
  high: priorityToColor("HIGH"),
  medium: priorityToColor("MEDIUM"),
  low: priorityToColor("LOW"),
};

function TaskRow({ task }: { task: TaskResponseDto }) {
  const color = priorityToColor(task.priority);
  return (
    <Link
      href={`/lists/${task.projectId}`}
      className="flex items-center gap-2 rounded-md px-2 py-1 text-[13px] text-foreground transition-colors hover:bg-accent"
    >
      <span
        className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
        style={{ background: color }}
      />
      <span className="flex-1 truncate">{task.nome}</span>
      {task.identifier && (
        <span className="flex-shrink-0 text-[11px] text-muted-foreground">
          {task.identifier}
        </span>
      )}
    </Link>
  );
}
