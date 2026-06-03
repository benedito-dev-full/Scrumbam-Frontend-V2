"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, Maximize2, Plus } from "lucide-react";
import {
  type ColumnDef,
  type FieldValue,
} from "@/lib/types/table-fields";
import {
  STATUS_V3_KEY,
  type MemberLike,
} from "@/lib/mappers/groups-from-tasks";
import type { TaskModel } from "@/lib/types/table-fields";
import {
  Checkbox,
  EditableText,
  FieldCell,
  SegmentBar,
} from "./cells";
import { colWidth } from "./columns";
import { useSelection } from "./selection";
import {
  BACKEND_EDITABLE_KEYS,
  NOME_KEY,
  noopFieldChange,
  type SubtarefasMode,
} from "./types";
import { SubtaskTableRow } from "./rows-subtasks";

/* ─── Linha de tarefa ────────────────────────────────────────────────────── */

export function TaskRow({
  task,
  columns,
  readOnly,
  members,
  saving,
  projectId,
  subtarefasMode,
  groupColor,
  subtaskColSpan,
  onOpenTask,
  onEditField,
}: {
  task: TaskModel;
  columns: ColumnDef[];
  readOnly: boolean;
  members?: MemberLike[];
  saving?: boolean;
  /** ID do projeto — quando presente, habilita o caret e subtarefas inline. */
  projectId?: string;
  /** Modo de exibição de subtarefas (toolbar) — controla expandir/recolher. */
  subtarefasMode?: SubtarefasMode;
  /** Cor do grupo pai — passada para a borda esquerda da sub-tabela. */
  groupColor?: string;
  /** colSpan total da linha de expansao (columns.length + 2). */
  subtaskColSpan?: number;
  /** Abre a TaskSheet compartilhada para esta task (gatilho dedicado). */
  onOpenTask?: (taskId: string) => void;
  onEditField?: (taskId: string, columnKey: string, value: FieldValue) => void;
}) {
  const [hover, setHover] = useState(false);
  // Estado de expansao da sub-tabela — gerenciado localmente no TaskRow.
  const [expanded, setExpanded] = useState(false);
  // Selecao via checkbox (null deixa o checkbox decorativo).
  const selection = useSelection();

  const hasChildren = (task.childCount ?? 0) > 0;
  // No modo backend com projectId, qualquer task pode receber filhas —
  // o caret fica visivel no hover mesmo sem filhas (igual Monday).
  const showCaret = !!projectId;

  // Reage ao controle "Mostrar subtarefas" da toolbar (paridade com a Lista),
  // ajustando o estado DURANTE a render quando o modo muda — padrão sem
  // useEffect (evita cascata). "expandidas" abre linhas COM filhas (não dispara
  // useSubtasks a toa); "recolhidas" fecha tudo; "separar" não interfere.
  const [syncedMode, setSyncedMode] = useState(subtarefasMode);
  if (syncedMode !== subtarefasMode) {
    setSyncedMode(subtarefasMode);
    if (subtarefasMode === "expandidas") {
      if (hasChildren) setExpanded(true);
    } else if (subtarefasMode === "recolhidas") {
      setExpanded(false);
    }
  }

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
      <tr
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
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
            // Read-only puro mostra span.
            const nomeStyle: React.CSSProperties = {
              flex: 1,
              fontWeight: 500,
              color: "var(--foreground)",
              ...(saving ? { opacity: 0.5, pointerEvents: "none" } : {}),
            };
            return (
              <td
                key={c.key}
                style={{
                  ...td,
                  fontWeight: 500,
                  borderRight: last
                    ? "1px solid var(--border)"
                    : td.borderRight,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {/* Caret de expansao de subtarefas — visivel no hover ou quando ha filhas */}
                  {showCaret && (
                    <button
                      type="button"
                      aria-label={
                        expanded ? "Recolher subtarefas" : "Expandir subtarefas"
                      }
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
                      {expanded ? (
                        <ChevronDown size={13} strokeWidth={2.5} />
                      ) : (
                        <ChevronRight size={13} strokeWidth={2.5} />
                      )}
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flex: 1,
                      overflow: "hidden",
                    }}
                  >
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
                    ) : null}
                  </div>
                  {/* Botão "Abrir" — gatilho DEDICADO da TaskSheet (hover).
                      `onPointerDown` com stopPropagation garante que jamais
                      inicie um drag (coluna/linha); `onClick` com stopPropagation
                      evita disparar o editor de título da célula. Zero conflito. */}
                  {onOpenTask && (
                    <button
                      type="button"
                      aria-label="Abrir detalhes"
                      title="Abrir detalhes"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenTask(task.id);
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        flexShrink: 0,
                        height: 22,
                        padding: "0 8px",
                        borderRadius: 6,
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                        color: "var(--muted-foreground)",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        opacity: hover ? 1 : 0,
                        transition: "opacity .1s, color .1s, border-color .1s",
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
                      <Maximize2 size={12} />
                      Abrir
                    </button>
                  )}
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
          // Identificador (ex: DEV-94) — gatilho SECUNDARIO de abertura. É
          // texto read-only, logo clicar nele nunca conflita com editor inline.
          // stopPropagation no pointerDown evita iniciar drag.
          if (c.key === "identifier" && onOpenTask) {
            const idValue = task.fields["identifier"];
            const idLabel =
              typeof idValue === "string" && idValue.length > 0
                ? idValue
                : null;
            return (
              <td
                key={c.key}
                style={{
                  ...td,
                  borderRight: last
                    ? "1px solid var(--border)"
                    : td.borderRight,
                }}
              >
                {idLabel ? (
                  <button
                    type="button"
                    title="Abrir detalhes"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenTask(task.id);
                    }}
                    style={{
                      background: "none",
                      border: 0,
                      padding: 0,
                      font: "inherit",
                      fontFamily: "monospace",
                      fontSize: 12,
                      color: "var(--muted-foreground)",
                      cursor: "pointer",
                      textDecorationLine: hover ? "underline" : "none",
                      transition: "color .1s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#7c5cff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--muted-foreground)";
                    }}
                  >
                    {idLabel}
                  </button>
                ) : null}
              </td>
            );
          }
          // No modo backend, as colunas-alvo viram editaveis via onEditField
          // (mesmo com readOnly geral). As demais respeitam readOnly.
          // Colunas custom vem do mapper com `builtin === false` e key `f_*`;
          // `identifier` (read-only, sem editor) tem `builtin` indefinido e por
          // isso nao entra aqui — so habilitamos edicao backend para os 4
          // builtin conhecidos OU colunas explicitamente custom.
          // Colunas builtin read-only (ex.: timeSpent — Fase 3 / ADR-V2-057)
          // NUNCA sao editaveis: o flag `readOnly` da ColumnDef e respeitado
          // mesmo que a key entre por algum dos ramos acima (defense-in-depth).
          const backendEditable =
            !!onEditField &&
            c.readOnly !== true &&
            (BACKEND_EDITABLE_KEYS.has(c.key) || c.builtin === false);
          const cellReadOnly = backendEditable ? false : readOnly;
          const cellOnChange = backendEditable
            ? (v: FieldValue) => onEditField!(task.id, c.key, v)
            : noopFieldChange;

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

/* ─── Linha "+ Adicionar tarefa" ─────────────────────────────────────────── */

export function AddTaskRow({
  colSpan,
  onAdd,
}: {
  colSpan: number;
  onAdd: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
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

export function FooterRow({
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
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    lineHeight: 1.2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--foreground)",
                    }}
                  >
                    {totalSp} SP
                  </span>
                  <span
                    style={{ fontSize: 10, color: "var(--muted-foreground)" }}
                  >
                    Total
                  </span>
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

// Exportar colWidth para uso em board.tsx (re-export de columns)
export { colWidth };

// Exportar tipos necessários para board.tsx
export type { SubtarefasMode };
