"use client";

import React, { useState } from "react";
import {
  applyAddColumn,
  applyRemoveColumn,
  applyRenameColumn,
  applyReorderColumns,
  applySetColumnHidden,
  applyUpdateColumnOptions,
} from "@/lib/table-fields/schema-ops";
import {
  useBlocks,
  useTasksByProject,
  useCreateBlock,
  useCreateTask,
  useUpdateTask,
  useUpdateBlock,
  useUpdateTaskStatus,
  useDeleteTask,
} from "@/hooks/use-tasks";
import { DeleteBlockDialog } from "@/components/lists/delete-block-dialog";
import { useProjectMembers } from "@/hooks/use-members";
import { useProject, useUpdateProjectTableFields } from "@/hooks/use-projects";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { qk } from "@/lib/query-keys";
import type { BlockDto, V3Intention } from "@/lib/types/api";
import type { ColumnOption, ColumnType, FieldValue } from "@/lib/types/table-fields";
import {
  buildGroupsBoard,
  SEM_BLOCO_ID,
  PILL_TO_V3,
  type MemberLike,
} from "@/lib/mappers/groups-from-tasks";
import { applyTaskFilters, type TaskFilters } from "@/lib/filters/task-filters";

import { GroupsBoardView } from "./groups-view/board";
import {
  SelectionContext,
  SelectionActionBar,
} from "./groups-view/selection";
import {
  ID_CLASSE_LIST,
  tableFieldsErrorDescription,
  fieldErrorDescription,
  normalizeCellValue,
} from "./groups-view/errors";
import type { ArchivedColumn, SubtarefasMode } from "./groups-view/types";

/**
 * GroupsView — visualizacao de tarefas em GRUPOS (estilo Monday.com).
 *
 * Modo backend: le Blocos + Tasks + Membros reais e monta o board via
 * `buildGroupsBoard`. As colunas customizaveis vêm de `DProject.tableFields`
 * e os valores de celula custom ficam em `DTask.dados.fields`.
 *
 * @example
 * <GroupsView projectId={listId} />
 */
export function GroupsView({
  projectId,
  onOpenTask,
  filters,
  subtarefasMode,
}: {
  projectId: string;
  /** Abre a TaskSheet compartilhada para o `taskId` (resolvido no caller). */
  onOpenTask?: (taskId: string) => void;
  /** Filtros compartilhados da toolbar — aplicados ao board (mesma fonte). */
  filters?: TaskFilters;
  /**
   * Modo de exibição das subtarefas vindo da toolbar (paridade com a Lista).
   * "expandidas" abre todas as linhas; "recolhidas" fecha. "separar" não tem
   * efeito nesta view (reservado).
   */
  subtarefasMode?: SubtarefasMode;
}) {
  return (
    <BackendGroupsView
      projectId={projectId}
      onOpenTask={onOpenTask}
      filters={filters}
      subtarefasMode={subtarefasMode}
    />
  );
}

/* ─── Modo backend ───────────────────────────────────────────────────────── */

/**
 * Busca Blocos + Tasks + Membros reais do projeto e renderiza o board.
 *
 * Edicao inline (passo 1): Responsavel, Prioridade e Data sao editaveis via
 * `useUpdateTask` (feedback conservador — a celula so muda apos o backend
 * confirmar; spinner enquanto salva). Status, ID e Nome seguem read-only.
 *
 * Escrita estrutural: "Adicionar grupo" cria um Bloco (`useCreateBlock`);
 * "Adicionar tarefa" cria uma task vinculada via `dados.idBloco`
 * (`useCreateTask`). Tasks sem bloco caem no grupo "Sem bloco".
 */
function BackendGroupsView({
  projectId,
  onOpenTask,
  filters,
  subtarefasMode,
}: {
  projectId: string;
  /** Abre a TaskSheet compartilhada para o `taskId` (resolvido no caller). */
  onOpenTask?: (taskId: string) => void;
  /** Filtros compartilhados da toolbar — aplicados ao board. */
  filters?: TaskFilters;
  /** Modo de exibição de subtarefas (toolbar) — propagado às linhas. */
  subtarefasMode?: SubtarefasMode;
}) {
  const { data: blocks = [], isLoading: loadingBlocks } = useBlocks(projectId);
  const { data: tasks = [], isLoading: loadingTasks } =
    useTasksByProject(projectId);
  const { data: membersRaw = [] } = useProjectMembers(projectId);
  // Schema de colunas customizaveis da Lista (DProject.tableFields — ADR-V2-055).
  // Read-only nesta fase: so alimenta as colunas do board (fallback aos 6
  // builtin quando null/ausente).
  const {
    data: project,
    isLoading: loadingProject,
    refetch: refetchProject,
  } = useProject(projectId);
  const queryClient = useQueryClient();

  const createBlock = useCreateBlock();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const updateBlock = useUpdateBlock();
  const updateStatus = useUpdateTaskStatus();
  const updateTableFields = useUpdateProjectTableFields(projectId);

  // Qual task / bloco esta salvando agora — alimenta o spinner.
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [savingGroupId, setSavingGroupId] = useState<string | null>(null);

  // Bloco selecionado para exclusao → alimenta o DeleteBlockDialog.
  const [blockToDelete, setBlockToDelete] = useState<{
    id: string;
    nome: string;
    taskCount: number;
  } | null>(null);

  // Blocos (idClasse=-200) nao sao tarefas — fora da listagem de tasks.
  const realTasks = tasks.filter((t) => t.idClasse !== "-200");
  const members: MemberLike[] = (
    Array.isArray(membersRaw) ? membersRaw : []
  ).map((m) => ({ userId: m.userId, nome: m.nome }));

  // Filtro da toolbar aplicado APENAS ao que alimenta o board (display).
  // `realTasks` permanece intacto para resolução de subtarefas/byId.
  const visibleTasks = filters
    ? applyTaskFilters(realTasks, filters)
    : realTasks;
  // Ordena os blocos pela ordem definida pelo usuário (dados.ordem). Em caso de
  // empate (ex.: blocos ainda sem ordem), desempata por `chave` crescente —
  // mais antigo primeiro, então um bloco recém-criado aparece SEMPRE no fim
  // (alinhado ao botão "Adicionar grupo", que fica embaixo).
  const orderedBlocks = [...blocks].sort((a, b) => {
    const oa = a.dados?.ordem ?? Infinity;
    const ob = b.dados?.ordem ?? Infinity;
    if (oa !== ob) return oa - ob;
    if (BigInt(a.id) < BigInt(b.id)) return -1;
    if (BigInt(a.id) > BigInt(b.id)) return 1;
    return 0;
  });
  const board = buildGroupsBoard(orderedBlocks, visibleTasks, project?.tableFields);

  // Colunas arquivadas (hidden:true) — derivadas do schema COMPLETO (não do
  // board, que já as filtra). Alimentam o menu "Arquivadas" para restaurar.
  const archivedColumns: ArchivedColumn[] = (
    project?.tableFields?.columns ?? []
  )
    .filter((c) => c.hidden)
    .map((c) => ({ key: c.key, label: c.label }));

  // ── Selecao de tarefas (checkbox) → barra de acoes flutuante ──
  const deleteTask = useDeleteTask();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /** Marca/desmarca uma task (pai ou subtarefa) na selecao. */
  function toggleSelect(id: string, next: boolean) {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });
  }

  /** Marca/desmarca todas as tasks raiz de um grupo de uma vez (header). */
  function toggleSelectGroup(taskIds: string[], next: boolean) {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      for (const id of taskIds) {
        if (next) copy.add(id);
        else copy.delete(id);
      }
      return copy;
    });
  }

  /** Limpa a selecao (X da barra). */
  function clearSelection() {
    setSelectedIds(new Set());
  }

  /**
   * Exclui as tasks selecionadas (unica acao funcional da barra). As demais
   * acoes sao decorativas nesta versao. Limpa a selecao ao final.
   *
   * Para subtarefas, passamos `parentId` (resolvido via `realTasks`, que inclui
   * filhas) para que `useDeleteTask` invalide `qk.tasks.children(parentId)` e a
   * sub-tabela na tela atualize. Sem isso, a filha sumia no backend mas
   * continuava visivel ate um refresh.
   *
   * **Dedup de cascade:** o backend deleta com cascade por padrao (raiz +
   * descendentes — ADR-V2-047 Q6). Se um pai E uma filha dele estao
   * selecionados, deletar o pai ja remove a filha; o DELETE explicito da filha
   * bateria num 404 (a busca exige `excluido: false`). Por isso pulamos
   * qualquer task selecionada que tenha um ANCESTRAL tambem selecionado — o
   * cascade do ancestral cuida dela.
   */
  function handleDeleteSelected() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    const parentById = new Map(
      realTasks.map((t) => [t.id, t.idPai ?? undefined]),
    );

    /** True se algum ancestral de `id` tambem esta selecionado. */
    function hasSelectedAncestor(id: string): boolean {
      let parent = parentById.get(id);
      while (parent) {
        if (selectedIds.has(parent)) return true;
        parent = parentById.get(parent);
      }
      return false;
    }

    // So dispara o delete das tasks "de topo" da selecao; descendentes
    // selecionados sao removidos pelo cascade do ancestral.
    const toDelete = ids.filter((id) => !hasSelectedAncestor(id));
    for (const id of toDelete) {
      deleteTask.mutate({ id, projectId, parentId: parentById.get(id) });
    }
    clearSelection();
  }

  /**
   * Duplica as tasks selecionadas recriando-as via `useCreateTask` (o backend
   * nao tem endpoint de clone). Copia os campos copiaveis: nome (+ " (copia)"),
   * prioridade, responsavel, time, data, tipo, pai e vinculo de bloco.
   *
   * Limitacoes do backend (documentadas):
   * - O status sempre inicia em INBOX (Backlog) — nao e copiavel no POST.
   * - Subtarefas NAO sao copiadas (decisao de produto): duplica so a propria
   *   task. Se for uma subtarefa, a copia mantem o mesmo `idPai`.
   */
  function handleDuplicateSelected() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    const byId = new Map(realTasks.map((t) => [t.id, t]));
    for (const id of ids) {
      const t = byId.get(id);
      if (!t) continue;
      const idBloco =
        typeof t.dados?.idBloco === "string" ? t.dados.idBloco : undefined;
      createTask.mutate({
        titulo: `${t.nome} (cópia)`,
        idProject: projectId,
        priority: t.priority ?? undefined,
        assigneeId: t.assigneeId ?? undefined,
        assigneeTeamId: t.assigneeTeamId ?? undefined,
        dueDate: t.dueDate ?? undefined,
        idPai: t.idPai ?? undefined,
        ...(idBloco ? { dados: { idBloco } } : {}),
      });
    }
    clearSelection();
  }

  /**
   * Classifica a selecao atual para decidir o comportamento do "Mover":
   * - "maes": todas as selecionadas sao tarefas raiz (sem idPai) → mover entre
   *   blocos (PUT dados.idBloco).
   * - "filhas": todas sao subtarefas (com idPai) → mover para outra mae
   *   (PUT idPai).
   * - "mista": mistura raiz + subtarefa → Mover desabilitado (destinos sao
   *   incompativeis: blocos vs maes).
   * - "vazia": nada selecionado.
   */
  const selectionKind: "maes" | "filhas" | "mista" | "vazia" = (() => {
    const ids = [...selectedIds];
    if (ids.length === 0) return "vazia";
    const byId = new Map(realTasks.map((t) => [t.id, t]));
    let temMae = false;
    let temFilha = false;
    for (const id of ids) {
      const t = byId.get(id);
      if (!t) continue;
      if (t.idPai) temFilha = true;
      else temMae = true;
    }
    if (temMae && temFilha) return "mista";
    if (temFilha) return "filhas";
    return "maes";
  })();

  /**
   * Move as MAES selecionadas para um bloco (PUT dados.idBloco). `blockId` nulo
   * desvincula (move para "Sem bloco"). So faz sentido quando `selectionKind`
   * e "maes".
   */
  function handleMoveToBlock(blockId: string | null) {
    const ids = [...selectedIds];
    for (const id of ids) {
      updateTask.mutate({
        id,
        projectId,
        dto: { dados: { idBloco: blockId } },
      });
    }
    clearSelection();
  }

  /**
   * Move as FILHAS selecionadas para outra mae (PUT idPai). A nova mae pode
   * estar em qualquer bloco. So faz sentido quando `selectionKind` e "filhas".
   */
  function handleMoveToParent(parentId: string) {
    const ids = [...selectedIds];
    for (const id of ids) {
      if (id === parentId) continue; // nao deixar virar pai de si mesma
      updateTask.mutate({ id, projectId, dto: { idPai: parentId } });
    }
    clearSelection();
  }

  /** Cria um novo Bloco (DTask idClasse=-200) no projeto. */
  function handleAddGroup() {
    createBlock.mutate({ nome: "Novo bloco", projectId });
  }

  /**
   * Cria uma tarefa no grupo. Para um bloco real, vincula via
   * `dados.idBloco`; para o grupo sintetico "Sem bloco", cria solta.
   */
  function handleAddTask(groupId: string) {
    const dados = groupId === SEM_BLOCO_ID ? undefined : { idBloco: groupId };
    createTask.mutate({ titulo: "Nova tarefa", idProject: projectId, dados });
  }

  function invalidateProjectTasks(taskId?: string) {
    void queryClient.invalidateQueries({
      queryKey: qk.tasks.byProject(projectId),
    });
    if (taskId) {
      void queryClient.invalidateQueries({ queryKey: qk.tasks.byId(taskId) });
    }
  }

  async function getFreshListProject() {
    const result = await refetchProject();
    if (result.error) {
      toast.error("Não foi possível carregar o schema mais recente.", {
        description: tableFieldsErrorDescription(result.error),
      });
      return null;
    }

    const latestProject = result.data ?? project;

    if (!latestProject) {
      toast.error("Não foi possível carregar o schema mais recente.");
      return null;
    }
    if (latestProject.idClasse !== ID_CLASSE_LIST) {
      toast.error("Colunas customizáveis só podem ser alteradas em Listas.");
      return null;
    }

    return latestProject;
  }

  function handleTableFieldsError(error: unknown) {
    toast.error("Não foi possível atualizar as colunas.", {
      description: tableFieldsErrorDescription(error),
    });
    void refetchProject();
  }

  function handleFieldError(error: unknown, taskId: string) {
    toast.error("Não foi possível salvar esta célula.", {
      description: fieldErrorDescription(error),
    });
    invalidateProjectTasks(taskId);
  }

  async function handleAddColumn(type: ColumnType, label: string) {
    const latestProject = await getFreshListProject();
    if (!latestProject) return;
    const tableFields = applyAddColumn(
      latestProject.tableFields ?? null,
      type,
      label,
    );
    updateTableFields.mutate(tableFields, { onError: handleTableFieldsError });
  }

  async function handleRenameColumn(key: string, label: string) {
    const latestProject = await getFreshListProject();
    if (!latestProject) return;
    const tableFields = applyRenameColumn(
      latestProject.tableFields ?? null,
      key,
      label,
    );
    updateTableFields.mutate(tableFields, { onError: handleTableFieldsError });
  }

  async function handleRemoveColumn(key: string) {
    const latestProject = await getFreshListProject();
    if (!latestProject) return;
    const tableFields = applyRemoveColumn(
      latestProject.tableFields ?? null,
      key,
    );
    updateTableFields.mutate(tableFields, { onError: handleTableFieldsError });
  }

  /**
   * Substitui as opcoes de uma coluna `status`/`dropdown` (editor de opcoes
   * no menu da coluna). Recebe a lista completa ja editada na UI.
   */
  async function handleUpdateColumnOptions(
    key: string,
    options: ColumnOption[],
  ) {
    const latestProject = await getFreshListProject();
    if (!latestProject) return;
    const tableFields = applyUpdateColumnOptions(
      latestProject.tableFields ?? null,
      key,
      options,
    );
    updateTableFields.mutate(tableFields, { onError: handleTableFieldsError });
  }

  // Arquivar (hidden=true) / restaurar (hidden=false) — funciona para builtin
  // E custom. As builtins ja vem materializadas no tableFields do backend.
  async function handleSetColumnHidden(key: string, hidden: boolean) {
    // Guard: nunca arquivar a ULTIMA coluna visivel — grade sem colunas fica
    // inutilizavel. `board.columns` ja exclui as hidden, entao <=1 = so esta.
    if (hidden && board.columns.length <= 1) {
      toast.error("Mantenha ao menos uma coluna visível na grade.");
      return;
    }
    const latestProject = await getFreshListProject();
    if (!latestProject) return;
    const tableFields = applySetColumnHidden(
      latestProject.tableFields ?? null,
      key,
      hidden,
    );
    updateTableFields.mutate(tableFields, { onError: handleTableFieldsError });
  }

  /**
   * Reordena todas as colunas no schema da lista. `orderedKeys` traz o
   * conjunto inteiro (builtin + custom) na nova ordem desejada;
   * `applyReorderColumns` renumera `order` de forma contigua.
   *
   * Diferente de criar/renomear/remover, o reorder NAO faz refetch bloqueante
   * antes de gravar: o drag precisa de feedback imediato e ja traz a ordem
   * desejada explicita. Calcula a partir do schema em cache e confia na
   * atualizacao otimista da mutation (rollback automatico em caso de erro).
   */
  function handleReorderColumn(orderedKeys: string[]) {
    if (project?.idClasse !== ID_CLASSE_LIST) return;
    const tableFields = applyReorderColumns(
      project?.tableFields ?? null,
      orderedKeys,
    );
    updateTableFields.mutate(tableFields, { onError: handleTableFieldsError });
  }

  /**
   * Edita um campo de uma task no backend. Mapeia a coluna para o campo do
   * DTO de update e dispara a mutation; o `savingTaskId` segura o spinner ate
   * a invalidacao trazer o valor confirmado (feedback conservador).
   */
  function handleEditField(
    taskId: string,
    columnKey: string,
    value: FieldValue,
  ) {
    // Status vai por outro endpoint (PUT /tasks/:id/status) e por isso e
    // tratado a parte. A celula ja garante: nao chama se VALIDATED (terminal)
    // nem se a pilula escolhida e a mesma (preserva estado V3 fino). Aqui so
    // traduzimos a pilula visual → estado V3 canonico e disparamos.
    if (columnKey === "status") {
      const v3 = typeof value === "string" ? PILL_TO_V3[value] : undefined;
      if (!v3) return;
      setSavingTaskId(taskId);
      updateStatus.mutate(
        { id: taskId, status: v3 as V3Intention, projectId },
        {
          onError: (error) => handleFieldError(error, taskId),
          onSettled: () => setSavingTaskId(null),
        },
      );
      return;
    }

    const dto: {
      titulo?: string;
      assigneeId?: string | null;
      priority?: string;
      dueDate?: string | null;
    } = {};
    if (columnKey === "__nome") {
      // Titulo da tarefa — nao salva vazio (ignora).
      if (typeof value !== "string" || !value.trim()) return;
      dto.titulo = value.trim();
    } else if (columnKey === "responsavel") {
      dto.assigneeId = typeof value === "string" && value ? value : null;
    } else if (columnKey === "prioridade") {
      // priority nao aceita null no DTO atual — sem valor, nao envia nada.
      if (typeof value !== "string" || !value) return;
      dto.priority = value;
    } else if (columnKey === "dueDate") {
      dto.dueDate = typeof value === "string" && value ? value : null;
    } else {
      // Coluna customizavel (key `f_*`, sem editor builtin). Grava o valor em
      // `dados.fields` por chave; o backend faz MERGE por chave (nao apaga as
      // demais celulas) e valida pelo tipo da coluna. `null` limpa a celula.
      const nextValue = normalizeCellValue(value);
      setSavingTaskId(taskId);
      updateTask.mutate(
        {
          id: taskId,
          projectId,
          dto: { dados: { fields: { [columnKey]: nextValue } } },
        },
        {
          onError: (error) => handleFieldError(error, taskId),
          onSettled: () => setSavingTaskId(null),
        },
      );
      return;
    }

    setSavingTaskId(taskId);
    updateTask.mutate(
      { id: taskId, projectId, dto },
      {
        onError: (error) => handleFieldError(error, taskId),
        onSettled: () => setSavingTaskId(null),
      },
    );
  }

  /**
   * Renomeia um Bloco (DTask idClasse=-200) via `useUpdateBlock`. O grupo
   * sintetico "Sem bloco" nao e um bloco real — ignora. Nao salva vazio.
   */
  function handleRenameGroup(groupId: string, nome: string) {
    if (groupId === SEM_BLOCO_ID) return;
    const novo = nome.trim();
    if (!novo) return;
    setSavingGroupId(groupId);
    updateBlock.mutate(
      { id: groupId, projectId, dto: { nome: novo } },
      { onSettled: () => setSavingGroupId(null) },
    );
  }

  /**
   * Altera a cor de um Bloco (DTask idClasse=-200) via `useUpdateBlock`
   * (`dados.cor`). O grupo sintetico "Sem bloco" nao e um bloco real — ignora.
   */
  function handleRecolorGroup(groupId: string, cor: string) {
    if (groupId === SEM_BLOCO_ID) return;
    setSavingGroupId(groupId);
    updateBlock.mutate(
      { id: groupId, projectId, dto: { dados: { cor } } },
      { onSettled: () => setSavingGroupId(null) },
    );
  }

  /**
   * Reordena os Blocos persistindo `dados.ordem` em cada um. Recebe os ids dos
   * blocos reais na nova ordem (o grupo sintetico "Sem bloco" fica fora). Aplica
   * atualizacao otimista no cache de blocos para a UI reagir na hora; cada PATCH
   * grava a nova ordem no backend (recarregar mantem).
   */
  function handleReorderGroups(orderedBlockIds: string[]) {
    if (!projectId) return;
    const orderMap = new Map(orderedBlockIds.map((id, i) => [id, i]));

    // Otimista: aplica a nova ordem no cache imediatamente.
    const key = qk.tasks.blocks(projectId);
    const current = queryClient.getQueryData<BlockDto[]>(key);
    if (current) {
      queryClient.setQueryData<BlockDto[]>(
        key,
        current.map((b) =>
          orderMap.has(b.id)
            ? { ...b, dados: { ...(b.dados ?? {}), ordem: orderMap.get(b.id)! } }
            : b,
        ),
      );
    }

    // Persiste so os blocos cuja ordem mudou.
    orderedBlockIds.forEach((id, index) => {
      const block = blocks.find((b) => b.id === id);
      if (!block || (block.dados?.ordem ?? -1) === index) return;
      updateBlock.mutate({ id, projectId, dto: { dados: { ordem: index } } });
    });
  }

  if (loadingBlocks || loadingTasks || loadingProject) {
    return (
      <div
        className="grid flex-1 place-items-center p-8 text-sm"
        style={{
          background: "var(--background)",
          color: "var(--muted-foreground)",
        }}
      >
        Carregando blocos...
      </div>
    );
  }

  return (
    <SelectionContext.Provider
      value={{
        selectedIds,
        toggle: toggleSelect,
        toggleMany: toggleSelectGroup,
      }}
    >
      <GroupsBoardView
        board={board}
        readOnly
        members={members}
        savingTaskId={savingTaskId}
        savingGroupId={savingGroupId}
        projectId={projectId}
        subtarefasMode={subtarefasMode}
        onOpenTask={onOpenTask}
        onEditField={handleEditField}
        onRenameGroup={handleRenameGroup}
        onRecolorGroup={handleRecolorGroup}
        onReorderGroups={handleReorderGroups}
        onDeleteGroup={(groupId, nome, taskCount) =>
          setBlockToDelete({ id: groupId, nome, taskCount })
        }
        onAddGroup={handleAddGroup}
        onAddTask={handleAddTask}
        onAddColumn={handleAddColumn}
        onRenameColumn={handleRenameColumn}
        onRemoveColumn={handleRemoveColumn}
        onUpdateColumnOptions={handleUpdateColumnOptions}
        onReorderColumn={handleReorderColumn}
        onArchiveColumn={(key) => handleSetColumnHidden(key, true)}
        onRestoreColumn={(key) => handleSetColumnHidden(key, false)}
        archivedColumns={archivedColumns}
      />
      <SelectionActionBar
        count={selectedIds.size}
        onClose={clearSelection}
        onDelete={handleDeleteSelected}
        deleting={deleteTask.isPending}
        onDuplicate={handleDuplicateSelected}
        duplicating={createTask.isPending}
        moveKind={selectionKind}
        blockTargets={blocks.map((b) => ({ id: b.id, nome: b.nome }))}
        parentTargets={realTasks
          .filter((t) => !t.idPai && !selectedIds.has(t.id))
          .map((t) => ({ id: t.id, nome: t.nome }))}
        onMoveToBlock={handleMoveToBlock}
        onMoveToParent={handleMoveToParent}
      />
      {blockToDelete && (
        <DeleteBlockDialog
          block={{
            id: blockToDelete.id,
            nome: blockToDelete.nome,
            projectId,
          }}
          taskCount={blockToDelete.taskCount}
          open
          onOpenChange={(o) => {
            if (!o) setBlockToDelete(null);
          }}
        />
      )}
    </SelectionContext.Provider>
  );
}
