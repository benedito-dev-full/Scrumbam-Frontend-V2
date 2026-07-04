"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Calendar as CalendarIcon,
  CheckSquare,
  CircleDot,
  CircleUser,
  EyeOff,
  Eye,
  Hash,
  Link2,
  List as ListIcon,
  Plus,
  Trash2,
  Type,
} from "lucide-react";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  COLUMN_TYPE_LABEL,
  type ColumnDef,
  type ColumnOption,
  type ColumnType,
} from "@/lib/types/table-fields";
import { makeOptionId } from "@/lib/table-fields/schema-ops";
import { Checkbox, Popover, inputStyle } from "./cells";
import { useSelection } from "./selection";
import type {
  AddColumnHandler,
  ArchiveColumnHandler,
  ArchivedColumn,
  RemoveColumnHandler,
  RenameColumnHandler,
  UpdateColumnOptionsHandler,
} from "./types";

/* ─── Icone por tipo de coluna ───────────────────────────────────────────── */

export const TYPE_ICON: Record<
  ColumnType,
  React.ComponentType<{ size?: number }>
> = {
  text: Type,
  number: Hash,
  date: CalendarIcon,
  person: CircleUser,
  status: CircleDot,
  checkbox: CheckSquare,
  dropdown: ListIcon,
  link: Link2,
};

/* ─── Paleta de cores dos blocos (compartilhada com columns/board) ────────── */

/** Paleta de cores disponiveis para os blocos (estilo Monday/ClickUp). */
export const BLOCK_COLORS: string[] = [
  "#7c5cff", // roxo (default)
  "#e0457b", // rosa/magenta
  "#3b82f6", // azul
  "#10b981", // verde
  "#f59e0b", // ambar
  "#ef4444", // vermelho
  "#06b6d4", // ciano
  "#8b5cf6", // violeta claro
  "#ec4899", // pink
  "#22c55e", // verde claro
  "#f97316", // laranja
  "#6b7280", // cinza
];

/* ─── Larguras das colunas ───────────────────────────────────────────────── */

export const W_CHECK = 36;
export const W_NOME = 360;
export const W_DEFAULT = 150;
/** Largura minima reservada para a coluna "+" (auto). Garante que ela nunca
 *  colapse para 0px quando a tabela transborda (ex.: zoom alto encolhe o
 *  container abaixo do minWidth e nao sobra espaco para a coluna auto). */
export const W_PLUS = 48;

/** Largura da coluna de nome da subtarefa. */
export const W_SUBTASK_NOME = 280;
/** Largura da coluna de responsavel da subtarefa. */
export const W_SUBTASK_RESP = 130;
/** Largura da coluna de status da subtarefa. */
export const W_SUBTASK_STATUS = 140;
/** Largura da coluna de data da subtarefa. */
export const W_SUBTASK_DATE = 110;
/** Largura da coluna de prioridade da subtarefa. */
export const W_SUBTASK_PRIORITY = 120;
/** Largura da coluna de tempo gasto da subtarefa (timer inline). */
export const W_SUBTASK_TIME = 110;
// Nota: a coluna "+" da sub-tabela usa largura `auto` (absorve o espaco
// restante para o grid ir ate o fim), por isso nao ha constante de largura
// fixa para ela nem largura total — a tabela ocupa 100% do container.

export function colWidth(c: ColumnDef): number {
  if (c.builtin) return W_NOME;
  if (c.type === "person") return 150;
  if (c.type === "number") return 130;
  if (c.type === "link") return 150;
  if (c.type === "text") return 130;
  return W_DEFAULT;
}

/* ─── Handle de redimensionamento de coluna ──────────────────────────────── */

/**
 * Largura minima que uma coluna pode assumir no resize (nunca colapsa). Mantida
 * em sincronia com `MIN_COL_W` do hook `use-column-widths` (fonte da regra).
 */
const RESIZE_MIN_W = 60;

/**
 * Alca fina na borda DIREITA do `<th>` que redimensiona a coluna por drag
 * (estilo planilha). Vive posicionada em absolute dentro do `<th>` (que e
 * `position: relative`), por isso NAO participa do fluxo do titulo nem do
 * punho de reorder — e `stopPropagation` no mousedown impede que o gesto de
 * arraste vire reorder ou abra o menu da coluna.
 *
 * @param columnKey    - Key da coluna alvo do resize.
 * @param currentWidth - Largura efetiva atual (base do calculo do arraste).
 * @param onResize     - Persiste a nova largura (px) da coluna.
 */
function ColumnResizeHandle({
  columnKey,
  currentWidth,
  onResize,
}: {
  columnKey: string;
  currentWidth: number;
  onResize: (key: string, width: number) => void;
}) {
  const [active, setActive] = useState(false);

  function handleMouseDown(e: React.MouseEvent) {
    // Impede que o mousedown dispare o drag de reorder (dnd-kit) ou o menu.
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startW = currentWidth;
    setActive(true);

    // Evita selecao de texto e mantem o cursor de resize durante o arraste.
    const prevUserSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    const onMove = (ev: MouseEvent) => {
      const next = Math.max(RESIZE_MIN_W, startW + (ev.clientX - startX));
      onResize(columnKey, next);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.userSelect = prevUserSelect;
      document.body.style.cursor = prevCursor;
      setActive(false);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <span
      role="separator"
      aria-orientation="vertical"
      aria-label="Redimensionar coluna"
      onMouseDown={handleMouseDown}
      // Nao propaga o clique para o botao do titulo (evita abrir/fechar menu).
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        top: 0,
        right: -2,
        width: 6,
        height: "100%",
        cursor: "col-resize",
        // Discreto: linha sutil so no hover/arraste, transparente em repouso.
        background: active
          ? "var(--primary, #7c5cff)"
          : "transparent",
        transition: "background .12s",
        zIndex: 3,
        touchAction: "none",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "var(--border)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    />
  );
}

/* ─── Cabecalho de colunas ───────────────────────────────────────────────── */

export function HeadRow({
  columns,
  groupTaskIds,
  reorderableKeys,
  onAddColumn,
  onRenameColumn,
  onRemoveColumn,
  onUpdateColumnOptions,
  onArchiveColumn,
  onRestoreColumn,
  archivedColumns,
  effectiveWidth,
  onResizeColumn,
}: {
  columns: ColumnDef[];
  /** IDs das tasks raiz do grupo — alimenta o "selecionar tudo" do header. */
  groupTaskIds?: string[];
  /**
   * Keys de colunas arrastaveis (na ordem atual). Quando presente (>1 coluna),
   * habilita o SortableContext. O DndContext fica no GroupBox (fora da tabela)
   * — aqui so o SortableContext, que e context puro e NAO renderiza DOM, por
   * isso pode ficar dentro da <tr> sem criar celulas-fantasma.
   */
  reorderableKeys?: string[];
  onAddColumn?: AddColumnHandler;
  onRenameColumn?: RenameColumnHandler;
  onRemoveColumn?: RemoveColumnHandler;
  onUpdateColumnOptions?: UpdateColumnOptionsHandler;
  onArchiveColumn?: ArchiveColumnHandler;
  onRestoreColumn?: ArchiveColumnHandler;
  /** Colunas arquivadas (hidden) — alimentam o menu de restauração. */
  archivedColumns?: ArchivedColumn[];
  /**
   * Largura efetiva de uma coluna (override custom ou default). Quando presente
   * junto de `onResizeColumn`, habilita a alca de resize no header. Usada para
   * calcular a base do arraste, mantendo o colgroup como fonte unica.
   */
  effectiveWidth?: (c: ColumnDef) => number;
  /** Persiste a nova largura (px) de uma coluna. Habilita o resize por drag. */
  onResizeColumn?: (key: string, width: number) => void;
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

  const reorderable = !!reorderableKeys && reorderableKeys.length > 1;

  // Resize so ativa com ambos os inputs (largura efetiva + handler de persistir).
  const resizable = !!effectiveWidth && !!onResizeColumn;

  const headerCells = (
    <>
      {columns.map((c) => {
        const resize = resizable
          ? {
              currentWidth: effectiveWidth!(c),
              onResize: onResizeColumn!,
            }
          : undefined;
        // Com handler de rename: TODA coluna ganha o header editável.
        // - Custom (builtin === false): renomear + arquivar + remover.
        // - Builtin: renomear + arquivar (NUNCA remover — campo de sistema).
        if (onRenameColumn) {
          const isCustom = c.builtin === false;
          return (
            <ColumnHeader
              key={c.key}
              column={c}
              thStyle={th}
              onRenameColumn={onRenameColumn}
              removable={isCustom}
              onRemoveColumn={isCustom ? onRemoveColumn : undefined}
              onUpdateColumnOptions={onUpdateColumnOptions}
              archivable={!!onArchiveColumn}
              onArchiveColumn={onArchiveColumn}
              sortable={reorderable}
              resize={resize}
            />
          );
        }

        // Sem handler (modo read-only puro): header estático.
        return (
          <PlainColumnHeader
            key={c.key}
            column={c}
            thStyle={th}
            sortable={reorderable}
            resize={resize}
          />
        );
      })}
    </>
  );

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
        {reorderable ? (
          <SortableContext
            items={reorderableKeys!}
            strategy={horizontalListSortingStrategy}
          >
            {headerCells}
          </SortableContext>
        ) : (
          headerCells
        )}
        {/* Coluna do "+" — alinhada a ESQUERDA (igual a sub-tabela) para o
            botao colar logo apos a ultima coluna; a coluna estica ate a borda
            absorvendo o espaco livre, sem deixar vao destacado no meio.
            padding 0: o botao interno assume o padding e ocupa o <th> inteiro,
            tornando todo o cabecalho clicavel para abrir "Nova coluna". */}
        <th style={{ ...th, textAlign: "left", padding: 0 }}>
          {onAddColumn && (
            <AddColumnButton
              onAddColumn={onAddColumn}
              archivedColumns={archivedColumns}
              onRestoreColumn={onRestoreColumn}
            />
          )}
        </th>
      </tr>
    </thead>
  );
}

/** Header de coluna fixa/read-only: arrastavel, mas sem menu de schema. */
export function PlainColumnHeader({
  column,
  thStyle,
  sortable,
  resize,
}: {
  column: ColumnDef;
  thStyle: React.CSSProperties;
  sortable?: boolean;
  /** Quando presente, renderiza a alca de resize na borda direita do `<th>`. */
  resize?: {
    currentWidth: number;
    onResize: (key: string, width: number) => void;
  };
}) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.key, disabled: !sortable });

  const dragStyle: React.CSSProperties = sortable
    ? {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 5 : undefined,
        position: "relative",
      }
    : {};

  return (
    <th
      ref={sortable ? setNodeRef : undefined}
      style={{
        ...thStyle,
        ...dragStyle,
        // `relative` e necessario para ancorar a alca de resize (absolute).
        // O dragStyle ja aplica `relative` quando sortable; garantimos aqui
        // para o caso nao-sortable tambem.
        position: "relative",
        textAlign: column.builtin ? "left" : "center",
        paddingLeft: column.builtin ? 4 : 8,
      }}
    >
      <span
        {...(sortable ? attributes : {})}
        {...(sortable ? listeners : {})}
        style={{
          cursor: sortable ? (isDragging ? "grabbing" : "grab") : undefined,
          touchAction: sortable ? "none" : undefined,
        }}
      >
        {column.label}
      </span>
      {resize && (
        <ColumnResizeHandle
          columnKey={column.key}
          currentWidth={resize.currentWidth}
          onResize={resize.onResize}
        />
      )}
    </th>
  );
}

/** Header de coluna custom — editavel (renomear), removivel e arrastavel. */
export function ColumnHeader({
  column,
  thStyle,
  onRenameColumn,
  onRemoveColumn,
  onUpdateColumnOptions,
  onArchiveColumn,
  removable = true,
  archivable = false,
  sortable,
  resize,
}: {
  column: ColumnDef;
  thStyle: React.CSSProperties;
  onRenameColumn: RenameColumnHandler;
  /** Remove a coluna do schema (só custom). Opcional quando `removable=false`. */
  onRemoveColumn?: RemoveColumnHandler;
  /** Atualiza as opções (status/dropdown). Ativa o editor de opções no menu. */
  onUpdateColumnOptions?: UpdateColumnOptionsHandler;
  /** Arquiva (oculta) a coluna — disponível para builtin e custom. */
  onArchiveColumn?: ArchiveColumnHandler;
  /** Mostra "Remover coluna" (só custom). Default true. */
  removable?: boolean;
  /** Mostra "Arquivar coluna". Default false. */
  archivable?: boolean;
  /** Quando true, o header pode ser arrastado para reordenar a coluna. */
  sortable?: boolean;
  /** Quando presente, renderiza a alca de resize na borda direita do `<th>`. */
  resize?: {
    currentWidth: number;
    onResize: (key: string, width: number) => void;
  };
}) {
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const handledRenameRef = useRef(false);

  // Colunas status/dropdown ganham o editor de opcoes no menu.
  const isSelectable = column.type === "status" || column.type === "dropdown";

  // Sortable: o sensor (distance 6px) garante que o clique para abrir o menu
  // ainda funciona; so vira arraste apos o gesto. `attributes`/`listeners`
  // vao no proprio botao do titulo (o titulo e o punho de arraste).
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.key, disabled: !sortable });

  useEffect(() => {
    if (menu) handledRenameRef.current = false;
  }, [menu]);

  function commitRename(value: string) {
    handledRenameRef.current = true;
    const nextLabel = value.trim() || column.label;
    if (nextLabel === column.label) return;
    onRenameColumn(column.key, nextLabel);
  }

  function removeColumn() {
    onRemoveColumn?.(column.key);
  }

  function archiveColumn() {
    onArchiveColumn?.(column.key);
  }

  // Em repouso, identico ao original. Durante o arraste: segue o ponteiro
  // (transform) com leve realce/fantasma — pista visual aparece so no drag.
  const dragStyle: React.CSSProperties = sortable
    ? {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 5 : undefined,
        position: "relative",
      }
    : {};

  return (
    <th
      ref={sortable ? setNodeRef : undefined}
      style={{
        ...thStyle,
        ...dragStyle,
        // `relative` ancora a alca de resize (absolute). O dragStyle ja aplica
        // quando sortable; garantimos para o caso nao-sortable tambem.
        position: "relative",
        // Preserva o alinhamento à esquerda do título (__nome), como no
        // PlainColumnHeader anterior; demais colunas permanecem centradas.
        textAlign: column.builtin ? "left" : thStyle.textAlign,
        paddingLeft: column.builtin ? 4 : thStyle.paddingLeft,
      }}
    >
      <button
        ref={ref}
        type="button"
        onClick={() => setMenu((v) => !v)}
        {...(sortable ? attributes : {})}
        {...(sortable ? listeners : {})}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          border: 0,
          background: "none",
          color: "var(--muted-foreground)",
          fontSize: 12,
          fontWeight: 500,
          cursor: sortable ? (isDragging ? "grabbing" : "grab") : "pointer",
          maxWidth: "100%",
          touchAction: sortable ? "none" : undefined,
        }}
        title="Editar coluna"
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {column.label}
        </span>
      </button>
      {menu && (
        <Popover anchorRef={ref} onClose={() => setMenu(false)}>
          <div style={{ padding: 8, minWidth: 200 }}>
            <p
              style={{
                margin: "0 0 6px",
                fontSize: 10,
                letterSpacing: ".5px",
                textTransform: "uppercase",
                color: "var(--muted-foreground)",
              }}
            >
              {COLUMN_TYPE_LABEL[column.type]}
            </p>
            <input
              autoFocus
              defaultValue={column.label}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  commitRename((e.target as HTMLInputElement).value);
                  setMenu(false);
                }
                if (e.key === "Escape") {
                  handledRenameRef.current = true;
                  setMenu(false);
                }
              }}
              onBlur={(e) => {
                if (!handledRenameRef.current) commitRename(e.target.value);
              }}
              style={inputStyle}
            />
            {isSelectable && onUpdateColumnOptions && (
              <ColumnOptionsEditor
                options={column.config?.options ?? []}
                onChange={(next) => onUpdateColumnOptions(column.key, next)}
              />
            )}
            {archivable && (
              <button
                type="button"
                onClick={() => {
                  archiveColumn();
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
                  color: "var(--muted-foreground)",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                <EyeOff size={13} /> Arquivar coluna
              </button>
            )}
            {removable && onRemoveColumn && (
              <button
                type="button"
                onClick={() => {
                  removeColumn();
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
            )}
          </div>
        </Popover>
      )}
      {resize && (
        <ColumnResizeHandle
          columnKey={column.key}
          currentWidth={resize.currentWidth}
          onResize={resize.onResize}
        />
      )}
    </th>
  );
}

/**
 * Editor das opções de uma coluna `status`/`dropdown`, exibido dentro do menu
 * da coluna (`ColumnHeader`). Permite adicionar, renomear, recolorir e remover
 * opções. Mantém estado local enquanto edita e propaga a lista completa via
 * `onChange` (debounce simples: grava ao confirmar nome, ao trocar cor, ao
 * adicionar/remover) — o pai (`GroupsView`) persiste no backend.
 */
export function ColumnOptionsEditor({
  options,
  onChange,
}: {
  options: ColumnOption[];
  onChange: (next: ColumnOption[]) => void;
}) {
  // Espelha as props num estado local para edição fluida; ressincroniza
  // durante a render quando a lista vinda do servidor muda (ex.: após salvar)
  // — padrão "ajustar estado ao mudar prop" (sem useEffect, sem cascata).
  const optionsKey = options
    .map((o) => `${o.id}:${o.label}:${o.color}`)
    .join("|");
  const [draft, setDraft] = useState<ColumnOption[]>(options);
  const [syncedKey, setSyncedKey] = useState(optionsKey);
  const [colorFor, setColorFor] = useState<string | null>(null);

  if (syncedKey !== optionsKey) {
    setDraft(options);
    setSyncedKey(optionsKey);
  }

  function commit(next: ColumnOption[]) {
    setDraft(next);
    onChange(next);
  }

  function addOption() {
    const id = makeOptionId(draft.map((o) => o.id));
    const color = BLOCK_COLORS[draft.length % BLOCK_COLORS.length];
    commit([...draft, { id, label: `Opção ${draft.length + 1}`, color }]);
  }

  function renameOption(id: string, label: string) {
    const next = draft.map((o) => (o.id === id ? { ...o, label } : o));
    setDraft(next);
  }

  function commitRenameOption(id: string, label: string) {
    const trimmed = label.trim();
    // Vazio: não persiste o vazio; restaura o último valor salvo da opção.
    if (!trimmed) {
      const saved = options.find((o) => o.id === id);
      setDraft((d) =>
        d.map((o) =>
          o.id === id ? { ...o, label: saved?.label ?? o.label } : o,
        ),
      );
      return;
    }
    commit(draft.map((o) => (o.id === id ? { ...o, label: trimmed } : o)));
  }

  function recolorOption(id: string, color: string) {
    setColorFor(null);
    commit(draft.map((o) => (o.id === id ? { ...o, color } : o)));
  }

  function removeOption(id: string) {
    commit(draft.filter((o) => o.id !== id));
  }

  return (
    <div
      style={{
        marginTop: 10,
        borderTop: "1px solid var(--border)",
        paddingTop: 8,
      }}
    >
      <p
        style={{
          margin: "0 0 6px",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: ".5px",
          textTransform: "uppercase",
          color: "var(--muted-foreground)",
        }}
      >
        Opções
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {draft.map((opt) => (
          <div
            key={opt.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              position: "relative",
            }}
          >
            {/* Swatch de cor — clique abre a paleta. */}
            <button
              type="button"
              onClick={() =>
                setColorFor((cur) => (cur === opt.id ? null : opt.id))
              }
              aria-label="Mudar cor da opção"
              title="Mudar cor"
              style={{
                width: 16,
                height: 16,
                flexShrink: 0,
                borderRadius: "50%",
                border: "1px solid var(--border)",
                background: opt.color ?? "#6b7280",
                cursor: "pointer",
              }}
            />
            <input
              defaultValue={opt.label}
              onChange={(e) => renameOption(opt.id, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  commitRenameOption(
                    opt.id,
                    (e.target as HTMLInputElement).value,
                  );
              }}
              onBlur={(e) => commitRenameOption(opt.id, e.target.value)}
              style={{ ...inputStyle, height: 28, flex: 1 }}
            />
            <button
              type="button"
              onClick={() => removeOption(opt.id)}
              aria-label="Remover opção"
              title="Remover opção"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 26,
                height: 26,
                flexShrink: 0,
                borderRadius: 6,
                border: 0,
                background: "none",
                color: "var(--muted-foreground)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#ef4444";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--muted-foreground)";
              }}
            >
              <Trash2 size={14} />
            </button>
            {colorFor === opt.id && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  zIndex: 10,
                  display: "grid",
                  gridTemplateColumns: "repeat(6, 1fr)",
                  gap: 4,
                  padding: 6,
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--popover, var(--background))",
                  boxShadow: "0 6px 20px rgba(0,0,0,.18)",
                }}
              >
                {BLOCK_COLORS.map((c) => {
                  const selected =
                    (opt.color ?? "").toLowerCase() === c.toLowerCase();
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => recolorOption(opt.id, c)}
                      aria-label={`Cor ${c}`}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: selected
                          ? "2px solid var(--foreground)"
                          : "1px solid var(--border)",
                        background: c,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {selected && (
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 11 11"
                          fill="none"
                        >
                          <path
                            d="M2 5.5L4.5 8L9 3"
                            stroke="#fff"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addOption}
        style={{
          marginTop: 6,
          width: "100%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          height: 30,
          borderRadius: 6,
          border: "1px dashed var(--border)",
          background: "none",
          color: "var(--muted-foreground)",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        <Plus size={13} /> Adicionar opção
      </button>
    </div>
  );
}

/** Botao "+" no header — abre menu para criar nova coluna (8 tipos). */
export function AddColumnButton({
  onAddColumn,
  archivedColumns,
  onRestoreColumn,
}: {
  onAddColumn: AddColumnHandler;
  archivedColumns?: ArchivedColumn[];
  onRestoreColumn?: ArchiveColumnHandler;
}) {
  const [menu, setMenu] = useState(false);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<ColumnType>("text");
  const ref = useRef<HTMLButtonElement>(null);

  function create() {
    const l = label.trim() || COLUMN_TYPE_LABEL[type];
    onAddColumn(type, l);
    setLabel("");
    setType("text");
    setMenu(false);
  }

  return (
    <>
      {/* O botao ocupa toda a area do <th> do "+" (largura/altura total) para
          que QUALQUER clique no cabecalho da ultima coluna abra o modal — nao
          so no icone. O "+" segue ancorado a esquerda (visual inalterado). */}
      <button
        ref={ref}
        type="button"
        onClick={() => setMenu((v) => !v)}
        aria-label="Adicionar coluna"
        title="Adicionar coluna"
        style={{
          display: "inline-flex",
          alignItems: "center",
          width: "100%",
          height: "100%",
          border: 0,
          background: "none",
          color: "var(--muted-foreground)",
          cursor: "pointer",
          // Mesmo padding do <th> original (9px 8px) — preserva a posicao do
          // "+"; agora aplicado no botao para a area clicavel cobrir o <th>.
          padding: "9px 8px",
        }}
      >
        <Plus size={14} />
      </button>
      {menu && (
        <Popover anchorRef={ref} onClose={() => setMenu(false)} align="right">
          <div style={{ padding: 10, minWidth: 240 }}>
            <p
              style={{
                margin: "0 0 8px",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--foreground)",
              }}
            >
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 4,
                margin: "8px 0",
              }}
            >
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
                      border: active
                        ? "1px solid #7c5cff"
                        : "1px solid var(--border)",
                      background: active
                        ? "rgba(124,92,255,0.12)"
                        : "transparent",
                      color: active
                        ? "var(--foreground)"
                        : "var(--muted-foreground)",
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

            {/* Colunas arquivadas — restaurar (traz de volta ao grid). */}
            {archivedColumns &&
              archivedColumns.length > 0 &&
              onRestoreColumn && (
                <div
                  style={{
                    marginTop: 12,
                    borderTop: "1px solid var(--border)",
                    paddingTop: 8,
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 6px",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: ".5px",
                      textTransform: "uppercase",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    Arquivadas
                  </p>
                  {archivedColumns.map((col) => (
                    <button
                      key={col.key}
                      type="button"
                      onClick={() => {
                        onRestoreColumn(col.key);
                        setMenu(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        padding: "7px 8px",
                        borderRadius: 6,
                        border: 0,
                        background: "none",
                        color: "var(--foreground)",
                        fontSize: 13,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                      title="Restaurar coluna"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--accent)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "none";
                      }}
                    >
                      <Eye size={13} />
                      <span style={{ flex: 1 }}>{col.label}</span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--muted-foreground)",
                        }}
                      >
                        Restaurar
                      </span>
                    </button>
                  ))}
                </div>
              )}
          </div>
        </Popover>
      )}
    </>
  );
}
