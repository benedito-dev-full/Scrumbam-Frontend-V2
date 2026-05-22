"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useShortcutsHelpStore } from "@/lib/stores/shortcuts-help";

type Shortcut = {
  keys: string[];
  description: string;
};

type ShortcutGroup = {
  label: string;
  items: Shortcut[];
};

const groups: ShortcutGroup[] = [
  {
    label: "Navegação",
    items: [
      { keys: ["G", "H"], description: "Ir para Início" },
      { keys: ["G", "I"], description: "Ir para Caixa de entrada" },
      { keys: ["G", "T"], description: "Ir para Minhas tarefas" },
      { keys: ["G", "S"], description: "Ir para Sprints" },
    ],
  },
  {
    label: "Geral",
    items: [
      { keys: ["⌘", "K"], description: "Abrir paleta de comandos" },
      { keys: ["⌘", "/"], description: "Mostrar atalhos de teclado" },
      { keys: ["Esc"], description: "Fechar diálogo aberto" },
    ],
  },
];

function KeyCap({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-border bg-muted px-1.5 font-mono text-[11px] font-medium text-foreground">
      {children}
    </kbd>
  );
}

export function ShortcutsHelpDialog() {
  const open = useShortcutsHelpStore((s) => s.open);
  const setOpen = useShortcutsHelpStore((s) => s.setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Atalhos de teclado</DialogTitle>
          <DialogDescription>
            Navegue mais rápido com combinações de teclas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.label} className="space-y-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </h3>
              <ul className="space-y-1">
                {group.items.map((sc) => (
                  <li
                    key={sc.description}
                    className="flex h-8 items-center justify-between rounded-md px-2 hover:bg-muted/40"
                  >
                    <span className="text-sm text-foreground">
                      {sc.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {sc.keys.map((k, i) => (
                        <KeyCap key={`${sc.description}-${i}`}>{k}</KeyCap>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
