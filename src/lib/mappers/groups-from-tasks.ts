/**
 * Adaptador backend → visualizacao de Grupos (novo conceito de Blocos).
 *
 * Converte os dados reais do backend (Blocos + Tasks + Membros) no shape
 * que a `GroupsView` ja sabe desenhar (`GroupsBoard`). Cada
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
  FieldValue,
  GroupsBoard,
  GroupModel,
  TaskModel,
} from "@/lib/types/table-fields";
import type {
  BlockDto,
  TableColumnDto,
  TableFieldsDto,
  TaskResponseDto,
  V3Intention,
} from "@/lib/types/api";

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
 *
 * Exportada para reutilizacao na sub-tabela de subtarefas (`SubtaskTable`).
 */
export const STATUS_OPTIONS: ColumnOption[] = (
  ["backlog", "ready", "em-progresso", "concluido", "falhou"] as const
).map((id) => {
  const cfg = getColumnConfig(id);
  return { id, label: cfg?.label ?? id, color: cfg?.color ?? SEM_BLOCO_COR };
});

/**
 * Opcoes de prioridade para a pill colorida.
 *
 * Exportada para reutilizacao na sub-tabela de subtarefas (`SubtaskTable`).
 */
export const PRIORITY_OPTIONS: ColumnOption[] = (
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

const TIME_SPENT_COLUMN_KEY = "timeSpent";

const TIME_SPENT_COLUMN: ColumnDef = {
  key: TIME_SPENT_COLUMN_KEY,
  type: "text",
  label: "Tempo",
  order: 6,
  readOnly: true,
};

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
  TIME_SPENT_COLUMN,
];

/* ─── Mapeamento de uma task ─────────────────────────────────────────────── */

/**
 * Converte um `TaskResponseDto` numa linha (`TaskModel`) com os valores das
 * colunas fixas preenchidos. Inclui `childCount` para pai com subtarefas.
 *
 * IDs de pessoa são resolvidos para userId (a resolução userId → nome para
 * exibição acontece depois na célula `FieldCell`).
 *
 * @param task - DTO da task do backend.
 * @param childCountMap - Mapa de contagem de filhas por ID de pai (calculado
 *   antes do filtro de raízes; contém **todas** as tasks, incluindo filhas).
 * @returns TaskModel com campos mapeados e `childCount` preenchido se o pai tiver filhas.
 */
function taskToRow(
  task: TaskResponseDto,
  childCountMap: Map<string, number>,
): TaskModel {
  const statusColId = intentionToColumn(task.status as V3Intention);

  // Valores das colunas customizaveis vivem em `task.dados.fields` chaveados
  // por `column.key`. Espalhados PRIMEIRO para que os 6 builtin abaixo sempre
  // prevalecam em caso de colisao de chave.
  const customFields =
    task.dados && typeof task.dados === "object" && "fields" in task.dados
      ? ((task.dados as { fields?: Record<string, FieldValue> }).fields ?? {})
      : {};

  return {
    id: task.id,
    nome: task.nome,
    idPai: task.idPai ?? null,
    childCount: childCountMap.get(task.id) ?? 0,
    // `true` quando o backend entregou em timeSpentLabel a SOMA das filhas
    // (rollup on-read). Alimenta o badge "soma das subtarefas" na celula Tempo.
    timeSpentIsRollup: task.timeSpentIsRollup ?? false,
    // Campos crus necessarios para o gatilho de execucao da IA na celula Nome
    // (paridade com a Lista): projeto p/ disparar, status V3 p/ detectar
    // terminal, e a execucao ativa p/ travar a linha e mostrar o badge.
    projectId: task.projectId,
    statusV3: task.status ?? null,
    activeExecution: task.activeExecution
      ? {
          id: task.activeExecution.id,
          status: task.activeExecution.status,
          riskLevel: task.activeExecution.riskLevel,
        }
      : null,
    fields: {
      ...customFields,
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
      // Coluna builtin read-only "Tempo gasto" (Fase 3 / ADR-V2-057): o valor
      // vem PRONTO do backend (timeSpentLabel, agregado server-side de TODOS os
      // usuarios). O front NUNCA soma: apenas exibe. Fallback "—" para legados.
      timeSpent: task.timeSpentLabel ?? "—",
    },
  };
}

/* ─── Colunas customizaveis (tableFields) ────────────────────────────────── */

/** Config local usada quando um backend legado ainda nao envia options das fixas. */
function builtinConfigFallback(key: string): ColumnDef["config"] | undefined {
  if (key === "status") return { options: STATUS_OPTIONS };
  if (key === "prioridade") return { options: PRIORITY_OPTIONS };
  return undefined;
}

/**
 * Converte uma coluna do contrato `tableFields` (`TableColumnDto`) na
 * `ColumnDef` que a `GroupsView` desenha.
 *
 * Compatibilidade visual da Fase 3: a `GroupsView` atual trata `builtin:true`
 * como "coluna de titulo". Por isso apenas `__nome` recebe esse flag no view
 * model; as demais fixas mantem `builtin` ausente, igual ao desenho anterior.
 * Colunas custom continuam com `builtin:false` para rename/remove.
 */
function tableColumnToColumnDef(col: TableColumnDto): ColumnDef {
  const builtinFlag =
    col.builtin === true || col.key === TIME_SPENT_COLUMN_KEY
      ? col.key === "__nome"
        ? { builtin: true }
        : {}
      : { builtin: false };

  return {
    key: col.key,
    type: col.type,
    label: col.label,
    order: col.order,
    required: col.required,
    config: col.config ?? builtinConfigFallback(col.key),
    ...builtinFlag,
    // Propaga o flag read-only (ex.: timeSpent — Fase 3 / ADR-V2-057) para a
    // GroupsView travar o editor inline da celula.
    ...(col.readOnly === true || col.key === TIME_SPENT_COLUMN_KEY
      ? { readOnly: true }
      : {}),
    // Propaga hidden (arquivada) para que o board possa filtrar antes de exibir.
    ...(col.hidden ? { hidden: true } : {}),
  };
}

function ensureTimeSpentColumn(columns: ColumnDef[]): ColumnDef[] {
  if (columns.some((col) => col.key === TIME_SPENT_COLUMN_KEY)) return columns;

  const lastOrder = columns.reduce((max, col) => Math.max(max, col.order), -1);
  return [...columns, { ...TIME_SPENT_COLUMN, order: lastOrder + 1 }];
}

/* ─── Montagem do board ──────────────────────────────────────────────────── */

/**
 * Monta o `GroupsBoard` a partir dos dados reais do backend.
 *
 * **Filtragem de subtarefas:** Tarefas com `idPai` (subtarefas) são removidas
 * das linhas raiz do board — elas aparecem em sub-tabelas expansíveis inline
 * ao lado do pai, seguindo o padrão Monday.com. Esta função calcula
 * `childCount` para cada pai (número de filhas diretas) e usa isso para
 * montar o contador visível quando o pai está recolhido.
 *
 * Os valores dos campos ficam canônicos (ex: `responsavel` = userId;
 * `prioridade` = LOW/MEDIUM/...). A resolução userId → nome para exibição
 * acontece na célula (`FieldCell`), que recebe a lista de membros.
 *
 * @param blocks - Blocos do projeto (DTask idClasse=-200).
 * @param tasks - Todas as tasks do projeto (sem os próprios blocos).
 *   Inclui raízes E subtarefas; a função filtra as subtarefas internamente.
 * @param tableFields - Schema de colunas customizáveis da Lista
 *   (`DProject.tableFields` — ADR-V2-055). Quando `null`/ausente, o board usa
 *   apenas as 6 colunas builtin (comportamento idêntico ao anterior).
 * @returns Board pronto para a `GroupsView` renderizar com subtarefas
 *   expandíveis no modo backend.
 *
 * @example
 * const { blocks, tasks } = await fetchProjectData(projectId);
 * const board = buildGroupsBoard(blocks, tasks, project.tableFields);
 * // Resultado: tasks com idPai ausentes das linhas raiz; childCount preenchido;
 * // colunas vindas de tableFields (ordenadas por `order`).
 */
/**
 * Ordena tasks dentro de um bloco respeitando `dados.ordem` (reordenacao manual
 * por drag). Tasks com `ordem` numerica vem primeiro, na ordem definida pelo
 * usuario; tasks sem `ordem` (ex: recem-criadas num bloco ja reordenado) caem no
 * fim, ordenadas por `chave` crescente — mesmo principio dos blocos. Sem nenhuma
 * `ordem` definida, o resultado e identico ao comportamento anterior (por id).
 */
function compareTaskOrder(a: TaskResponseDto, b: TaskResponseDto): number {
  const oa = typeof a.dados?.ordem === "number" ? a.dados.ordem : null;
  const ob = typeof b.dados?.ordem === "number" ? b.dados.ordem : null;
  if (oa !== null && ob !== null) return oa - ob;
  if (oa !== null) return -1; // a tem ordem → vem antes das sem ordem
  if (ob !== null) return 1;
  // Nenhuma tem ordem: fallback por chave crescente (mais antiga primeiro).
  if (BigInt(a.id) < BigInt(b.id)) return -1;
  if (BigInt(a.id) > BigInt(b.id)) return 1;
  return 0;
}

export function buildGroupsBoard(
  blocks: BlockDto[],
  tasks: TaskResponseDto[],
  tableFields?: TableFieldsDto | null,
): GroupsBoard {
  // 1. Calcular contagem de filhas por pai ANTES de qualquer filtro —
  //    o mapa precisa contar todas as tasks, incluindo as filhas.
  const childCountMap = new Map<string, number>();
  for (const task of tasks) {
    if (task.idPai) {
      childCountMap.set(task.idPai, (childCountMap.get(task.idPai) ?? 0) + 1);
    }
  }

  // 2. Filtrar apenas tasks raiz (sem pai) para as linhas do board.
  //    Filhas nao devem aparecer como linhas independentes nos grupos —
  //    elas sao exibidas na sub-tabela embutida ao expandir o pai.
  //    Ordena por `chave` crescente (mais antiga primeiro) para que uma
  //    tarefa recem-criada apareca SEMPRE no fim do bloco — mesmo conceito
  //    aplicado aos blocos. O backend devolve por chave desc (nova no topo).
  const rootTasks = tasks
    .filter((t) => !t.idPai)
    .sort((a, b) => {
      if (BigInt(a.id) < BigInt(b.id)) return -1;
      if (BigInt(a.id) > BigInt(b.id)) return 1;
      return 0;
    });

  // 3. Indexa tasks raiz por idBloco; o restante vai para "sem bloco".
  //    Tasks cujo idBloco aponta para um bloco inexistente (ex: bloco recem
  //    excluido) sao tratadas como orfas → caem em "Sem bloco" em vez de
  //    sumirem da view (o cascade do backend opera em idPai, nao em idBloco).
  const validBlockIds = new Set(blocks.map((b) => b.id));
  const byBlock = new Map<string, TaskResponseDto[]>();
  const semBloco: TaskResponseDto[] = [];

  for (const task of rootTasks) {
    const idBloco =
      typeof task.dados?.idBloco === "string" ? task.dados.idBloco : null;
    if (idBloco && validBlockIds.has(idBloco)) {
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
    tasks: (byBlock.get(block.id) ?? [])
      .slice()
      .sort(compareTaskOrder)
      .map((t) => taskToRow(t, childCountMap)),
  }));

  // Grupo "Sem bloco" no fim — so aparece se houver tasks orfas.
  if (semBloco.length > 0) {
    groups.push({
      id: SEM_BLOCO_ID,
      nome: "Sem bloco",
      cor: SEM_BLOCO_COR,
      tasks: semBloco
        .slice()
        .sort(compareTaskOrder)
        .map((t) => taskToRow(t, childCountMap)),
    });
  }

  // Desde ADR-V2-056, `tableFields` e a fonte unica das colunas da Lista.
  // O fallback preserva o comportamento anterior quando o backend ainda nao
  // devolve schema algum.
  // Colunas arquivadas (hidden:true) sao removidas da visualizacao do board
  // mas permanecem no `tableFields` persistido — o dado nao e perdido.
  const tableFieldColumns = tableFields?.columns ?? [];
  const columns = ensureTimeSpentColumn(
    tableFieldColumns.length > 0
      ? tableFieldColumns
          .map(tableColumnToColumnDef)
          .filter((c) => !c.hidden)
          .sort((a, b) => a.order - b.order)
      : BACKEND_COLUMNS,
  );

  return { columns, groups };
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

/** Formata "21 mai - 3 jun" a partir das datas ISO do bloco (se houver). */
function formatPeriodo(start?: string, end?: string): string | undefined {
  if (!start && !end) return undefined;
  const fmt = (iso: string) =>
    new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
    });
  if (start && end) return `${fmt(start)} - ${fmt(end)}`;
  return fmt((start ?? end) as string);
}
