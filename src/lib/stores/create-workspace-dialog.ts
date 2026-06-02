import { create } from "zustand";

/**
 * Controla a abertura do modal "Criar Espaço de trabalho" (nova organização).
 *
 * Disparado pelo `WorkspaceSwitcher` (topbar) e consumido pelo
 * `CreateWorkspaceDialog`, montado globalmente no `app-shell`.
 */
type CreateWorkspaceDialogState = {
  open: boolean;
  setOpen: (open: boolean) => void;
  openDialog: () => void;
  close: () => void;
};

export const useCreateWorkspaceDialogStore = create<CreateWorkspaceDialogState>(
  (set) => ({
    open: false,
    setOpen: (open) => set({ open }),
    openDialog: () => set({ open: true }),
    close: () => set({ open: false }),
  }),
);
