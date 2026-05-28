"use client";

/**
 * Calendar view para tarefas de uma Lista.
 *
 * Renderiza um calendário mensal (grid 7x6) onde cada célula mostra as tasks
 * cuja `dueDate` cai naquele dia. Tasks sem `dueDate` aparecem em uma faixa
 * "Sem prazo" no rodapé.
 *
 * Construído do zero com date-fns (sem react-big-calendar) para manter
 * consistência visual com o resto da plataforma e zero dependência extra.
 *
 * Dados reais via `useTasksByProject` (mesmo hook que as outras views usam).
 */

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export function CalendarView({
  tasks,
  onOpenTask,
}: {
  tasks: TaskResponseDto[];
  onOpenTask: (task: TaskResponseDto) => void;
}) {
  const [cursor, setCursor] = useState<Date>(new Date());

  // Constrói matriz de dias do mês (6 semanas x 7 dias = 42 células)
  const { days, undated } = useMemo(() => {
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

    const withDate = tasks.filter((t) => !!t.dueDate);
    const noDate = tasks.filter((t) => !t.dueDate);

    return { days: cells, undated: noDate, _withDate: withDate };
  }, [cursor, tasks]);

  function tasksForDay(day: Date): TaskResponseDto[] {
    return tasks.filter((t) => {
      if (!t.dueDate) return false;
      const td = new Date(t.dueDate + "T12:00:00");
      return isSameDay(td, day);
    });
  }

  return (
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
          const inMonth = isSameMonth(day, cursor);
          const today = isToday(day);
          const dayTasks = tasksForDay(day);
          return (
            <div
              key={day.toISOString()}
              style={{
                minHeight: 110,
                borderRadius: 8,
                border: today
                  ? "1px solid #7c5cff"
                  : "1px solid #26262d",
                background: today
                  ? "rgba(124,92,255,0.06)"
                  : inMonth
                    ? "var(--card)"
                    : "transparent",
                padding: "6px 8px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                opacity: inMonth ? 1 : 0.4,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
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
                {dayTasks.length > 3 && (
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--muted-foreground)",
                      fontWeight: 600,
                    }}
                  >
                    +{dayTasks.length - 3}
                  </span>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  overflow: "hidden",
                }}
              >
                {dayTasks.slice(0, 3).map((t) => {
                  const color =
                    STATUS_COLOR[t.status as V3Intention] ?? "#6b7280";
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onOpenTask(t)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "3px 6px",
                        borderRadius: 4,
                        background: color + "20",
                        border: "none",
                        color: "var(--foreground)",
                        fontSize: 11,
                        cursor: "pointer",
                        textAlign: "left",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = color + "35";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = color + "20";
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: color,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {t.nome}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
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
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
            }}
          >
            {undated.map((t) => {
              const color = STATUS_COLOR[t.status as V3Intention] ?? "#6b7280";
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
  );
}

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
