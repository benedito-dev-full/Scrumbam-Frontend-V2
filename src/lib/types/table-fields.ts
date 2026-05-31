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
