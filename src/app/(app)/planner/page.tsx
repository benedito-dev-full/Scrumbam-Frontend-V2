"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Search, X } from "lucide-react";

import { mockPlannerEvents } from "@/lib/mocks/planner-events";
import type { PlannerView } from "@/lib/types/planner-event";
import { usePlannerUIStore } from "@/lib/stores/planner-ui";

import { CreateEventModal } from "./_components/create-event-modal";
import { DayView } from "./_components/day-view";
import { MonthView } from "./_components/month-view";
import { PlannerToolbar } from "./_components/planner-toolbar";
import { WeekView } from "./_components/week-view";
import { YearView } from "./_components/year-view";
import { useDragNavigation } from "./_hooks/use-drag-navigation";
import { useKeyboardNavigation } from "./_hooks/use-keyboard-navigation";

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchOpen = usePlannerUIStore((s) => s.searchOpen);
  const setSearchOpen = usePlannerUIStore((s) => s.setSearchOpen);
  const createEventOpen = usePlannerUIStore((s) => s.createEventOpen);
  const setCreateEventOpen = usePlannerUIStore((s) => s.setCreateEventOpen);

  /**
   * Refresh dos eventos do calendario.
   *
   * Hoje usa um delay simulado de 1s porque os eventos vem de mock. Quando
   * o endpoint do Planner existir no backend V2, substituir o setTimeout
   * por `queryClient.refetchQueries({ queryKey: qk.plannerEvents... })`.
   */
  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    refreshTimeoutRef.current = setTimeout(() => setIsRefreshing(false), 1000);
  };

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    };
  }, []);

  const {
    slideDates,
    railOffset,
    isSnapping,
    snapEasing,
    snapDuration,
    isDragging,
    containerWidth,
    containerRef,
    navigateTo,
    pointerHandlers,
  } = useDragNavigation(view, cursorDate, setCursorDate);

  useKeyboardNavigation(view, cursorDate, navigateTo);

  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      style={{ background: "var(--background)" }}
    >
      <PlannerToolbar
        view={view}
        cursorDate={cursorDate}
        isRefreshing={isRefreshing}
        onViewChange={setView}
        onCursorChange={setCursorDate}
        onRefresh={handleRefresh}
      />

      {/* Container do carrossel: overflow hidden, captura pointer events */}
      <div
        ref={containerRef}
        className="relative flex-1 select-none overflow-hidden"
        {...pointerHandlers}
        style={{ touchAction: "pan-y", cursor: isDragging ? "grabbing" : "default" }}
      >
        {/* Painel de busca de eventos — flutua sobre o calendario */}
        {searchOpen && (
          <PlannerSearchPanel
            events={mockPlannerEvents}
            onClose={() => setSearchOpen(false)}
            onSelectEvent={(event) => {
              setCursorDate(new Date(event.start));
              setSearchOpen(false);
            }}
          />
        )}

        {/* Overlay de refresh — bloqueia interacao e mostra spinner enquanto recarrega */}
        {isRefreshing && (
          <div
            aria-busy="true"
            aria-live="polite"
            className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[1px]"
            style={{ background: "rgba(0,0,0,0.25)" }}
          >
            <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-[12px] text-muted-foreground shadow-sm">
              <Loader2 size={13} className="animate-spin" />
              Atualizando…
            </div>
          </div>
        )}
        {/* Trilho: 3 slides lado a lado, se move como um bloco */}
        <div
          className="flex h-full"
          style={{
            width: containerWidth ? `${containerWidth * 3}px` : "300%",
            transform: `translateX(${-containerWidth + railOffset}px)`,
            transition: isSnapping ? `transform ${snapDuration}ms ${snapEasing}` : "none",
            userSelect: isDragging ? "none" : undefined,
            willChange: "transform",
          }}
        >
          {/* Slide anterior */}
          <div className="h-full flex-shrink-0" style={{ width: containerWidth || "33.333%" }}>
            <SlideContent view={view} date={slideDates[-1]} />
          </div>
          {/* Slide atual */}
          <div className="h-full flex-shrink-0" style={{ width: containerWidth || "33.333%" }}>
            <SlideContent view={view} date={slideDates[0]} />
          </div>
          {/* Slide proximo */}
          <div className="h-full flex-shrink-0" style={{ width: containerWidth || "33.333%" }}>
            <SlideContent view={view} date={slideDates[1]} />
          </div>
        </div>
      </div>

      <PlannerSearchBar />

      {/* Modal de novo evento (acionado pelo "+" do painel do Planner) */}
      {createEventOpen && (
        <CreateEventModal
          date={cursorDate}
          hour={null}
          onClose={() => setCreateEventOpen(false)}
        />
      )}
    </div>
  );
}

/**
 * Painel flutuante de busca de eventos.
 *
 * Renderizado dentro do container do carrossel (relative parent), aparece
 * no topo do calendario cobrindo quase toda a largura mas com altura
 * pequena. Filtra os eventos por titulo em tempo real.
 */
function PlannerSearchPanel({
  events,
  onClose,
  onSelectEvent,
}: {
  events: typeof mockPlannerEvents;
  onClose: () => void;
  onSelectEvent: (event: (typeof mockPlannerEvents)[number]) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    /**
     * Fecha quando o clique cai fora do painel — exceto se for no botao
     * de lupa do PlannerPanel, que ja toggla por conta propria (clicar
     * de novo na lupa fecha o painel).
     */
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      if (target.closest('[data-planner-search-trigger]')) return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events.slice(0, 8);
    return events.filter((e) => e.title.toLowerCase().includes(q)).slice(0, 20);
  }, [query, events]);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Buscar eventos no Planner"
      className="absolute left-1/2 top-3 z-30 w-[92%] max-w-3xl -translate-x-1/2 rounded-lg border border-border bg-popover shadow-xl"
    >
      <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <Search size={14} className="text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar eventos por titulo…"
          className="flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar busca"
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X size={13} />
        </button>
      </header>
      <ul className="max-h-[240px] divide-y divide-border overflow-y-auto py-1">
        {results.length === 0 ? (
          <li className="px-3 py-4 text-center text-[12px] text-muted-foreground">
            Nenhum evento encontrado.
          </li>
        ) : (
          results.map((event) => {
            const start = new Date(event.start);
            const label = event.allDay
              ? format(start, "EEE, dd MMM", { locale: ptBR })
              : format(start, "EEE, dd MMM 'as' HH:mm", { locale: ptBR });
            return (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => onSelectEvent(event)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-foreground hover:bg-accent"
                >
                  <span
                    aria-hidden
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ background: EVENT_COLOR_DOT[event.color] }}
                  />
                  <span className="flex-1 truncate">{event.title}</span>
                  <span className="text-[11px] text-muted-foreground">{label}</span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

const EVENT_COLOR_DOT: Record<string, string> = {
  blue: "#3b82f6",
  violet: "#8b5cf6",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  slate: "#64748b",
};

/** Renderiza a view correta para um slide do carrossel. */
function SlideContent({ view, date }: { view: PlannerView; date: Date }) {
  if (view === "day") return <DayView cursorDate={date} events={mockPlannerEvents} />;
  if (view === "week") return <WeekView cursorDate={date} events={mockPlannerEvents} />;
  if (view === "year") return <YearView cursorDate={date} events={mockPlannerEvents} />;
  return <MonthView cursorDate={date} events={mockPlannerEvents} />;
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
