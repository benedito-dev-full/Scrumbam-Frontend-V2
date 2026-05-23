"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Star,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { SpaceTree } from "./space-tree";
import { PlannerPanel } from "./planner-panel";

/* ─── Ícones SVG custom — pixel-perfect ClickUp ──────────────────────────── */

/* Caixa de entrada — bandeja com seta entrando */
function IcInbox() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-6l-2 3H10l-2-3H2" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

/* Respostas — seta de reply curvada */
function IcReply() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 17L4 12l5-5" />
      <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
  );
}

/* Comentários atribuídos — balão de chat com @ */
function IcMentions() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
    </svg>
  );
}

/* Minhas tarefas — pessoa com check mark */
function IcMyTasks() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
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
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

/* Canal de anúncio — antena com sinal (igual ClickUp Geral) */
function IcChannel() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35z" />
      <path d="M6 18h12" />
      <path d="M6 14h12" />
      <path d="M6 10h12" />
    </svg>
  );
}

/* Canal público — hashtag */
function IcHash() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}

/* ─── Tipos ───────────────────────────────────────────────────────────────── */
type LeafItem = {
  href: string;
  label: string;
  renderIcon: () => React.ReactNode;
  badge?: string;
};

type TreeItem = LeafItem & {
  children?: LeafItem[];
};

/* ─── Dados de navegação ─────────────────────────────────────────────────── */
const homeItems: TreeItem[] = [
  { href: "/inbox",    label: "Caixa de entrada",      renderIcon: () => <IcInbox /> },
  { href: "/replies",  label: "Respostas",              renderIcon: () => <IcReply /> },
  { href: "/mentions", label: "Comentários atribuídos", renderIcon: () => <IcMentions /> },
  { href: "/assigned", label: "Minhas tarefas",         renderIcon: () => <IcMyTasks /> },
  { href: "/more",     label: "Mais",                   renderIcon: () => <IcMore /> },
];

type Section = {
  id: string;
  label: string;
  items: LeafItem[];
  showAddButton?: boolean;
};

const sections: Section[] = [
  {
    id: "favoritos",
    label: "Favoritos",
    items: [
      { href: "/favorites", label: "Adicione à sua barra lateral", renderIcon: () => <IcStar /> },
    ],
  },
  {
    id: "canais",
    label: "Canais",
    showAddButton: true,
    items: [
      { href: "/channels/geral",   label: "Geral",   renderIcon: () => <IcChannel /> },
      { href: "/channels/welcome", label: "Welcome", renderIcon: () => <IcHash /> },
    ],
  },
];

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
        "group flex h-[34px] items-center gap-2 rounded-[5px] px-3 text-[13px] text-sidebar-foreground/80 outline-none transition-colors",
        "hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        "focus-visible:bg-sidebar-accent focus-visible:text-sidebar-accent-foreground focus-visible:ring-1 focus-visible:ring-sidebar-ring",
        "data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground data-active:font-medium",
      )}
    >
      <span className="shrink-0 text-muted-foreground group-data-active:text-sidebar-accent-foreground">
        {item.renderIcon()}
      </span>
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span className="rounded bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

/* ─── Item expansível (com filhos) ───────────────────────────────────────── */
function ExpandableItem({
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
          "group flex h-[34px] items-center rounded-[4px] text-[13px] text-sidebar-foreground/80 transition-colors",
          "hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
          active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
        )}
      >
        <button
          type="button"
          aria-label={open ? "Colapsar" : "Expandir"}
          onClick={() => setOpen((v) => !v)}
          className="grid h-full w-5 place-items-center text-muted-foreground hover:text-foreground"
        >
          {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        </button>
        <Link
          href={item.href}
          className="flex h-full flex-1 items-center gap-2 pr-2 outline-none"
        >
          <span className="shrink-0 text-muted-foreground">{item.renderIcon()}</span>
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

/* ─── Bloco de seção colapsável ───────────────────────────────────────────── */
function SectionBlock({ section }: { section: Section }) {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();

  return (
    <div>
      <div className="group mb-1 flex h-7 items-center justify-between px-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 transition-colors hover:text-muted-foreground"
        >
          {open ? (
            <ChevronDown className="size-2.5" />
          ) : (
            <ChevronRight className="size-2.5" />
          )}
          {section.label}
        </button>
        {section.showAddButton && (
          <button
            type="button"
            aria-label={`Adicionar em ${section.label}`}
            className="grid size-4 place-items-center rounded text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Plus className="size-3" />
          </button>
        )}
      </div>

      {open && (
        <ul className="space-y-1">
          {section.items.map((item) => (
            <li key={item.href}>
              <Leaf item={item} active={pathname === item.href} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ─── Painel principal ────────────────────────────────────────────────────── */
export function WorkspacePanel() {
  const pathname = usePathname();
  const [homeOpen, setHomeOpen] = useState(true);

  /* painéis alternativos por rota */
  if (pathname.startsWith("/planner")) {
    return (
      <aside aria-label="Painel do planejador" className="flex h-full w-[260px] shrink-0 flex-col bg-sidebar border-r border-border">
        <PlannerPanel />
      </aside>
    );
  }

  return (
    <aside
      aria-label="Painel do workspace"
      className="flex h-full w-[260px] shrink-0 flex-col bg-sidebar"
    >
      {/* header "Início" */}
      <header className="flex h-10 items-center justify-between gap-1 px-3">
        <button
          type="button"
          onClick={() => setHomeOpen((v) => !v)}
          className="flex h-7 flex-1 items-center gap-1 rounded px-1 text-[13px] font-semibold text-sidebar-foreground transition-colors hover:text-foreground"
        >
          {homeOpen ? (
            <ChevronDown className="size-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3.5 text-muted-foreground" />
          )}
          Início
        </button>
        <button
          type="button"
          aria-label="Adicionar"
          className="grid size-5 place-items-center rounded text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Plus className="size-3.5" />
        </button>
      </header>

      <ScrollArea className="flex-1">
        <div className="space-y-5 px-2 pb-4">
          {/* seção Início */}
          {homeOpen && (
            <div className="space-y-1">
              {homeItems.map((item) => (
                <ExpandableItem
                  key={item.href}
                  item={item}
                  active={pathname === item.href}
                  activeHref={pathname}
                />
              ))}
            </div>
          )}

          {/* seções + SpaceTree após favoritos */}
          {sections.map((section) => (
            <Fragment key={section.id}>
              <SectionBlock section={section} />
              {section.id === "favoritos" && <SpaceTree />}
            </Fragment>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
