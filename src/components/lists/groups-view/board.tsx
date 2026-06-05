"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  GripVertical,
  Layers,
  Plus,
  Trash2,
} from "lucide-react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  type ColumnDef,
  type FieldValue,
  type GroupModel,
  type GroupsBoard,
} from "@/lib/types/table-fields";
import { SEM_BLOCO_ID } from "@/lib/mappers/groups-from-tasks";
import type { MemberLike } from "@/lib/mappers/groups-from-tasks";
import { Popover } from "./cells";
import { EditableText } from "./cells";
import {
  HeadRow,
  BLOCK_COLORS,
  W_CHECK,
  W_PLUS,
  colWidth,
} from "./columns";
import { AddTaskRow, FooterRow, TaskRow } from "./rows";
import type {
  AddColumnHandler,
  ArchiveColumnHandler,
  ArchivedColumn,
  RemoveColumnHandler,
  RenameColumnHandler,
  ReorderColumnHandler,
  SubtarefasMode,
  UpdateColumnOptionsHandler,
} from "./types";

/* ─── GroupsBoardView ───────────────────────────────────────────────────── */

/**
 * Renderiza o board completo de grupos com todas as funcionalidades:
 * criação de grupos, drag & drop de blocos, edição inline de tarefas,
 * subtarefas inline e gerenciamento do schema de colunas.
 *
 * @param board             - Board construído por `buildGroupsBoard`.
 * @param readOnly          - Quando true, desabilita a edição inline das cells.
 * @param projectId         - Quando presente, habilita subtarefas inline.
 * @param onReorderGroups   - Reordena os blocos. Recebe os ids dos blocos reais na nova ordem.
 * @param onRemoveColumn    - Remove uma coluna custom do schema da lista.
 */
export function GroupsBoardView({
  board,
  readOnly,
  members,
  savingTaskId,
  savingGroupId,
  projectId,
  subtarefasMode,
  onOpenTask,
  onEditField,
  onRenameGroup,
  onRecolorGroup,
  onReorderGroups,
  onDeleteGroup,
  onAddGroup,
  onAddTask,
  onReorderTasks,
  onAddColumn,
  onRenameColumn,
  onRemoveColumn,
  onUpdateColumnOptions,
  onReorderColumn,
  onArchiveColumn,
  onRestoreColumn,
  archivedColumns,
}: {
  board: GroupsBoard;
  readOnly: boolean;
  members?: MemberLike[];
  savingTaskId?: string | null;
  savingGroupId?: string | null;
  /** ID do projeto — quando presente, habilita subtarefas inline nos grupos. */
  projectId?: string;
  /** Modo de exibição de subtarefas (toolbar) — propagado às linhas. */
  subtarefasMode?: SubtarefasMode;
  /** Abre a TaskSheet compartilhada para o `taskId`. */
  onOpenTask?: (taskId: string) => void;
  onEditField?: (taskId: string, columnKey: string, value: FieldValue) => void;
  onRenameGroup?: (groupId: string, nome: string) => void;
  /** Altera a cor do bloco. Quando presente, o header mostra o seletor de cor. */
  onRecolorGroup?: (groupId: string, cor: string) => void;
  /** Reordena os blocos. Recebe os ids dos blocos reais na nova ordem. */
  onReorderGroups?: (orderedBlockIds: string[]) => void;
  /** Exclui o bloco. Quando presente, o header mostra a lixeira (exceto "Sem bloco"). */
  onDeleteGroup?: (groupId: string, nome: string, taskCount: number) => void;
  onAddGroup?: () => void;
  onAddTask?: (groupId: string) => void;
  /** Reordena as tasks de um bloco. Recebe o groupId e os ids na nova ordem. */
  onReorderTasks?: (groupId: string, orderedTaskIds: string[]) => void;
  onAddColumn?: AddColumnHandler;
  onRenameColumn?: RenameColumnHandler;
  onRemoveColumn?: RemoveColumnHandler;
  onUpdateColumnOptions?: UpdateColumnOptionsHandler;
  onReorderColumn?: ReorderColumnHandler;
  onArchiveColumn?: ArchiveColumnHandler;
  onRestoreColumn?: ArchiveColumnHandler;
  archivedColumns?: ArchivedColumn[];
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
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              padding: "80px 24px",
              textAlign: "center",
            }}
          >
            {/* ícone num círculo suave */}
            <div
              style={{
                display: "grid",
                placeItems: "center",
                width: 72,
                height: 72,
                borderRadius: 20,
                background:
                  "linear-gradient(135deg, color-mix(in oklab, var(--primary) 22%, transparent), color-mix(in oklab, var(--primary) 8%, transparent))",
                color: "var(--primary)",
                boxShadow: "0 0 0 1px color-mix(in oklab, var(--primary) 18%, transparent)",
              }}
            >
              <Layers size={32} strokeWidth={1.6} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 360 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 600,
                  color: "var(--foreground)",
                }}
              >
                Comece organizando em blocos
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: "var(--muted-foreground)",
                }}
              >
                Blocos agrupam suas tarefas por etapa, status ou o que fizer sentido.
                Crie o primeiro para começar a planejar.
              </p>
            </div>

            {onAddGroup && (
              <button
                type="button"
                onClick={onAddGroup}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  height: 40,
                  padding: "0 20px",
                  borderRadius: 10,
                  border: "none",
                  background: "var(--primary)",
                  color: "var(--primary-foreground)",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px color-mix(in oklab, var(--primary) 35%, transparent)",
                  transition: "transform 0.12s ease, box-shadow 0.12s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 20px color-mix(in oklab, var(--primary) 45%, transparent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 14px color-mix(in oklab, var(--primary) 35%, transparent)";
                }}
              >
                <Plus size={16} strokeWidth={2.5} />
                Criar primeiro bloco
              </button>
            )}
          </div>
        ) : (
          <SortableGroupList
            groups={board.groups}
            onReorderGroups={onReorderGroups}
            renderGroup={(g) => (
              <GroupBox
                group={g}
                columns={cols}
                register={register}
                onSyncScroll={syncScroll}
                readOnly={readOnly}
                members={members}
                savingTaskId={savingTaskId}
                savingGroup={savingGroupId === g.id}
                projectId={projectId}
                subtarefasMode={subtarefasMode}
                onOpenTask={onOpenTask}
                onEditField={onEditField}
                onRenameGroup={onRenameGroup}
                onRecolorGroup={onRecolorGroup}
                onDeleteGroup={onDeleteGroup}
                onAddTask={onAddTask}
                onReorderTasks={onReorderTasks}
                onAddColumn={onAddColumn}
                onRenameColumn={onRenameColumn}
                onRemoveColumn={onRemoveColumn}
                onUpdateColumnOptions={onUpdateColumnOptions}
                onReorderColumn={onReorderColumn}
                onArchiveColumn={onArchiveColumn}
                onRestoreColumn={onRestoreColumn}
                archivedColumns={archivedColumns}
              />
            )}
          />
        )}

        {/* adicionar grupo — aparece quando ha handler (cria Bloco no backend).
            Independe de readOnly. Escondido no empty state, pois o botao
            "Criar primeiro bloco" ja cumpre esse papel de forma evidente. */}
        {onAddGroup && board.groups.length > 0 && (
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

/* ─── Reordenacao de blocos (drag & drop) ───────────────────────────────── */

/**
 * Renderiza a lista de grupos permitindo reordenar os blocos reais por drag.
 * O grupo sintetico "Sem bloco" (SEM_BLOCO_ID) nao e arrastavel e fica fixo
 * no fim. DnD so liga com `onReorderGroups` e 2+ blocos reais.
 */
export function SortableGroupList({
  groups,
  onReorderGroups,
  renderGroup,
}: {
  groups: GroupModel[];
  onReorderGroups?: (orderedBlockIds: string[]) => void;
  renderGroup: (group: GroupModel) => React.ReactNode;
}) {
  const realGroups = groups.filter((g) => g.id !== SEM_BLOCO_ID);
  const semBloco = groups.filter((g) => g.id === SEM_BLOCO_ID);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const dndEnabled = !!onReorderGroups && realGroups.length > 1;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = realGroups.map((g) => g.id);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    onReorderGroups?.(arrayMove(ids, from, to));
  }

  if (!dndEnabled) {
    return (
      <>
        {groups.map((g) => (
          <div key={g.id} className="min-w-0">
            {renderGroup(g)}
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={realGroups.map((g) => g.id)}
          strategy={verticalListSortingStrategy}
        >
          {realGroups.map((g) => (
            <SortableGroup key={g.id} id={g.id}>
              {renderGroup(g)}
            </SortableGroup>
          ))}
        </SortableContext>
      </DndContext>
      {semBloco.map((g) => (
        <div key={g.id} className="min-w-0">
          {renderGroup(g)}
        </div>
      ))}
    </>
  );
}

/** Wrapper sortable de um bloco: handle de arraste (grip) à esquerda. */
export function SortableGroup({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
      className="group/sortable flex min-w-0 items-start gap-1.5"
    >
      <button
        type="button"
        aria-label="Arrastar para reordenar bloco"
        {...attributes}
        {...listeners}
        className="mt-2 shrink-0 cursor-grab rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent active:cursor-grabbing group-hover/sortable:opacity-100"
      >
        <GripVertical size={16} />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/* ─── GroupBox ───────────────────────────────────────────────────────────── */

export function GroupBox({
  group,
  columns,
  register,
  onSyncScroll,
  readOnly,
  members,
  savingTaskId,
  savingGroup,
  projectId,
  subtarefasMode,
  onOpenTask,
  onEditField,
  onRenameGroup,
  onRecolorGroup,
  onDeleteGroup,
  onAddTask,
  onReorderTasks,
  onAddColumn,
  onRenameColumn,
  onRemoveColumn,
  onUpdateColumnOptions,
  onReorderColumn,
  onArchiveColumn,
  onRestoreColumn,
  archivedColumns,
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
  /** Modo de exibição de subtarefas (toolbar) — propagado às linhas. */
  subtarefasMode?: SubtarefasMode;
  /** Abre a TaskSheet compartilhada para o `taskId`. */
  onOpenTask?: (taskId: string) => void;
  onEditField?: (taskId: string, columnKey: string, value: FieldValue) => void;
  onRenameGroup?: (groupId: string, nome: string) => void;
  onRecolorGroup?: (groupId: string, cor: string) => void;
  onDeleteGroup?: (groupId: string, nome: string, taskCount: number) => void;
  onAddTask?: (groupId: string) => void;
  /** Reordena as tasks do bloco. Recebe o groupId e os ids na nova ordem. */
  onReorderTasks?: (groupId: string, orderedTaskIds: string[]) => void;
  onAddColumn?: AddColumnHandler;
  onRenameColumn?: RenameColumnHandler;
  onRemoveColumn?: RemoveColumnHandler;
  onUpdateColumnOptions?: UpdateColumnOptionsHandler;
  onReorderColumn?: ReorderColumnHandler;
  onArchiveColumn?: ArchiveColumnHandler;
  onRestoreColumn?: ArchiveColumnHandler;
  archivedColumns?: ArchivedColumn[];
}) {
  const [open, setOpen] = useState(true);
  const [headerHovered, setHeaderHovered] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Lixeira no header so para bloco real (nao para o sintetico "Sem bloco").
  const canDelete = !!onDeleteGroup && group.id !== SEM_BLOCO_ID;

  // Registra/desregistra este container no pool de scroll sincronizado.
  useEffect(() => {
    const el = scrollerRef.current;
    register(el);
    return () => register(null, el);
    // re-registra quando abre/fecha (o no muda de existencia)
  }, [register, open]);

  // ── Reorder de colunas custom (drag no header) ──
  // O DndContext fica AQUI, envolvendo a <table> — NUNCA dentro da <tr>, pois
  // o DndContext renderiza <div>s (wrapper + nos de acessibilidade) que, como
  // filhos diretos de <tr>, viram celulas-fantasma e criam uma coluna vazia.
  // O SortableContext (context puro, sem DOM) permanece dentro do HeadRow.
  const colSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const columnKeys = columns.map((c) => c.key);
  const reorderable = !!onReorderColumn && columnKeys.length > 1;

  // Ids das tasks raiz do bloco — base do SortableContext vertical das linhas.
  const taskIds = group.tasks.map((t) => t.id);
  const rowsReorderable = !!onReorderTasks && taskIds.length > 1;

  // Um unico DndContext (envolve a <table>) cuida tanto do reorder de colunas
  // (horizontal) quanto de linhas (vertical). O handler roteia pelo id ativo:
  // se bate com uma coluna → reordena colunas; se bate com uma task → reordena
  // linhas. Conjuntos de ids disjuntos, entao nao ha ambiguidade.
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const colFrom = columnKeys.indexOf(active.id as string);
    const colTo = columnKeys.indexOf(over.id as string);
    if (colFrom !== -1 && colTo !== -1) {
      onReorderColumn?.(arrayMove(columnKeys, colFrom, colTo));
      return;
    }

    const rowFrom = taskIds.indexOf(active.id as string);
    const rowTo = taskIds.indexOf(over.id as string);
    if (rowFrom !== -1 && rowTo !== -1) {
      onReorderTasks?.(group.id, arrayMove(taskIds, rowFrom, rowTo));
    }
  }

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

  // largura minima da tabela = soma das colunas reais (checkbox + colunas).
  // NAO inclui o "+": sua <col> e auto e absorve o espaco que sobrar ate a
  // borda. Quando a soma ultrapassa o container, surge scroll horizontal
  // (tableLayout fixed respeita as <col>); quando ha poucas colunas, a tabela
  // estica ate 100% e o "+" estica junto, colado na ultima coluna (Monday).
  // Reserva W_PLUS para a coluna "+": no overflow (container < soma das colunas)
  // o minWidth garante esse naco extra, entao a <col> auto recebe ao menos
  // W_PLUS em vez de colapsar para 0px. Com espaco sobrando, a coluna "+"
  // continua esticando normalmente (Monday) — o minWidth so atua no aperto.
  const tableMinWidth =
    W_CHECK + columns.reduce((s, c) => s + colWidth(c), 0) + W_PLUS;

  return (
    <section>
      {/* cabecalho do grupo */}
      <header
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
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

        {/* Seletor de cor do bloco — so no modo backend (bloco real). O grupo
            sintetico "Sem bloco" nao tem seletor, mas reserva o mesmo espaco
            (14px) para que o titulo fique alinhado com os blocos reais. */}
        {onRecolorGroup &&
          (group.id !== SEM_BLOCO_ID ? (
            <GroupColorPicker
              color={group.cor}
              disabled={savingGroup}
              onPick={(cor) => onRecolorGroup(group.id, cor)}
            />
          ) : (
            <span style={{ width: 14, flexShrink: 0 }} aria-hidden />
          ))}

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
          // Read-only puro (ou grupo sintetico "Sem bloco").
          return <span style={titleStyle}>{group.nome}</span>;
        })()}

        <span
          style={{
            fontSize: 12,
            color: "var(--muted-foreground)",
            marginLeft: 2,
          }}
        >
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

        {/* Lixeira do bloco — revelada no hover do header (bloco real apenas).
            As tarefas do bloco NAO sao excluidas: voltam para "Sem bloco". */}
        {canDelete && (
          <button
            type="button"
            onClick={() =>
              onDeleteGroup!(group.id, group.nome, group.tasks.length)
            }
            aria-label="Excluir bloco"
            title="Excluir bloco"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 24,
              height: 24,
              border: 0,
              borderRadius: 6,
              background: "none",
              color: "var(--muted-foreground)",
              cursor: "pointer",
              opacity: headerHovered ? 1 : 0,
              transition: "opacity .15s, color .15s, background .15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ef4444";
              e.currentTarget.style.background = "rgba(239,68,68,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--muted-foreground)";
              e.currentTarget.style.background = "none";
            }}
          >
            <Trash2 size={15} />
          </button>
        )}

        {group.periodo && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 12,
              color: "var(--muted-foreground)",
            }}
          >
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
          <DndContext
            sensors={colSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table
              style={{
                width: "100%",
                minWidth: tableMinWidth,
                borderCollapse: "collapse",
                tableLayout: "fixed",
              }}
            >
              <colgroup>
                <col style={{ width: W_CHECK }} />
                {columns.map((c) => (
                  <col key={c.key} style={{ width: colWidth(c) }} />
                ))}
                {/* coluna do "+" SEM largura (auto puro, igual a sub-tabela):
                  absorve TODO o espaco restante ate a borda direita, fazendo o
                  "+" ser a ultima coluna que se estica (estilo Monday). Reservar
                  minWidth aqui criava uma "meia coluna" sobrando. */}
                <col />
              </colgroup>

              <HeadRow
                columns={columns}
                groupTaskIds={group.tasks.map((t) => t.id)}
                reorderableKeys={reorderable ? columnKeys : undefined}
                onAddColumn={onAddColumn}
                onRenameColumn={onRenameColumn}
                onRemoveColumn={onRemoveColumn}
                onUpdateColumnOptions={onUpdateColumnOptions}
                onArchiveColumn={onArchiveColumn}
                onRestoreColumn={onRestoreColumn}
                archivedColumns={archivedColumns}
              />

              <tbody>
                {/* SortableContext e context puro (nao renderiza DOM), entao
                    pode viver dentro do <tbody> sem criar linhas-fantasma. */}
                <SortableContext
                  items={taskIds}
                  strategy={verticalListSortingStrategy}
                >
                  {group.tasks.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      columns={columns}
                      readOnly={readOnly}
                      members={members}
                      saving={savingTaskId === t.id}
                      projectId={projectId}
                      subtarefasMode={subtarefasMode}
                      groupColor={group.cor}
                      subtaskColSpan={columns.length + 2}
                      sortable={rowsReorderable}
                      onOpenTask={onOpenTask}
                      onEditField={onEditField}
                    />
                  ))}
                </SortableContext>
                {onAddTask && (
                  <AddTaskRow
                    colSpan={columns.length + 2}
                    onAdd={() => onAddTask(group.id)}
                  />
                )}
              </tbody>

              <FooterRow
                columns={columns}
                tasks={group.tasks}
                totalSp={totalSp}
              />
            </table>
          </DndContext>
        </div>
      )}
    </section>
  );
}

/* ─── Seletor de cor do bloco ────────────────────────────────────────────── */

/**
 * Gatilho + popover de selecao de cor de um bloco. O gatilho e um quadrado da
 * cor atual; ao clicar, abre uma paleta. Escolher dispara `onPick(cor)`.
 *
 * @param color    - Cor atual do bloco (destaca a opcao selecionada).
 * @param onPick   - Callback com a cor hex escolhida.
 * @param disabled - Enquanto salva, desativa o gatilho.
 */
export function GroupColorPicker({
  color,
  onPick,
  disabled,
}: {
  color: string;
  onPick: (cor: string) => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label="Alterar cor do bloco"
        title="Alterar cor do bloco"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 14,
          height: 14,
          borderRadius: 4,
          border:
            "1px solid color-mix(in srgb, var(--foreground) 20%, transparent)",
          background: color,
          cursor: disabled ? "default" : "pointer",
          flexShrink: 0,
          padding: 0,
          opacity: disabled ? 0.5 : 1,
        }}
      />
      {open && (
        <Popover anchorRef={ref} onClose={() => setOpen(false)}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 6,
              padding: 10,
            }}
          >
            {BLOCK_COLORS.map((c) => {
              const selected = c.toLowerCase() === color.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  aria-label={`Cor ${c}`}
                  onClick={() => {
                    if (c.toLowerCase() !== color.toLowerCase()) onPick(c);
                    setOpen(false);
                  }}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: c,
                    border: selected
                      ? "2px solid var(--foreground)"
                      : "1px solid transparent",
                    cursor: "pointer",
                    padding: 0,
                    display: "inline-grid",
                    placeItems: "center",
                  }}
                >
                  {selected && <Check size={12} color="#fff" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </Popover>
      )}
    </>
  );
}
