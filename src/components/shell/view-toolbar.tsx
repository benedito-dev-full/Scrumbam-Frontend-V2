"use client";

import { Filter, RefreshCw, Settings2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ViewToolbarProps = {
  autoRefresh?: boolean;
  filterCount?: number;
};

export function ViewToolbar({
  autoRefresh = true,
  filterCount,
}: ViewToolbarProps) {
  return (
    <div className="flex h-11 items-center justify-between gap-2 border-b border-border bg-background/60 px-4">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className={cn(
            "group inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground transition-colors",
            "hover:bg-muted",
          )}
        >
          <Filter className="size-3.5 text-muted-foreground group-hover:text-foreground" />
          Filtros
          {filterCount != null && filterCount > 0 && (
            <span className="rounded bg-primary/15 px-1 text-[10px] font-semibold text-primary">
              {filterCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        {autoRefresh && (
          <div className="inline-flex h-7 items-center gap-1.5 rounded-md bg-muted/50 px-2 text-[11px] text-muted-foreground">
            <span className="relative grid place-items-center">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span className="absolute inset-0 size-1.5 animate-ping rounded-full bg-emerald-500/60" />
            </span>
            Atualização automática
          </div>
        )}

        <button
          type="button"
          className="inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <RefreshCw className="size-3.5" />
          Atualizar
        </button>

        <button
          type="button"
          className="inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Settings2 className="size-3.5" />
          Personalizar
        </button>

        <Button size="xs" className="gap-1">
          <Plus className="size-3.5" />
          Adicionar
        </Button>
      </div>
    </div>
  );
}
