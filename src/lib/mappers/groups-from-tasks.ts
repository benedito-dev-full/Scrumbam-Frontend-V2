/**
 * Adaptador backend → visualizacao de Grupos (novo conceito de Blocos).
 *
 * Converte os dados reais do backend (Blocos + Tasks + Membros) no shape
 * que a `GroupsView` ja sabe desenhar (`GroupsBoard` da groups-store). Cada
 * Bloco (DTask idClasse=-200) vira um grupo; as tasks sao distribuidas pelo
 * `dados.idBloco`; tasks sem bloco caem num grupo "Sem bloco" no fim.
 *
 * Esta v1 e SOMENTE LEITURA — nao mexe em colunas customizaveis
 * (`dados.fields`). As colunas sao fixas e derivadas de campos que o
 * `TaskResponseDto` ja traz: nome, status V3, identifier, assignee,
 * priority e dueDate.
 *
 * @see docs/contrato-colunas-customizaveis-v1.md (colunas custom — fase futura)
 */

import {
  intentionToColumn,
  getColumnConfig,
  priorityToLabel,
  priorityToColor,
} from "@/lib/mappers/task-status.mapper";
import type {
  ColumnDef,
  ColumnOption,
  GroupsBoard,
  GroupModel,
  TaskModel,
} from "@/lib/prototype/groups-store";
import type { BlockDto, TaskResponseDto, V3Intention } from "@/lib/types/api";

/* ─── Membros (para resolver o nome do responsavel) ──────────────────────── */

/** Recorte minimo de membro do projeto usado para exibir o responsavel. */
export interface MemberLike {
  userId: string;
  nome: string;
}

/* ─── Cor padrao do grupo "Sem bloco" e fallback de blocos ───────────────── */

const SEM_BLOCO_COR = "#6b7280";
const BLOCO_COR_FALLBACK = "#7c5cff";

/**
 * ID sintetico do grupo "Sem bloco" — nao corresponde a um Bloco real no
 * backend. A UI usa este id para saber que "Adicionar tarefa" ali deve
 * criar uma task SEM `dados.idBloco`.
 */
export const SEM_BLOCO_ID = "__sem_bloco";

/* ─── Colunas fixas da v1 (sem colunas custom) ───────────────────────────── */

/**
 * Opcoes de status para a pill colorida — espelham as 5 colunas Kanban
 * canonicas (task-status.mapper). O `id` da opcao e o id da coluna Kanban
 * (ex: "em-progresso"), e e isso que cada task guarda em `fields.status`.
 */
const STATUS_OPTIONS: ColumnOption[] = (
  ["backlog", "ready", "em-progresso", "concluido", "falhou"] as const
).map((id) => {
  const cfg = getColumnConfig(id);
  return { id, label: cfg?.label ?? id, color: cfg?.color ?? SEM_BLOCO_COR };
});

const PRIORITY_OPTIONS: ColumnOption[] = (
  ["LOW", "MEDIUM", "HIGH", "URGENT"] as const
).map((p) => ({
  id: p,
  label: priorityToLabel(p),
  color: priorityToColor(p),
}));

/**
 * Estado V3 canonico enviado ao backend ao escolher cada pilula visual.
 * Decisao de produto (passo 2): as 5 pilulas mapeiam 1:1 para um estado
 * canonico. "Concluido" achata DONE/VALIDATED/CANCELLED/DISCARDED em DONE,
 * por isso a edicao so dispara quando o usuario TROCA de pilula (ver
 * `groups-view`), preservando a distincao fina quando ele nao mexe.
 */
export const PILL_TO_V3: Record<string, V3Intention> = {
  backlog: "INBOX",
  ready: "READY",
  "em-progresso": "EXECUTING",
  concluido: "DONE",
  falhou: "FAILED",
};

/** Estado V3 terminal — nao pode mudar (backend recusa). UI trava a pilula. */
export const V3_TERMINAL_VALIDATED: V3Intention = "VALIDATED";

/** Chave interna que carrega o estado V3 cru da task (para regras de status). */
export const STATUS_V3_KEY = "__statusV3";

/** Definicao das colunas fixas exibidas na v1 read-only. */
export const BACKEND_COLUMNS: ColumnDef[] = [
  { key: "__nome", type: "text", label: "Tarefa", order: 0, builtin: true },
  {
    key: "status",
    type: "status",
    label: "Status",
    order: 1,
    config: { options: STATUS_OPTIONS },
  },
  { key: "identifier", type: "text", label: "ID da tarefa", order: 2 },
  { key: "responsavel", type: "person", label: "Resp.", order: 3 },
  {
    key: "prioridade",
    type: "dropdown",
    label: "Prioridade",
    order: 4,
    config: { options: PRIORITY_OPTIONS },
  },
  { key: "dueDate", type: "date", label: "Data", order: 5 },
];

/* ─── Mapeamento de uma task ─────────────────────────────────────────────── */

/**
 * Converte um `TaskResponseDto` numa linha (`TaskModel`) com os valores das
 * colunas fixas preenchidos. IDs de pessoa sao resolvidos para o nome do
 * membro quando disponivel (senao caem no proprio id).
 */
function taskToRow(task: TaskResponseDto): TaskModel {
  const statusColId = intentionToColumn(task.status as V3Intention);

  return {
    id: task.id,
    nome: task.nome,
    fields: {
      status: statusColId,
      // Estado V3 cru — usado pela celula de status para detectar VALIDATED
      // (terminal) e aplicar a regra "nao mexer se mesma pilula".
      [STATUS_V3_KEY]: task.status ?? null,
      identifier: task.identifier ?? null,
      // `person` guarda o userId canonico (string). A celula resolve
      // userId → nome via lista de membros para exibir, e a edicao manda
      // o userId direto — espelha o contrato real de coluna `person`.
      responsavel: task.assigneeId ?? null,
      prioridade: task.priority ?? null,
      dueDate: task.dueDate ?? null,
    },
  };
}

/* ─── Montagem do board ──────────────────────────────────────────────────── */

/**
 * Monta o `GroupsBoard` a partir dos dados reais do backend.
 *
 * Os valores ficam canonicos (ex: `responsavel` = userId; `prioridade` =
 * LOW/MEDIUM/...). A resolucao userId → nome para exibicao acontece na
 * celula (`FieldCell`), que recebe a lista de membros.
 *
 * @param blocks - Blocos do projeto (DTask idClasse=-200).
 * @param tasks - Todas as tasks do projeto (sem os proprios blocos).
 * @returns Board pronto para a `GroupsView` renderizar.
 */
export function buildGroupsBoard(
  blocks: BlockDto[],
  tasks: TaskResponseDto[],
): GroupsBoard {
  // Indexa tasks por idBloco; o restante vai para "sem bloco".
  const byBlock = new Map<string, TaskResponseDto[]>();
  const semBloco: TaskResponseDto[] = [];

  for (const task of tasks) {
    const idBloco =
      typeof task.dados?.idBloco === "string" ? task.dados.idBloco : null;
    if (idBloco) {
      const arr = byBlock.get(idBloco) ?? [];
      arr.push(task);
      byBlock.set(idBloco, arr);
    } else {
      semBloco.push(task);
    }
  }

  const groups: GroupModel[] = blocks.map((block) => ({
    id: block.id,
    nome: block.nome,
    cor: block.dados?.cor ?? BLOCO_COR_FALLBACK,
    periodo: formatPeriodo(block.dados?.startDate, block.dados?.endDate),
    tasks: (byBlock.get(block.id) ?? []).map(taskToRow),
  }));

  // Grupo "Sem bloco" no fim — so aparece se houver tasks orfas.
  if (semBloco.length > 0) {
    groups.push({
      id: SEM_BLOCO_ID,
      nome: "Sem bloco",
      cor: SEM_BLOCO_COR,
      tasks: semBloco.map(taskToRow),
    });
  }

  return { columns: BACKEND_COLUMNS, groups };
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

/** Formata "21 mai - 3 jun" a partir das datas ISO do bloco (se houver). */
function formatPeriodo(
  start?: string,
  end?: string,
): string | undefined {
  if (!start && !end) return undefined;
  const fmt = (iso: string) =>
    new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
    });
  if (start && end) return `${fmt(start)} - ${fmt(end)}`;
  return fmt((start ?? end) as string);
}
