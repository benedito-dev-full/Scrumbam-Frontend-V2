// Store Zustand para gerenciar tasks em memória (mock).
// Persiste em localStorage para sobreviver a reloads de página.

// ─── Externos ─────────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Mocks / Types ─────────────────────────────────────────────────────────────
import { mockTarefas } from '@/lib/mocks/tarefas';
import type { Tarefa } from '@/lib/types/tarefa';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TasksState {
  /** Lista de tasks em memória, inicializada com os mocks */
  tasks: Tarefa[];
  /** Adiciona uma task à lista */
  addTask: (task: Tarefa) => void;
  /** Atualiza campos de uma task existente pelo id */
  updateTask: (id: string, patch: Partial<Omit<Tarefa, 'id'>>) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

/**
 * Store de tasks mock com persistência em localStorage.
 *
 * Inicializado com `mockTarefas`. Mutations (addTask) atualizam o estado
 * em memória e são persistidas automaticamente via zustand/persist.
 *
 * @example
 * const tasks = useTasksStore((s) => s.tasks);
 * const addTask = useTasksStore((s) => s.addTask);
 */
export const useTasksStore = create<TasksState>()(
  persist(
    (set) => ({
      tasks: mockTarefas,

      addTask: (task) =>
        set((s) => ({ tasks: [...s.tasks, task] })),

      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) => t.id === id ? { ...t, ...patch } : t),
        })),
    }),
    {
      name: 'scrumban_tasks_mock',
    },
  ),
);
