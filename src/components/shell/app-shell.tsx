import { IconRail } from "./icon-rail";
import { WorkspacePanel } from "./workspace-panel";
import { AppTopbar } from "./app-topbar";
import { CommandPalette } from "./command-palette";
import { KeyboardShortcuts } from "./keyboard-shortcuts";
import { ShortcutsHelpDialog } from "./shortcuts-help-dialog";
import { NewSpaceDialog } from "./new-space-dialog";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      {/* Topbar cobre 100% da largura */}
      <AppTopbar />

      {/* Abaixo da topbar: rail + sidebar + conteúdo */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <IconRail />
        <WorkspacePanel />
        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>

      <CommandPalette />
      <ShortcutsHelpDialog />
      <NewSpaceDialog />
      <KeyboardShortcuts />
    </div>
  );
}
