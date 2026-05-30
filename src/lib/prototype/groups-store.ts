"use client";

import { useSyncExternalStore } from "react";

/**
 * Store de prototipagem da visualizacao de Grupos (estilo Monday).
 *
 * Persiste em localStorage e ESPELHA o contrato do backend
 * (`docs/contrato-colunas-customizaveis-v1.md`):
 *  - Definicao das colunas → `tableFields.columns[]` (key/type/label/order/...)
 *  - Valores por task       → `dados.fields{}` chaveado por `column.key`
 *
 * Quando integrarmos, esta store some e os mesmos tipos saem do backend.
 * Por isso os nomes/formatos seguem o contrato de proposito.
 */

/* ─── Tipos do contrato (8 tipos de coluna v1) ───────────────────────────── */

export type ColumnType =
  | "text"
  | "number"
  | "date"
  | "person"
  | "status"
  | "checkbox"
  | "dropdown"
  | "link";

/** Rotulo PT-BR de cada tipo — usado no menu "Nova coluna". */
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

/** Definicao de uma coluna — espelha tableFields.columns[]. */
export interface ColumnDef {
  key: string;
  type: ColumnType;
  label: string;
  order: number;
  required?: boolean;
  config?: ColumnConfig;
  /** Coluna interna fixa (Tarefa) — nao editavel/removivel. */
  builtin?: boolean;
}

/** Valor de campo custom — espelha o que trafega em dados.fields. */
export type FieldValue = string | number | boolean | null;

/**
 * Task do prototipo — `fields` = dados.fields do contrato.
 *
 * Na aba Blocos (modo backend com integração), as subtarefas (tasks com `idPai`)
 * são renderizadas numa sub-tabela embutida expansível ao lado de cada pai,
 * seguindo o padrão Monday.com. Os campos `idPai` e `childCount` são opcionais
 * para manter compatibilidade com o modo prototipo (localStorage).
 *
 * @see buildGroupsBoard para entender como `childCount` é calculado
 * @see SubtaskTable para a visualização das subtarefas
 */
export interface TaskModel {
  id: string;
  nome: string;
  /** valores das colunas custom, chaveados por column.key */
  fields: Record<string, FieldValue>;
  /** Presenca de idPai indica que esta task e filha (usado na aba Blocos). */
  idPai?: string | null;
  /** Numero de filhas diretas conhecidas no momento do fetch (para o contador). */
  childCount?: number;
}

/** Grupo (bloco/sprint) — agrupador alto da visualizacao. */
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

/* ─── Seed inicial (= mock que ja validamos visualmente) ─────────────────── */

const SEED: GroupsBoard = {
  columns: [
    { key: "__nome", type: "text", label: "Tarefa", order: 0, builtin: true },
    { key: "responsavel", type: "person", label: "Resp.", order: 1 },
    {
      key: "status",
      type: "status",
      label: "Status",
      order: 2,
      config: {
        options: [
          { id: "em-andamento", label: "Em andamento", color: "#f5a623" },
          { id: "pronto", label: "Pronto para com...", color: "#4a8df7" },
          { id: "concluido", label: "Concluído", color: "#22c55e" },
          { id: "backlog", label: "Backlog", color: "#6b7280" },
        ],
      },
    },
    {
      key: "tipo",
      type: "dropdown",
      label: "Tipo",
      order: 3,
      config: {
        options: [
          { id: "qualidade", label: "Qualidade", color: "#e879c4" },
          { id: "funcionalidade", label: "Funcionalidade", color: "#22c55e" },
          { id: "bug", label: "Bug", color: "#ef4444" },
        ],
      },
    },
    { key: "codigo", type: "text", label: "ID da tarefa", order: 4 },
    {
      key: "sp",
      type: "number",
      label: "SP estimados",
      order: 5,
      config: { decimals: 0 },
    },
    { key: "epico", type: "dropdown", label: "Épico", order: 6, config: {
      options: [
        { id: "infraestrutura", label: "Infraestrutura", color: "#64748b" },
        { id: "produto", label: "Produto", color: "#7c5cff" },
      ],
    } },
    { key: "github", type: "link", label: "Link do GitHub", order: 7 },
  ],
  groups: [
    {
      id: "sprint-1",
      nome: "Sprint 1",
      cor: "#e0457b",
      periodo: "mai 21 - jun 3",
      tasks: [
        {
          id: "t1",
          nome: "Tarefa 1",
          fields: {
            responsavel: null,
            status: "em-andamento",
            tipo: "qualidade",
            codigo: "TMYT-001",
            sp: 3,
            epico: "infraestrutura",
            github: null,
          },
        },
        {
          id: "t2",
          nome: "Tarefa 2",
          fields: {
            responsavel: null,
            status: "pronto",
            tipo: "funcionalidade",
            codigo: "TMYT-002",
            sp: null,
            epico: null,
            github: null,
          },
        },
      ],
    },
    { id: "backlog", nome: "Backlog", cor: "#7c5cff", tasks: [] },
  ],
};

/* ─── Persistencia em localStorage + subscription ────────────────────────── */

const STORAGE_KEY = "scrumbam:prototype:groups-board:v1";

let state: GroupsBoard = SEED;
let hydrated = false;
const listeners = new Set<() => void>();

function load(): GroupsBoard {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    const parsed = JSON.parse(raw) as GroupsBoard;
    if (!parsed.columns || !parsed.groups) return SEED;
    return parsed;
  } catch {
    return SEED;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota / modo privado — ignora no prototipo */
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  if (!hydrated) {
    state = load();
    hydrated = true;
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): GroupsBoard {
  if (!hydrated && typeof window !== "undefined") {
    state = load();
    hydrated = true;
  }
  return state;
}

function getServerSnapshot(): GroupsBoard {
  return SEED;
}

/** Hook reativo: re-renderiza quando o board muda. */
export function useGroupsBoard(): GroupsBoard {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/* ─── Helpers de mutacao ─────────────────────────────────────────────────── */

function setState(next: GroupsBoard) {
  state = next;
  emit();
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Converte um label em slug estavel (key da coluna). */
function slugify(label: string): string {
  const base = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return base || uid("col");
}

export const groupsActions = {
  /* ── Grupos ── */
  renameGroup(groupId: string, nome: string) {
    setState({
      ...state,
      groups: state.groups.map((g) =>
        g.id === groupId ? { ...g, nome } : g,
      ),
    });
  },

  addGroup(nome = "Novo grupo") {
    const cores = ["#e0457b", "#7c5cff", "#22c55e", "#f5a623", "#4a8df7"];
    const cor = cores[state.groups.length % cores.length];
    setState({
      ...state,
      groups: [...state.groups, { id: uid("grp"), nome, cor, tasks: [] }],
    });
  },

  removeGroup(groupId: string) {
    setState({
      ...state,
      groups: state.groups.filter((g) => g.id !== groupId),
    });
  },

  /* ── Tarefas ── */
  addTask(groupId: string, nome = "Nova tarefa") {
    setState({
      ...state,
      groups: state.groups.map((g) =>
        g.id === groupId
          ? { ...g, tasks: [...g.tasks, { id: uid("t"), nome, fields: {} }] }
          : g,
      ),
    });
  },

  renameTask(groupId: string, taskId: string, nome: string) {
    setState({
      ...state,
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              tasks: g.tasks.map((t) =>
                t.id === taskId ? { ...t, nome } : t,
              ),
            }
          : g,
      ),
    });
  },

  removeTask(groupId: string, taskId: string) {
    setState({
      ...state,
      groups: state.groups.map((g) =>
        g.id === groupId
          ? { ...g, tasks: g.tasks.filter((t) => t.id !== taskId) }
          : g,
      ),
    });
  },

  /** Atualiza um valor de campo custom (dados.fields[key]). */
  setField(
    groupId: string,
    taskId: string,
    key: string,
    value: FieldValue,
  ) {
    setState({
      ...state,
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              tasks: g.tasks.map((t) =>
                t.id === taskId
                  ? { ...t, fields: { ...t.fields, [key]: value } }
                  : t,
              ),
            }
          : g,
      ),
    });
  },

  /* ── Colunas ── */
  addColumn(type: ColumnType, label: string) {
    const key = slugify(label);
    const order =
      state.columns.reduce((max, c) => Math.max(max, c.order), 0) + 1;
    const config: ColumnConfig | undefined =
      type === "status" || type === "dropdown"
        ? {
            options: [
              { id: "opt_1", label: "Opção 1", color: "#7c5cff" },
              { id: "opt_2", label: "Opção 2", color: "#22c55e" },
            ],
          }
        : undefined;
    setState({
      ...state,
      columns: [...state.columns, { key, type, label, order, config }],
    });
  },

  renameColumn(key: string, label: string) {
    setState({
      ...state,
      columns: state.columns.map((c) =>
        c.key === key ? { ...c, label } : c,
      ),
    });
  },

  removeColumn(key: string) {
    setState({
      ...state,
      columns: state.columns.filter((c) => c.key !== key || c.builtin),
      groups: state.groups.map((g) => ({
        ...g,
        tasks: g.tasks.map((t) => {
          const { [key]: _drop, ...rest } = t.fields;
          return { ...t, fields: rest };
        }),
      })),
    });
  },

  /** Reseta ao seed (descarta localStorage). Util no prototipo. */
  reset() {
    setState(SEED);
  },
};
