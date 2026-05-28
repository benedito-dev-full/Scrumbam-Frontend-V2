"use client";

/**
 * Gantt view para tarefas de uma Lista.
 *
 * Estratégia de datas (MVP):
 *  - startDate = `criadoEm` (data de criação)
 *  - endDate   = `dueDate` (data de vencimento)
 *  - Tasks sem `dueDate` são filtradas (precisa de fim pra desenhar barra)
 *
 * Renderiza:
 *  - Eixo horizontal com dias/semanas dentro do range visível
 *  - Para cada task, uma linha com nome (esquerda) + barra colorida (direita)
 *  - Hoje destacado com linha vertical roxa
 *  - Tasks atrasadas com barra vermelha
 *
 * Sem dependência de lib externa — construído do zero com date-fns.
 * Conecta com backend real via props `tasks` (TaskResponseDto[]).
 */

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import {
  addDays,
  differenceInDays,
  format,
  isToday,
  isWeekend,
  startOfDay,
  subDays,
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

const STATUS_LABEL: Partial<Record<V3Intention, string>> = {
  EXECUTING: "Em progresso",
  VALIDATING: "Validando",
  READY: "Pronto",
  INBOX: "Backlog",
  FAILED: "Falhou",
  DISCARDED: "Descartado",
  DONE: "Concluído",
  VALIDATED: "Validado",
  CANCELLED: "Cancelado",
};

type Zoom = "day" | "week";

export function GanttView({
  tasks,
  onOpenTask,
}: {
  tasks: TaskResponseDto[];
  onOpenTask: (task: TaskResponseDto) => void;
}) {
  const [cursor, setCursor] = useState<Date>(new Date());
  const [zoom, setZoom] = useState<Zoom>("day");

  // largura de cada célula (dia ou semana)
  const cellWidth = zoom === "day" ? 36 : 12;
  // quantos dias mostrar a partir do cursor (para trás e para frente)
  const daysBefore = zoom === "day" ? 7 : 30;
  const daysAfter = zoom === "day" ? 30 : 90;

  // Tasks com prazo definido (caso contrário não dá pra desenhar)
  const ganttTasks = useMemo(
    () =>
      tasks
        .filter((t) => !!t.dueDate)
        .sort((a, b) => {
          const ad = new Date(a.criadoEm).getTime();
          const bd = new Date(b.criadoEm).getTime();
          return ad - bd;
        }),
    [tasks],
  );

  const undated = tasks.filter((t) => !t.dueDate);

  // Range de datas visível
  const rangeStart = useMemo(
    () => startOfDay(subDays(cursor, daysBefore)),
    [cursor, daysBefore],
  );
  const rangeEnd = useMemo(
    () => startOfDay(addDays(cursor, daysAfter)),
    [cursor, daysAfter],
  );
  const totalDays = differenceInDays(rangeEnd, rangeStart) + 1;
  const totalWidth = totalDays * cellWidth;

  // Gera array de datas para o cabeçalho
  const dateColumns = useMemo(() => {
    const cols: Date[] = [];
    let d = rangeStart;
    while (d <= rangeEnd) {
      cols.push(d);
      d = addDays(d, 1);
    }
    return cols;
  }, [rangeStart, rangeEnd]);

  // Calcula posição/largura da barra de uma task
  function barGeometry(task: TaskResponseDto): {
    left: number;
    width: number;
    visible: boolean;
  } {
    const start = startOfDay(new Date(task.criadoEm));
    const end = startOfDay(new Date(task.dueDate! + "T12:00:00"));

    // Clamp ao range visível
    const visStart = start < rangeStart ? rangeStart : start;
    const visEnd = end > rangeEnd ? rangeEnd : end;

    if (visEnd < rangeStart || visStart > rangeEnd) {
      return { left: 0, width: 0, visible: false };
    }

    const left =
      Math.max(0, differenceInDays(visStart, rangeStart)) * cellWidth;
    const width = Math.max(
      cellWidth * 0.6,
      (differenceInDays(visEnd, visStart) + 1) * cellWidth,
    );

    return { left, width, visible: true };
  }

  // Posição da linha "hoje" no gráfico
  const todayLeft = useMemo(() => {
    const diff = differenceInDays(startOfDay(new Date()), rangeStart);
    if (diff < 0 || diff > totalDays) return null;
    return diff * cellWidth + cellWidth / 2;
  }, [rangeStart, totalDays, cellWidth]);

  return (
    <div
      className="flex-1 overflow-hidden flex flex-col"
      style={{ background: "var(--background)" }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 28px 12px",
          borderBottom: "1px solid #26262d",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={() => setCursor((c) => subDays(c, 14))}
            style={navBtnStyle}
            aria-label="Recuar"
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
            onClick={() => setCursor((c) => addDays(c, 14))}
            style={navBtnStyle}
            aria-label="Avançar"
          >
            <ChevronRight size={16} />
          </button>
          <span
            style={{
              marginLeft: 10,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--foreground)",
              textTransform: "capitalize",
            }}
          >
            {format(rangeStart, "d MMM", { locale: ptBR })} –{" "}
            {format(rangeEnd, "d MMM yyyy", { locale: ptBR })}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              color: "var(--muted-foreground)",
              marginRight: 4,
            }}
          >
            {ganttTasks.length} no gráfico · {undated.length} sem prazo
          </span>
          <button
            type="button"
            onClick={() => setZoom("week")}
            style={{
              ...navBtnStyle,
              background: zoom === "week" ? "var(--accent)" : "var(--card)",
            }}
            aria-label="Visão semanal"
            title="Visão semanal"
          >
            <ZoomOut size={14} />
          </button>
          <button
            type="button"
            onClick={() => setZoom("day")}
            style={{
              ...navBtnStyle,
              background: zoom === "day" ? "var(--accent)" : "var(--card)",
            }}
            aria-label="Visão diária"
            title="Visão diária"
          >
            <ZoomIn size={14} />
          </button>
        </div>
      </div>

      {/* Gantt grid */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          minHeight: 0,
        }}
      >
        {/* Coluna fixa de nomes das tasks */}
        <div
          style={{
            width: 240,
            flexShrink: 0,
            borderRight: "1px solid #26262d",
            background: "var(--background)",
            position: "sticky",
            left: 0,
            zIndex: 2,
          }}
        >
          {/* Header de alinhamento com o cabeçalho de datas */}
          <div
            style={{
              height: 60,
              borderBottom: "1px solid #26262d",
              padding: "0 14px",
              display: "flex",
              alignItems: "center",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--muted-foreground)",
              textTransform: "uppercase",
              letterSpacing: ".5px",
              background: "var(--background)",
            }}
          >
            Tarefa
          </div>

          {ganttTasks.map((task) => {
            const color = STATUS_COLOR[task.status as V3Intention] ?? "#6b7280";
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => onOpenTask(task)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  height: 40,
                  padding: "0 14px",
                  border: "none",
                  borderBottom: "1px solid #1f1f25",
                  background: "transparent",
                  color: "var(--foreground)",
                  fontSize: 13,
                  cursor: "pointer",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
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
                  {task.nome}
                </span>
              </button>
            );
          })}
        </div>

        {/* Área scrollável com timeline + barras */}
        <div
          style={{
            position: "relative",
            minWidth: totalWidth,
          }}
        >
          {/* Cabeçalho de datas */}
          <div
            style={{
              height: 60,
              borderBottom: "1px solid #26262d",
              position: "sticky",
              top: 0,
              background: "var(--background)",
              zIndex: 1,
              display: "flex",
            }}
          >
            {dateColumns.map((d) => {
              const isFirstOfMonth = d.getDate() === 1;
              const today = isToday(d);
              const weekend = isWeekend(d);
              return (
                <div
                  key={d.toISOString()}
                  style={{
                    width: cellWidth,
                    flexShrink: 0,
                    borderRight: "1px solid #1f1f25",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: today
                      ? "rgba(124,92,255,0.08)"
                      : weekend
                        ? "rgba(255,255,255,0.015)"
                        : "transparent",
                  }}
                >
                  {isFirstOfMonth || zoom === "week" ? (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: "var(--muted-foreground)",
                        textTransform: "uppercase",
                        letterSpacing: ".3px",
                      }}
                    >
                      {format(d, "MMM", { locale: ptBR })}
                    </span>
                  ) : null}
                  <span
                    style={{
                      fontSize: zoom === "day" ? 12 : 9,
                      fontWeight: today ? 700 : 500,
                      color: today
                        ? "#7c5cff"
                        : weekend
                          ? "var(--muted-foreground)"
                          : "var(--foreground)",
                    }}
                  >
                    {format(d, "d")}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Body — linhas de tasks com fundo de grid */}
          <div style={{ position: "relative" }}>
            {/* Linha vertical "hoje" */}
            {todayLeft !== null && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: todayLeft,
                  width: 1,
                  background: "#7c5cff",
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              />
            )}

            {ganttTasks.map((task) => {
              const geom = barGeometry(task);
              const color =
                STATUS_COLOR[task.status as V3Intention] ?? "#6b7280";
              const label =
                STATUS_LABEL[task.status as V3Intention] ?? task.status;
              const isLate =
                task.dueDate &&
                new Date(task.dueDate + "T12:00:00") < new Date() &&
                !["DONE", "VALIDATED", "CANCELLED"].includes(task.status);
              const isDone = ["DONE", "VALIDATED"].includes(task.status);

              return (
                <div
                  key={task.id}
                  style={{
                    height: 40,
                    borderBottom: "1px solid #1f1f25",
                    position: "relative",
                    display: "flex",
                  }}
                >
                  {/* Grid background */}
                  {dateColumns.map((d, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: cellWidth,
                        flexShrink: 0,
                        borderRight: "1px solid #1a1a20",
                        background: isWeekend(d)
                          ? "rgba(255,255,255,0.015)"
                          : "transparent",
                      }}
                    />
                  ))}

                  {/* Barra da task */}
                  {geom.visible && (
                    <button
                      type="button"
                      onClick={() => onOpenTask(task)}
                      title={`${task.nome} · ${label}`}
                      style={{
                        position: "absolute",
                        top: 8,
                        left: geom.left + 2,
                        width: geom.width - 4,
                        height: 24,
                        borderRadius: 5,
                        background: isLate
                          ? "linear-gradient(90deg, #ef4444, #f87171)"
                          : isDone
                            ? "linear-gradient(90deg, #22c55e, #4ade80)"
                            : `linear-gradient(90deg, ${color}, ${color}dd)`,
                        border: "none",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        padding: "0 8px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                        transition: "transform .1s, box-shadow .1s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 12px rgba(0,0,0,0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow =
                          "0 2px 6px rgba(0,0,0,0.3)";
                      }}
                    >
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {task.nome}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}

            {ganttTasks.length === 0 && (
              <div
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  color: "var(--muted-foreground)",
                  fontSize: 13,
                }}
              >
                Nenhuma tarefa com prazo definido para mostrar no Gantt.
                <br />
                {undated.length > 0 && (
                  <span style={{ fontSize: 12, opacity: 0.7 }}>
                    ({undated.length} tarefa{undated.length !== 1 ? "s" : ""}{" "}
                    sem prazo definido)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Faixa "sem prazo" */}
      {undated.length > 0 && ganttTasks.length > 0 && (
        <div
          style={{
            padding: "10px 28px",
            borderTop: "1px solid #26262d",
            background: "var(--card)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--muted-foreground)",
              textTransform: "uppercase",
              letterSpacing: ".5px",
            }}
          >
            {undated.length} sem prazo:
          </span>
          {undated.slice(0, 8).map((t) => {
            const color = STATUS_COLOR[t.status as V3Intention] ?? "#6b7280";
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onOpenTask(t)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 8px",
                  borderRadius: 4,
                  background: color + "18",
                  border: `1px solid ${color}30`,
                  color: "var(--foreground)",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: color,
                  }}
                />
                {t.nome}
              </button>
            );
          })}
          {undated.length > 8 && (
            <span
              style={{ fontSize: 11, color: "var(--muted-foreground)" }}
            >
              +{undated.length - 8} mais
            </span>
          )}
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
