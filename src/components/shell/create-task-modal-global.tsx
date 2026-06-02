"use client";

import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { useCreateTaskModalStore } from "@/lib/stores/create-task-modal";

/**
 * Monta o `CreateTaskModal` uma única vez no shell, controlado pelo store
 * global `useCreateTaskModalStore`. Permite abrir o modal de criação de
 * tarefa de qualquer lugar (command palette, etc.) sem montá-lo por tela.
 *
 * O `CreateTaskModal` retorna null quando `open` é false, então manter este
 * wrapper sempre montado não tem custo de render.
 */
export function CreateTaskModalGlobal() {
  const open = useCreateTaskModalStore((s) => s.open);
  const listId = useCreateTaskModalStore((s) => s.listId);
  const defaultStatus = useCreateTaskModalStore((s) => s.defaultStatus);
  const closeModal = useCreateTaskModalStore((s) => s.closeModal);

  return (
    <CreateTaskModal
      open={open}
      onClose={closeModal}
      listId={listId}
      defaultStatus={defaultStatus}
    />
  );
}
