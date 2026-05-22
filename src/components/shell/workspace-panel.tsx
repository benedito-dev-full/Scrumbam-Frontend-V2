"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Folder,
  FileText,
  ListTodo,
  Star,
  Hash,
  Inbox,
  UserCheck,
  CalendarClock,
  MoreHorizontal,
  Megaphone,
  type LucideIcon,
} from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { SpaceTree } from "./space-tree";

type LeafItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

type TreeItem = LeafItem & {
  children?: LeafItem[];
};

const homeItems: TreeItem[] = [
  { href: "/inbox", label: "Caixa de entrada", icon: Inbox },
  { href: "/assigned", label: "Atribuídas a mim", icon: UserCheck },
  {
    href: "/tasks",
    label: "Tarefas",
    icon: ListTodo,
    children: [
      { href: "/tasks/in-progress", label: "Em andamento", icon: Hash, badge: "5" },
      { href: "/tasks/pending", label: "Pendentes", icon: Hash, badge: "12" },
      { href: "/tasks/done", label: "Concluídas", icon: Hash },
    ],
  },
  { href: "/today", label: "Hoje", icon: CalendarClock, badge: "3" },
  { href: "/more", label: "Mais", icon: MoreHorizontal },
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
      { href: "/projects/website", label: "Website 2026", icon: Star },
      { href: "/projects/onboarding", label: "Onboarding", icon: Star },
    ],
  },
  {
    id: "canais",
    label: "Canais",
    showAddButton: true,
    items: [
      { href: "/channels/geral", label: "Geral", icon: Megaphone },
      { href: "/channels/anuncios", label: "Anúncios", icon: Megaphone },
      { href: "/channels/welcome", label: "Welcome", icon: Megaphone },
    ],
  },
  {
    id: "docs",
    label: "Documentos recentes",
    items: [
      { href: "/docs/changelog", label: "Changelog Q2", icon: FileText },
      { href: "/docs/runbook", label: "Runbook on-call", icon: FileText },
    ],
  },
];

function Leaf({
  item,
  depth = 0,
  active,
}: {
  item: LeafItem;
  depth?: number;
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      data-active={active ? "" : undefined}
      style={depth ? { paddingLeft: `${0.5 + depth * 1.25}rem` } : undefined}
      className={cn(
        "group flex h-7 items-center gap-2 rounded px-2 text-[13px] text-sidebar-foreground/85 outline-none transition-colors",
        "hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
        "focus-visible:bg-sidebar-accent focus-visible:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        "data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground data-active:font-medium",
      )}
    >
      <Icon className="size-4 shrink-0 text-muted-foreground group-data-active:text-sidebar-accent-foreground" />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span className="rounded bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

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
  const Icon = item.icon;
  if (!item.children) {
    return <Leaf item={item} active={active} />;
  }

  return (
    <div>
      <div
        className={cn(
          "group flex h-7 items-center rounded text-[13px] text-sidebar-foreground/85 transition-colors",
          "hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
          active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
        )}
      >
        <button
          type="button"
          aria-label={open ? "Colapsar" : "Expandir"}
          onClick={() => setOpen((v) => !v)}
          className="grid h-7 w-5 place-items-center text-muted-foreground hover:text-foreground"
        >
          {open ? (
            <ChevronDown className="size-3" />
          ) : (
            <ChevronRight className="size-3" />
          )}
        </button>
        <Link
          href={item.href}
          className="flex h-7 flex-1 items-center gap-2 pr-2 outline-none"
        >
          <Icon className="size-4 shrink-0 text-muted-foreground group-data-active:text-sidebar-accent-foreground" />
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && (
            <span className="rounded bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
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

function SectionBlock({ section }: { section: Section }) {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();

  return (
    <div>
      <div className="group flex h-7 items-center justify-between pr-1 pl-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-full flex-1 items-center gap-1 rounded px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          {open ? (
            <ChevronDown className="size-3" />
          ) : (
            <ChevronRight className="size-3" />
          )}
          {section.label}
        </button>
        {section.showAddButton && (
          <button
            type="button"
            aria-label={`Adicionar em ${section.label}`}
            className="grid size-5 place-items-center rounded text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Plus className="size-3.5" />
          </button>
        )}
      </div>

      {open && (
        <ul className="mt-0.5 space-y-px">
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

export function WorkspacePanel() {
  const pathname = usePathname();
  const [homeOpen, setHomeOpen] = useState(true);

  return (
    <aside
      aria-label="Painel do workspace"
      className="flex h-full w-[256px] shrink-0 flex-col bg-sidebar"
    >
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
          className="grid size-6 place-items-center rounded text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Plus className="size-3.5" />
        </button>
      </header>

      <ScrollArea className="flex-1">
        <div className="space-y-4 px-2 pb-4">
          {homeOpen && (
            <div className="space-y-px">
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
