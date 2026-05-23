import { create } from "zustand";

type InviteDialogStore = {
  open: boolean;
  openDialog: () => void;
  closeDialog: () => void;
};

export const useInviteDialogStore = create<InviteDialogStore>((set) => ({
  open: false,
  openDialog: () => set({ open: true }),
  closeDialog: () => set({ open: false }),
}));
