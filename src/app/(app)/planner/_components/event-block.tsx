import { format } from "date-fns";

import { cn } from "@/lib/utils";
import type { PlannerEvent } from "@/lib/types/planner-event";

import { EVENT_COLOR_CLASSES, getEventPosition } from "../_lib/events";

interface EventBlockProps {
  event: PlannerEvent;
}

/**
 * Bloco visual de um evento posicionado absolutamente na coluna do dia.
 *
 * Renderiza titulo + horario inicio-fim, posicionado verticalmente
 * conforme `getEventPosition`. Usado por DayView e WeekView; se o evento
 * estiver fora da faixa de horas (10am-11pm) o componente nao renderiza.
 */
export function EventBlock({ event }: EventBlockProps) {
  const pos = getEventPosition(event);
  if (!pos) return null;

  const start = new Date(event.start);
  const end = new Date(event.end);

  return (
    <div
      className={cn(
        "absolute left-1 right-1 overflow-hidden rounded-md border-l-2 px-1.5 py-0.5",
        "cursor-pointer text-[11px] leading-tight shadow-sm transition-opacity hover:opacity-90",
        EVENT_COLOR_CLASSES[event.color],
      )}
      style={{ top: `${pos.top}%`, height: `${pos.height}%` }}
      title={event.title}
    >
      <div className="truncate font-semibold">{event.title}</div>
      <div className="truncate opacity-80">
        {format(start, "HH:mm")} - {format(end, "HH:mm")}
      </div>
    </div>
  );
}
