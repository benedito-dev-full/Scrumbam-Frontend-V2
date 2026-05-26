import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Threshold de prioridade da secao "Prioridades" do PlannerPanel.
 *
 *  - "urgent": apenas URGENT
 *  - "high":   URGENT + HIGH
 *  - "medium": URGENT + HIGH + MEDIUM
 *  - "low":    URGENT + HIGH + MEDIUM + LOW (todas as priorizadas)
 *
 * Lista resultante eh plana, ordenada por prioridade desc + dueDate.
 */
export type PriorityThreshold = "urgent" | "high" | "medium" | "low";

interface PlannerPrefsState {
  priorityThreshold: PriorityThreshold;
  setPriorityThreshold: (threshold: PriorityThreshold) => void;
}

/**
 * Preferencias persistidas do PlannerPanel.
 *
 * Atualmente guarda apenas o threshold de prioridade — o objetivo eh
 * concentrar futuras flags do painel (ordenacao, agrupamentos) aqui em
 * vez de espalhar `useState` + `localStorage` ad-hoc.
 */
export const usePlannerPrefs = create<PlannerPrefsState>()(
  persist(
    (set) => ({
      priorityThreshold: "high",
      setPriorityThreshold: (priorityThreshold) => set({ priorityThreshold }),
    }),
    {
      name: "scrumbam:planner-prefs",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
