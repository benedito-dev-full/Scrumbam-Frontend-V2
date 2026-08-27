"use client";

import React, { useState } from "react";
import { GripVertical } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { IcCaret, IcChat, IcPlus } from "@/components/lists/icons";
import { STATUS_CONFIG, GROUP_PILL_STYLE } from "@/components/lists/config";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { GroupsView } from "@/components/lists/groups-view";
import { useUpdateTaskStatus } from "@/hooks/use-tasks";
import type { ProjectMemberDto } from "@/hooks/use-members";
import type { TaskResponseDto, V3Intention } from "@/lib/types/api";
import {
  INTENTION_TO_STATUS,
  INTENTION_TO_STATUS_REVERSE,
  LIST_SHOW_STATUS_COLUMN,
  LIST_COL_COUNT,
  type StatusVisual,
  type SubtarefasMode,
} from "../_lib/list-view-types";
import type { TaskFilters } from "@/lib/filters/task-filters";
import { TaskRowBackend } from "./task-row-backend";

// ─── Colunas ──────────────────────────────────────────────────────────────────

/**
 * Larguras das colunas da Lista.
 *
 * Compartilhado entre o cabecalho (renderizado UMA vez, sticky) e a tabela de
 * cada grupo. Como todas usam `tableLayout: fixed` com este mesmo colgroup, as
 * tabelas alinham entre si sem nenhum truque de medicao.
 *
 * Sem a coluna Status, os fixos caem de ~808px para ~546px — e o Nome, que era
 * o que sobrava, mais que dobra.
 */
function ListColgroup() {
  return (
    <colgroup>
      <col style={{ width: 24 }} />
      <col style={{ width: "auto" }} />
      <col style={{ width: 170 }} />
      <col style={{ width: 150 }} />
      <col style={{ width: 130 }} />
      {LIST_SHOW_STATUS_COLUMN && <col style={{ width: 200 }} />}
      <col style={{ width: 40 }} />
      <col style={{ width: 32 }} />
    </colgroup>
  );
}

// ─── HeadRow ──────────────────────────────────────────────────────────────────
export function HeadRow() {
  const thStyle: React.CSSProperties = {
    fontWeight: 500,
    color: "var(--muted-foreground)",
    fontSize: 12,
    textAlign: "left",
    padding: "6px 10px",
    borderBottom: "1px solid var(--border)",
    background: "var(--background)",
  };
  return (
    <tr>
      <th style={{ ...thStyle, width: 24, padding: 0 }} />
      <th style={{ ...thStyle, paddingLeft: 8 }}>Nome</th>
      <th style={thStyle}>Responsável</th>
      <th style={thStyle}>Vencimento</th>
      <th style={thStyle}>Prioridade</th>
      {LIST_SHOW_STATUS_COLUMN && <th style={thStyle}>Status</th>}
      <th style={{ ...thStyle, textAlign: "center" }}>
        <IcChat size={13} />
      </th>
      <th style={{ ...thStyle, textAlign: "center" }}>
        <span
          style={{
            display: "inline-flex",
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "var(--accent)",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--foreground)",
          }}
        >
          <IcPlus size={11} />
        </span>
      </th>
    </tr>
  );
}

// ─── AddRow ───────────────────────────────────────────────────────────────────
export function AddRow({ onAddTask }: { onAddTask: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onAddTask}
      style={{ cursor: "pointer" }}
    >
      <td
        colSpan={LIST_COL_COUNT}
        style={{
          height: "calc(var(--row-h) - 6px)",
          borderBottom: "1px solid #1f1f25",
          background: hovered ? "var(--accent)" : "transparent",
        }}
      >
        <div
          style={{
            paddingLeft: 30,
            height: "calc(var(--row-h) - 6px)",
            display: "flex",
            alignItems: "center",
            gap: 7,
            color: hovered ? "var(--foreground)" : "var(--muted-foreground)",
            fontSize: 13,
          }}
        >
          <IcPlus size={13} />
          Adicionar Tarefa
        </div>
      </td>
    </tr>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ onAddTask }: { onAddTask: () => void }) {
  return (
    <div
      style={{
        marginTop: 40,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        padding: 40,
        border: "1px dashed #26262d",
        borderRadius: 8,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--muted-foreground)",
        }}
      >
        <IcPlus size={18} />
      </div>
      <p
        style={{
          color: "var(--foreground)",
          fontSize: 14,
          fontWeight: 500,
          margin: 0,
        }}
      >
        Nenhuma tarefa nesta lista ainda
      </p>
      <p style={{ color: "var(--muted-foreground)", fontSize: 12, margin: 0 }}>
        Crie a primeira tarefa para começar.
      </p>
      <button
        type="button"
        onClick={onAddTask}
        style={{
          marginTop: 8,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          height: 32,
          padding: "0 14px",
          borderRadius: 7,
          border: "none",
          background: "linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)",
          color: "var(--background)",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        <IcPlus size={13} />
        Nova tarefa
      </button>
    </div>
  );
}

// ─── ListSkeleton ─────────────────────────────────────────────────────────────
export function ListSkeleton() {
  return (
    <div style={{ marginTop: 16 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            height: 36,
            marginBottom: 2,
            borderRadius: 4,
            background: "var(--card)",
          }}
        />
      ))}
    </div>
  );
}

// ─── GroupBlock ───────────────────────────────────────────────────────────────
export function GroupBlock({
  status,
  tarefas,
  subtarefasMode,
  onAddTask,
  onOpenTask,
  members,
  isDragging,
}: {
  status: StatusVisual;
  tarefas: TaskResponseDto[];
  subtarefasMode: SubtarefasMode;
  onAddTask: (defaultStatus?: StatusVisual) => void;
  onOpenTask: (task: TaskResponseDto) => void;
  members: ProjectMemberDto[];
  isDragging?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const cfg = STATUS_CONFIG[status];
  const StatusIcon = cfg.Icon;
  const { setNodeRef, isOver } = useDroppable({ id: status });

  const tarefasVisiveis = tarefas.filter((t) => !t.idPai);

  return (
    <div style={{ marginBottom: 8, marginTop: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 0 8px",
        }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            width: 18,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--muted-foreground)",
            background: "none",
            border: 0,
            cursor: "pointer",
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform .15s",
          }}
        >
          <IcCaret size={12} />
        </button>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "3px 9px",
            borderRadius: 5,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: ".7px",
            textTransform: "uppercase",
            background: GROUP_PILL_STYLE[status].bg,
            color: GROUP_PILL_STYLE[status].color,
          }}
        >
          <StatusIcon size={11} />
          {cfg.label}
        </span>
        <span
          style={{
            color: "var(--muted-foreground)",
            fontSize: 12,
            marginLeft: 2,
          }}
        >
          {tarefasVisiveis.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        style={{
          borderRadius: 8,
          transition: "background .15s",
          background: isOver ? "rgba(124,92,255,0.08)" : "transparent",
          outline: isOver ? "1px solid rgba(124,92,255,0.3)" : "none",
        }}
      >
        {open && (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              tableLayout: "fixed",
            }}
          >
            {/* Sem <thead>: o cabecalho e renderizado UMA vez no topo da
                Lista (sticky). Antes cada grupo montava a propria <table> COM
                <thead>, entao "Nome / Responsavel / Vencimento / Prioridade"
                se repetia a cada grupo na tela. */}
            <ListColgroup />
            <tbody>
              {tarefasVisiveis.map((t) => (
                <TaskRowBackend
                  key={t.id}
                  task={t}
                  onOpenTask={onOpenTask}
                  members={members}
                  subtarefasMode={subtarefasMode}
                />
              ))}
              {isDragging && tarefasVisiveis.length === 0 && (
                <tr>
                  <td colSpan={LIST_COL_COUNT}>
                    <div
                      style={{
                        padding: "12px 16px",
                        fontSize: 12,
                        color: "var(--muted-foreground)",
                        textAlign: "center",
                      }}
                    >
                      {isOver ? "Soltar aqui" : "Arraste para cá"}
                    </div>
                  </td>
                </tr>
              )}
              <AddRow onAddTask={() => onAddTask(status)} />
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── BoardContent ─────────────────────────────────────────────────────────────
export function BoardContent({
  listId,
  tasks,
  onOpenTask,
}: {
  listId: string;
  tasks: TaskResponseDto[];
  onOpenTask: (task: TaskResponseDto) => void;
}) {
  return (
    <KanbanBoard
      projectId={listId}
      tasks={tasks}
      onSelectTask={(taskId) => {
        const found = tasks.find((t) => t.id === taskId);
        if (found) onOpenTask(found);
      }}
    />
  );
}

// ─── ListContent ──────────────────────────────────────────────────────────────
export function ListContent({
  grupos,
  isLoading,
  subtarefasMode,
  onAddTask,
  onOpenTask,
  members,
  projectId,
  allTasks,
}: {
  grupos: { status: StatusVisual; tarefas: TaskResponseDto[] }[];
  isLoading: boolean;
  subtarefasMode: SubtarefasMode;
  onAddTask: (defaultStatus?: StatusVisual) => void;
  onOpenTask: (task: TaskResponseDto) => void;
  members: ProjectMemberDto[];
  projectId: string;
  allTasks: TaskResponseDto[];
}) {
  const queryClient = useQueryClient();
  const updateStatus = useUpdateTaskStatus();
  const [draggingTask, setDraggingTask] = useState<TaskResponseDto | null>(
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    const task = allTasks.find((t) => t.id === event.active.id);
    setDraggingTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggingTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const targetStatus = over.id as StatusVisual;
    const newIntention = INTENTION_TO_STATUS_REVERSE[targetStatus];
    if (!newIntention) return;

    const task = allTasks.find((t) => t.id === taskId);
    if (!task) return;

    // Já está no grupo certo
    const currentStatus = INTENTION_TO_STATUS[task.status] ?? "backlog";
    if (currentStatus === targetStatus) return;

    // Otimista
    queryClient.setQueryData<TaskResponseDto[]>(
      qk.tasks.byProject(projectId),
      (prev) =>
        prev?.map((t) =>
          t.id === taskId ? { ...t, status: newIntention as V3Intention } : t,
        ) ?? [],
    );

    updateStatus.mutate(
      { id: taskId, status: newIntention, projectId },
      {
        onSuccess: () =>
          void queryClient.invalidateQueries({
            queryKey: qk.tasks.byProject(projectId),
          }),
        onError: () =>
          void queryClient.invalidateQueries({
            queryKey: qk.tasks.byProject(projectId),
          }),
      },
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="flex-1 overflow-y-auto overflow-x-auto"
        style={{ background: "var(--background)" }}
      >
        <div style={{ minWidth: 860, padding: "0 22px 60px" }}>
          {/* Cabecalho de colunas — UMA vez, colado no topo ao rolar.
              `tableLayout: fixed` + o mesmo <ListColgroup /> das tabelas de
              grupo garantem o alinhamento sem medir nada em JS. */}
          {!isLoading && grupos.length > 0 && (
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 3,
                background: "var(--background)",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  tableLayout: "fixed",
                }}
              >
                <ListColgroup />
                <thead>
                  <HeadRow />
                </thead>
              </table>
            </div>
          )}

          {isLoading ? (
            <ListSkeleton />
          ) : grupos.length === 0 ? (
            <EmptyState onAddTask={() => onAddTask()} />
          ) : (
            grupos.map((g) => (
              <GroupBlock
                key={g.status}
                status={g.status}
                tarefas={g.tarefas}
                subtarefasMode={subtarefasMode}
                onAddTask={onAddTask}
                onOpenTask={onOpenTask}
                members={members}
                isDragging={draggingTask !== null}
              />
            ))
          )}
          <button
            type="button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              color: "var(--muted-foreground)",
              padding: "14px 4px 0 4px",
              fontSize: 13,
              cursor: "pointer",
              background: "none",
              border: 0,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--foreground)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--muted-foreground)")
            }
          >
            <IcPlus size={13} />
            Novo status
          </button>
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
        {draggingTask && (
          <div
            style={{
              background: "var(--card)",
              border: "1px solid #7c5cff40",
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 13,
              color: "var(--foreground)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              opacity: 0.95,
              display: "flex",
              alignItems: "center",
              gap: 8,
              minWidth: 300,
            }}
          >
            <GripVertical
              size={13}
              style={{ color: "var(--muted-foreground)", flexShrink: 0 }}
            />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                color: "var(--muted-foreground)",
                flexShrink: 0,
              }}
            >
              {draggingTask.identifier}
            </span>
            <span className="truncate">{draggingTask.nome}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

// ─── GroupsViewContent — wrapper para GroupsView na aba Blocos ────────────────
export function GroupsViewContent({
  projectId,
  filters,
  subtarefasMode,
  onOpenTask,
}: {
  projectId: string;
  filters: TaskFilters;
  subtarefasMode: SubtarefasMode;
  onOpenTask: (taskId: string) => void;
}) {
  return (
    <GroupsView
      projectId={projectId}
      filters={filters}
      subtarefasMode={subtarefasMode}
      onOpenTask={onOpenTask}
    />
  );
}
