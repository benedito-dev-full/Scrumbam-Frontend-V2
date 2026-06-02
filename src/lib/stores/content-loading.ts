import { create } from "zustand";

/**
 * Controla o overlay de carregamento da ÁREA DE CONTEÚDO (tudo abaixo da
 * topbar). A topbar permanece sempre visível e interativa.
 *
 * Acionado APENAS quando há carregamento real:
 *  - `GlobalLoadingTrigger`: auto-mostra quando uma query em primeira carga
 *    passa de ~400ms (ignora navegação rápida / refetch de fundo).
 *  - refresh do conteúdo (botão da topbar → `invalidateQueries`).
 *
 * NÃO usar em navegação instantânea (dados em cache). Para um carregamento
 * pontual, chame `show()/hide()` ao redor da operação.
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
