"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  PanelLeftOpen,
  Plus,
  Settings2,
  Star,
} from "lucide-react";

import { PlannerPanel } from "./planner-panel";
import { AddFavoriteDropdown, FavoritesList } from "./workspace-panel-favorites";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { usePlannerUIStore } from "@/lib/stores/planner-ui";

function IcInbox() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-6l-2 3H10l-2-3H2" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

/* Respostas — seta de reply curvada */
function IcReply() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 17L4 12l5-5" />
      <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
  );
}

/* Comentários atribuídos — balão de chat com @ */
function IcMentions() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
    </svg>
  );
}

/* Minhas tarefas — pessoa com check mark */
function IcMyTasks() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M16 11l2 2 4-4" />
    </svg>
  );
}

/* Mais — três pontos */
function IcMore() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

/* Favoritos — estrela outline */
function IcStar() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

/* ─── Tipos ───────────────────────────────────────────────────────────────── */
type LeafItem = {
  href: string;
  label: string;
  suffix?: string;
  renderIcon: () => React.ReactNode;
  badge?: string;
};

type TreeItem = LeafItem & {
  children?: LeafItem[];
};

/* ─── Dados de navegação ─────────────────────────────────────────────────── */
export const homeItems: TreeItem[] = [
  { href: "/inbox", label: "Caixa de entrada", renderIcon: () => <IcInbox /> },
  { href: "/replies", label: "Respostas", renderIcon: () => <IcReply /> },
  {
    href: "/mentions",
    label: "Comentários atribuídos",
    renderIcon: () => <IcMentions />,
  },
  {
    href: "/assigned",
    label: "Minhas tarefas",
    renderIcon: () => <IcMyTasks />,
  },
];

type Section = {
  id: string;
  label: string;
  items: LeafItem[];
  showAddButton?: boolean;
};

export function buildSections(): Section[] {
  return [
    {
      id: "favoritos",
      label: "Favoritos",
      items: [
        {
          href: "/favorites",
          label: "Adicione à sua barra lateral",
          renderIcon: () => <IcStar />,
        },
      ],
    },
  ];
}

/* ─── Mais — dropdown ────────────────────────────────────────────────────── */

type MoreEntry = {
  id: string;
  label: string;
  renderIcon: () => React.ReactNode;
  href?: string;
};

const MORE_ENTRIES: MoreEntry[] = [
  {
    id: "chat-activity",
    label: "Atividade do chat",
    href: "/chat-activity",
    renderIcon: () => (
      <svg
        width={15}
        height={15}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "drafts",
    label: "Rascunhos e enviadas",
    href: "/drafts",
    renderIcon: () => (
      <svg
        width={15}
        height={15}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 2L11 13" />
        <path d="M22 2L15 22l-4-9-9-4 20-7z" />
      </svg>
    ),
  },
  {
    id: "posts",
    label: "Posts",
    href: "/posts",
    renderIcon: () => (
      <svg
        width={15}
        height={15}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    id: "all-spaces",
    label: "Todos os Espaços",
    href: "/spaces",
    renderIcon: () => (
      <svg
        width={15}
        height={15}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: "all-tasks",
    label: "Minhas tarefas",
    href: "/assigned",
    renderIcon: () => (
      <svg
        width={15}
        height={15}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function MoreItem() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "group flex h-[calc(var(--row-h)-6px)] w-full items-center gap-2 rounded-[5px] px-3 text-[13px] text-sidebar-foreground/80 transition-colors",
          "hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
          open && "bg-sidebar-accent text-sidebar-accent-foreground",
        )}
      >
        <span className="shrink-0 text-muted-foreground">
          <IcMore />
        </span>
        <span className="flex-1 text-left">Mais</span>
      </button>

      {open && (
        <div
          className="absolute z-50 overflow-hidden rounded-lg border border-border bg-popover shadow-xl"
          style={{ left: "100%", top: 0, marginLeft: 6, width: 240 }}
        >
          {/* itens principais */}
          <div className="py-1.5">
            {MORE_ENTRIES.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (entry.href) router.push(entry.href);
                }}
                className="group flex h-[calc(var(--row-h)-4px)] w-full items-center gap-3 px-3 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <span className="shrink-0">{entry.renderIcon()}</span>
                <span className="flex-1 text-left">{entry.label}</span>
                <Star className="size-3.5 shrink-0 opacity-0 group-hover:opacity-40 transition-opacity" />
              </button>
            ))}
          </div>

          {/* divisor + Personalizar */}
          <div className="border-t border-border py-1.5">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-[calc(var(--row-h)-4px)] w-full items-center gap-3 px-3 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Settings2 className="size-3.5 shrink-0" />
              <span>Personalizar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Item folha ──────────────────────────────────────────────────────────── */
function Leaf({
  item,
  depth = 0,
  active,
}: {
  item: LeafItem;
  depth?: number;
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      data-active={active ? "" : undefined}
      style={depth ? { paddingLeft: `${0.5 + depth * 1.125}rem` } : undefined}
      className={cn(
        "group flex h-[calc(var(--row-h)-6px)] items-center gap-2 rounded-[5px] px-3 text-[13px] text-sidebar-foreground/80 outline-none transition-colors",
        "hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        "focus-visible:bg-sidebar-accent focus-visible:text-sidebar-accent-foreground focus-visible:ring-1 focus-visible:ring-sidebar-ring",
        "data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground data-active:font-medium",
      )}
    >
      <span className="shrink-0 text-muted-foreground group-data-active:text-sidebar-accent-foreground">
        {item.renderIcon()}
      </span>
      <span className="flex-1 truncate">
        {item.label}
        {item.suffix && (
          <span className="ml-1 text-[13px] text-sidebar-foreground/50">{`- ${item.suffix}`}</span>
        )}
      </span>
      {item.badge && (
        <span className="rounded bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

/* ─── Item expansível (com filhos) ───────────────────────────────────────── */
export function ExpandableItem({
  item,
  active,
  activeHref,
}: {
  item: TreeItem;
  active: boolean;
  activeHref: string;
}) {
  const [open, setOpen] = useState(true);

  if (!item.children) {
    return <Leaf item={item} active={active} />;
  }

  return (
    <div>
      <div
        className={cn(
          "group flex h-[calc(var(--row-h)-6px)] items-center rounded-[4px] text-[13px] text-sidebar-foreground/80 transition-colors",
          "hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
          active &&
            "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
        )}
      >
        <button
          type="button"
          aria-label={open ? "Colapsar" : "Expandir"}
          onClick={() => setOpen((v) => !v)}
          className="grid h-full w-5 place-items-center text-muted-foreground hover:text-foreground"
        >
          {open ? (
            <ChevronDown className="size-3" />
          ) : (
            <ChevronRight className="size-3" />
          )}
        </button>
        <Link
          href={item.href}
          className="flex h-full flex-1 items-center gap-2 pr-2 outline-none"
        >
          <span className="shrink-0 text-muted-foreground">
            {item.renderIcon()}
          </span>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && (
            <span className="rounded bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
              {item.badge}
            </span>
          )}
        </Link>
      </div>

      {open && (
        <ul className="mt-px space-y-px">
          {item.children.map((child) => (
            <li key={child.href}>
              <Leaf item={child} depth={1} active={activeHref === child.href} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ─── Ícone de Space (chip colorido mini) ─────────────────────────────────── */
export function SectionBlock({ section }: { section: Section }) {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();

  return (
    <div>
      <div className="mb-1 flex h-7 items-center justify-between px-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-1 text-[12px] font-semibold text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground"
        >
          <ChevronRight
            className={cn(
              "size-3 shrink-0 transition-transform duration-150",
              open && "rotate-90",
            )}
          />
          {section.label}
        </button>
        {section.showAddButton && (
          <button
            type="button"
            aria-label={`Adicionar em ${section.label}`}
            className="grid size-4 place-items-center rounded text-muted-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Plus className="size-3" />
          </button>
        )}
      </div>

      {open && (
        <ul className="space-y-1">
          {section.id === "favoritos" ? (
            <>
              <FavoritesList />
              <li>
                <AddFavoriteDropdown />
              </li>
            </>
          ) : (
            section.items.map((item) => (
              <li key={item.href}>
                <Leaf item={item} active={pathname === item.href} />
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

/* ─── Aside do Planner (colapsavel) ───────────────────────────────────────── */
export function PlannerAside() {
  const collapsed = usePlannerUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = usePlannerUIStore((s) => s.toggleSidebar);

  if (collapsed) {
    return (
      <aside
        aria-label="Painel do planejador recolhido"
        className="flex h-full w-10 shrink-0 flex-col items-center border-r border-border bg-sidebar pt-2"
      >
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Expandir painel"
          title="Expandir painel"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <PanelLeftOpen size={15} strokeWidth={1.7} />
        </button>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Painel do planejador"
      className="flex h-full w-[260px] shrink-0 flex-col bg-sidebar border-r border-border"
    >
      <PlannerPanel />
    </aside>
  );
}

/* ─── Painel principal ────────────────────────────────────────────────────── */
export function SidebarIconButton({
  label,
  side = "right",
  children,
  onClick,
}: {
  label: string;
  side?: "top" | "right" | "bottom" | "left";
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        aria-label={label}
        className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring"
        onClick={onClick}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}

