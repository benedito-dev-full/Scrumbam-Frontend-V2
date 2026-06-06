"use client";

/**
 * Calendar view para tarefas de uma Lista.
 *
 * Renderiza um calendário mensal (grid 7x6) onde cada célula mostra as tasks
 * cuja `dueDate` cai naquele dia, como barras sólidas coloridas (estilo ClickUp).
 * A cor mapeia o status do fluxo; tasks atrasadas (dueDate no passado e não
 * concluídas) ganham destaque vermelho independente do status.
 *
 * Interações:
 *  - Clicar numa célula vazia → cria task já com a data preenchida (`onCreateOnDate`)
 *  - Arrastar uma barra para outro dia → remarca o `dueDate` (`onMoveTask`)
 *  - Clicar no "+N" de um dia lotado → popover com a lista completa do dia
 *  - Clicar numa barra → abre a task (`onOpenTask`)
 *
 * Construído com date-fns + @dnd-kit (já no projeto), sem dependência extra.
 * Dados reais via a mesma fonte das outras views (props `tasks`).
 */

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";

import type { TaskResponseDto, V3Intention } from "@/lib/types/api";

const STATUS_COLOR: Partial<Record<V3Intention, string>> = {
  EXECUTING: "#f59e0b",
  VALIDATING: "#a78bfa",
  READY: "#60a5fa",
  INBOX: "#6b7280",
  FAILED: "#ef4444",
  DISCARDED: "#ef4444",
  DONE: "#22c55e",
  VALIDATED: "#22c55e",
  CANCELLED: "#6b7280",
};

const DONE_STATUSES = ["DONE", "VALIDATED", "CANCELLED", "DISCARDED"];
const OVERDUE_COLOR = "#ef4444";
const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MAX_VISIBLE = 3;

/** Normaliza `dueDate` (date-only ou ISO completo) para "YYYY-MM-DD". */
function dayKey(dueDate: string): string {
  return dueDate.slice(0, 10);
}

/** Cor efetiva da task: vermelho se atrasada, senão a cor do status. */
function taskColor(task: TaskResponseDto): { color: string; overdue: boolean } {
  const isDone = DONE_STATUSES.includes(task.status);
  const overdue =
    !!task.dueDate &&
    !isDone &&
    new Date(dayKey(task.dueDate) + "T12:00:00") <
      new Date(format(new Date(), "yyyy-MM-dd") + "T12:00:00");
  if (overdue) return { color: OVERDUE_COLOR, overdue: true };
  return { color: STATUS_COLOR[task.status as V3Intention] ?? "#6b7280", overdue: false };
}

export function CalendarView({
  tasks,
  onOpenTask,
  onCreateOnDate,
  onMoveTask,
}: {
  tasks: TaskResponseDto[];
  onOpenTask: (task: TaskResponseDto) => void;
  /** Cria uma task com `dueDate` = dia clicado (formato "YYYY-MM-DD"). */
  onCreateOnDate?: (isoDate: string) => void;
  /** Remarca a task para o dia de destino (formato "YYYY-MM-DD"). */
  onMoveTask?: (task: TaskResponseDto, isoDate: string) => void;
}) {
  const [cursor, setCursor] = useState<Date>(new Date());
  const [activeTask, setActiveTask] = useState<TaskResponseDto | null>(null);
  const [openDay, setOpenDay] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  // Constrói matriz de dias (6 semanas x 7 = 42 células) + agrupa tasks por dia.
  const { days, undated, byDay } = useMemo(() => {
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const cells: Date[] = [];
    let d = gridStart;
    while (d <= gridEnd) {
      cells.push(d);
      d = addDays(d, 1);
    }

    const map = new Map<string, TaskResponseDto[]>();
    const noDate: TaskResponseDto[] = [];
    for (const t of tasks) {
      if (!t.dueDate) {
        noDate.push(t);
        continue;
      }
      const key = dayKey(t.dueDate);
      const arr = map.get(key);
      if (arr) arr.push(t);
      else map.set(key, [t]);
    }

    return { days: cells, undated: noDate, byDay: map };
  }, [cursor, tasks]);

  function handleDragStart(e: DragStartEvent) {
    const t = tasks.find((x) => x.id === e.active.id);
    setActiveTask(t ?? null);
  }

  function handleDragEnd(e: DragEndEvent) {
    const task = activeTask;
    setActiveTask(null);
    if (!task || !e.over) return;
    const targetDay = String(e.over.id);
    onMoveTask?.(task, targetDay);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="flex-1 overflow-auto"
        style={{ background: "var(--background)", padding: "20px 28px 60px" }}
      >
        {/* Header de navegação */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              onClick={() => setCursor((c) => subMonths(c, 1))}
              style={navBtnStyle}
              aria-label="Mês anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setCursor(new Date())}
              style={{
                ...navBtnStyle,
                width: "auto",
                padding: "0 12px",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => setCursor((c) => addMonths(c, 1))}
              style={navBtnStyle}
              aria-label="Próximo mês"
            >
              <ChevronRight size={16} />
            </button>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--foreground)",
                margin: 0,
                marginLeft: 8,
                textTransform: "capitalize",
              }}
            >
              {format(cursor, "MMMM 'de' yyyy", { locale: ptBR })}
            </h2>
          </div>

          <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
            {tasks.length} tarefa{tasks.length !== 1 ? "s" : ""} ·{" "}
            {undated.length} sem prazo
          </span>
        </div>

        {/* Cabeçalho dos dias da semana */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 4,
            marginBottom: 4,
          }}
        >
          {WEEKDAYS.map((wd) => (
            <div
              key={wd}
              style={{
                padding: "6px 8px",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--muted-foreground)",
                textTransform: "uppercase",
                letterSpacing: ".5px",
              }}
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Grid de células */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 4,
          }}
        >
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            return (
              <DayCell
                key={key}
                day={day}
                dayKey={key}
                inMonth={isSameMonth(day, cursor)}
                today={isToday(day)}
                tasks={byDay.get(key) ?? []}
                popoverOpen={openDay === key}
                onTogglePopover={() =>
                  setOpenDay((cur) => (cur === key ? null : key))
                }
                onClosePopover={() => setOpenDay(null)}
                onOpenTask={onOpenTask}
                onCreateOnDate={onCreateOnDate}
              />
            );
          })}
        </div>

        {/* Faixa de tasks sem prazo */}
        {undated.length > 0 && (
          <div
            style={{
              marginTop: 24,
              padding: "14px 16px",
              borderRadius: 8,
              border: "1px dashed #2a2a32",
              background: "var(--card)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--muted-foreground)",
                textTransform: "uppercase",
                letterSpacing: ".5px",
                marginBottom: 10,
              }}
            >
              {undated.length} sem prazo
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {undated.map((t) => {
                const { color } = taskColor(t);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onOpenTask(t)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 10px",
                      borderRadius: 5,
                      background: color + "18",
                      border: `1px solid ${color}30`,
                      color: "var(--foreground)",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = color + "30";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = color + "18";
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: color,
                      }}
                    />
                    {t.nome}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Overlay arrastado — barra sólida que segue o cursor */}
      <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
        {activeTask ? (
          <div style={{ ...taskBarStyle(taskColor(activeTask).color), boxShadow: "0 8px 20px rgba(0,0,0,.45)", cursor: "grabbing" }}>
            <span style={taskBarTextStyle}>{activeTask.nome}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/* ─── Célula de um dia ──────────────────────────────────────────────────────── */

function DayCell({
  day,
  dayKey,
  inMonth,
  today,
  tasks,
  popoverOpen,
  onTogglePopover,
  onClosePopover,
  onOpenTask,
  onCreateOnDate,
}: {
  day: Date;
  dayKey: string;
  inMonth: boolean;
  today: boolean;
  tasks: TaskResponseDto[];
  popoverOpen: boolean;
  onTogglePopover: () => void;
  onClosePopover: () => void;
  onOpenTask: (t: TaskResponseDto) => void;
  onCreateOnDate?: (isoDate: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dayKey });
  const [hover, setHover] = useState(false);
  const extra = tasks.length - MAX_VISIBLE;

  return (
    <div
      ref={setNodeRef}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        minHeight: 110,
        borderRadius: 8,
        border: isOver
          ? "1px solid #7c5cff"
          : today
            ? "1px solid #7c5cff"
            : "1px solid #26262d",
        background: isOver
          ? "rgba(124,92,255,0.12)"
          : today
            ? "rgba(124,92,255,0.06)"
            : inMonth
              ? "var(--card)"
              : "transparent",
        padding: "6px 6px 8px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        opacity: inMonth ? 1 : 0.4,
        transition: "background .12s, border-color .12s",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingLeft: 2,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: today ? 700 : 500,
            color: today
              ? "#7c5cff"
              : inMonth
                ? "var(--foreground)"
                : "var(--muted-foreground)",
          }}
        >
          {format(day, "d")}
        </span>
        {/* Botão "+" de criação — aparece no hover da célula */}
        {hover && onCreateOnDate && (
          <button
            type="button"
            onClick={() => onCreateOnDate(dayKey)}
            aria-label={`Criar task em ${dayKey}`}
            style={{
              display: "grid",
              placeItems: "center",
              width: 18,
              height: 18,
              borderRadius: 4,
              border: "none",
              background: "rgba(124,92,255,0.18)",
              color: "#a48bff",
              cursor: "pointer",
            }}
          >
            <Plus size={12} />
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {tasks.slice(0, MAX_VISIBLE).map((t) => (
          <DraggableTaskBar key={t.id} task={t} onOpenTask={onOpenTask} />
        ))}
      </div>

      {/* "+N" — abre popover com a lista completa do dia */}
      {extra > 0 && (
        <button
          type="button"
          onClick={onTogglePopover}
          style={{
            alignSelf: "flex-start",
            marginTop: 1,
            padding: "1px 6px",
            borderRadius: 4,
            border: "none",
            background: "transparent",
            color: "var(--muted-foreground)",
            fontSize: 10,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          +{extra} mais
        </button>
      )}

      {popoverOpen && (
        <DayPopover
          day={day}
          tasks={tasks}
          onClose={onClosePopover}
          onOpenTask={onOpenTask}
        />
      )}
    </div>
  );
}

/* ─── Barra arrastável de task ──────────────────────────────────────────────── */

function DraggableTaskBar({
  task,
  onOpenTask,
}: {
  task: TaskResponseDto;
  onOpenTask: (t: TaskResponseDto) => void;
}) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: task.id,
  });
  const { color, overdue } = taskColor(task);

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      type="button"
      onClick={() => onOpenTask(task)}
      title={task.nome}
      style={{
        ...taskBarStyle(color),
        opacity: isDragging ? 0.35 : 1,
        boxShadow: overdue ? `0 0 0 1px ${color}aa inset` : undefined,
        cursor: "grab",
      }}
    >
      <span style={taskBarTextStyle}>{task.nome}</span>
    </button>
  );
}

/* ─── Popover do dia (todas as tasks) ───────────────────────────────────────── */

function DayPopover({
  day,
  tasks,
  onClose,
  onOpenTask,
}: {
  day: Date;
  tasks: TaskResponseDto[];
  onClose: () => void;
  onOpenTask: (t: TaskResponseDto) => void;
}) {
  return (
    <>
      {/* backdrop invisível para fechar ao clicar fora */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 40 }}
      />
      <div
        style={{
          position: "absolute",
          top: 28,
          left: 4,
          right: 4,
          zIndex: 41,
          maxHeight: 280,
          overflowY: "auto",
          borderRadius: 8,
          border: "1px solid #2a2a32",
          background: "var(--popover, #16161a)",
          boxShadow: "0 12px 32px rgba(0,0,0,.5)",
          padding: 8,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--foreground)",
            marginBottom: 8,
            textTransform: "capitalize",
          }}
        >
          {format(day, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {tasks.map((t) => {
            const { color } = taskColor(t);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTask(t);
                }}
                title={t.nome}
                style={{ ...taskBarStyle(color), cursor: "pointer" }}
              >
                <span style={taskBarTextStyle}>{t.nome}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ─── Estilos compartilhados ────────────────────────────────────────────────── */

/** Barra sólida estilo ClickUp: fundo da cor cheia, texto claro, 1 linha. */
function taskBarStyle(color: string): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "3px 7px",
    borderRadius: 4,
    background: color,
    border: "none",
    color: "#fff",
    fontSize: 11,
    fontWeight: 500,
    lineHeight: "16px",
    textAlign: "left",
    width: "100%",
    overflow: "hidden",
  };
}

const taskBarTextStyle: React.CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  textShadow: "0 1px 1px rgba(0,0,0,.25)",
};

const navBtnStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  display: "grid",
  placeItems: "center",
  borderRadius: 6,
  border: "1px solid #2a2a32",
  background: "var(--card)",
  color: "var(--foreground)",
  cursor: "pointer",
};
