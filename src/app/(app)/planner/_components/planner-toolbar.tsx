"use client";

import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { PlannerView } from "@/lib/types/planner-event";

import { formatPeriodLabel, stepDate } from "../_lib/date";

const VIEW_LABEL: Record<PlannerView, string> = {
  day: "Dia",
  week: "Semana",
  month: "Mes",
  year: "Ano",
};

interface PlannerToolbarProps {
  view: PlannerView;
  cursorDate: Date;
  isRefreshing?: boolean;
  onViewChange: (view: PlannerView) => void;
  onCursorChange: (date: Date) => void;
  onRefresh?: () => void;
}

/**
 * Toolbar superior do Planner.
 *
 * Concentra navegacao (prev/next/Hoje), label do periodo e o switcher de
 * view (Dia/Semana/Mes). A direita: atalho "Anotacoes com IA", mini
 * calendario e refresh do periodo (anima enquanto recarrega).
 */
export function PlannerToolbar({
  view,
  cursorDate,
  isRefreshing = false,
  onViewChange,
  onCursorChange,
  onRefresh,
}: PlannerToolbarProps) {
  const goPrev = () => onCursorChange(stepDate(view, cursorDate, -1));
  const goNext = () => onCursorChange(stepDate(view, cursorDate, 1));
  const goToday = () => onCursorChange(new Date());

  return (
    <div
      className="flex h-11 flex-shrink-0 items-center justify-between border-b border-border px-4"
      style={{ background: "var(--background)" }}
    >
      <div className="flex items-center gap-2">
        <button type="button" onClick={goPrev} className={navBtnClass} aria-label="Periodo anterior">
          <ChevronLeft size={15} strokeWidth={2} />
        </button>
        <button type="button" onClick={goNext} className={navBtnClass} aria-label="Proximo periodo">
          <ChevronRight size={15} strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={goToday}
          className="ml-1 rounded-md border border-border bg-transparent px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          Hoje
        </button>
        <span
          className="ml-2 text-[15px] font-semibold capitalize"
          style={{ color: "var(--foreground)" }}
        >
          {formatPeriodLabel(view, cursorDate)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md border border-border bg-transparent px-2.5 py-1 text-xs text-muted-foreground"
        >
          <Sparkles size={13} strokeWidth={1.7} style={{ color: "#a78bfa" }} />
          Anotacoes com IA
        </button>
        <ToolbarIconBtn aria-label="Mini calendario">
          <CalendarDays size={14} strokeWidth={1.7} />
        </ToolbarIconBtn>
        <ToolbarIconBtn
          aria-label="Recarregar"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            size={14}
            strokeWidth={1.7}
            className={isRefreshing ? "animate-spin" : undefined}
          />
        </ToolbarIconBtn>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex items-center gap-1 rounded-md border border-border bg-transparent px-2.5 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Trocar visualizacao"
              >
                {VIEW_LABEL[view]}
                <ChevronDown size={12} strokeWidth={2} />
              </button>
            }
          />
          <DropdownMenuContent align="end" sideOffset={6} className="w-32">
            <DropdownMenuGroup>
              {(Object.keys(VIEW_LABEL) as PlannerView[]).map((v) => (
                <DropdownMenuItem
                  key={v}
                  className={cn("text-[13px]", v === view && "font-semibold")}
                  onClick={() => onViewChange(v)}
                >
                  {VIEW_LABEL[v]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

const navBtnClass =
  "flex h-7 w-7 items-center justify-center rounded-md border border-border bg-transparent text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground";

function ToolbarIconBtn({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className="flex h-7 w-7 items-center justify-center rounded-md border-0 bg-transparent text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
    >
      {children}
    </button>
  );
}
