"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Home,
  Inbox,
  ListTodo,
  Zap,
  Sparkles,
  Users,
  FileText,
  MoreHorizontal,
  UserPlus,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type RailItem = {
  href?: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  onClick?: () => void;
};

const mainNav: RailItem[] = [
  { href: "/", label: "Início", icon: Home },
  { href: "/inbox", label: "Caixa", icon: Inbox },
  { href: "/tasks", label: "Tarefas", icon: ListTodo },
  { href: "/sprints", label: "Sprints", icon: Zap, badge: "S2" },
  { href: "/ia", label: "IA", icon: Sparkles },
  { href: "/teams", label: "Equipes", icon: Users },
  { href: "/docs", label: "Documentos", icon: FileText },
  { href: "/more", label: "Mais", icon: MoreHorizontal },
];

type RailButtonProps = {
  item: RailItem;
  active?: boolean;
};

function RailButton({ item, active }: RailButtonProps) {
  const Icon = item.icon;

  const content = (
    <>
      <div className="relative">
        <Icon className="size-[18px]" strokeWidth={1.75} />
        {item.badge && (
          <span className="absolute -top-1 -right-2 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-primary px-1 text-[9px] font-semibold leading-none text-primary-foreground">
            {item.badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium leading-none">{item.label}</span>
    </>
  );

  const className = cn(
    "group/rail flex h-14 w-14 flex-col items-center justify-center gap-1.5 rounded-md text-sidebar-foreground/70 transition-colors outline-none",
    "hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
    "focus-visible:bg-sidebar-accent focus-visible:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring",
    active && "bg-sidebar-accent text-sidebar-accent-foreground",
  );

  if (item.href) {
    return (
      <Link href={item.href} aria-label={item.label} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      aria-label={item.label}
      onClick={item.onClick}
      className={className}
    >
      {content}
    </button>
  );
}

function ThemeToggleRail() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <RailButton
      item={{
        label: isDark ? "Claro" : "Escuro",
        icon: isDark ? Sun : Moon,
        onClick: () => setTheme(isDark ? "light" : "dark"),
      }}
    />
  );
}

export function IconRail() {
  const pathname = usePathname();
  const isActive = (href?: string) =>
    !!href && (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav
      aria-label="Navegação principal"
      className="flex h-full w-[60px] shrink-0 flex-col items-center justify-between bg-sidebar py-2"
    >
      <div className="flex flex-col items-center gap-0.5">
        {mainNav.map((item) => (
          <RailButton
            key={item.label}
            item={item}
            active={isActive(item.href)}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-0.5">
        <RailButton
          item={{ label: "Convidar", icon: UserPlus, onClick: () => {} }}
        />
        <ThemeToggleRail />
      </div>
    </nav>
  );
}
