import type { ColumnDef, ColumnOption, ColumnType, FieldValue } from "@/lib/types/table-fields";
import { STATUS_OPTIONS } from "@/lib/mappers/groups-from-tasks";

/** Coluna sintetica do titulo da tarefa (builtin). Editavel no backend. */
export const NOME_KEY = "__nome";

/** Modo de exibição de subtarefas (compartilhado com a toolbar da Lista). */
export type SubtarefasMode = "recolhidas" | "expandidas" | "separar";

export type AddColumnHandler = (type: ColumnType, label: string) => void;
export type RenameColumnHandler = (key: string, label: string) => void;
export type RemoveColumnHandler = (key: string) => void;
/** Substitui as opcoes de uma coluna status/dropdown (lista completa). */
export type UpdateColumnOptionsHandler = (key: string, options: ColumnOption[]) => void;
/** Arquiva ou restaura uma coluna pelo seu key. */
export type ArchiveColumnHandler = (key: string) => void;
/** Recebe as keys custom (`f_*`) na nova ordem desejada. */
export type ReorderColumnHandler = (orderedKeys: string[]) => void;
/** Coluna arquivada exibida no menu de restauração. */
export type ArchivedColumn = { key: string; label: string };

/** Colunas editaveis no modo backend. As demais ficam read-only. */
export const BACKEND_EDITABLE_KEYS = new Set([
  "status",
  "responsavel",
  "prioridade",
  "dueDate",
]);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const noopFieldChange = (_v: FieldValue): void => {};

/**
 * Colunas fixas da sub-tabela de subtarefas (estilo Monday).
 *
 * Conjunto reduzido de 4 colunas independentes do conjunto do bloco pai:
 * Subelemento | Resp. | Status | Data. Reutiliza as opcoes de STATUS_OPTIONS
 * para manter consistencia visual com as pills do pai.
 */
export const SUBTASK_COLUMNS: ColumnDef[] = [
  {
    key: "__nome",
    type: "text",
    label: "Subelemento",
    order: 0,
    builtin: true,
  },
  { key: "responsavel", type: "person", label: "Resp.", order: 1 },
  {
    key: "status",
    type: "status",
    label: "Status",
    order: 2,
    config: { options: STATUS_OPTIONS },
  },
  { key: "dueDate", type: "date", label: "Data limite", order: 3 },
];
