import { create } from "zustand";

/**
 * Controla o overlay de carregamento da ÁREA DE CONTEÚDO (tudo abaixo da
 * topbar). Acionado em duas situações:
 *  - troca de aba/rota (ver `NavigationLoader`)
 *  - refresh do conteúdo (botão da topbar → `invalidateQueries`)
 *
 * A topbar permanece sempre visível e interativa.
 */
type ContentLoadingState = {
  visible: boolean;
  show: () => void;
  hide: () => void;
};

export const useContentLoadingStore = create<ContentLoadingState>((set) => ({
  visible: false,
  show: () => set({ visible: true }),
  hide: () => set({ visible: false }),
}));
