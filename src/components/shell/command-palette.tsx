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
  Settings,
  Plus,
  UserPlus,
  Moon,
  Sun,
  Keyboard,
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
  CommandShortcut,
} from "@/components/ui/command";
import { useCommandPaletteStore } from "@/lib/stores/command-palette";

type CommandEntry = {
  id: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
  keywords?: string[];
  onSelect: () => void;
};

export function CommandPalette() {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const open = useCommandPaletteStore((s) => s.open);
  const setOpen = useCommandPaletteStore((s) => s.setOpen);

  const run = (fn: () => void) => () => {
    setOpen(false);
    setTimeout(fn, 50);
  };

  const pages: CommandEntry[] = [
    {
      id: "p:home",
      label: "Início",
      icon: Home,
      shortcut: "G H",
      keywords: ["home", "dashboard", "inicio"],
      onSelect: run(() => router.push("/")),
    },
    {
      id: "p:inbox",
      label: "Caixa de entrada",
      icon: Inbox,
      shortcut: "G I",
      keywords: ["caixa", "inbox"],
      onSelect: run(() => router.push("/inbox")),
    },
    {
      id: "p:tasks",
      label: "Minhas tarefas",
      icon: ListTodo,
      shortcut: "G T",
      keywords: ["tarefas", "tasks"],
      onSelect: run(() => router.push("/tasks")),
    },
    {
      id: "p:sprints",
      label: "Sprints",
      icon: Zap,
      shortcut: "G S",
      keywords: ["sprint", "iteracao"],
      onSelect: run(() => router.push("/sprints")),
    },
    {
      id: "p:ia",
      label: "Assistente IA",
      icon: Sparkles,
      keywords: ["ai", "ia", "assistente"],
      onSelect: run(() => router.push("/ia")),
    },
    {
      id: "p:teams",
      label: "Equipes",
      icon: Users,
      keywords: ["team", "equipe", "pessoas"],
      onSelect: run(() => router.push("/teams")),
    },
    {
      id: "p:docs",
      label: "Documentos",
      icon: FileText,
      keywords: ["docs", "documento"],
      onSelect: run(() => router.push("/docs")),
    },
  ];

  const isDark = resolvedTheme === "dark";

  const actions: CommandEntry[] = [
    {
      id: "a:new-task",
      label: "Criar tarefa",
      icon: Plus,
      shortcut: "C T",
      keywords: ["nova tarefa", "criar", "add"],
      onSelect: run(() => {
        /* TODO: abrir modal de criação */
      }),
    },
    {
      id: "a:new-sprint",
      label: "Criar sprint",
      icon: Plus,
      keywords: ["novo sprint", "criar"],
      onSelect: run(() => {
        /* TODO: abrir modal de criação */
      }),
    },
    {
      id: "a:invite",
      label: "Convidar membro",
      icon: UserPlus,
      keywords: ["invite", "convidar"],
      onSelect: run(() => {
        /* TODO: abrir modal de convite */
      }),
    },
    {
      id: "a:theme",
      label: isDark ? "Mudar para tema claro" : "Mudar para tema escuro",
      icon: isDark ? Sun : Moon,
      keywords: ["tema", "theme", "dark", "light"],
      onSelect: run(() => setTheme(isDark ? "light" : "dark")),
    },
    {
      id: "a:settings",
      label: "Configurações",
      icon: Settings,
      shortcut: "⌘ ,",
      keywords: ["preferences", "config"],
      onSelect: run(() => router.push("/settings")),
    },
  ];

  const help: CommandEntry[] = [
    {
      id: "h:shortcuts",
      label: "Mostrar atalhos de teclado",
      icon: Keyboard,
      shortcut: "⌘ /",
      keywords: ["shortcuts", "atalhos", "keyboard"],
      onSelect: run(() => {
        /* TODO: abrir overlay de atalhos */
      }),
    },
  ];

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Paleta de comandos"
      description="Busque por uma página ou ação"
    >
      <CommandInput placeholder="Buscar páginas, ações ou comandos..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

        <CommandGroup heading="Páginas">
          {pages.map((entry) => (
            <CommandEntryItem key={entry.id} entry={entry} />
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Ações">
          {actions.map((entry) => (
            <CommandEntryItem key={entry.id} entry={entry} />
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Ajuda">
          {help.map((entry) => (
            <CommandEntryItem key={entry.id} entry={entry} />
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

function CommandEntryItem({ entry }: { entry: CommandEntry }) {
  const Icon = entry.icon;
  return (
    <CommandItem
      value={`${entry.label} ${(entry.keywords ?? []).join(" ")}`}
      onSelect={entry.onSelect}
    >
      <Icon className="size-4 text-muted-foreground" />
      <span className="flex-1">{entry.label}</span>
      {entry.shortcut && <CommandShortcut>{entry.shortcut}</CommandShortcut>}
    </CommandItem>
  );
}
