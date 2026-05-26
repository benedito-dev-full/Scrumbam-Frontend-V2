"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import type { PlannerEvent } from "@/lib/types/planner-event";

import { getMonthGrid, isSameMonth, isToday } from "../_lib/date";
import { EVENT_PILL_CLASSES, getEventsForDay } from "../_lib/events";
import { CreateEventModal } from "./create-event-modal";

const WEEK_DAY_LABEL = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

interface MonthViewProps {
  cursorDate: Date;
  events: PlannerEvent[];
}

const MAX_PILLS = 3;

/**
 * Vista mensal — grid 7xN com numero do dia + ate 3 eventos por celula.
 *
 * Dias fora do mes corrente sao atenuados; "hoje" recebe destaque
 * vermelho identico ao das outras views. Celula com mais de 3 eventos
 * mostra "+N mais" (sem popover por enquanto — apenas indicador visual).
 */
export function MonthView({ cursorDate, events }: MonthViewProps) {
  const [modal, setModal] = useState<{ date: Date } | null>(null);
  const weeks = getMonthGrid(cursorDate);

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      {/* Cabecalho dos dias da semana */}
      <div className="grid flex-shrink-0 grid-cols-7 border-b border-border">
        {WEEK_DAY_LABEL.map((label, i) => (
          <div
            key={label}
            className={cn(
              "py-2 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground",
              i < 6 && "border-r border-border",
            )}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Grid de semanas */}
      <div className="flex flex-1 flex-col">
        {weeks.map((week, wi) => (
          <div
            key={wi}
            className={cn(
              "grid flex-1 grid-cols-7",
              wi < weeks.length - 1 && "border-b border-border",
            )}
          >
            {week.map((date, di) => {
              const today = isToday(date);
              const inMonth = isSameMonth(date, cursorDate);
              const dayEvents = getEventsForDay(events, date);
              const visible = dayEvents.slice(0, MAX_PILLS);
              const overflow = dayEvents.length - visible.length;

              return (
                <div
                  key={di}
                  className={cn(
                    "group relative flex min-h-[88px] flex-col gap-1 p-1.5",
                    di < 6 && "border-r border-border",
                    !inMonth && "bg-muted/20",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setModal({ date })}
                    className="absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground opacity-0 shadow transition-opacity group-hover:opacity-100"
                    aria-label="Criar evento"
                  >
                    +
                  </button>
                  <div className="flex items-center justify-end">
                    <span
                      className={cn(
                        "inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-[12px]",
                        today && "bg-red-500 font-bold text-white",
                        !today && inMonth && "text-foreground",
                        !today && !inMonth && "text-muted-foreground",
                      )}
                    >
                      {date.getDate()}
                    </span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    {visible.map((ev) => (
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
                    {overflow > 0 && (
                      <div className="px-1.5 text-[10px] text-muted-foreground">
                        +{overflow} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {modal && (
        <CreateEventModal
          date={modal.date}
          hour={null}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
