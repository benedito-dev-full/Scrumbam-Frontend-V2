import { create } from "zustand";

import type { StatusVisual } from "@/components/tasks/create-task-modal";

/**
 * Store de UI global para o modal de criação de tarefa.
 *
 * Permite abrir o `CreateTaskModal` de qualquer lugar (command palette,
 * atalhos, botões soltos) sem precisar montá-lo localmente em cada tela.
 * Montado uma única vez via `CreateTaskModalGlobal` no `AppShell`.
 *
 * Sem `listId`, o modal abre "solto" e exige que o usuário escolha a lista
 * antes de criar — comportamento desejado quando não há contexto de lista
 * (ex.: comando "Criar tarefa" do Cmd+K).
 *
 * @example
 * const openCreateTask = useCreateTaskModalStore((s) => s.openModal);
 * openCreateTask();                          // sem contexto
 * openCreateTask({ listId, defaultStatus }); // pré-selecionado
 */
type CreateTaskModalState = {
  open: boolean;
  /** Lista pré-selecionada (opcional). */
  listId?: string;
  /** Status inicial pré-selecionado (opcional). */
  defaultStatus?: StatusVisual;
  openModal: (opts?: { listId?: string; defaultStatus?: StatusVisual }) => void;
  closeModal: () => void;
};

export const useCreateTaskModalStore = create<CreateTaskModalState>((set) => ({
  open: false,
  listId: undefined,
  defaultStatus: undefined,
  openModal: (opts) =>
    set({
      open: true,
      listId: opts?.listId,
      defaultStatus: opts?.defaultStatus,
    }),
  closeModal: () =>
    set({ open: false, listId: undefined, defaultStatus: undefined }),
}));
