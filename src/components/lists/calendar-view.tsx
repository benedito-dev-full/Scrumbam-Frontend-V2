"use client";

/**
 * Calendar view para tarefas de uma Lista.
 *
 * Renderiza um calendário mensal (grid 7x6) onde cada célula mostra as tasks
 * cuja `dueDate` cai naquele dia, como pills tonais (fundo da cor com baixa
 * opacidade + dot sólido + texto na cor). A cor mapeia o status do fluxo; tasks
 * atrasadas (dueDate no passado e não concluídas) ganham destaque vermelho
 * independente do status.
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
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";

import type { TaskResponseDto, V3Intention } from "@/lib/types/api";

const STATUS_COLOR: Partial<Record<V3Intention, string>> = {
  EXECUTING: "#a78bfa",
  READY: "#60a5fa",
  INBOX: "#6b7280",
  FAILED: "#ef4444",
  DONE: "#22c55e",
};

const DONE_STATUSES = ["DONE"];
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
  return {
    color: STATUS_COLOR[task.status as V3Intention] ?? "#6b7280",
    overdue: false,
  };
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

        {/* Cabeçalho dos dias da semana — dentro do mesmo quadro da grade,
            para as colunas lerem como continuacao uma da outra. */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            border: "1px solid var(--border)",
            borderBottom: "none",
            borderRadius: "10px 10px 0 0",
            overflow: "hidden",
            background: "var(--muted)",
          }}
        >
          {WEEKDAYS.map((wd) => (
            <div
              key={wd}
              style={{
                padding: "7px 8px",
                borderRight: "1px solid var(--border)",
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

        {/* Grid de células — moldura unica com fios de 1px entre os dias.
            Antes eram 42 caixas arredondadas soltas com 4px de respiro: lia
            como 42 cartoes flutuando, nao como um calendario. Grade continua
            e o que Google Calendar e Notion usam. */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            border: "1px solid var(--border)",
            borderRadius: "0 0 10px 10px",
            overflow: "hidden",
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
              border: "1px dashed var(--border)",
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
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--accent)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--card)";
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

      {/* Overlay arrastado — pill que segue o cursor (fundo sólido p/ destacar) */}
      <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
        {activeTask ? (
          <div
            style={{
              ...taskBarStyle(),
              background: "var(--card)",
              boxShadow: "0 8px 20px rgba(0,0,0,.45)",
              cursor: "grabbing",
            }}
          >
            <span style={dotStyle(taskColor(activeTask).color)} />
            <span style={taskTextStyle(taskColor(activeTask).overdue)}>
              {activeTask.nome}
            </span>
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
        minWidth: 0,
        minHeight: 104,
        // Fios de 1px entre celulas em vez de borda por celula.
        borderRight: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        background: isOver
          ? "rgba(124,92,255,0.12)"
          : inMonth
            ? "var(--card)"
            : "var(--muted)",
        padding: "6px 6px 8px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        transition: "background .12s",
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
        {/* Hoje = circulo preenchido no NUMERO. Antes o dia de hoje tingia a
            celula inteira de roxo, o que competia com as tasks dentro dela.
            Google Calendar e Notion marcam so o numero. */}
        <span
          style={{
            display: "grid",
            placeItems: "center",
            minWidth: 20,
            height: 20,
            padding: "0 5px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: today ? 700 : 500,
            background: today ? "#7c5cff" : "transparent",
            color: today
              ? "#fff"
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
        ...taskBarStyle(),
        opacity: isDragging ? 0.35 : 1,
        boxShadow: overdue ? `0 0 0 1px ${color}66 inset` : undefined,
        cursor: "grab",
      }}
    >
      <span style={dotStyle(color)} />
      <span style={taskTextStyle(overdue)}>{task.nome}</span>
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
          border: "1px solid var(--border)",
          background: "var(--popover)",
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
            const { color, overdue } = taskColor(t);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTask(t);
                }}
                title={t.nome}
                style={{ ...taskBarStyle(), cursor: "pointer" }}
              >
                <span style={dotStyle(color)} />
                <span style={taskTextStyle(overdue)}>{t.nome}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ─── Estilos compartilhados ────────────────────────────────────────────────── */

/**
 * Pill tonal: fundo da cor com baixa opacidade (~13%), borda sutil, dot sólido
 * e texto na cor. A cor vira acento de status, não um bloco chapado — fica
 * legível mesmo com títulos longos e não pesa visualmente na grade.
 */
function taskBarStyle(): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "3px 6px",
    borderRadius: 5,
    // Fundo NEUTRO. Antes cada pill era um bloco na cor do status (vermelho
    // para atrasada, verde para concluida) e o mes inteiro virava uma parede
    // de cor. O sinal agora vive no dot — pequeno, mas e o unico ponto
    // colorido da linha, entao le melhor do que quando tudo era colorido.
    background: "var(--card)",
    border: "1px solid var(--border)",
    fontSize: 11,
    fontWeight: 500,
    lineHeight: "16px",
    textAlign: "left",
    width: "100%",
    overflow: "hidden",
  };
}

/** Dot sólido da cor, alinhado à esquerda da pill. */
function dotStyle(color: string): React.CSSProperties {
  return {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: color,
    flexShrink: 0,
  };
}

/** Texto truncado em 1 linha, na cor da task (clareada p/ legibilidade dark). */
function taskTextStyle(overdue: boolean): React.CSSProperties {
  return {
    // `minWidth: 0` e `flex: 1` sao o que fazem o ellipsis funcionar: um flex
    // item tem `min-width: auto` por padrao e se recusa a encolher abaixo do
    // proprio conteudo. Sem isso, o texto empurrava a pill, a pill empurrava a
    // celula e a celula empurrava a COLUNA da grade — os outros dias da semana
    // eram espremidos ate zero pixel e sumiam da tela.
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    // Texto neutro por padrao — a cor do status vive no dot. Vermelho SO em
    // task atrasada, que e o unico caso que precisa gritar. Antes todo texto
    // era colorido pelo status e o mes virava uma parede vermelha/verde.
    color: overdue ? "#f87171" : "var(--foreground)",
  };
}

const navBtnStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  display: "grid",
  placeItems: "center",
  borderRadius: 6,
  border: "1px solid var(--border)",
  background: "var(--card)",
  color: "var(--foreground)",
  cursor: "pointer",
};
