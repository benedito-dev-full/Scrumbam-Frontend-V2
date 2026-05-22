import { create } from "zustand";

type ShortcutsHelpState = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

export const useShortcutsHelpStore = create<ShortcutsHelpState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
}));
