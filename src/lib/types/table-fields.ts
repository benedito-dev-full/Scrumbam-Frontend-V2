/**
 * Tipos consumidos pela visualizacao de Blocos.
 *
 * Estes shapes espelham o contrato `tableFields.columns[]`/`dados.fields`
 * usado pelo backend, sem store localStorage ou dados de exemplo.
 */

export type ColumnType =
  | "text"
  | "number"
  | "date"
  | "person"
  | "status"
  | "checkbox"
  | "dropdown"
  | "link";

/** Rotulo PT-BR de cada tipo, usado no menu "Nova coluna". */
export const COLUMN_TYPE_LABEL: Record<ColumnType, string> = {
  text: "Texto",
  number: "Número",
  date: "Data",
  person: "Pessoa",
  status: "Status",
  checkbox: "Checkbox",
  dropdown: "Lista suspensa",
  link: "Link / URL",
};

/** Opcao de status/dropdown (config.options do contrato). */
export interface ColumnOption {
  id: string;
  label: string;
  color?: string;
}

export interface ColumnConfig {
  /** number: moeda */
  currency?: "BRL" | "USD";
  /** number: casas decimais */
  decimals?: number;
  /** text: tamanho maximo */
  maxLength?: number;
  /** status/dropdown: opcoes */
  options?: ColumnOption[];
}

/** Definicao de uma coluna, espelha tableFields.columns[]. */
export interface ColumnDef {
  key: string;
  type: ColumnType;
  label: string;
  order: number;
  required?: boolean;
  config?: ColumnConfig;
  /** Coluna interna fixa (Tarefa), nao editavel/removivel. */
  builtin?: boolean;
  /**
   * Coluna builtin READ-ONLY computada server-side (ex.: "Tempo gasto").
   * A celula apenas EXIBE o valor; clicar NAO abre editor inline nem grava.
   * Fase 3 / ADR-V2-057.
   */
  readOnly?: boolean;
  /**
   * Coluna arquivada (oculta na grade de forma reversivel). Quando true, a
   * coluna nao aparece no board mas permanece no schema e pode ser restaurada.
   * Aplica-se a builtin (somente ocultar, nunca remover) e custom.
   */
  hidden?: boolean;
}

/** Valor de campo custom, espelha o que trafega em dados.fields. */
export type FieldValue = string | number | boolean | null;

/**
 * Linha renderizada na aba Blocos. `fields` corresponde a dados.fields do
 * contrato, acrescido dos campos builtin mapeados do DTO de task.
 */
export interface TaskModel {
  id: string;
  nome: string;
  /** valores das colunas custom, chaveados por column.key */
  fields: Record<string, FieldValue>;
  /** Presenca de idPai indica que esta task e filha. */
  idPai?: string | null;
  /** Numero de filhas diretas conhecidas no momento do fetch. */
  childCount?: number;
  /**
   * `true` quando o `timeSpent` exibido e a SOMA do tempo das filhas diretas
   * (rollup server-side), e nao o tempo proprio da task. Alimenta o badge de
   * "soma das subtarefas" na celula de Tempo.
   */
  timeSpentIsRollup?: boolean;
  /** ID do projeto da task — necessario para disparar a execucao via IA. */
  projectId?: string;
  /**
   * Estado V3 cru da task (ex.: "EXECUTING", "DONE"). Usado para detectar
   * estado terminal (DONE/FAILED) e suprimir o gatilho de execucao da IA.
   */
  statusV3?: string | null;
  /**
   * Execucao de IA em andamento (espelha `TaskResponseDto.activeExecution`).
   * Quando presente e a task nao esta em estado terminal, a linha fica
   * read-only e exibe o badge de lock no lugar do botao "Executar".
   */
  activeExecution?: TaskActiveExecution | null;
}

/**
 * Recorte minimo da execucao de IA ativa carregado no `TaskModel` da view de
 * Blocos. Espelha os campos de `ActiveExecutionDto` que a UI consome para
 * decidir lock/badge. Mantido local para nao acoplar tipos de API a esta view.
 */
export interface TaskActiveExecution {
  id: string;
  status: "queued" | "running" | "awaiting_approval";
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

/** Grupo/bloco da visualizacao. */
export interface GroupModel {
  id: string;
  nome: string;
  /** cor do accent do grupo */
  cor: string;
  periodo?: string;
  tasks: TaskModel[];
}

/** Documento completo da view de uma lista. */
export interface GroupsBoard {
  columns: ColumnDef[];
  groups: GroupModel[];
}
