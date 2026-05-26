"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  ChevronRight,
} from "lucide-react";

import { useMyTasks } from "@/hooks/use-tasks";
import { isDueToday, isOverdue } from "@/lib/mappers/task-status.mapper";
import type { TaskResponseDto } from "@/lib/types/api";

/**
 * Secao "Hoje e atrasadas" do PlannerPanel.
 *
 * Encapsula:
 *  - O cabecalho colapsavel (chevron + label + badge com total)
 *  - O fetch via `useMyTasks()` (filtra automaticamente por
 *    `assigneeId = usuario logado` no backend)
 *  - O split client-side em dois grupos mutuamente exclusivos:
 *      * Atrasadas: dueDate < agora e status nao-terminal
 *      * Hoje: dueDate cai hoje e status nao-terminal
 *
 * O fetch acontece independente do collapse (uma vez montado o painel),
 * pra que o badge mostre o total mesmo com a secao fechada.
 */
export function HojeEAtrasadasSection() {
  const [open, setOpen] = useState(false);
  const { data: tasks = [], isLoading } = useMyTasks();

  const { atrasadas, hoje } = useMemo(() => {
    const atr: TaskResponseDto[] = [];
    const hj: TaskResponseDto[] = [];
    for (const t of tasks) {
      if (isOverdue(t.dueDate, t.status)) atr.push(t);
      else if (isDueToday(t.dueDate, t.status)) hj.push(t);
    }
    const byDue = (a: TaskResponseDto, b: TaskResponseDto) =>
      (a.dueDate ?? "").localeCompare(b.dueDate ?? "");
    return { atrasadas: atr.sort(byDue), hoje: hj.sort(byDue) };
  }, [tasks]);

  const total = atrasadas.length + hoje.length;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 border-0 bg-transparent px-[14px] py-1.5 text-left text-[13px] font-semibold text-foreground hover:bg-accent"
      >
        <ChevronRight
          size={13}
          strokeWidth={2.5}
          className="text-muted-foreground transition-transform"
          style={{ transform: open ? "rotate(90deg)" : "none" }}
        />
        <span className="flex-1">Hoje e atrasadas</span>
        {!isLoading && total > 0 && (
          <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500/20 px-1.5 text-[10px] font-bold text-rose-300">
            {total}
          </span>
        )}
      </button>

      {open && (
        <div className="pb-1">
          {isLoading ? (
            <div className="px-[14px] py-2 text-[12px] text-muted-foreground">
              Carregando...
            </div>
          ) : total === 0 ? (
            <div className="mx-3 my-1 rounded-md bg-card px-3 py-3 text-center text-[12px] text-muted-foreground">
              Nenhuma tarefa para hoje nem atrasada.
            </div>
          ) : (
            <div className="flex flex-col gap-2 px-[14px] pb-2 pt-1">
              {atrasadas.length > 0 && (
                <Group
                  icon={<AlertTriangle size={11} className="text-rose-400" />}
                  label="Atrasadas"
                  count={atrasadas.length}
                  tasks={atrasadas}
                  variant="overdue"
                />
              )}
              {hoje.length > 0 && (
                <Group
                  icon={<CalendarClock size={11} className="text-amber-400" />}
                  label="Hoje"
                  count={hoje.length}
                  tasks={hoje}
                  variant="today"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface GroupProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  tasks: TaskResponseDto[];
  variant: "overdue" | "today";
}

function Group({ icon, label, count, tasks, variant }: GroupProps) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="text-[11px] text-muted-foreground">({count})</span>
      </div>
      <ul className="flex flex-col gap-px">
        {tasks.map((t) => (
          <li key={t.id}>
            <TaskRow task={t} variant={variant} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function TaskRow({
  task,
  variant,
}: {
  task: TaskResponseDto;
  variant: "overdue" | "today";
}) {
  const dotColor = variant === "overdue" ? "bg-rose-500" : "bg-amber-400";
  return (
    <Link
      href={`/lists/${task.projectId}`}
      className="flex items-center gap-2 rounded-md px-2 py-1 text-[13px] text-foreground transition-colors hover:bg-accent"
    >
      <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${dotColor}`} />
      <span className="flex-1 truncate">{task.nome}</span>
      {task.identifier && (
        <span className="flex-shrink-0 text-[11px] text-muted-foreground">
          {task.identifier}
        </span>
      )}
    </Link>
  );
}
