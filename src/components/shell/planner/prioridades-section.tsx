"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Flag } from "lucide-react";

import { useMyTasks } from "@/hooks/use-tasks";
import {
  isTerminalIntention,
  priorityToColor,
  priorityToLabel,
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
 * Lista tasks atribuidas ao usuario logado (via `useMyTasks`) cujo nivel
 * de prioridade atinge ou supera o threshold escolhido — `URGENT`,
 * `HIGH`+ ou `MEDIUM`+. O threshold eh persistido em localStorage via
 * `usePlannerPrefs` para sobreviver a reloads.
 *
 * Tasks em estado terminal sao descartadas. Resultado eh agrupado por
 * prioridade em ordem descendente (Urgente -> Alta -> Media).
 */
export function PrioridadesSection() {
  const threshold = usePlannerPrefs((s) => s.priorityThreshold);
  const setThreshold = usePlannerPrefs((s) => s.setPriorityThreshold);
  const { data: tasks = [], isLoading } = useMyTasks();

  const grouped = useMemo(() => {
    const allowed = ALLOWED_BY_THRESHOLD[threshold];
    const result: Record<AllowedPriority, TaskResponseDto[]> = {
      URGENT: [],
      HIGH: [],
      MEDIUM: [],
    };
    for (const t of tasks) {
      if (isTerminalIntention(t.status)) continue;
      const p = t.priority as AllowedPriority | undefined;
      if (!p || !allowed.includes(p)) continue;
      result[p].push(t);
    }
    const byDue = (a: TaskResponseDto, b: TaskResponseDto) => {
      const ad = a.dueDate ?? "9999-12-31";
      const bd = b.dueDate ?? "9999-12-31";
      return ad.localeCompare(bd);
    };
    (Object.keys(result) as AllowedPriority[]).forEach((k) =>
      result[k].sort(byDue),
    );
    return result;
  }, [tasks, threshold]);

  const total =
    grouped.URGENT.length + grouped.HIGH.length + grouped.MEDIUM.length;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between px-[14px]">
        <div className="flex items-center gap-1.5">
          <Flag size={11} className="text-rose-400" />
          <span className="text-[12px] font-semibold text-foreground">
            Prioridades
          </span>
          {!isLoading && total > 0 && (
            <span className="text-[11px] text-muted-foreground">({total})</span>
          )}
        </div>
      </div>

      <div className="mx-3 mb-2 flex overflow-hidden rounded-md border border-border">
        {(Object.keys(THRESHOLD_LABEL) as PriorityThreshold[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setThreshold(t)}
            className={cn(
              "flex-1 border-0 px-2 py-1 text-[11px] font-medium transition-colors",
              threshold === t
                ? "bg-accent text-foreground"
                : "bg-transparent text-muted-foreground hover:bg-secondary",
            )}
          >
            {THRESHOLD_LABEL[t]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="px-[14px] py-2 text-[12px] text-muted-foreground">
          Carregando...
        </div>
      ) : total === 0 ? (
        <div className="mx-3 mb-2 rounded-md border border-dashed border-border px-3 py-4 text-center">
          <Flag
            size={16}
            className="mx-auto mb-2 block text-rose-400"
          />
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            Nenhuma tarefa atende a esse filtro.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 px-[14px] pb-2">
          {(["URGENT", "HIGH", "MEDIUM"] as AllowedPriority[])
            .filter((p) => grouped[p].length > 0)
            .map((p) => (
              <Group key={p} priority={p} tasks={grouped[p]} />
            ))}
        </div>
      )}
    </div>
  );
}

const THRESHOLD_LABEL: Record<PriorityThreshold, string> = {
  urgent: "Urgentes",
  high: "Alta+",
  medium: "Media+",
};

type AllowedPriority = "URGENT" | "HIGH" | "MEDIUM";

const ALLOWED_BY_THRESHOLD: Record<PriorityThreshold, AllowedPriority[]> = {
  urgent: ["URGENT"],
  high: ["URGENT", "HIGH"],
  medium: ["URGENT", "HIGH", "MEDIUM"],
};

function Group({
  priority,
  tasks,
}: {
  priority: AllowedPriority;
  tasks: TaskResponseDto[];
}) {
  const color = priorityToColor(priority);
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5">
        <span
          className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
          style={{ background: color }}
        />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {priorityToLabel(priority)}
        </span>
        <span className="text-[11px] text-muted-foreground">
          ({tasks.length})
        </span>
      </div>
      <ul className="flex flex-col gap-px">
        {tasks.map((t) => (
          <li key={t.id}>
            <TaskRow task={t} color={color} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function TaskRow({ task, color }: { task: TaskResponseDto; color: string }) {
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
