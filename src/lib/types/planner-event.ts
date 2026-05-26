/**
 * Cor visual de um evento no Planner.
 *
 * Mapeada para classes Tailwind nos componentes de view. Mantemos uma
 * paleta fechada para evitar criatividade descontrolada — se for ampliar,
 * atualize tambem o mapa de cores em `_components/event-block.tsx`.
 */
export type PlannerEventColor =
  | "blue"
  | "violet"
  | "emerald"
  | "amber"
  | "rose"
  | "slate";

/**
 * Evento individual exibido no Planner.
 *
 * `start`/`end` sao ISO strings (timezone do servidor; conversao para
 * America/Sao_Paulo eh feita no momento do render). Eventos `allDay`
 * ignoram a parte de hora e aparecem na faixa "O dia todo" das views
 * Dia/Semana e como pilula na MonthView.
 */
export interface PlannerEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  color: PlannerEventColor;
  allDay?: boolean;
  /** Origem do bloco — futuro link com Tarefa/Sprint/Doc */
  source?: "manual" | "task" | "sprint";
}

/**
 * Modo de visualizacao do Planner.
 *
 * Define tanto o layout quanto o passo de navegacao (prev/next) e o
 * formato do label do periodo na toolbar.
 */
export type PlannerView = "day" | "week" | "month";
