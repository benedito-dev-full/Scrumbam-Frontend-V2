"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  MessageSquarePlus,
  User,
  GitBranch,
  Check,
  Trash2,
  Type,
  Hash,
  Calendar as CalendarIcon,
  CircleUser,
  CircleDot,
  CheckSquare,
  List as ListIcon,
  Link2,
  Lock,
  Loader2,
  Copy,
  Upload,
  CornerDownRight,
  ArrowRight,
  Sparkles,
  X,
} from "lucide-react";
import {
  useGroupsBoard,
  groupsActions,
  COLUMN_TYPE_LABEL,
  type ColumnDef,
  type ColumnType,
  type ColumnOption,
  type FieldValue,
  type GroupModel,
  type GroupsBoard,
  type TaskModel,
} from "@/lib/prototype/groups-store";
import {
  useBlocks,
  useTasksByProject,
  useCreateBlock,
  useCreateTask,
  useUpdateTask,
  useUpdateBlock,
  useUpdateTaskStatus,
  useSubtasks,
  useDeleteTask,
} from "@/hooks/use-tasks";
import { useProjectMembers } from "@/hooks/use-members";
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import type { TaskResponseDto, V3Intention } from "@/lib/types/api";
import {
  buildGroupsBoard,
  SEM_BLOCO_ID,
  PILL_TO_V3,
  V3_TERMINAL_VALIDATED,
  STATUS_V3_KEY,
  STATUS_OPTIONS,
  type MemberLike,
} from "@/lib/mappers/groups-from-tasks";
import { intentionToColumn } from "@/lib/mappers/task-status.mapper";

/* ─── Contexto de selecao (checkbox → barra de acoes flutuante) ───────────── */

/**
 * Estado de selecao de tarefas via checkbox, consumido pelos checkboxes das
 * linhas (pai e subtarefa) e pelo header de grupo ("selecionar tudo"). Quando
 * `null` (modo prototipo / sem projectId), os checkboxes ficam decorativos.
 */
interface SelectionContextValue {
  /** IDs atualmente selecionados. */
  selectedIds: Set<string>;
  /** Marca/desmarca uma task individual. */
  toggle: (id: string, next: boolean) => void;
  /** Marca/desmarca um conjunto de tasks de uma vez (header do grupo). */
  toggleMany: (ids: string[], next: boolean) => void;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

/** Hook interno — retorna o contexto de selecao ou null (modo decorativo). */
function useSelection(): SelectionContextValue | null {
  return useContext(SelectionContext);
}

/**
 * Barra de acoes flutuante (estilo Monday) que surge no rodape quando ha
 * tarefas selecionadas via checkbox. Mostra o contador + acoes. Nesta versao
 * apenas **Excluir** e funcional; as demais sao decorativas (placeholder
 * visual). O botao X (e o ESC) limpam a selecao.
 *
 * Quando `count === 0` nao renderiza nada.
 *
 * @param count    - Numero de tarefas selecionadas (mostrado no badge).
 * @param onClose  - Limpa a selecao (X / ESC).
 * @param onDelete - Exclui as tarefas selecionadas (acao funcional).
 * @param deleting - Enquanto true, desabilita o Excluir (evita duplo disparo).
 */
function SelectionActionBar({
  count,
  onClose,
  onDelete,
  deleting,
}: {
  count: number;
  onClose: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  // ESC limpa a selecao (atalho padrao). Registrado so quando a barra existe.
  useEffect(() => {
    if (count === 0) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, onClose]);

  if (count === 0 || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="toolbar"
      aria-label="Acoes da selecao"
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        // Estado final do transform — o keyframe `groups-action-bar-in` anima
        // de translate(-50%,16px)+opacity:0 ate este estado (slide de baixo pra
        // cima + fade-in). `both` mantem o frame inicial antes de comecar.
        transform: "translate(-50%, 0)",
        animation: "groups-action-bar-in .4s cubic-bezier(.16,1,.3,1) both",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "10px 12px",
        borderRadius: 12,
        background: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "0 12px 40px rgba(0,0,0,.5)",
      }}
    >
      {/* Badge contador + rotulo */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 26,
          height: 26,
          padding: "0 6px",
          borderRadius: "50%",
          background: "#7c5cff",
          color: "#fff",
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        {count}
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--foreground)",
          padding: "0 10px 0 4px",
          whiteSpace: "nowrap",
        }}
      >
        {count === 1 ? "Tarefa Selecionada" : "Tarefas Selecionadas"}
      </span>

      <ActionBtn icon={<Copy size={16} />} label="Duplicar" />
      <ActionBtn icon={<Upload size={16} />} label="Exportar" disabled />
      <ActionBtn
        icon={<Trash2 size={16} />}
        label="Excluir"
        onClick={onDelete}
        disabled={deleting}
        danger
      />
      <ActionBtn icon={<CornerDownRight size={16} />} label="Converter" />
      <ActionBtn icon={<ArrowRight size={16} />} label="Mover" />
      <ActionBtn icon={<Sparkles size={16} />} label="Sidekick" />

      {/* Divisor + fechar */}
      <span style={{ width: 1, height: 28, background: "var(--border)", margin: "0 4px" }} />
      <button
        type="button"
        onClick={onClose}
        aria-label="Limpar selecao"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 30,
          height: 30,
          borderRadius: 8,
          border: 0,
          background: "none",
          color: "var(--muted-foreground)",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
      >
        <X size={18} />
      </button>
    </div>,
    document.body,
  );
}

/** Vermelho da acao destrutiva (Excluir). */
const DANGER_COLOR = "#ef4444";

/**
 * Botao de acao da barra de selecao. Empilha icone + rotulo (estilo Monday).
 *
 * @param disabled - Atenua e bloqueia (acoes decorativas ou em andamento).
 * @param danger - Acao destrutiva (Excluir): no hover, icone+texto ficam
 *   vermelhos e o fundo ganha um tom rosado. Em repouso fica neutro como as
 *   demais.
 */
function ActionBtn({
  icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  const baseColor = disabled ? "var(--muted-foreground)" : "var(--foreground)";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        minWidth: 58,
        padding: "4px 8px",
        borderRadius: 8,
        border: 0,
        background: "none",
        color: baseColor,
        fontSize: 11,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "background .1s, color .1s",
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (danger) {
          // Acao destrutiva: vermelho no hover (icone+texto via color, herdado
          // pelo currentColor do lucide) + fundo rosado.
          e.currentTarget.style.color = DANGER_COLOR;
          e.currentTarget.style.background = "rgba(239,68,68,0.12)";
        } else {
          e.currentTarget.style.background = "var(--accent)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "none";
        e.currentTarget.style.color = baseColor;
      }}
    >
      {icon}
      {label}
    </button>
  );
}

/**
 * GroupsView — visualizacao de tarefas em GRUPOS (estilo Monday.com).
 *
 * Versao DINAMICA de prototipo: le e escreve numa store persistida em
 * localStorage (`groups-store`) que espelha o contrato de colunas
 * customizaveis do backend (tableFields.columns[] + dados.fields{}).
 *
 * Suporta nesta fase, sem backend:
 *  - editar nome do grupo (clique no titulo)
 *  - editar titulo da tarefa (clique)
 *  - mudar status/tipo e demais campos por tipo de coluna
 *  - adicionar tarefa, grupo e novas colunas (8 tipos do contrato)
 *
 * Tem dois modos:
 *  - **backend** (com `projectId`): le Blocos + Tasks + Membros reais e monta
 *    o board via `buildGroupsBoard`. SOMENTE LEITURA nesta v1 — edicao inline,
 *    add tarefa/grupo/coluna ficam desabilitados. E o novo conceito de Blocos.
 *  - **prototipo** (sem `projectId`): le/escreve a store em localStorage.
 *    Mantido para o showcase em `/design-system/groups-preview`.
 *
 * @example
 * <GroupsView projectId={listId} />   // dados reais (read-only)
 * <GroupsView />                       // prototipo localStorage (editavel)
 */
export function GroupsView({ projectId }: { projectId?: string }) {
  if (projectId) return <BackendGroupsView projectId={projectId} />;
  return <PrototypeGroupsView />;
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
function BackendGroupsView({ projectId }: { projectId: string }) {
  const { data: blocks = [], isLoading: loadingBlocks } = useBlocks(projectId);
  const { data: tasks = [], isLoading: loadingTasks } =
    useTasksByProject(projectId);
  const { data: membersRaw = [] } = useProjectMembers(projectId);

  const createBlock = useCreateBlock();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const updateBlock = useUpdateBlock();
  const updateStatus = useUpdateTaskStatus();

  // Qual task / bloco esta salvando agora — alimenta o spinner.
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [savingGroupId, setSavingGroupId] = useState<string | null>(null);

  // Blocos (idClasse=-200) nao sao tarefas — fora da listagem de tasks.
  const realTasks = tasks.filter((t) => t.idClasse !== "-200");
  const members: MemberLike[] = (
    Array.isArray(membersRaw) ? membersRaw : []
  ).map((m) => ({ userId: m.userId, nome: m.nome }));

  const board = buildGroupsBoard(blocks, realTasks);

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
   */
  function handleDeleteSelected() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    const parentById = new Map(realTasks.map((t) => [t.id, t.idPai ?? undefined]));
    for (const id of ids) {
      deleteTask.mutate({ id, projectId, parentId: parentById.get(id) });
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
    const dados =
      groupId === SEM_BLOCO_ID ? undefined : { idBloco: groupId };
    createTask.mutate({ titulo: "Nova tarefa", idProject: projectId, dados });
  }

  /**
   * Edita um campo de uma task no backend. Mapeia a coluna para o campo do
   * DTO de update e dispara a mutation; o `savingTaskId` segura o spinner ate
   * a invalidacao trazer o valor confirmado (feedback conservador).
   */
  function handleEditField(taskId: string, columnKey: string, value: FieldValue) {
    // Status vai por outro endpoint (PUT /tasks/:id/status) e por isso e
    // tratado a parte. A celula ja garante: nao chama se VALIDATED (terminal)
    // nem se a pilula escolhida e a mesma (preserva estado V3 fino). Aqui so
    // traduzimos a pilula visual → estado V3 canonico e disparamos.
    if (columnKey === "status") {
      const v3 = typeof value === "string" ? PILL_TO_V3[value] : undefined;
      if (!v3) return;
      setSavingTaskId(taskId);
      updateStatus.mutate(
        { id: taskId, status: v3, projectId },
        { onSettled: () => setSavingTaskId(null) },
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
      return; // coluna nao-editavel neste passo
    }

    setSavingTaskId(taskId);
    updateTask.mutate(
      { id: taskId, projectId, dto },
      { onSettled: () => setSavingTaskId(null) },
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

  if (loadingBlocks || loadingTasks) {
    return (
      <div
        className="grid flex-1 place-items-center p-8 text-sm"
        style={{ background: "var(--background)", color: "var(--muted-foreground)" }}
      >
        Carregando blocos...
      </div>
    );
  }

  return (
    <SelectionContext.Provider
      value={{ selectedIds, toggle: toggleSelect, toggleMany: toggleSelectGroup }}
    >
      <GroupsBoardView
        board={board}
        readOnly
        members={members}
        savingTaskId={savingTaskId}
        savingGroupId={savingGroupId}
        projectId={projectId}
        onEditField={handleEditField}
        onRenameGroup={handleRenameGroup}
        onAddGroup={handleAddGroup}
        onAddTask={handleAddTask}
      />
      <SelectionActionBar
        count={selectedIds.size}
        onClose={clearSelection}
        onDelete={handleDeleteSelected}
        deleting={deleteTask.isPending}
      />
    </SelectionContext.Provider>
  );
}

/* ─── Modo prototipo (editavel, localStorage) ────────────────────────────── */

/** Le e escreve a store em localStorage. Usado no design-system. */
function PrototypeGroupsView() {
  const board = useGroupsBoard();
  return (
    <GroupsBoardView
      board={board}
      readOnly={false}
      onAddGroup={() => groupsActions.addGroup()}
      onAddTask={(groupId) => groupsActions.addTask(groupId)}
    />
  );
}

/** Coluna sintetica do titulo da tarefa (builtin). Editavel no backend. */
const NOME_KEY = "__nome";

/* ─── Renderizacao do board (compartilhada entre os dois modos) ──────────── */

/** Colunas editaveis no modo backend. As demais ficam read-only. */
const BACKEND_EDITABLE_KEYS = new Set([
  "status",
  "responsavel",
  "prioridade",
  "dueDate",
]);

/**
 * Colunas fixas da sub-tabela de subtarefas (estilo Monday).
 *
 * Conjunto reduzido de 4 colunas independentes do conjunto do bloco pai:
 * Subelemento | Resp. | Status | Data. Reutiliza as opcoes de STATUS_OPTIONS
 * para manter consistencia visual com as pills do pai.
 */
const SUBTASK_COLUMNS: ColumnDef[] = [
  { key: "__nome", type: "text", label: "Subelemento", order: 0, builtin: true },
  { key: "responsavel", type: "person", label: "Resp.", order: 1 },
  {
    key: "status",
    type: "status",
    label: "Status",
    order: 2,
    config: { options: STATUS_OPTIONS },
  },
  { key: "dueDate", type: "date", label: "Data", order: 3 },
];


/**
 * @param readOnly - Desliga a edicao via store (rename/remove/setField do
 *   prototipo). No modo backend e `true`, mas `onEditField`/`onRenameGroup`
 *   reabrem a edicao do titulo da tarefa, do titulo do bloco e das colunas
 *   em `BACKEND_EDITABLE_KEYS`.
 * @param members - Membros para resolver userId → nome na coluna `person`.
 * @param savingTaskId - Task que esta salvando agora (spinner na celula).
 * @param savingGroupId - Bloco cujo titulo esta salvando (spinner no header).
 * @param onEditField - Salva uma celula no backend (titulo/resp/prioridade/data).
 *   Quando presente, essas colunas ficam editaveis mesmo com `readOnly`.
 * @param onRenameGroup - Renomeia o bloco. Quando presente, o titulo do grupo
 *   fica editavel (exceto o grupo sintetico "Sem bloco").
 * @param onAddGroup - Cria um grupo/bloco. Se ausente, o botao nao aparece.
 * @param onAddTask - Cria uma tarefa no grupo. Se ausente, a linha nao aparece.
 */
function GroupsBoardView({
  board,
  readOnly,
  members,
  savingTaskId,
  savingGroupId,
  projectId,
  onEditField,
  onRenameGroup,
  onAddGroup,
  onAddTask,
}: {
  board: GroupsBoard;
  readOnly: boolean;
  members?: MemberLike[];
  savingTaskId?: string | null;
  savingGroupId?: string | null;
  /** ID do projeto — quando presente, habilita subtarefas inline nos grupos. */
  projectId?: string;
  onEditField?: (taskId: string, columnKey: string, value: FieldValue) => void;
  onRenameGroup?: (groupId: string, nome: string) => void;
  onAddGroup?: () => void;
  onAddTask?: (groupId: string) => void;
}) {
  const cols = [...board.columns].sort((a, b) => a.order - b.order);

  // Conjunto de containers scrollaveis dos grupos — para sincronizar o
  // scroll horizontal entre todos (rolar um rola todos, igual Monday).
  const scrollers = useRef<Set<HTMLDivElement>>(new Set());
  const syncing = useRef(false);

  /** Propaga o scrollLeft de um grupo para todos os outros. */
  const syncScroll = useCallback((source: HTMLDivElement) => {
    if (syncing.current) return;
    syncing.current = true;
    const left = source.scrollLeft;
    scrollers.current.forEach((el) => {
      if (el !== source && el.scrollLeft !== left) el.scrollLeft = left;
    });
    // libera no proximo frame para nao entrar em loop de eventos
    requestAnimationFrame(() => {
      syncing.current = false;
    });
  }, []);

  const register = useCallback(
    (el: HTMLDivElement | null, prev?: HTMLDivElement | null) => {
      if (prev) scrollers.current.delete(prev);
      if (el) {
        scrollers.current.add(el);
        // alinha o novo container ao offset atual dos demais
        const any = scrollers.current.values().next().value;
        if (any && any !== el) el.scrollLeft = any.scrollLeft;
      }
    },
    [],
  );

  return (
    <div
      className="flex-1 overflow-auto"
      style={{ background: "var(--background)", padding: "16px 20px 80px" }}
    >
      {/* esconde a scrollbar nativa dos grupos por completo — o scroll
          horizontal fica sincronizado e e ativado por Shift + roda sobre o
          bloco (padrao de planilha). Inclui keyframe para o spinner de saving
          nas subtarefas. */}
      <style>{`.groups-scroller{scrollbar-width:none;-ms-overflow-style:none}.groups-scroller::-webkit-scrollbar{height:0;width:0;display:none}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes groups-action-bar-in{from{opacity:0;transform:translate(-50%,16px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {board.groups.length === 0 ? (
          <div
            style={{
              padding: "60px 0",
              textAlign: "center",
              color: "var(--muted-foreground)",
              fontSize: 13,
            }}
          >
            Nenhuma tarefa nesta lista ainda.
          </div>
        ) : (
          board.groups.map((g) => (
            <GroupBox
              key={g.id}
              group={g}
              columns={cols}
              register={register}
              onSyncScroll={syncScroll}
              readOnly={readOnly}
              members={members}
              savingTaskId={savingTaskId}
              savingGroup={savingGroupId === g.id}
              projectId={projectId}
              onEditField={onEditField}
              onRenameGroup={onRenameGroup}
              onAddTask={onAddTask}
            />
          ))
        )}

        {/* adicionar grupo — aparece quando ha handler (cria Bloco no backend
            ou grupo no prototipo). Independe de readOnly. */}
        {onAddGroup && (
          <button
            type="button"
            onClick={onAddGroup}
            style={{
              alignSelf: "flex-start",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              height: 34,
              padding: "0 14px",
              borderRadius: 8,
              border: "1px dashed var(--border)",
              background: "transparent",
              color: "var(--muted-foreground)",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <Plus size={14} />
            Adicionar grupo
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Larguras das colunas ───────────────────────────────────────────────── */

const W_CHECK = 36;
const W_NOME = 360;
const W_ADD = 44;
const W_DEFAULT = 150;

/** Largura da coluna de nome da subtarefa. */
const W_SUBTASK_NOME = 280;
/** Largura da coluna de responsavel da subtarefa. */
const W_SUBTASK_RESP = 130;
/** Largura da coluna de status da subtarefa. */
const W_SUBTASK_STATUS = 140;
/** Largura da coluna de data da subtarefa. */
const W_SUBTASK_DATE = 110;
// Nota: a coluna "+" da sub-tabela usa largura `auto` (absorve o espaco
// restante para o grid ir ate o fim), por isso nao ha constante de largura
// fixa para ela nem largura total — a tabela ocupa 100% do container.

function colWidth(c: ColumnDef): number {
  if (c.builtin) return W_NOME;
  if (c.type === "person") return 150;
  if (c.type === "number") return 130;
  if (c.type === "link") return 150;
  if (c.type === "text") return 130;
  return W_DEFAULT;
}

/* ─── GroupBox ───────────────────────────────────────────────────────────── */

function GroupBox({
  group,
  columns,
  register,
  onSyncScroll,
  readOnly,
  members,
  savingTaskId,
  savingGroup,
  projectId,
  onEditField,
  onRenameGroup,
  onAddTask,
}: {
  group: GroupModel;
  columns: ColumnDef[];
  register: (el: HTMLDivElement | null, prev?: HTMLDivElement | null) => void;
  onSyncScroll: (source: HTMLDivElement) => void;
  readOnly: boolean;
  members?: MemberLike[];
  savingTaskId?: string | null;
  savingGroup?: boolean;
  /** ID do projeto — quando presente, habilita subtarefas inline. */
  projectId?: string;
  onEditField?: (taskId: string, columnKey: string, value: FieldValue) => void;
  onRenameGroup?: (groupId: string, nome: string) => void;
  onAddTask?: (groupId: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Registra/desregistra este container no pool de scroll sincronizado.
  useEffect(() => {
    const el = scrollerRef.current;
    register(el);
    return () => register(null, el);
    // re-registra quando abre/fecha (o no muda de existencia)
  }, [register, open]);

  /**
   * Rola o bloco na horizontal QUANDO o usuario segura SHIFT e usa a roda
   * sobre o bloco (padrao de planilha — Excel/Sheets). Sem Shift, o evento
   * segue para a pagina e a rolagem vertical acontece normalmente, mesmo
   * com o cursor sobre o bloco — nunca "prendemos" a pagina.
   *
   * Registrado manualmente como listener NAO-passivo: o onWheel do React e
   * passive por padrao e ignora preventDefault. Como so prevenimos no caso
   * Shift+overflow, o scroll vertical normal continua intacto.
   */
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.shiftKey) return; // sem Shift → pagina rola vertical normalmente
      const overflow = el.scrollWidth - el.clientWidth;
      if (overflow <= 0) return; // nada para rolar na horizontal
      // Com Shift, o navegador costuma mapear deltaY → deltaX; cobrimos ambos.
      const delta =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const clamped = Math.max(0, Math.min(overflow, el.scrollLeft + delta));
      if (clamped !== el.scrollLeft) {
        e.preventDefault();
        el.scrollLeft = clamped; // dispara onScroll → sincroniza os demais
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [open]);

  const spCol = columns.find((c) => c.type === "number");
  const totalSp = spCol
    ? group.tasks.reduce(
        (acc, t) => acc + (Number(t.fields[spCol.key]) || 0),
        0,
      )
    : 0;

  // largura total = soma das colunas; garante scroll horizontal quando
  // ultrapassa o container (tableLayout fixed respeita estas larguras).
  const tableWidth =
    W_CHECK + columns.reduce((s, c) => s + colWidth(c), 0) + W_ADD;

  return (
    <section>
      {/* cabecalho do grupo */}
      <header style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Recolher grupo" : "Expandir grupo"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 20,
            height: 20,
            border: 0,
            background: "none",
            color: group.cor,
            cursor: "pointer",
            transform: open ? "none" : "rotate(-90deg)",
            transition: "transform .15s",
          }}
        >
          <ChevronDown size={16} strokeWidth={2.5} />
        </button>

        {(() => {
          const titleStyle: React.CSSProperties = {
            fontSize: 16,
            fontWeight: 700,
            color: group.cor,
            letterSpacing: ".2px",
            ...(savingGroup ? { opacity: 0.5, pointerEvents: "none" } : {}),
          };
          // Backend: bloco real renomeavel via onRenameGroup ("Sem bloco" fica fixo).
          const backendRenamable = !!onRenameGroup && group.id !== SEM_BLOCO_ID;
          if (backendRenamable) {
            return (
              <EditableText
                value={group.nome}
                onCommit={(v) => onRenameGroup!(group.id, v)}
                style={titleStyle}
              />
            );
          }
          // Prototipo: edita via store.
          if (!readOnly) {
            return (
              <EditableText
                value={group.nome}
                onCommit={(v) => groupsActions.renameGroup(group.id, v)}
                style={titleStyle}
              />
            );
          }
          // Read-only puro (ou grupo sintetico "Sem bloco").
          return <span style={titleStyle}>{group.nome}</span>;
        })()}

        <span style={{ fontSize: 12, color: "var(--muted-foreground)", marginLeft: 2 }}>
          {(() => {
            // Contador descritivo estilo Monday: "N Tarefas / M subelementos".
            // `childCount` vem de buildGroupsBoard (soma das filhas diretas de
            // cada task raiz do grupo). So mostra a parte de subelementos se > 0.
            const nTasks = group.tasks.length;
            const nSubs = group.tasks.reduce(
              (acc, t) => acc + (t.childCount ?? 0),
              0,
            );
            const tarefasTxt = `${nTasks} ${nTasks === 1 ? "Tarefa" : "Tarefas"}`;
            if (nSubs === 0) return tarefasTxt;
            const subsTxt = `${nSubs} ${nSubs === 1 ? "subelemento" : "subelementos"}`;
            return `${tarefasTxt} / ${subsTxt}`;
          })()}
        </span>

        {!readOnly && (
          <button
            type="button"
            onClick={() => {
              if (confirm(`Remover o grupo "${group.nome}"?`)) groupsActions.removeGroup(group.id);
            }}
            aria-label="Remover grupo"
            title="Remover grupo"
            style={{
              display: "inline-flex",
              border: 0,
              background: "none",
              color: "var(--muted-foreground)",
              cursor: "pointer",
              opacity: 0.5,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
          >
            <Trash2 size={14} />
          </button>
        )}

        {group.periodo && (
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted-foreground)" }}>
            {group.periodo}
          </span>
        )}
      </header>

      {open && (
        <div
          ref={scrollerRef}
          className="groups-scroller"
          onScroll={(e) => onSyncScroll(e.currentTarget)}
          style={{
            borderRadius: 8,
            overflowX: "auto",
            overflowY: "hidden",
            border: "1px solid var(--border)",
            borderLeft: `4px solid ${group.cor}`,
            background: "var(--card)",
            // Firefox: esconde a scrollbar (webkit via .groups-scroller)
            scrollbarWidth: "none",
          }}
        >
          <table style={{ width: tableWidth, minWidth: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: W_CHECK }} />
              {columns.map((c) => (
                <col key={c.key} style={{ width: colWidth(c) }} />
              ))}
              <col style={{ width: W_ADD }} />
            </colgroup>

            <HeadRow
              columns={columns}
              readOnly={readOnly}
              groupTaskIds={group.tasks.map((t) => t.id)}
            />

            <tbody>
              {group.tasks.map((t) => (
                <TaskRow
                  key={t.id}
                  groupId={group.id}
                  task={t}
                  columns={columns}
                  readOnly={readOnly}
                  members={members}
                  saving={savingTaskId === t.id}
                  projectId={projectId}
                  groupColor={group.cor}
                  subtaskColSpan={columns.length + 2}
                  onEditField={onEditField}
                />
              ))}
              {onAddTask && (
                <AddTaskRow colSpan={columns.length + 2} onAdd={() => onAddTask(group.id)} />
              )}
            </tbody>

            <FooterRow columns={columns} tasks={group.tasks} totalSp={totalSp} />
          </table>
        </div>
      )}
    </section>
  );
}

/* ─── Icone por tipo de coluna ───────────────────────────────────────────── */

const TYPE_ICON: Record<ColumnType, React.ComponentType<{ size?: number }>> = {
  text: Type,
  number: Hash,
  date: CalendarIcon,
  person: CircleUser,
  status: CircleDot,
  checkbox: CheckSquare,
  dropdown: ListIcon,
  link: Link2,
};

/* ─── Cabecalho de colunas ───────────────────────────────────────────────── */

function HeadRow({
  columns,
  readOnly,
  groupTaskIds,
}: {
  columns: ColumnDef[];
  readOnly: boolean;
  /** IDs das tasks raiz do grupo — alimenta o "selecionar tudo" do header. */
  groupTaskIds?: string[];
}) {
  const selection = useSelection();
  const th: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: "var(--muted-foreground)",
    textAlign: "center",
    padding: "9px 8px",
    borderBottom: "1px solid var(--border)",
    background: "color-mix(in srgb, var(--foreground) 3%, transparent)",
    whiteSpace: "nowrap",
  };
  // Todas as tasks raiz do grupo estao selecionadas? (estado do "selecionar tudo")
  const allChecked =
    !!selection &&
    !!groupTaskIds &&
    groupTaskIds.length > 0 &&
    groupTaskIds.every((id) => selection.selectedIds.has(id));
  return (
    <thead>
      <tr>
        <th style={{ ...th, padding: 0 }}>
          <span style={{ display: "inline-flex" }}>
            {selection && groupTaskIds ? (
              <Checkbox
                checked={allChecked}
                onChange={(next) => selection.toggleMany(groupTaskIds, next)}
              />
            ) : (
              <Checkbox checked={false} />
            )}
          </span>
        </th>
        {columns.map((c) =>
          c.builtin || readOnly ? (
            <th key={c.key} style={{ ...th, textAlign: c.builtin ? "left" : "center", paddingLeft: c.builtin ? 4 : 8 }}>
              {c.label}
            </th>
          ) : (
            <ColumnHeader key={c.key} column={c} thStyle={th} />
          ),
        )}
        <th style={th}>
          {!readOnly && <AddColumnButton />}
        </th>
      </tr>
    </thead>
  );
}

/** Header de coluna custom — editavel (renomear) e removivel via menu. */
function ColumnHeader({ column, thStyle }: { column: ColumnDef; thStyle: React.CSSProperties }) {
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <th style={thStyle}>
      <button
        ref={ref}
        type="button"
        onClick={() => setMenu((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          border: 0,
          background: "none",
          color: "var(--muted-foreground)",
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
          maxWidth: "100%",
        }}
        title="Editar coluna"
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {column.label}
        </span>
      </button>
      {menu && (
        <Popover anchorRef={ref} onClose={() => setMenu(false)}>
          <div style={{ padding: 8, minWidth: 200 }}>
            <p style={{ margin: "0 0 6px", fontSize: 10, letterSpacing: ".5px", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
              {COLUMN_TYPE_LABEL[column.type]}
            </p>
            <input
              autoFocus
              defaultValue={column.label}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  groupsActions.renameColumn(column.key, (e.target as HTMLInputElement).value.trim() || column.label);
                  setMenu(false);
                }
                if (e.key === "Escape") setMenu(false);
              }}
              onBlur={(e) => groupsActions.renameColumn(column.key, e.target.value.trim() || column.label)}
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => {
                groupsActions.removeColumn(column.key);
                setMenu(false);
              }}
              style={{
                marginTop: 8,
                width: "100%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                height: 30,
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "none",
                color: "#ef4444",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              <Trash2 size={13} /> Remover coluna
            </button>
          </div>
        </Popover>
      )}
    </th>
  );
}

/** Botao "+" no header — abre menu para criar nova coluna (8 tipos). */
function AddColumnButton() {
  const [menu, setMenu] = useState(false);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<ColumnType>("text");
  const ref = useRef<HTMLButtonElement>(null);

  function create() {
    const l = label.trim() || COLUMN_TYPE_LABEL[type];
    groupsActions.addColumn(type, l);
    setLabel("");
    setType("text");
    setMenu(false);
  }

  return (
    <>
      <button
        ref={ref}
        type="button"
        onClick={() => setMenu((v) => !v)}
        aria-label="Adicionar coluna"
        title="Adicionar coluna"
        style={{ display: "inline-flex", border: 0, background: "none", color: "var(--muted-foreground)", cursor: "pointer" }}
      >
        <Plus size={14} />
      </button>
      {menu && (
        <Popover anchorRef={ref} onClose={() => setMenu(false)} align="right">
          <div style={{ padding: 10, minWidth: 240 }}>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 600, color: "var(--foreground)" }}>
              Nova coluna
            </p>
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") create();
                if (e.key === "Escape") setMenu(false);
              }}
              placeholder="Nome da coluna…"
              style={inputStyle}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, margin: "8px 0" }}>
              {(Object.keys(COLUMN_TYPE_LABEL) as ColumnType[]).map((t) => {
                const Icon = TYPE_ICON[t];
                const active = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      height: 30,
                      padding: "0 8px",
                      borderRadius: 6,
                      border: active ? "1px solid #7c5cff" : "1px solid var(--border)",
                      background: active ? "rgba(124,92,255,0.12)" : "transparent",
                      color: active ? "var(--foreground)" : "var(--muted-foreground)",
                      fontSize: 12,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <Icon size={13} />
                    {COLUMN_TYPE_LABEL[t]}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={create}
              style={{
                width: "100%",
                height: 32,
                borderRadius: 6,
                border: 0,
                background: "#7c5cff",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Criar coluna
            </button>
          </div>
        </Popover>
      )}
    </>
  );
}

/* ─── Linha de tarefa ────────────────────────────────────────────────────── */

function TaskRow({
  groupId,
  task,
  columns,
  readOnly,
  members,
  saving,
  projectId,
  groupColor,
  subtaskColSpan,
  onEditField,
}: {
  groupId: string;
  task: TaskModel;
  columns: ColumnDef[];
  readOnly: boolean;
  members?: MemberLike[];
  saving?: boolean;
  /** ID do projeto — quando presente, habilita o caret e subtarefas inline. */
  projectId?: string;
  /** Cor do grupo pai — passada para a borda esquerda da sub-tabela. */
  groupColor?: string;
  /** colSpan total da linha de expansao (columns.length + 2). */
  subtaskColSpan?: number;
  onEditField?: (taskId: string, columnKey: string, value: FieldValue) => void;
}) {
  const [hover, setHover] = useState(false);
  // Estado de expansao da sub-tabela — gerenciado localmente no TaskRow.
  const [expanded, setExpanded] = useState(false);
  // Selecao via checkbox (null no modo prototipo → checkbox decorativo).
  const selection = useSelection();

  const hasChildren = (task.childCount ?? 0) > 0;
  // No modo backend com projectId, qualquer task pode receber filhas —
  // o caret fica visivel no hover mesmo sem filhas (igual Monday).
  const showCaret = !!projectId;

  const td: React.CSSProperties = {
    padding: "0 8px",
    height: 38,
    borderBottom: "1px solid var(--border)",
    borderRight: "1px solid var(--border)",
    verticalAlign: "middle",
    fontSize: 13,
    color: "var(--foreground)",
    background: hover ? "var(--accent)" : "transparent",
    transition: "background .1s",
  };

  return (
    <React.Fragment>
      <tr onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <td style={{ ...td, padding: 0, textAlign: "center" }}>
          {selection ? (
            <Checkbox
              checked={selection.selectedIds.has(task.id)}
              onChange={(next) => selection.toggle(task.id, next)}
            />
          ) : (
            <Checkbox checked={false} />
          )}
        </td>

        {columns.map((c, i) => {
          const last = i === columns.length - 1;
          if (c.builtin) {
            // Titulo da tarefa: editavel no backend (via onEditField → __nome)
            // e no prototipo (via store). Read-only puro mostra span.
            const nomeStyle: React.CSSProperties = {
              flex: 1,
              fontWeight: 500,
              color: "var(--foreground)",
              ...(saving ? { opacity: 0.5, pointerEvents: "none" } : {}),
            };
            return (
              <td key={c.key} style={{ ...td, fontWeight: 500, borderRight: last ? "1px solid var(--border)" : td.borderRight }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {/* Caret de expansao de subtarefas — visivel no hover ou quando ha filhas */}
                  {showCaret && (
                    <button
                      type="button"
                      aria-label={expanded ? "Recolher subtarefas" : "Expandir subtarefas"}
                      onClick={() => setExpanded((v) => !v)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 18,
                        height: 18,
                        border: 0,
                        background: "none",
                        color: "var(--muted-foreground)",
                        cursor: "pointer",
                        flexShrink: 0,
                        opacity: hover || hasChildren || expanded ? 1 : 0,
                        transition: "opacity .1s",
                        padding: 0,
                      }}
                    >
                      {expanded
                        ? <ChevronDown size={13} strokeWidth={2.5} />
                        : <ChevronRight size={13} strokeWidth={2.5} />
                      }
                    </button>
                  )}
                  {/* Contador de filhas quando recolhido */}
                  {hasChildren && !expanded && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--muted-foreground)",
                        fontWeight: 500,
                        flexShrink: 0,
                        minWidth: 20,
                      }}
                    >
                      ({task.childCount})
                    </span>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, overflow: "hidden" }}>
                    {onEditField ? (
                      // Backend: edita o titulo via onEditField (feedback conservador).
                      <EditableText
                        value={task.nome}
                        onCommit={(v) => onEditField(task.id, NOME_KEY, v)}
                        style={nomeStyle}
                      />
                    ) : readOnly ? (
                      <span
                        style={{
                          flex: 1,
                          fontWeight: 500,
                          color: "var(--foreground)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={task.nome}
                      >
                        {task.nome}
                      </span>
                    ) : (
                      <>
                        <EditableText
                          value={task.nome}
                          onCommit={(v) => groupsActions.renameTask(groupId, task.id, v)}
                          style={{ flex: 1, fontWeight: 500, color: "var(--foreground)" }}
                        />
                        <button
                          type="button"
                          aria-label="Remover tarefa"
                          onClick={() => groupsActions.removeTask(groupId, task.id)}
                          style={{
                            display: "inline-flex",
                            border: 0,
                            background: "none",
                            color: "var(--muted-foreground)",
                            cursor: "pointer",
                            opacity: hover ? 0.6 : 0,
                            transition: "opacity .1s",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                        <span style={{ display: "inline-flex", color: "var(--muted-foreground)", opacity: hover ? 1 : 0, transition: "opacity .1s" }}>
                          <MessageSquarePlus size={15} />
                        </span>
                      </>
                    )}
                  </div>
                  {/* Botão "+" de adicionar subtarefa — estilo Monday: círculo
                      destacado ao lado do nome. Expande a sub-tabela do pai.
                      Só no modo backend (showCaret). */}
                  {showCaret && (
                    <button
                      type="button"
                      aria-label="Adicionar subtarefa"
                      title="Adicionar subtarefa"
                      onClick={() => setExpanded(true)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 22,
                        height: 22,
                        flexShrink: 0,
                        borderRadius: "50%",
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                        color: "var(--muted-foreground)",
                        cursor: "pointer",
                        opacity: hover ? 1 : 0,
                        transition: "opacity .1s, color .1s, border-color .1s",
                        padding: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#7c5cff";
                        e.currentTarget.style.borderColor = "#7c5cff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--muted-foreground)";
                        e.currentTarget.style.borderColor = "var(--border)";
                      }}
                    >
                      <Plus size={13} />
                    </button>
                  )}
                </div>
              </td>
            );
          }
          // No modo backend, as colunas-alvo viram editaveis via onEditField
          // (mesmo com readOnly geral). As demais respeitam readOnly.
          const backendEditable =
            !!onEditField && BACKEND_EDITABLE_KEYS.has(c.key);
          const cellReadOnly = backendEditable ? false : readOnly;
          const cellOnChange = backendEditable
            ? (v: FieldValue) => onEditField!(task.id, c.key, v)
            : (v: FieldValue) => groupsActions.setField(groupId, task.id, c.key, v);

          const statusV3 =
            typeof task.fields[STATUS_V3_KEY] === "string"
              ? (task.fields[STATUS_V3_KEY] as string)
              : null;

          return (
            <FieldCell
              key={c.key}
              tdStyle={td}
              column={c}
              value={task.fields[c.key] ?? null}
              onChange={cellOnChange}
              readOnly={cellReadOnly}
              members={members}
              saving={saving}
              statusV3={statusV3}
            />
          );
        })}

        <td style={{ ...td, borderRight: 0 }} />
      </tr>

      {/* Sub-tabela de subtarefas — renderizada apenas no modo backend com projectId */}
      {projectId && subtaskColSpan !== undefined && (
        <SubtaskTableRow
          parentId={task.id}
          groupColor={groupColor ?? "#6b7280"}
          colSpan={subtaskColSpan}
          projectId={projectId}
          members={members}
          expanded={expanded}
        />
      )}
    </React.Fragment>
  );
}

/* ─── Sub-tabela de subtarefas (estilo Monday) ───────────────────────────── */

/**
 * Linha de expansão que embrulha a `SubtaskTable` num `<tr><td colSpan>`.
 *
 * Renderizada imediatamente após o `<tr>` do pai no `<tbody>` do grupo.
 * Quando `expanded` é `false`, retorna `null` sem altura residual.
 * O `<td>` com `colSpan` cobre toda a largura da tabela pai; dentro dele
 * renderiza uma sub-tabela independente com 4 colunas fixas (Subelemento |
 * Resp. | Status | Data), seguindo o padrão Monday.com.
 *
 * @param parentId   - ID da task pai.
 * @param groupColor - Cor do grupo (usada na borda esquerda da sub-tabela visual).
 * @param colSpan    - Número de colunas do bloco pai (inclui checkbox + colunas + botão add).
 * @param projectId  - ID do projeto (necessário para mutations internas).
 * @param members    - Lista de membros para resolver userId → nome na coluna de responsável.
 * @param expanded   - Controla visibilidade da sub-tabela.
 *
 * @see SubtaskTable para a tabela interna
 */
function SubtaskTableRow({
  parentId,
  groupColor,
  colSpan,
  projectId,
  members,
  expanded,
}: {
  parentId: string;
  groupColor: string;
  colSpan: number;
  projectId: string;
  members?: MemberLike[];
  expanded: boolean;
}) {
  if (!expanded) return null;

  return (
    <tr>
      <td
        colSpan={colSpan}
        style={{
          // Recuo a esquerda (28px) deixa o braco de ligacao visivel.
          // Respiro generoso EM CIMA e EMBAIXO (14px) descola a sub-tabela tanto
          // da tarefa-pai dela quanto da proxima tarefa, evidenciando a hierarquia
          // (estilo Monday — o bloco da subtarefa "flutua" entre as duas).
          padding: "14px 0 14px 28px",
          borderBottom: "1px solid var(--border)",
          // Fundo transparente: o respiro de 14px em cima/embaixo mostra o fundo
          // normal da linha, fazendo a sub-tabela (card destacado) "flutuar"
          // entre o pai e a proxima tarefa, como no Monday.
          background: "transparent",
          position: "relative",
          // NOTA: a calha lateral (cor do grupo) ja vem do GroupBox (borderLeft
          // de 4px no container scrollavel). NAO duplicar aqui — antes havia um
          // boxShadow inset que criava uma segunda barra lateral.
        }}
      >
        {/* Braco horizontal de ligacao (cor do grupo) — sai da calha lateral do
            grupo (x=0) e vai ate o card (x=28), conectando a barra lateral a
            sub-tabela, como no Monday. Centralizado verticalmente. */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            width: 28,
            height: 2,
            background: groupColor,
          }}
        />
        <SubtaskTable
          parentId={parentId}
          projectId={projectId}
          members={members}
          expanded={expanded}
        />
      </td>
    </tr>
  );
}

/**
 * Tabela independente de subtarefas embutida na linha de expansão do pai.
 *
 * **Lazy fetch:** Usa `useSubtasks(parentId, expanded)` — a query só dispara
 * quando `expanded=true`. Enquanto carrega, exibe 3 linhas skeleton cinzas.
 *
 * **Layout:** Tabela `<table>` com colgroup próprio de 4 colunas fixas:
 * Subelemento (280px) | Resp. (130px) | Status (140px) | Data (110px).
 * Margem esquerda de 36px com borda colorida do grupo (conexão visual ao pai).
 *
 * **Conteúdo:** Renderiza cada subtarefa com `SubtaskTaskRow` (editável inline),
 * seguido de `AddSubtaskRow` para criar nova subtarefa.
 *
 * Sem scroll próprio — as 4 colunas (~660px total) cabem na largura mínima
 * do GroupBox sem necessidade de scroll horizontal.
 *
 * @param parentId   - ID da task pai.
 * @param projectId  - ID do projeto (necessário para mutations).
 * @param members    - Membros do projeto para resolver userId → nome na coluna de responsável.
 * @param expanded   - Controla se o fetch está habilitado e a tabela é visível.
 *
 * @example
 * <SubtaskTable
 *   parentId="task-123"
 *   projectId="proj-456"
 *   members={[...]}
 *   expanded={isExpanded}
 * />
 *
 * @see SubtaskTaskRow para edição inline de cada subtarefa
 * @see AddSubtaskRow para criação de nova subtarefa
 */
function SubtaskTable({
  parentId,
  projectId,
  members,
  expanded,
}: {
  parentId: string;
  projectId: string;
  members?: MemberLike[];
  expanded: boolean;
}) {
  const { data: subtasks = [], isLoading } = useSubtasks(parentId, expanded);
  // Qual subtarefa esta salvando agora — alimenta o spinner conservador.
  const [savingId, setSavingId] = useState<string | null>(null);

  return (
    <div
      style={{
        // Card embutido com calha lateral grossa e contínua na cor do grupo
        // (conecta visualmente ao pai, estilo Monday). Fundo de card real para
        // destacar do fundo escuro. Ocupa toda a largura disponivel (100%) —
        // como no Monday, o bloco da subtarefa se estende ate o fim mesmo com
        // poucas colunas; a coluna "+" absorve o espaco restante.
        width: "100%",
        // A calha de conexao (cor do grupo) fica no <td> pai (boxShadow inset);
        // aqui o card so tem borda neutra e encosta nela.
        border: "1px solid var(--border)",
        borderRadius: 6,
        overflow: "hidden",
        // Fundo nitidamente mais claro que o "poco" (4%) e que o cabecalho —
        // a sub-tabela tem que se destacar como um card elevado, como no Monday.
        // var(--card) ficava quase identico ao fundo; subimos o contraste.
        background: "color-mix(in srgb, var(--foreground) 9%, var(--card))",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
        }}
      >
        <colgroup>
          <col style={{ width: W_CHECK }} />
          <col style={{ width: W_SUBTASK_NOME }} />
          <col style={{ width: W_SUBTASK_RESP }} />
          <col style={{ width: W_SUBTASK_STATUS }} />
          <col style={{ width: W_SUBTASK_DATE }} />
          {/* Coluna "+" com largura `auto` — absorve todo o espaco restante,
              fazendo o grid se estender ate o fim da tabela pai (estilo Monday). */}
          <col />
        </colgroup>

        <SubtaskHeadRow />

        <tbody>
          {isLoading ? (
            /* Skeleton de carregamento — 3 linhas cinza enquanto fetch */
            Array.from({ length: 3 }).map((_, i) => (
              <tr key={`sk-${i}`}>
                <td colSpan={6} style={{ height: 34, padding: "4px 8px" }}>
                  <div
                    style={{
                      height: 18,
                      borderRadius: 4,
                      background: "color-mix(in srgb, var(--muted-foreground) 15%, transparent)",
                      width: `${60 + i * 15}%`,
                    }}
                  />
                </td>
              </tr>
            ))
          ) : (
            subtasks.map((sub) => (
              <SubtaskTaskRow
                key={sub.id}
                subtask={sub}
                projectId={projectId}
                members={members}
                savingId={savingId}
                onSavingChange={setSavingId}
                parentId={parentId}
              />
            ))
          )}
          <AddSubtaskRow
            parentId={parentId}
            projectId={projectId}
          />
        </tbody>
      </table>
    </div>
  );
}

/**
 * Cabeçalho da sub-tabela de subtarefas — 4 colunas fixas reduzidas.
 *
 * Diferencia-se do cabeçalho pai por:
 * - Sem checkbox na primeira coluna (apenas espaço reservado)
 * - Sem botão de "Adicionar coluna" (colunas são fixas)
 * - Fonte menor (11px vs 12px) e cor muted
 * - Altura menor (6px padding vs 9px)
 */
function SubtaskHeadRow() {
  const th: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--muted-foreground)",
    padding: "7px 8px",
    borderBottom: "1px solid var(--border)",
    borderRight: "1px solid var(--border)",
    // Cabecalho um pouco mais forte que o corpo do card (que ja e 9%) — faixa
    // de grid visivel, como no Monday. Base no proprio fundo do card para
    // contraste previsivel. TODAS as colunas (inclusive "+") usam este mesmo
    // background — nenhuma fica mais escura que as outras.
    background: "color-mix(in srgb, var(--foreground) 13%, var(--card))",
    whiteSpace: "nowrap",
    textAlign: "center",
  };
  return (
    <thead>
      <tr>
        <th style={{ ...th, padding: 0 }} />
        <th style={{ ...th, textAlign: "left", paddingLeft: 8 }}>Subelemento</th>
        <th style={th}>Resp.</th>
        <th style={th}>Status</th>
        <th style={th}>Data</th>
        {/* Coluna "+" decorativa — espelha o "adicionar coluna" do Monday.
            Largura `auto`: estende o grid ate o fim. O "+" fica alinhado a
            esquerda (logo apos Data), nao centralizado no vazio.
            IMPORTANTE: opacity SO no icone — antes estava na <th> inteira, o
            que escurecia o FUNDO da coluna (deixava-a mais escura que as ativas). */}
        <th style={{ ...th, borderRight: 0, textAlign: "left", color: "var(--muted-foreground)" }}>
          <Plus size={13} style={{ opacity: 0.4 }} />
        </th>
      </tr>
    </thead>
  );
}

/**
 * Linha de uma subtarefa na sub-tabela — renderiza e edita 4 colunas
 * (Nome | Resp. | Status | Data) com feedback conservador (spinner até
 * o backend confirmar).
 *
 * **Edição inline:**
 * - Nome: `EditableText` com `useUpdateTask` (DTO.titulo)
 * - Responsável: `FieldCell` com menu de membros
 * - Status: `FieldCell` com pills coloridas; VALIDATED trava a edição
 * - Data: `FieldCell` com date picker
 *
 * **Invalidação:** Mutations invalidam `qk.tasks.children(parentId)` no
 * `onSuccess`, além das invalidações padrão já feitas pelos hooks
 * `useUpdateTask` e `useUpdateTaskStatus`.
 *
 * @param subtask        - DTO da subtarefa do backend.
 * @param projectId      - ID do projeto (necessário para as mutations).
 * @param members        - Membros do projeto para resolver userId → nome.
 * @param savingId       - ID da subtarefa que está salvando (mostra spinner).
 * @param onSavingChange - Callback para atualizar `savingId` no estado pai.
 * @param parentId       - ID da task pai (para invalidar `qk.tasks.children`).
 *
 * @see SubtaskTable para o contexto de parent
 * @see FieldCell para a lógica de edição por tipo de coluna
 */
function SubtaskTaskRow({
  subtask,
  projectId,
  members,
  savingId,
  onSavingChange,
  parentId,
}: {
  subtask: TaskResponseDto;
  projectId: string;
  members?: MemberLike[];
  savingId: string | null;
  onSavingChange: (id: string | null) => void;
  parentId: string;
}) {
  const [hover, setHover] = useState(false);
  const queryClient = useQueryClient();
  // Selecao via checkbox (null no modo prototipo → checkbox decorativo).
  const selection = useSelection();

  const updateTask = useUpdateTask();
  const updateStatus = useUpdateTaskStatus();

  const saving = savingId === subtask.id;

  /** Estado V3 cru da subtarefa — passado para `FieldCell` travar pilula VALIDATED. */
  const statusV3 = subtask.status ?? null;
  /** Coluna visual de status baseada no V3 Intention atual. */
  const statusColId = subtask.status
    ? intentionToColumn(subtask.status as V3Intention)
    : null;

  /** Salva um campo da subtarefa. */
  function handleEdit(columnKey: string, value: FieldValue) {
    if (columnKey === "status") {
      const v3 = typeof value === "string" ? PILL_TO_V3[value] : undefined;
      if (!v3) return;
      onSavingChange(subtask.id);
      updateStatus.mutate(
        { id: subtask.id, status: v3, projectId },
        {
          onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: qk.tasks.children(parentId) });
          },
          onSettled: () => onSavingChange(null),
        },
      );
      return;
    }

    const dto: {
      titulo?: string;
      assigneeId?: string | null;
      dueDate?: string | null;
    } = {};

    if (columnKey === "__nome") {
      if (typeof value !== "string" || !value.trim()) return;
      dto.titulo = value.trim();
    } else if (columnKey === "responsavel") {
      dto.assigneeId = typeof value === "string" && value ? value : null;
    } else if (columnKey === "dueDate") {
      dto.dueDate = typeof value === "string" && value ? value : null;
    } else {
      return;
    }

    onSavingChange(subtask.id);
    updateTask.mutate(
      { id: subtask.id, projectId, dto },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: qk.tasks.children(parentId) });
        },
        onSettled: () => onSavingChange(null),
      },
    );
  }

  const td: React.CSSProperties = {
    padding: "0 8px",
    height: 38,
    borderBottom: "1px solid var(--border)",
    borderRight: "1px solid var(--border)",
    verticalAlign: "middle",
    fontSize: 12,
    color: "var(--foreground)",
    background: hover ? "var(--accent)" : "transparent",
    transition: "background .1s",
  };

  // Celulas de campos da subtarefa usando as SUBTASK_COLUMNS
  const statusCol = SUBTASK_COLUMNS.find((c) => c.key === "status")!;
  const respCol = SUBTASK_COLUMNS.find((c) => c.key === "responsavel")!;
  const dateCol = SUBTASK_COLUMNS.find((c) => c.key === "dueDate")!;

  return (
    <tr onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <td style={{ ...td, padding: 0, textAlign: "center", borderRight: "1px solid var(--border)" }}>
        {selection ? (
          <Checkbox
            checked={selection.selectedIds.has(subtask.id)}
            onChange={(next) => selection.toggle(subtask.id, next)}
          />
        ) : (
          <Checkbox checked={false} />
        )}
      </td>

      {/* Nome / titulo da subtarefa */}
      <td style={{ ...td, fontWeight: 500 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {saving && (
            <Loader2 size={12} style={{ flexShrink: 0, opacity: 0.5, animation: "spin 1s linear infinite" }} />
          )}
          <EditableText
            value={subtask.nome}
            onCommit={(v) => handleEdit("__nome", v)}
            style={{
              flex: 1,
              fontWeight: 500,
              color: "var(--foreground)",
              ...(saving ? { opacity: 0.5, pointerEvents: "none" } : {}),
            }}
          />
        </div>
      </td>

      {/* Responsavel */}
      <FieldCell
        tdStyle={td}
        column={respCol}
        value={subtask.assigneeId ?? null}
        onChange={(v) => handleEdit("responsavel", v)}
        readOnly={false}
        members={members}
        saving={saving}
      />

      {/* Status */}
      <FieldCell
        tdStyle={td}
        column={statusCol}
        value={statusColId}
        onChange={(v) => handleEdit("status", v)}
        readOnly={false}
        members={members}
        saving={saving}
        statusV3={statusV3}
      />

      {/* Data */}
      <FieldCell
        tdStyle={td}
        column={dateCol}
        value={subtask.dueDate ?? null}
        onChange={(v) => handleEdit("dueDate", v)}
        readOnly={false}
        members={members}
        saving={saving}
      />

      {/* Celula vazia sob a coluna "+" decorativa do cabecalho */}
      <td style={{ ...td, borderRight: 0 }} />
    </tr>
  );
}

/**
 * Linha "+ Adicionar subelemento" ao final da sub-tabela.
 *
 * **Estados:**
 * - Repouso: botão clicável "Adicionar subelemento"
 * - Ativo: input inline para digitar o nome (auto-focus)
 * - Carregando (`creating`): spinner "Criando subelemento..." que cobre o
 *   ciclo inteiro — submit (POST) E refetch das children — ate a subtarefa
 *   aparecer de fato na lista (o `await invalidateQueries` segura o estado).
 *
 * **Confirmação:**
 * - Enter → cria a subtarefa (input perde foco)
 * - Blur com valor não-vazio → cria a subtarefa
 * - Escape → cancela edição
 * - Valor vazio ao blur/Enter → apenas fecha o input
 *
 * **Criação:** Chama `useCreateTask({ titulo, idProject, idPai })`.
 * A mutação invalida automaticamente `qk.tasks.children(parentId)` (já feito
 * pelo hook). Após sucesso, limpa o input e reseta o estado.
 *
 * Botão fica desabilitado (opacity 0.5, cursor not-allowed) enquanto
 * `isPending`, evitando cliques duplos.
 *
 * @param parentId  - ID da task pai (passado como `idPai` na criação).
 * @param projectId - ID do projeto (passado como `idProject` na criação).
 *
 * @example
 * <AddSubtaskRow parentId="task-123" projectId="proj-456" />
 * // Ao confirmar: cria { titulo, idProject: 'proj-456', idPai: 'task-123' }
 *
 * @see SubtaskTable para o contexto de parent
 */
function AddSubtaskRow({
  parentId,
  projectId,
}: {
  parentId: string;
  projectId: string;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [hover, setHover] = useState(false);
  // `creating` cobre TODO o ciclo: submit (POST) + refetch das children, ate a
  // subtarefa realmente aparecer. So o `isPending` do mutation desligava cedo
  // demais (acabava no fim do POST, mas a lista so atualizava no refetch
  // seguinte — gap em que o spinner sumia e a task ainda nao tinha aparecido).
  const [creating, setCreating] = useState(false);
  const createTask = useCreateTask();
  const queryClient = useQueryClient();

  async function commit() {
    if (creating) return;
    const nome = draft.trim();
    if (!nome) {
      setAdding(false);
      setDraft("");
      return;
    }
    setCreating(true);
    setAdding(false);
    setDraft("");
    try {
      await createTask.mutateAsync({
        titulo: nome,
        idProject: projectId,
        idPai: parentId,
      });
      // Espera o refetch das subtarefas COMPLETAR — invalidateQueries resolve
      // so quando a query ativa termina de rebuscar. Mantem o spinner ate a
      // nova subtarefa estar de fato na lista.
      await queryClient.invalidateQueries({
        queryKey: qk.tasks.children(parentId),
      });
    } finally {
      setCreating(false);
    }
  }

  return (
    <tr onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <td
        colSpan={6}
        style={{
          height: 32,
          padding: 0,
          borderBottom: "none",
          background: hover ? "var(--accent)" : "transparent",
          transition: "background .1s",
        }}
      >
        {creating ? (
          /* Estado de carregamento — cobre submit + refetch, ate a subtarefa
             aparecer de fato na lista. Da feedback imediato e continuo,
             evitando a sensacao de que o clique nao funcionou. */
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "0 8px 0 44px",
              height: 32,
              color: "var(--muted-foreground)",
              fontSize: 12,
            }}
          >
            <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
            Criando subelemento...
          </div>
        ) : adding ? (
          <div style={{ display: "flex", alignItems: "center", padding: "0 8px 0 44px", height: 32 }}>
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") {
                  setAdding(false);
                  setDraft("");
                }
              }}
              onBlur={commit}
              placeholder="Nome do subelemento..."
              style={{
                ...inputStyle,
                height: 26,
                padding: "3px 8px",
                fontSize: 12,
              }}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 32,
              padding: "0 8px 0 44px",
              border: 0,
              background: "none",
              color: "var(--muted-foreground)",
              fontSize: 12,
              cursor: "pointer",
              width: "100%",
              textAlign: "left",
            }}
          >
            <Plus size={13} />
            Adicionar subelemento
          </button>
        )}
      </td>
    </tr>
  );
}

/* ─── Celula de campo — renderiza/edita conforme o tipo da coluna ────────── */

function FieldCell({
  column,
  value,
  onChange,
  tdStyle,
  readOnly,
  members,
  saving,
  statusV3,
}: {
  column: ColumnDef;
  value: FieldValue;
  onChange: (v: FieldValue) => void;
  tdStyle: React.CSSProperties;
  readOnly: boolean;
  members?: MemberLike[];
  saving?: boolean;
  /** Estado V3 cru da task (so usado pela coluna `status`). */
  statusV3?: string | null;
}) {
  const ref = useRef<HTMLTableCellElement>(null);
  const [open, setOpen] = useState(false);

  // Status em VALIDATED e terminal: backend recusa mudar → travamos a pilula.
  const statusLocked =
    column.type === "status" && statusV3 === V3_TERMINAL_VALIDATED;

  // No modo read-only (ou enquanto salva, ou status terminal) a celula nao
  // abre editor nem responde a clique. `saving` segura ate o backend confirmar.
  const locked = readOnly || !!saving || statusLocked;
  const openCell = locked ? undefined : () => setOpen(true);
  const editCursor = locked ? "default" : "pointer";
  // Estilo aplicado quando esta salvando — atenua a celula para feedback.
  const savingStyle: React.CSSProperties = saving
    ? { opacity: 0.5, pointerEvents: "none" }
    : {};

  const options = column.config?.options ?? [];
  const selected = options.find((o) => o.id === value);

  // ── status / dropdown: pill colorida + popover de opcoes ──
  if (column.type === "status" || column.type === "dropdown") {
    const isStatus = column.type === "status";
    return (
      <td
        ref={ref}
        style={{ ...tdStyle, ...savingStyle, padding: 2, cursor: editCursor }}
        onClick={openCell}
        title={statusLocked ? "Validado — estado final" : undefined}
      >
        {selected ? (
          isStatus ? (
            <Pill bg={selected.color ?? "#6b7280"} locked={statusLocked}>
              {selected.label}
            </Pill>
          ) : (
            <ChipDropdown option={selected} />
          )
        ) : (
          <EmptyCell />
        )}
        {open && (
          <Popover anchorRef={ref} onClose={() => setOpen(false)}>
            <OptionList
              options={options}
              currentId={typeof value === "string" ? value : null}
              onPick={(id) => {
                // Regra "nao mexer se mesma pilula": so dispara quando o
                // usuario TROCA de pilula. Escolher a mesma preserva o estado
                // V3 fino (ex: VALIDATING/CANCELLED nao viram EXECUTING/DONE).
                if (id !== value) onChange(id);
                setOpen(false);
              }}
            />
          </Popover>
        )}
      </td>
    );
  }

  // ── person ──
  if (column.type === "person") {
    // O valor guardado e o userId (string). Resolve para nome via members.
    const userId = typeof value === "string" && value ? value : null;
    const nome = userId
      ? (members?.find((m) => m.userId === userId)?.nome ?? userId)
      : null;
    return (
      <td
        ref={ref}
        style={{ ...tdStyle, ...savingStyle, textAlign: nome ? "left" : "center", cursor: editCursor }}
        onClick={openCell}
      >
        {nome ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, maxWidth: "100%" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "#7c5cff",
                color: "#fff",
                fontSize: 11,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {nome.charAt(0).toUpperCase()}
            </span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={nome}>
              {nome}
            </span>
          </span>
        ) : (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 26,
              height: 26,
              borderRadius: "50%",
              border: "1.5px dashed var(--border)",
              color: "var(--muted-foreground)",
            }}
            title="Sem responsável"
          >
            <User size={13} />
          </span>
        )}
        {open && (
          <Popover anchorRef={ref} onClose={() => setOpen(false)}>
            <PersonList
              members={members ?? []}
              currentId={userId}
              onPick={(id) => {
                onChange(id);
                setOpen(false);
              }}
            />
          </Popover>
        )}
      </td>
    );
  }

  // ── checkbox ──
  if (column.type === "checkbox") {
    return (
      <td style={{ ...tdStyle, ...savingStyle, textAlign: "center", cursor: editCursor }} onClick={locked ? undefined : () => onChange(!value)}>
        <Checkbox checked={value === true} />
      </td>
    );
  }

  // ── link ──
  if (column.type === "link") {
    return (
      <td ref={ref} style={{ ...tdStyle, textAlign: "center", cursor: editCursor }} onClick={openCell}>
        {typeof value === "string" && value ? (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ display: "inline-flex", color: "#7c5cff" }}
          >
            <GitBranch size={14} />
          </a>
        ) : (
          <span style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>
            <Link2 size={14} />
          </span>
        )}
        {open && (
          <Popover anchorRef={ref} onClose={() => setOpen(false)}>
            <div style={{ padding: 8, minWidth: 240 }}>
              <input
                autoFocus
                defaultValue={typeof value === "string" ? value : ""}
                placeholder="https://…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onChange((e.target as HTMLInputElement).value.trim() || null);
                    setOpen(false);
                  }
                  if (e.key === "Escape") setOpen(false);
                }}
                onBlur={(e) => onChange(e.target.value.trim() || null)}
                style={inputStyle}
              />
            </div>
          </Popover>
        )}
      </td>
    );
  }

  // ── date ──
  if (column.type === "date") {
    const dateText =
      typeof value === "string" && value
        ? new Date(value + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
        : "";
    return (
      <td ref={ref} style={{ ...tdStyle, ...savingStyle, textAlign: "center", cursor: editCursor, color: dateText ? "var(--foreground)" : "var(--muted-foreground)" }} onClick={openCell}>
        {dateText || "—"}
        {open && (
          <Popover anchorRef={ref} onClose={() => setOpen(false)}>
            <div style={{ padding: 8 }}>
              <input
                autoFocus
                type="date"
                defaultValue={typeof value === "string" ? value : ""}
                onChange={(e) => onChange(e.target.value || null)}
                onBlur={() => setOpen(false)}
                style={{ ...inputStyle, colorScheme: "dark" }}
              />
            </div>
          </Popover>
        )}
      </td>
    );
  }

  // ── number ──
  if (column.type === "number") {
    const display =
      value != null && value !== ""
        ? column.config?.currency
          ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: column.config.currency }).format(Number(value))
          : column.key === "sp"
            ? `${value} SP`
            : String(value)
        : "";
    return (
      <td ref={ref} style={{ ...tdStyle, textAlign: "center", cursor: editCursor }} onClick={openCell}>
        {display || <span style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>—</span>}
        {open && (
          <Popover anchorRef={ref} onClose={() => setOpen(false)}>
            <div style={{ padding: 8 }}>
              <input
                autoFocus
                type="number"
                defaultValue={value != null ? String(value) : ""}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const v = (e.target as HTMLInputElement).value;
                    onChange(v === "" ? null : Number(v));
                    setOpen(false);
                  }
                  if (e.key === "Escape") setOpen(false);
                }}
                onBlur={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
                style={inputStyle}
              />
            </div>
          </Popover>
        )}
      </td>
    );
  }

  // ── text (default) ──
  const textValue = typeof value === "string" ? value : "";
  return (
    <td style={{ ...tdStyle, color: "var(--muted-foreground)" }}>
      {readOnly ? (
        <span
          style={{
            display: "inline-block",
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: textValue ? "var(--foreground)" : "var(--muted-foreground)",
          }}
          title={textValue}
        >
          {textValue || "—"}
        </span>
      ) : (
        <EditableText
          value={textValue}
          placeholder="—"
          onCommit={(v) => onChange(v || null)}
          style={{ color: "var(--foreground)", width: "100%" }}
        />
      )}
    </td>
  );
}

/* ─── Linha "+ Adicionar tarefa" ─────────────────────────────────────────── */

function AddTaskRow({ colSpan, onAdd }: { colSpan: number; onAdd: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <tr onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <td
        colSpan={colSpan}
        style={{
          height: 38,
          borderBottom: "1px solid var(--border)",
          background: hover ? "var(--accent)" : "transparent",
          transition: "background .1s",
          padding: 0,
        }}
      >
        <button
          type="button"
          onClick={onAdd}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            height: 38,
            padding: "0 14px",
            border: 0,
            background: "none",
            color: "var(--muted-foreground)",
            fontSize: 13,
            cursor: "pointer",
            width: "100%",
            textAlign: "left",
          }}
        >
          <Plus size={14} />
          Adicionar tarefa
        </button>
      </td>
    </tr>
  );
}

/* ─── Rodape de totais ───────────────────────────────────────────────────── */

function FooterRow({
  columns,
  tasks,
  totalSp,
}: {
  columns: ColumnDef[];
  tasks: TaskModel[];
  totalSp: number;
}) {
  const td: React.CSSProperties = {
    height: 42,
    borderRight: "1px solid var(--border)",
    background: "color-mix(in srgb, var(--foreground) 2%, transparent)",
    verticalAlign: "middle",
  };

  return (
    <tfoot>
      <tr>
        <td style={{ ...td, borderRight: 0 }} />
        {columns.map((c) => {
          // barra segmentada para status/dropdown
          if (c.type === "status" || c.type === "dropdown") {
            const opts = c.config?.options ?? [];
            const colors = tasks
              .map((t) => opts.find((o) => o.id === t.fields[c.key])?.color)
              .filter((x): x is string => Boolean(x));
            return (
              <td key={c.key} style={{ ...td, padding: 8 }}>
                <SegmentBar colors={colors} />
              </td>
            );
          }
          // total para a coluna numerica
          if (c.type === "number") {
            return (
              <td key={c.key} style={{ ...td, textAlign: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
                    {totalSp} SP
                  </span>
                  <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>Total</span>
                </div>
              </td>
            );
          }
          return <td key={c.key} style={td} />;
        })}
        <td style={{ ...td, borderRight: 0 }} />
      </tr>
    </tfoot>
  );
}

/* ─── Primitivos ─────────────────────────────────────────────────────────── */

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  background: "var(--background)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  color: "var(--foreground)",
  fontSize: 13,
  padding: "7px 10px",
  outline: "none",
};

/** Texto editavel inline — clique entra em edicao; Enter/blur commitam. */
function EditableText({
  value,
  onCommit,
  placeholder,
  style,
}: {
  value: string;
  onCommit: (v: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  // Ressincroniza o draft quando o `value` externo muda, sem useEffect
  // (padrao oficial React: ajustar state durante a render comparando o
  // valor anterior). Evita o cascading render do set-state-in-effect.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setDraft(value);
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (draft.trim() !== value) onCommit(draft.trim());
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setEditing(false);
            if (draft.trim() !== value) onCommit(draft.trim());
          }
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        onClick={(e) => e.stopPropagation()}
        style={{
          ...style,
          background: "var(--background)",
          border: "1px solid #7c5cff",
          borderRadius: 4,
          padding: "2px 6px",
          outline: "none",
          font: "inherit",
        }}
      />
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter") setEditing(true);
      }}
      style={{
        ...style,
        cursor: "text",
        display: "inline-block",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        maxWidth: "100%",
      }}
      title="Clique para editar"
    >
      {value || <span style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>{placeholder ?? "—"}</span>}
    </span>
  );
}

/**
 * Pill solida que preenche a celula (Status). Quando `locked`, exibe um
 * cadeado indicando estado terminal (VALIDATED) — nao editavel.
 */
function Pill({
  bg,
  children,
  locked,
}: {
  bg: string;
  children: React.ReactNode;
  locked?: boolean;
}) {
  return (
    <div
      style={{
        height: 34,
        borderRadius: 4,
        background: bg,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        fontSize: 12,
        fontWeight: 500,
        padding: "0 8px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {locked && <Lock size={11} style={{ flexShrink: 0, opacity: 0.85 }} />}
      {children}
    </div>
  );
}

/** Chip menor para dropdown (Tipo/Epico) — borda + dot colorido. */
function ChipDropdown({ option }: { option: ColumnOption }) {
  return (
    <div
      style={{
        height: 34,
        borderRadius: 4,
        background: option.color ?? "#6b7280",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 500,
        padding: "0 8px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {option.label}
    </div>
  );
}

function EmptyCell() {
  return (
    <div
      style={{
        height: 34,
        borderRadius: 4,
        background: "color-mix(in srgb, var(--muted-foreground) 12%, transparent)",
      }}
    />
  );
}

function SegmentBar({ colors }: { colors: string[] }) {
  if (colors.length === 0) return null;
  return (
    <div style={{ display: "flex", height: 22, borderRadius: 4, overflow: "hidden" }}>
      {colors.map((c, i) => (
        <span key={i} style={{ flex: 1, background: c }} />
      ))}
    </div>
  );
}

/**
 * Checkbox visual. Quando `onChange` é fornecido, vira um botão clicável de
 * seleção (alimenta a barra de ações flutuante); sem `onChange` é apenas
 * decorativo (compatível com os usos antigos que passavam só `checked`).
 */
function Checkbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange?: (next: boolean) => void;
}) {
  const box = (
    <span
      style={{
        display: "inline-grid",
        placeItems: "center",
        width: 15,
        height: 15,
        borderRadius: 3,
        border: checked ? "none" : "1.5px solid var(--border)",
        background: checked ? "#7c5cff" : "transparent",
      }}
    >
      {checked && <Check size={11} color="#fff" strokeWidth={3} />}
    </span>
  );

  if (!onChange) return box;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={checked ? "Desmarcar" : "Selecionar"}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      style={{
        display: "inline-grid",
        placeItems: "center",
        border: 0,
        background: "none",
        padding: 0,
        cursor: "pointer",
      }}
    >
      {box}
    </button>
  );
}

/** Lista de opcoes (status/dropdown) dentro de um popover. */
function OptionList({
  options,
  currentId,
  onPick,
}: {
  options: ColumnOption[];
  currentId: string | null;
  onPick: (id: string) => void;
}) {
  return (
    <div style={{ padding: 4, minWidth: 180 }}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onPick(o.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "7px 10px",
            borderRadius: 5,
            border: 0,
            background: o.id === currentId ? "rgba(124,92,255,0.12)" : "none",
            color: "var(--foreground)",
            fontSize: 13,
            cursor: "pointer",
            textAlign: "left",
          }}
          onMouseEnter={(e) => {
            if (o.id !== currentId) e.currentTarget.style.background = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            if (o.id !== currentId) e.currentTarget.style.background = "none";
          }}
        >
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: o.color ?? "#6b7280", flexShrink: 0 }} />
          {o.label}
          {o.id === currentId && <Check size={14} color="#7c5cff" style={{ marginLeft: "auto" }} />}
        </button>
      ))}
    </div>
  );
}

/**
 * Lista de membros do projeto dentro de um popover (editor da coluna
 * `person`). Inclui a opcao "Sem responsavel" (envia "" → o handler trata
 * como null/limpar). `onPick` recebe o userId escolhido.
 */
function PersonList({
  members,
  currentId,
  onPick,
}: {
  members: MemberLike[];
  currentId: string | null;
  onPick: (id: string) => void;
}) {
  const row: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "7px 10px",
    borderRadius: 5,
    border: 0,
    color: "var(--foreground)",
    fontSize: 13,
    cursor: "pointer",
    textAlign: "left",
  };
  return (
    <div style={{ padding: 4, minWidth: 200, maxHeight: 320, overflowY: "auto" }}>
      {/* Sem responsavel */}
      <button
        type="button"
        onClick={() => onPick("")}
        style={{ ...row, background: !currentId ? "rgba(124,92,255,0.12)" : "none" }}
        onMouseEnter={(e) => {
          if (currentId) e.currentTarget.style.background = "var(--accent)";
        }}
        onMouseLeave={(e) => {
          if (currentId) e.currentTarget.style.background = "none";
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 22,
            height: 22,
            borderRadius: "50%",
            border: "1.5px dashed var(--border)",
            color: "var(--muted-foreground)",
            flexShrink: 0,
          }}
        >
          <User size={12} />
        </span>
        <span style={{ color: "var(--muted-foreground)" }}>Sem responsável</span>
        {!currentId && <Check size={14} color="#7c5cff" style={{ marginLeft: "auto" }} />}
      </button>

      {members.length === 0 ? (
        <div style={{ padding: "8px 10px", fontSize: 12, color: "var(--muted-foreground)" }}>
          Nenhum membro no projeto.
        </div>
      ) : (
        members.map((m) => (
          <button
            key={m.userId}
            type="button"
            onClick={() => onPick(m.userId)}
            style={{ ...row, background: m.userId === currentId ? "rgba(124,92,255,0.12)" : "none" }}
            onMouseEnter={(e) => {
              if (m.userId !== currentId) e.currentTarget.style.background = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              if (m.userId !== currentId) e.currentTarget.style.background = "none";
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "#7c5cff",
                color: "#fff",
                fontSize: 11,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {m.nome.charAt(0).toUpperCase()}
            </span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {m.nome}
            </span>
            {m.userId === currentId && <Check size={14} color="#7c5cff" style={{ marginLeft: "auto" }} />}
          </button>
        ))
      )}
    </div>
  );
}

/* ─── Popover ancorado (via portal, escapa do overflow da tabela) ────────── */

function Popover({
  anchorRef,
  onClose,
  align = "left",
  children,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  align?: "left" | "right";
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: align === "right" ? r.right : r.left });
  }, [anchorRef, align]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current?.contains(e.target as Node)) return;
      if (anchorRef.current?.contains(e.target as Node)) return;
      onClose();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [anchorRef, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={ref}
      style={{
        position: "fixed",
        top: pos.top,
        left: align === "right" ? undefined : pos.left,
        right: align === "right" ? `calc(100vw - ${pos.left}px)` : undefined,
        zIndex: 99999,
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        boxShadow: "0 8px 24px rgba(0,0,0,.4)",
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
