"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import type { PlannerEvent } from "@/lib/types/planner-event";

import { getWeekDates, HOUR_RANGE, isToday } from "../_lib/date";
import {
  EVENT_PILL_CLASSES,
  getAllDayEventsForDay,
  getTimedEventsForDay,
} from "../_lib/events";
import { CreateEventModal } from "./create-event-modal";
import { EventBlock } from "./event-block";

const WEEK_DAY_LABEL = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

interface WeekViewProps {
  cursorDate: Date;
  events: PlannerEvent[];
}

/**
 * Grade semanal (7 colunas x faixa de horas).
 *
 * Mantem layout da pagina original mas: usa tokens do tema no lugar de
 * cores hex, posiciona eventos absolutamente nas colunas, e adiciona
 * faixa "O dia todo" no topo para eventos `allDay`.
 */
export function WeekView({ cursorDate, events }: WeekViewProps) {
  const [modal, setModal] = useState<{ date: Date; hour: number } | null>(null);
  const weekDates = getWeekDates(cursorDate);
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const rangeStart = HOUR_RANGE.start * 60;
  const rangeEnd = HOUR_RANGE.end * 60;
  const timelineTop =
    currentMin >= rangeStart && currentMin <= rangeEnd
      ? ((currentMin - rangeStart) / (rangeEnd - rangeStart)) * 100
      : null;

  const hours = Array.from(
    { length: HOUR_RANGE.end - HOUR_RANGE.start + 1 },
    (_, i) => HOUR_RANGE.start + i,
  );

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      {/* Cabecalho dos dias */}
      <div
        className="sticky top-0 z-10 grid flex-shrink-0 border-b border-border"
        style={{
          gridTemplateColumns: "60px repeat(7, 1fr)",
          background: "var(--background)",
        }}
      >
        <div className="border-r border-border py-2 text-center text-[10px] text-muted-foreground">
          GMT-3
        </div>
        {weekDates.map((date, i) => {
          const today = isToday(date);
          return (
            <div
              key={i}
              className={cn(
                "py-1.5 text-center",
                i < 6 && "border-r border-border",
                today && "bg-card",
              )}
            >
              <div className="mb-0.5 text-[11px] text-muted-foreground">
                {WEEK_DAY_LABEL[date.getDay()]}
              </div>
              <div
                className={cn(
                  "inline-flex h-[26px] w-[26px] items-center justify-center rounded-full text-[13px]",
                  today ? "bg-red-500 font-bold text-white" : "text-foreground",
                )}
              >
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Faixa "O dia todo" */}
      <div
        className="grid flex-shrink-0 border-b border-border"
        style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}
      >
        <div className="flex items-center justify-end border-r border-border pr-2 text-[10px] text-muted-foreground">
          O dia todo
        </div>
        {weekDates.map((date, i) => {
          const allDay = getAllDayEventsForDay(events, date);
          return (
            <div
              key={i}
              className={cn(
                "flex min-h-[28px] flex-col gap-0.5 px-1 py-1",
                i < 6 && "border-r border-border",
              )}
            >
              {allDay.map((ev) => (
                <div
                  key={ev.id}
                  className={cn(
                    "truncate rounded px-1.5 py-0.5 text-[11px] font-medium",
                    EVENT_PILL_CLASSES[ev.color],
                  )}
                  title={ev.title}
                >
                  {ev.title}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Corpo: horas + colunas */}
      <div
        className="relative grid flex-1"
        style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}
      >
        {/* Coluna de horas (rotulos) */}
        <div className="flex flex-col border-r border-border">
          {hours.map((h) => (
            <div
              key={h}
              className="flex h-[60px] items-start justify-end pr-2 pt-1 text-[10px] text-muted-foreground"
            >
              {h % 12 === 0 ? 12 : h % 12} {h < 12 ? "am" : "pm"}
            </div>
          ))}
        </div>

        {/* 7 colunas dos dias */}
        {weekDates.map((date, di) => {
          const dayEvents = getTimedEventsForDay(events, date);
          const today = isToday(date);
          return (
            <div
              key={di}
              className={cn(
                "relative",
                di < 6 && "border-r border-border",
                today && "bg-accent/30",
              )}
            >
              {hours.map((h) => (
                <div
                  key={h}
                  className="group relative h-[60px] border-b border-border/50"
                >
                  <button
                    type="button"
                    onClick={() => setModal({ date, hour: h })}
                    className="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground opacity-0 shadow transition-opacity group-hover:opacity-100"
                    aria-label={`Criar evento`}
                  >
                    +
                  </button>
                </div>
              ))}
              {dayEvents.map((ev) => (
                <EventBlock key={ev.id} event={ev} />
              ))}
              {today && timelineTop != null && (
                <div
                  className="pointer-events-none absolute left-0 right-0 z-10 flex items-center"
                  style={{ top: `${timelineTop}%` }}
                >
                  <div className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
                  <div className="h-px flex-1 bg-red-500" />
                </div>
              )}
            </div>
          );
        })}

      {modal && (
        <CreateEventModal
          date={modal.date}
          hour={modal.hour}
          onClose={() => setModal(null)}
        />
      )}
      </div>
    </div>
  );
}
