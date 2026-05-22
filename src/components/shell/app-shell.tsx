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
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <IconRail />
      <WorkspacePanel />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
      <CommandPalette />
      <ShortcutsHelpDialog />
      <NewSpaceDialog />
      <KeyboardShortcuts />
    </div>
  );
}
