"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { useMyTasks } from "@/hooks/use-tasks";
import {
  intentionToColumn,
  isOverdue,
  isTerminalIntention,
  KANBAN_COLUMNS,
  type KanbanColumn,
} from "@/lib/mappers/task-status.mapper";
import type { TaskResponseDto } from "@/lib/types/api";

/**
 * Secao "Atribuidas a mim" do PlannerPanel.
 *
 * Consome `useMyTasks()` (que ja filtra `assigneeId = usuario logado` no
 * backend), descarta tasks em estado terminal (DONE/VALIDATED/CANCELLED/
 * DISCARDED/FAILED) e agrupa o resto pelas colunas Kanban canonicas:
 *
 *  - Backlog       (INBOX)
 *  - Pronto        (READY)
 *  - Em Progresso  (EXECUTING, VALIDATING)
 *  - Falhou        (FAILED — incluido por nao ser terminal logico, embora
 *                  esteja em TERMINAL_INTENTIONS; filtramos antes)
 *
 * Tasks atrasadas ganham um asterisco visual (badge "⚠") — quem quiser
 * agir nelas usa a secao "Hoje e atrasadas" logo abaixo.
 */
export function AtribuidasAMimSection() {
  const [open, setOpen] = useState(false);
  const { data: tasks = [], isLoading } = useMyTasks();

  const grouped = useMemo(() => {
    const map: Record<KanbanColumn, TaskResponseDto[]> = {
      backlog: [],
      ready: [],
      "em-progresso": [],
      concluido: [],
      falhou: [],
    };
    for (const t of tasks) {
      if (isTerminalIntention(t.status)) continue;
      map[intentionToColumn(t.status)].push(t);
    }
    const byDue = (a: TaskResponseDto, b: TaskResponseDto) => {
      const ad = a.dueDate ?? "9999-12-31";
      const bd = b.dueDate ?? "9999-12-31";
      return ad.localeCompare(bd);
    };
    for (const col of Object.keys(map) as KanbanColumn[]) {
      map[col].sort(byDue);
    }
    return map;
  }, [tasks]);

  const total =
    grouped.backlog.length +
    grouped.ready.length +
    grouped["em-progresso"].length +
    grouped.falhou.length;

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
        <span className="flex-1">Atribuidas a mim</span>
        {!isLoading && total > 0 && (
          <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-violet-500/20 px-1.5 text-[10px] font-bold text-violet-300">
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
              Voce nao tem tarefas em aberto.
            </div>
          ) : (
            <div className="flex flex-col gap-2 px-[14px] pb-2 pt-1">
              {KANBAN_COLUMNS.filter(
                (col) => col.id !== "concluido" && grouped[col.id].length > 0,
              ).map((col) => (
                <Group
                  key={col.id}
                  label={col.label}
                  color={col.color}
                  tasks={grouped[col.id]}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface GroupProps {
  label: string;
  color: string;
  tasks: TaskResponseDto[];
}

function Group({ label, color, tasks }: GroupProps) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5">
        <span
          className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
          style={{ background: color }}
        />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
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
  const overdue = isOverdue(task.dueDate, task.status);
  return (
    <Link
      href={`/lists/${task.projectId}`}
      className="flex items-center gap-2 rounded-md px-2 py-1 text-[13px] text-foreground transition-colors hover:bg-accent"
    >
      <span
        className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
        style={{ background: color }}
      />
      <span className="flex-1 truncate">
        {overdue && (
          <span className="mr-1 text-rose-400" title="Atrasada">
            ⚠
          </span>
        )}
        {task.nome}
      </span>
      {task.identifier && (
        <span className="flex-shrink-0 text-[11px] text-muted-foreground">
          {task.identifier}
        </span>
      )}
    </Link>
  );
}
