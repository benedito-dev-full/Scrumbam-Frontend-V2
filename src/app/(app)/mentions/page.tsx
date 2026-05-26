"use client";

import { useState } from "react";
import {
  AtSign,
  Filter as FilterIcon,
  CheckCircle2,
  Calendar,
  Search,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TabId = "atribuidas" | "delegados";

const TABS: { id: TabId; label: string }[] = [
  { id: "atribuidas", label: "Atribuídas a mim" },
  { id: "delegados", label: "Delegados por mim" },
];

const DEFAULT_FILTERS = {
  resolvido: false,
  periodo: "90d" as "30d" | "90d" | "365d" | "all",
};

const PERIODOS: Record<typeof DEFAULT_FILTERS.periodo, string> = {
  "30d": "Últimos 30 dias",
  "90d": "Últimos 90 dias",
  "365d": "Últimos 365 dias",
  all: "Todo o período",
};

export default function MentionsPage() {
  const [tab, setTab] = useState<TabId>("atribuidas");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const filtersActive =
    filters.resolvido !== DEFAULT_FILTERS.resolvido ||
    filters.periodo !== DEFAULT_FILTERS.periodo;

  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
        <AtSign className="size-4 text-muted-foreground" />
        <h1 className="text-sm font-semibold text-foreground">Comentários atribuídos</h1>
      </header>

      <div className="flex h-10 shrink-0 items-center gap-px border-b border-border bg-background px-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "relative flex h-10 items-center gap-1.5 px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground",
              tab === t.id &&
                "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-t-sm after:bg-primary",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-4">
        <div className="flex items-center gap-2">
          <FilterChip icon={<FilterIcon className="size-3.5" />} label="Filtro" />

          <span className="h-4 w-px bg-border" />

          <FilterChip
            icon={
              <CheckCircle2
                className={cn(
                  "size-3.5",
                  filters.resolvido ? "text-emerald-400" : "text-muted-foreground",
                )}
              />
            }
            label="Resolvido"
            active={filters.resolvido}
            onClick={() => setFilters((f) => ({ ...f, resolvido: !f.resolvido }))}
          />

          <FilterChip
            icon={<Calendar className="size-3.5" />}
            label={PERIODOS[filters.periodo]}
            active
            withCaret
          />
        </div>

        <button
          type="button"
          className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
        >
          <Search className="size-3.5" />
          Pesquisar
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-10">
        <EmptyState
          title="Você já se atualizou"
          showClear={filtersActive}
          onClear={clearFilters}
        />
      </div>
    </div>
  );
}

interface FilterChipProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  withCaret?: boolean;
  onClick?: () => void;
}

function FilterChip({ icon, label, active, withCaret, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-[12px] text-foreground transition-colors hover:bg-muted/60",
        active && "border-primary/40 bg-primary/15 text-primary-foreground",
      )}
    >
      {icon}
      <span className={cn(active && "text-foreground")}>{label}</span>
      {withCaret && <ChevronDown className="size-3 opacity-70" />}
    </button>
  );
}

interface EmptyStateProps {
  title: string;
  showClear: boolean;
  onClear: () => void;
}

function EmptyState({ title, showClear, onClear }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <CommentIllustration />
      <h2 className="text-[15px] font-medium text-foreground">{title}</h2>
      {showClear && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          className="rounded-md border-border bg-card text-[13px] font-normal text-foreground hover:bg-muted/60"
        >
          Limpar filtros
        </Button>
      )}
    </div>
  );
}

/**
 * Ilustração do empty state — pequeno balão de comentário com um ponto
 * de chat aninhado, espelhando o ícone usado pelo ClickUp na tela de
 * Comentários atribuídos.
 */
function CommentIllustration() {
  return (
    <div className="grid size-14 place-items-center rounded-xl border border-border bg-card text-muted-foreground">
      <svg
        width={28}
        height={28}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      </svg>
    </div>
  );
}
