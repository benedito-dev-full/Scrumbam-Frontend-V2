"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Home,
  Inbox,
  ListTodo,
  Zap,
  Sparkles,
  Users,
  FileText,
  Plus,
  UserPlus,
  Moon,
  Sun,
  Keyboard,
  CalendarDays,
  Settings,
  CornerDownLeft,
  Search,
  type LucideIcon,
} from "lucide-react";
import { useCommandPaletteStore } from "@/lib/stores/command-palette";
import { useInviteDialogStore } from "@/lib/stores/invite-dialog";
import { cn } from "@/lib/utils";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Entry = {
  id: string;
  label: string;
  sublabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  shortcut?: string;
  keywords?: string[];
  onSelect: () => void;
};

// ─── Componente principal ─────────────────────────────────────────────────────

export function CommandPalette() {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const open = useCommandPaletteStore((s) => s.open);
  const setOpen = useCommandPaletteStore((s) => s.setOpen);
  const openInvite = useInviteDialogStore((s) => s.openDialog);

  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isDark = resolvedTheme === "dark";

  const run = (fn: () => void) => () => {
    setOpen(false);
    setQuery("");
    setCursor(0);
    setTimeout(fn, 50);
  };

  const recents: Entry[] = [
    {
      id: "r:home",
      label: "Início",
      sublabel: "Página inicial",
      icon: Home,
      iconColor: "#60a5fa",
      keywords: ["home", "inicio", "dashboard"],
      onSelect: run(() => router.push("/")),
    },
    {
      id: "r:inbox",
      label: "Caixa de entrada",
      sublabel: "Inbox",
      icon: Inbox,
      iconColor: "#a78bfa",
      keywords: ["caixa", "inbox", "notificacoes"],
      onSelect: run(() => router.push("/inbox")),
    },
    {
      id: "r:tasks",
      label: "Minhas tarefas",
      sublabel: "Tarefas atribuidas a voce",
      icon: ListTodo,
      iconColor: "#34d399",
      keywords: ["tarefas", "tasks", "board", "atribuidas", "assigned"],
      onSelect: run(() => router.push("/assigned")),
    },
    {
      id: "r:planner",
      label: "Planejador",
      sublabel: "Visão de calendário",
      icon: CalendarDays,
      iconColor: "#fb923c",
      keywords: ["planner", "calendario", "planejador"],
      onSelect: run(() => router.push("/planner")),
    },
    {
      id: "r:docs",
      label: "Documentos",
      sublabel: "Docs colaborativos",
      icon: FileText,
      iconColor: "#94a3b8",
      keywords: ["docs", "documento", "notas"],
      onSelect: run(() => router.push("/docs")),
    },
  ];

  const commands: Entry[] = [
    {
      id: "c:new-task",
      label: "Criar tarefa",
      icon: Plus,
      shortcut: "C T",
      keywords: ["nova tarefa", "criar", "add"],
      onSelect: run(() => {}),
    },
    {
      id: "c:invite",
      label: "Convidar membro",
      icon: UserPlus,
      keywords: ["invite", "convidar", "membro"],
      onSelect: run(() => openInvite()),
    },
    {
      id: "c:sprints",
      label: "Abrir Sprints",
      icon: Zap,
      shortcut: "G S",
      keywords: ["sprint", "iteracao"],
      onSelect: run(() => router.push("/sprints")),
    },
    {
      id: "c:ia",
      label: "Assistente IA",
      icon: Sparkles,
      keywords: ["ai", "ia", "assistente", "nexus"],
      onSelect: run(() => router.push("/ia")),
    },
    {
      id: "c:people",
      label: "Gerenciar pessoas",
      icon: Users,
      keywords: ["team", "equipe", "pessoas", "membros"],
      onSelect: run(() => router.push("/people")),
    },
    {
      id: "c:theme",
      label: isDark ? "Tema claro" : "Tema escuro",
      icon: isDark ? Sun : Moon,
      keywords: ["tema", "theme", "dark", "light"],
      onSelect: run(() => setTheme(isDark ? "light" : "dark")),
    },
    {
      id: "c:shortcuts",
      label: "Atalhos de teclado",
      icon: Keyboard,
      shortcut: "⌘ /",
      keywords: ["shortcuts", "atalhos", "ajuda"],
      onSelect: run(() => {}),
    },
    {
      id: "c:settings",
      label: "Configurações",
      icon: Settings,
      shortcut: "⌘ ,",
      keywords: ["preferences", "config", "configuracoes"],
      onSelect: run(() => router.push("/settings")),
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const allEntries = [...recents, ...commands];

  // filtro por query
  const q = query.toLowerCase().trim();
  const filteredRecents = q
    ? recents.filter(
        (e) =>
          e.label.toLowerCase().includes(q) ||
          (e.sublabel ?? "").toLowerCase().includes(q) ||
          (e.keywords ?? []).some((k) => k.includes(q)),
      )
    : recents;
  const filteredCommands = q
    ? commands.filter(
        (e) =>
          e.label.toLowerCase().includes(q) ||
          (e.keywords ?? []).some((k) => k.includes(q)),
      )
    : commands;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filtered = [...filteredRecents, ...filteredCommands];

  // reset cursor quando muda a query
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCursor(0);
  }, [query]);

  // foca o input quando abre
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // navegação por teclado
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => Math.min(c + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => Math.max(c - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        filtered[cursor]?.onSelect();
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, filtered, cursor, setOpen]);

  // scroll automático do item ativo
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${cursor}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  if (!open) return null;

  return (
    /* overlay */
    <div
      className="fixed inset-0 z-[9998] flex items-start justify-center pt-[15vh]"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={() => setOpen(false)}
    >
      {/* painel */}
      <div
        className="w-full max-w-[580px] rounded-xl border border-border bg-popover shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* input */}
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <Search className="size-4 shrink-0 text-muted-foreground/50" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquise, execute um comando ou faça uma pergunta..."
            className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground/50 outline-none"
          />
          <Kbd small>Esc</Kbd>
        </div>

        {/* lista */}
        <div ref={listRef} className="max-h-[360px] overflow-y-auto py-1.5">
          {filtered.length === 0 && (
            <p className="py-8 text-center text-[13px] text-muted-foreground">
              Nenhum resultado para &ldquo;{query}&rdquo;
            </p>
          )}

          {filteredRecents.length > 0 && (
            <Section
              label={q ? "Resultados" : "Recentes"}
              entries={filteredRecents}
              offset={0}
              cursor={cursor}
              onHover={setCursor}
            />
          )}

          {filteredCommands.length > 0 && (
            <Section
              label="Comandos"
              entries={filteredCommands}
              offset={filteredRecents.length}
              cursor={cursor}
              onHover={setCursor}
            />
          )}
        </div>

        {/* rodapé */}
        <div className="flex items-center justify-between border-t border-border px-4 py-2">
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground/50">
            <span className="flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> navegar
            </span>
            <span className="flex items-center gap-1">
              <Kbd>
                <CornerDownLeft className="size-2.5" />
              </Kbd>{" "}
              selecionar
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground/30">⌘K</span>
        </div>
      </div>
    </div>
  );
}

// ─── Seção ────────────────────────────────────────────────────────────────────

function Section({
  label,
  entries,
  offset,
  cursor,
  onHover,
}: {
  label: string;
  entries: Entry[];
  offset: number;
  cursor: number;
  onHover: (idx: number) => void;
}) {
  return (
    <div className="mb-1">
      <p className="px-3 pb-1 pt-2 text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider">
        {label}
      </p>
      {entries.map((entry, i) => {
        const idx = offset + i;
        const active = cursor === idx;
        const Icon = entry.icon;
        return (
          <button
            key={entry.id}
            type="button"
            data-idx={idx}
            onMouseEnter={() => onHover(idx)}
            onClick={entry.onSelect}
            className={cn(
              "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
              active ? "bg-muted" : "hover:bg-muted/50",
            )}
          >
            <span
              className="grid size-7 shrink-0 place-items-center rounded-md bg-muted/60"
              style={entry.iconColor ? { color: entry.iconColor } : undefined}
            >
              <Icon className="size-4" />
            </span>

            <span className="flex flex-1 flex-col min-w-0">
              <span className="text-[13px] text-foreground leading-tight">
                {entry.label}
              </span>
              {entry.sublabel && (
                <span className="text-[11px] text-muted-foreground/60 leading-tight truncate">
                  {entry.sublabel}
                </span>
              )}
            </span>

            {entry.shortcut && active && (
              <span className="flex items-center gap-0.5">
                {entry.shortcut.split(" ").map((k) => (
                  <Kbd key={k}>{k}</Kbd>
                ))}
              </span>
            )}

            {active && (
              <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground/40" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Kbd ──────────────────────────────────────────────────────────────────────

function Kbd({
  children,
  small,
}: {
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center rounded border border-border bg-muted font-medium text-muted-foreground",
        small
          ? "h-5 min-w-[20px] px-1 text-[10px]"
          : "h-4 min-w-[16px] px-1 text-[9px]",
      )}
    >
      {children}
    </kbd>
  );
}
