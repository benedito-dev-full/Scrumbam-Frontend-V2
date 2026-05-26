"use client";

import { useState } from "react";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { cn } from "@/lib/utils";
import type { PlannerEvent } from "@/lib/types/planner-event";

import { HOUR_RANGE, isToday } from "../_lib/date";
import {
  EVENT_PILL_CLASSES,
  getAllDayEventsForDay,
  getTimedEventsForDay,
} from "../_lib/events";
import { CreateEventModal } from "./create-event-modal";
import { EventBlock } from "./event-block";

interface DayViewProps {
  cursorDate: Date;
  events: PlannerEvent[];
}

/**
 * Vista de 1 dia — mesma faixa horaria da WeekView, em coluna unica.
 *
 * Util para foco no dia corrente; usa os mesmos helpers de posicionamento
 * para que blocos fiquem visualmente consistentes entre Dia e Semana.
 */
export function DayView({ cursorDate, events }: DayViewProps) {
  const [modal, setModal] = useState<{ hour: number } | null>(null);
  const today = isToday(cursorDate);
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const rangeStart = HOUR_RANGE.start * 60;
  const rangeEnd = HOUR_RANGE.end * 60;
  const timelineTop =
    today && currentMin >= rangeStart && currentMin <= rangeEnd
      ? ((currentMin - rangeStart) / (rangeEnd - rangeStart)) * 100
      : null;

  const hours = Array.from(
    { length: HOUR_RANGE.end - HOUR_RANGE.start + 1 },
    (_, i) => HOUR_RANGE.start + i,
  );

  const allDay = getAllDayEventsForDay(events, cursorDate);
  const timed = getTimedEventsForDay(events, cursorDate);

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      {/* Cabecalho do dia */}
      <div
        className="sticky top-0 z-10 grid flex-shrink-0 border-b border-border"
        style={{ gridTemplateColumns: "60px 1fr", background: "var(--background)" }}
      >
        <div className="border-r border-border py-2 text-center text-[10px] text-muted-foreground">
          GMT-3
        </div>
        <div className={cn("py-2 text-center", today && "bg-card")}>
          <div className="text-[11px] uppercase text-muted-foreground">
            {format(cursorDate, "EEEE", { locale: ptBR })}
          </div>
          <div
            className={cn(
              "mx-auto mt-0.5 inline-flex h-[26px] w-[26px] items-center justify-center rounded-full text-[13px]",
              today ? "bg-red-500 font-bold text-white" : "text-foreground",
            )}
          >
            {cursorDate.getDate()}
          </div>
        </div>
      </div>

      {/* Faixa "O dia todo" */}
      <div
        className="grid flex-shrink-0 border-b border-border"
        style={{ gridTemplateColumns: "60px 1fr" }}
      >
        <div className="flex items-center justify-end border-r border-border pr-2 text-[10px] text-muted-foreground">
          O dia todo
        </div>
        <div className="flex min-h-[28px] flex-col gap-0.5 px-1 py-1">
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
      </div>

      {/* Corpo: horas + coluna do dia */}
      <div className="relative grid flex-1" style={{ gridTemplateColumns: "60px 1fr" }}>
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

        <div className={cn("relative", today && "bg-accent/30")}>
          {hours.map((h) => (
            <div key={h} className="group relative h-[60px] border-b border-border/50">
              <button
                type="button"
                onClick={() => setModal({ hour: h })}
                className="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground opacity-0 shadow transition-opacity group-hover:opacity-100"
                aria-label="Criar evento"
              >
                +
              </button>
            </div>
          ))}
          {timed.map((ev) => (
            <EventBlock key={ev.id} event={ev} />
          ))}
          {timelineTop != null && (
            <div
              className="pointer-events-none absolute left-0 right-0 z-10 flex items-center"
              style={{ top: `${timelineTop}%` }}
            >
              <div className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
              <div className="h-px flex-1 bg-red-500" />
            </div>
          )}
        </div>
      </div>

      {modal && (
        <CreateEventModal
          date={cursorDate}
          hour={modal.hour}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
