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

export function makeColumnKey(label: string, existingKeys: Iterable<string>): string {
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
    key: makeColumnKey(nextLabel, schema.columns.map((column) => column.key)),
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
    columns: schema.columns.filter((column) => column.key !== key || column.builtin),
  });
}

export function applyReorderColumns(
  tableFields: TableFieldsDto | null | undefined,
  orderedKeys: string[],
): TableFieldsDto {
  const schema = toSchema(tableFields);
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
