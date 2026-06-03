"use client";

import { create } from "zustand";

/**
 * Estado global do fluxo de criação de Lista (chooser → template → criação).
 *
 * Centraliza a abertura para que TODOS os gatilhos ("+ Nova lista" na árvore e
 * nas páginas de Space/Folder) virem uma linha: `openCreateList(parentId, nome)`.
 * Um único `<CreateListFlow />` montado no shell consome este estado e decide
 * qual passo mostrar (chooser / em branco / galeria de templates).
 *
 * Mesmo padrão do `useNewSpaceDialogStore`.
 *
 * @example
 * const openCreateList = useCreateListFlowStore((s) => s.openCreateList);
 * openCreateList(space.id, space.nome);
 */
/** Passo atual do fluxo de criação de Lista. */
export type CreateListStep = "chooser" | "blank" | "gallery";

interface CreateListFlowState {
  open: boolean;
  /** Space ou Folder onde a Lista será criada (idPai). */
  parentId: string | null;
  /** Nome do pai, só para exibição no modal "em branco". */
  parentName: string;
  /** Passo visível. Resetado para "chooser" a cada nova abertura. */
  step: CreateListStep;
  openCreateList: (parentId: string, parentName?: string) => void;
  setStep: (step: CreateListStep) => void;
  close: () => void;
}

export const useCreateListFlowStore = create<CreateListFlowState>((set) => ({
  open: false,
  parentId: null,
  parentName: "",
  step: "chooser",
  openCreateList: (parentId, parentName = "") =>
    set({ open: true, parentId, parentName, step: "chooser" }),
  setStep: (step) => set({ step }),
  close: () => set({ open: false }),
}));
