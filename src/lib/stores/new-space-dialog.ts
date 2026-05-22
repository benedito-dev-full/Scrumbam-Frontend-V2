import { create } from "zustand";

type NewSpaceDialogState = {
  open: boolean;
  setOpen: (open: boolean) => void;
  openDialog: () => void;
  close: () => void;
};

export const useNewSpaceDialogStore = create<NewSpaceDialogState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  openDialog: () => set({ open: true }),
  close: () => set({ open: false }),
}));
