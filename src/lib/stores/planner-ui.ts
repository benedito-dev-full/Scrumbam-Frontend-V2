import { create } from "zustand";

/**
 * Store de UI local do Planner.
 *
 * Compartilhado entre `PlannerPanel` (sidebar) e `PlannerPage` (calendario):
 * o painel dispara as acoes (colapsar sidebar, abrir busca, abrir modal de
 * novo evento) e a pagina renderiza os componentes correspondentes.
 *
 * Distinto de `planner-prefs.ts`, que persiste preferencias do usuario
 * (view, dia inicial da semana, etc). Este store eh efemero — reinicia
 * a cada navegacao para `/planner`.
 */
interface PlannerUIState {
  sidebarCollapsed: boolean;
  searchOpen: boolean;
  createEventOpen: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setCreateEventOpen: (open: boolean) => void;
}

export const usePlannerUIStore = create<PlannerUIState>((set) => ({
  sidebarCollapsed: false,
  searchOpen: false,
  createEventOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setCreateEventOpen: (open) => set({ createEventOpen: open }),
}));
