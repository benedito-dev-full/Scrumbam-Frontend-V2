"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { mockPlannerEvents } from "@/lib/mocks/planner-events";
import type { PlannerView } from "@/lib/types/planner-event";

import { DayView } from "./_components/day-view";
import { MonthView } from "./_components/month-view";
import { PlannerToolbar } from "./_components/planner-toolbar";
import { WeekView } from "./_components/week-view";
import { useDragNavigation } from "./_hooks/use-drag-navigation";

/**
 * Pagina /planner — orquestra view ativa + data de referencia.
 *
 * Mantem state local de `{ view, cursorDate }` e delega o render para
 * Day/Week/MonthView. Eventos vem do mock por enquanto — substituir por
 * `useQuery` quando o endpoint do Planner existir no backend V2.
 */
export default function PlannerPage() {
  const [view, setView] = useState<PlannerView>("week");
  const [cursorDate, setCursorDate] = useState<Date>(new Date());

  const { dragOffset, isDragging, pointerHandlers } = useDragNavigation({
    view,
    cursorDate,
    onCursorChange: setCursorDate,
  });

  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      style={{ background: "var(--background)" }}
    >
      <PlannerToolbar
        view={view}
        cursorDate={cursorDate}
        onViewChange={setView}
        onCursorChange={setCursorDate}
      />

      {/* Wrapper de drag: captura pointer events e aplica translacao fluida */}
      <div
        className="relative flex-1 overflow-hidden"
        {...pointerHandlers}
        style={{ touchAction: "pan-y" }}
      >
        <div
          className="h-full"
          style={{
            transform: `translateX(${dragOffset}px)`,
            transition: isDragging ? "none" : "transform 0.2s ease-out",
            cursor: isDragging ? "grabbing" : "default",
            userSelect: isDragging ? "none" : undefined,
          }}
        >
          {view === "day" && <DayView cursorDate={cursorDate} events={mockPlannerEvents} />}
          {view === "week" && <WeekView cursorDate={cursorDate} events={mockPlannerEvents} />}
          {view === "month" && <MonthView cursorDate={cursorDate} events={mockPlannerEvents} />}
        </div>
      </div>

      <PlannerSearchBar />
    </div>
  );
}

/**
 * Barra de busca do rodape — mantida do layout original. Visual por
 * enquanto, sem comportamento (hook do command palette entra depois).
 */
function PlannerSearchBar() {
  return (
    <div
      className="flex flex-shrink-0 justify-center border-t border-border px-4 py-2.5"
      style={{ background: "var(--background)" }}
    >
      <div
        className="flex h-[34px] w-full max-w-[520px] items-center gap-2 rounded-lg border border-border px-3"
        style={{ background: "var(--background)" }}
      >
        <Search size={13} className="flex-shrink-0 text-muted-foreground" />
        <span className="text-[13px] text-muted-foreground">
          Pesquise eventos, colegas de equipe, comandos...
        </span>
        <SparklesGradient className="ml-auto flex-shrink-0" />
      </div>
    </div>
  );
}

function SparklesGradient({ className }: { className?: string }) {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" className={className}>
      <defs>
        <linearGradient id="pl-spark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c5cff" />
          <stop offset="100%" stopColor="#e040fb" />
        </linearGradient>
      </defs>
      <path
        d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
        stroke="url(#pl-spark)"
        strokeWidth={1.6}
        fill="none"
      />
    </svg>
  );
}
