"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  List,
  Columns3,
  Calendar,
  BarChart2,
  Table,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type View = {
  id: string;
  label: string;
  icon: LucideIcon;
};

const defaultViews: View[] = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard },
  { id: "list", label: "Lista", icon: List },
  { id: "board", label: "Quadro", icon: Columns3 },
  { id: "calendar", label: "Calendário", icon: Calendar },
  { id: "timeline", label: "Linha do tempo", icon: BarChart2 },
  { id: "table", label: "Tabela", icon: Table },
];

/**
 * Switcher de visualizações (Lista, Quadro, Calendário, etc.).
 *
 * Suporta modo controlado externamente via `value`/`onChange` e modo
 * autônomo via `defaultValue`. Se `value` e `onChange` não forem passados,
 * mantém estado interno — retrocompatível com usos anteriores.
 *
 * @example
 * // Modo controlado (página controla a view ativa):
 * <ViewSwitcher value={view} onChange={(v) => setView(v)} />
 *
 * // Modo autônomo (estado interno):
 * <ViewSwitcher defaultValue="list" />
 */
type ViewSwitcherProps = {
  views?: View[];
  defaultValue?: string;
  /** View ativa — quando passado, ativa modo controlado */
  value?: string;
  /** Callback chamado ao trocar de view — obrigatório no modo controlado */
  onChange?: (id: string) => void;
};

export function ViewSwitcher({
  views = defaultViews,
  defaultValue,
  value,
  onChange,
}: ViewSwitcherProps) {
  /* Modo autônomo: estado interno usado só quando `value` não é fornecido */
  const [internal, setInternal] = useState(defaultValue ?? views[0]?.id);

  const current = value ?? internal;

  function handleSelect(id: string) {
    if (onChange) {
      onChange(id);
    } else {
      setInternal(id);
    }
  }

  return (
    <div className="flex h-10 items-center gap-0 border-b border-border bg-background px-3">
      <div role="tablist" className="flex items-center">
        {views.map((view) => {
          const Icon = view.icon;
          const active = current === view.id;
          return (
            <button
              key={view.id}
              role="tab"
              aria-selected={active}
              data-active={active ? "" : undefined}
              onClick={() => handleSelect(view.id)}
              className={cn(
                "group -mb-px inline-flex h-10 items-center gap-1.5 border-b-2 border-transparent px-2.5 text-sm text-muted-foreground transition-colors outline-none",
                "hover:text-foreground",
                "focus-visible:text-foreground focus-visible:bg-muted/40",
                "data-active:border-primary data-active:text-foreground data-active:font-medium",
              )}
            >
              <Icon className="size-[15px] opacity-80 group-data-active:opacity-100" />
              {view.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="ml-2 inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Plus className="size-3.5" />
        Visualização
      </button>
    </div>
  );
}
