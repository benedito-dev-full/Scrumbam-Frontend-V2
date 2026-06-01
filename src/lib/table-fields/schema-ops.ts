import type {
  TableColumnDto,
  TableColumnOptionDto,
  TableColumnType,
  TableFieldsDto,
} from "@/lib/types/api";

const DEFAULT_OPTIONS: TableColumnOptionDto[] = [
  { id: "opt_1", label: "Opção 1", color: "#7c5cff" },
  { id: "opt_2", label: "Opção 2", color: "#22c55e" },
];

function normalizeLabel(input: string): string {
  return input.trim();
}

function slugifyKeyStem(label: string): string {
  const stem = normalizeLabel(label)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");

  if (stem.length >= 2) return stem;
  if (stem.length === 1) return `${stem}x`;
  return "campo";
}

function isSelectableType(type: TableColumnType): boolean {
  return type === "status" || type === "dropdown";
}

function cloneDefaultOptions(): TableColumnOptionDto[] {
  return DEFAULT_OPTIONS.map((option) => ({ ...option }));
}

function ensureSelectableConfig(column: TableColumnDto): TableColumnDto {
  if (!isSelectableType(column.type)) return column;

  const options = column.config?.options ?? [];
  return {
    ...column,
    config: {
      ...column.config,
      options: options.length > 0 ? options : cloneDefaultOptions(),
    },
  };
}

function normalizeSchema(schema: TableFieldsDto): TableFieldsDto {
  const columns = schema.columns
    .map(ensureSelectableConfig)
    .map((column, index) => ({ column, index }))
    .sort((a, b) => a.column.order - b.column.order || a.index - b.index)
    .map(({ column }, order) => ({ ...column, order }));

  return {
    version: schema.version || 1,
    columns,
  };
}

function toSchema(tableFields?: TableFieldsDto | null): TableFieldsDto {
  return normalizeSchema(tableFields ?? { version: 1, columns: [] });
}

/**
 * Gera um ID de opção único (`opt_<n>`) que não colide com os já existentes.
 * Usado ao adicionar uma nova opção numa coluna `status`/`dropdown` pela UI.
 */
export function makeOptionId(existingIds: Iterable<string>): string {
  const existing = new Set(existingIds);
  let suffix = 1;
  let id = `opt_${suffix}`;

  while (existing.has(id)) {
    suffix += 1;
    id = `opt_${suffix}`;
  }

  return id;
}

export function makeColumnKey(
  label: string,
  existingKeys: Iterable<string>,
): string {
  const existing = new Set(existingKeys);
  const stem = slugifyKeyStem(label);
  let key = `f_${stem}`;
  let suffix = 2;

  while (existing.has(key)) {
    key = `f_${stem}${suffix}`;
    suffix += 1;
  }

  return key;
}

export function applyAddColumn(
  tableFields: TableFieldsDto | null | undefined,
  type: TableColumnType,
  label: string,
): TableFieldsDto {
  const schema = toSchema(tableFields);
  const nextLabel = normalizeLabel(label) || "Nova coluna";
  const nextColumn: TableColumnDto = {
    key: makeColumnKey(
      nextLabel,
      schema.columns.map((column) => column.key),
    ),
    type,
    label: nextLabel,
    order: schema.columns.length,
    ...(isSelectableType(type)
      ? { config: { options: cloneDefaultOptions() } }
      : {}),
  };

  return normalizeSchema({
    version: schema.version,
    columns: [...schema.columns, nextColumn],
  });
}

export function applyRenameColumn(
  tableFields: TableFieldsDto | null | undefined,
  key: string,
  label: string,
): TableFieldsDto {
  const schema = toSchema(tableFields);

  return normalizeSchema({
    version: schema.version,
    columns: schema.columns.map((column) =>
      column.key === key
        ? { ...column, label: normalizeLabel(label) || column.label }
        : column,
    ),
  });
}

export function applyRemoveColumn(
  tableFields: TableFieldsDto | null | undefined,
  key: string,
): TableFieldsDto {
  const schema = toSchema(tableFields);

  return normalizeSchema({
    version: schema.version,
    columns: schema.columns.filter(
      (column) => column.key !== key || column.builtin,
    ),
  });
}

export function applySetColumnHidden(
  tableFields: TableFieldsDto | null | undefined,
  key: string,
  hidden: boolean,
): TableFieldsDto {
  const schema = toSchema(tableFields);

  return normalizeSchema({
    version: schema.version,
    columns: schema.columns.map((column) =>
      column.key === key ? { ...column, hidden } : column,
    ),
  });
}

/**
 * Substitui as opções de uma coluna `status`/`dropdown`. Recebe a lista
 * completa já editada (UI envia o estado final). Filtra opções sem `label`
 * (vazias) e garante que sobre ao menos uma — colunas selecionáveis sem
 * opção quebram o contrato do backend. Para colunas não-selecionáveis, é
 * no-op.
 */
export function applyUpdateColumnOptions(
  tableFields: TableFieldsDto | null | undefined,
  key: string,
  options: TableColumnOptionDto[],
): TableFieldsDto {
  const schema = toSchema(tableFields);

  const cleaned = options
    .map((option) => ({
      ...option,
      label: normalizeLabel(option.label),
    }))
    .filter((option) => option.label.length > 0);

  return normalizeSchema({
    version: schema.version,
    columns: schema.columns.map((column) => {
      if (column.key !== key || !isSelectableType(column.type)) return column;
      // Nunca deixar a coluna sem nenhuma opção (cairia no default ao
      // recarregar via ensureSelectableConfig — confuso para o usuário).
      const next = cleaned.length > 0 ? cleaned : cloneDefaultOptions();
      return { ...column, config: { ...column.config, options: next } };
    }),
  });
}

export function applyReorderColumns(
  tableFields: TableFieldsDto | null | undefined,
  orderedKeys: string[],
): TableFieldsDto {
  // NAO usar toSchema/normalizeSchema aqui: ambos re-sortam por `column.order`
  // (o ANTIGO), o que embaralharia a base ANTES de aplicar a nova ordem e
  // desfaria o reorder (bug que reaparecia com fixas+custom materializadas).
  // O `rank` por key define a ordem sozinho — partimos das colunas como estao.
  const schema: TableFieldsDto = tableFields ?? { version: 1, columns: [] };
  // `orderedKeys` representa a ordem completa enviada pela tabela (builtin +
  // custom). Chaves ausentes/desconhecidas ficam em ordem estavel ao final.
  const rank = new Map(orderedKeys.map((key, index) => [key, index]));

  const columns = schema.columns
    .map((column, index) => ({ column, index }))
    .sort((a, b) => {
      const aRank = rank.get(a.column.key);
      const bRank = rank.get(b.column.key);

      if (aRank !== undefined && bRank !== undefined) return aRank - bRank;
      if (aRank !== undefined) return -1;
      if (bRank !== undefined) return 1;
      return a.column.order - b.column.order || a.index - b.index;
    })
    // Renumera `order` pela posicao JA reordenada — NAO passar por
    // normalizeSchema aqui: ele re-sorta por `column.order` (ainda o antigo),
    // o que desfaria a reordenacao recem-feita. A ordem final e a do array.
    .map(({ column }, order) => ensureSelectableConfig({ ...column, order }));

  return { version: schema.version || 1, columns };
}
