"use client";

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
  Hash,
  CalendarDays,
  Settings,
  CornerDownLeft,
  type LucideIcon,
} from "lucide-react";

import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { useCommandPaletteStore } from "@/lib/stores/command-palette";
import { useInviteDialogStore } from "@/lib/stores/invite-dialog";
import { cn } from "@/lib/utils";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type CommandEntry = {
  id: string;
  label: string;
  sublabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  shortcut?: string;
  keywords?: string[];
  onSelect: () => void;
};

// ─── Componente ───────────────────────────────────────────────────────────────

export function CommandPalette() {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const open = useCommandPaletteStore((s) => s.open);
  const setOpen = useCommandPaletteStore((s) => s.setOpen);
  const openInvite = useInviteDialogStore((s) => s.openDialog);

  const run = (fn: () => void) => () => {
    setOpen(false);
    setTimeout(fn, 50);
  };

  const isDark = resolvedTheme === "dark";

  const recents: CommandEntry[] = [
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
      shortcut: "G I",
      keywords: ["caixa", "inbox", "notificacoes"],
      onSelect: run(() => router.push("/inbox")),
    },
    {
      id: "r:tasks",
      label: "Minhas tarefas",
      sublabel: "Board de tarefas",
      icon: ListTodo,
      iconColor: "#34d399",
      shortcut: "G T",
      keywords: ["tarefas", "tasks", "board"],
      onSelect: run(() => router.push("/tasks")),
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
    {
      id: "r:channels",
      label: "Canal Geral",
      sublabel: "Canais",
      icon: Hash,
      iconColor: "#38bdf8",
      keywords: ["canal", "geral", "chat"],
      onSelect: run(() => router.push("/channels/geral")),
    },
  ];

  const commands: CommandEntry[] = [
    {
      id: "c:new-task",
      label: "Criar tarefa",
      icon: Plus,
      shortcut: "C T",
      keywords: ["nova tarefa", "criar", "add task"],
      onSelect: run(() => { /* TODO */ }),
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
      label: isDark ? "Mudar para tema claro" : "Mudar para tema escuro",
      icon: isDark ? Sun : Moon,
      keywords: ["tema", "theme", "dark", "light", "modo"],
      onSelect: run(() => setTheme(isDark ? "light" : "dark")),
    },
    {
      id: "c:shortcuts",
      label: "Mostrar atalhos de teclado",
      icon: Keyboard,
      shortcut: "⌘ /",
      keywords: ["shortcuts", "atalhos", "keyboard", "ajuda"],
      onSelect: run(() => { /* TODO */ }),
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

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Busca e comandos"
      description="Pesquise páginas ou execute um comando"
    >
      <CommandInput placeholder="Pesquise, execute um comando ou faça uma pergunta..." />

      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-1.5 py-6 text-center">
            <span className="text-[13px] text-muted-foreground">
              Nenhum resultado encontrado.
            </span>
          </div>
        </CommandEmpty>

        <CommandGroup heading="Recentes">
          {recents.map((entry) => (
            <PaletteItem key={entry.id} entry={entry} />
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Comandos">
          {commands.map((entry) => (
            <PaletteItem key={entry.id} entry={entry} />
          ))}
        </CommandGroup>
      </CommandList>

      {/* rodapé */}
      <div className="flex items-center justify-between border-t border-border px-3 py-2">
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd><Kbd>↓</Kbd> navegar
          </span>
          <span className="flex items-center gap-1">
            <Kbd><CornerDownLeft className="size-2.5" /></Kbd> selecionar
          </span>
          <span className="flex items-center gap-1">
            <Kbd>Esc</Kbd> fechar
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground/40">
          ⌘K
        </span>
      </div>
    </CommandDialog>
  );
}

// ─── Item da paleta ───────────────────────────────────────────────────────────

function PaletteItem({ entry }: { entry: CommandEntry }) {
  const Icon = entry.icon;
  return (
    <CommandItem
      value={`${entry.label} ${(entry.keywords ?? []).join(" ")}`}
      onSelect={entry.onSelect}
      className="group flex items-center gap-3 px-3 py-2"
    >
      <span
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-md",
          entry.iconColor ? "bg-transparent" : "bg-muted",
        )}
        style={entry.iconColor ? { color: entry.iconColor } : undefined}
      >
        <Icon className="size-4" style={entry.iconColor ? { color: entry.iconColor } : undefined} />
      </span>

      <span className="flex flex-1 flex-col min-w-0">
        <span className="text-[13px] text-foreground leading-tight">{entry.label}</span>
        {entry.sublabel && (
          <span className="text-[11px] text-muted-foreground/60 leading-tight truncate">
            {entry.sublabel}
          </span>
        )}
      </span>

      {entry.shortcut && (
        <span className="flex items-center gap-0.5 opacity-0 group-data-[selected=true]:opacity-100 transition-opacity">
          {entry.shortcut.split(" ").map((k) => (
            <Kbd key={k}>{k}</Kbd>
          ))}
        </span>
      )}

      <CornerDownLeft
        className="size-3.5 shrink-0 text-muted-foreground/40 opacity-0 group-data-[selected=true]:opacity-100 transition-opacity"
      />
    </CommandItem>
  );
}

// ─── Kbd ──────────────────────────────────────────────────────────────────────

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="flex items-center justify-center min-w-[20px] h-5 rounded border border-border bg-muted px-1 text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}
