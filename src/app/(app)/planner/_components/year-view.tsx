"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { cn } from "@/lib/utils";
import type { PlannerEvent } from "@/lib/types/planner-event";

import { getMonthGrid, isSameMonth, isToday } from "../_lib/date";
import { getEventsForMonth } from "../_lib/events";

const MONTHS = Array.from({ length: 12 }, (_, i) => i);
const WEEK_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

interface YearViewProps {
  cursorDate: Date;
  events: PlannerEvent[];
}

/**
 * Vista anual — grid de 12 mini-calendarios mensais.
 *
 * Cada celula mostra os 7 dias da semana em formato compacto.
 * Dias com eventos recebem um ponto indicador. "Hoje" e destacado
 * em vermelho, igual as outras views.
 */
export function YearView({ cursorDate, events }: YearViewProps) {
  const year = cursorDate.getFullYear();

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="grid flex-1 grid-cols-4 gap-px bg-border p-0">
        {MONTHS.map((monthIndex) => {
          const monthDate = new Date(year, monthIndex, 1);
          const weeks = getMonthGrid(monthDate);
          const monthEvents = getEventsForMonth(events, monthDate);
          const isCurrentMonth = isSameMonth(monthDate, new Date());

          return (
            <div
              key={monthIndex}
              className="flex flex-col p-4"
              style={{ background: "var(--background)" }}
            >
              {/* Nome do mes */}
              <div className="mb-3 flex items-center justify-between">
                <span
                  className={cn(
                    "text-[13px] font-semibold capitalize",
                    isCurrentMonth ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {format(monthDate, "MMMM", { locale: ptBR })}
                </span>
                {monthEvents.length > 0 && (
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    {monthEvents.length}
                  </span>
                )}
              </div>

              {/* Header dias da semana */}
              <div className="mb-1 grid grid-cols-7">
                {WEEK_LABELS.map((label, i) => (
                  <div
                    key={i}
                    className="text-center text-[9px] font-medium uppercase text-muted-foreground/60"
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Semanas */}
              <div className="flex flex-1 flex-col gap-0.5">
                {weeks.map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7">
                    {week.map((date, di) => {
                      const today = isToday(date);
                      const inMonth = isSameMonth(date, monthDate);
                      const hasEvents = events.some(
                        (e) => {
                          const d = new Date(e.start);
                          return d.getDate() === date.getDate() &&
                            d.getMonth() === date.getMonth() &&
                            d.getFullYear() === date.getFullYear();
                        }
                      );

                      return (
                        <div
                          key={di}
                          className="flex flex-col items-center justify-center py-0.5"
                        >
                          <span
                            className={cn(
                              "flex h-[18px] w-[18px] items-center justify-center rounded-full text-[10px]",
                              today && "bg-red-500 font-bold text-white",
                              !today && inMonth && "text-foreground",
                              !today && !inMonth && "text-muted-foreground/30",
                            )}
                          >
                            {date.getDate()}
                          </span>
                          {/* Ponto indicador de eventos */}
                          {hasEvents && inMonth && !today && (
                            <div className="mt-0.5 h-1 w-1 rounded-full bg-primary/60" />
                          )}
                          {!hasEvents && <div className="mt-0.5 h-1 w-1" />}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
