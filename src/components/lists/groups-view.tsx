"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
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
  type TaskModel,
} from "@/lib/prototype/groups-store";

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
 * Quando integrarmos, a store sai e os dados vem dos hooks do backend.
 *
 * @example
 * <GroupsView />
 */
export function GroupsView() {
  const board = useGroupsBoard();
  const cols = [...board.columns].sort((a, b) => a.order - b.order);

  return (
    <div
      className="flex-1 overflow-auto"
      style={{ background: "var(--background)", padding: "16px 20px 80px" }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {board.groups.map((g) => (
          <GroupBox key={g.id} group={g} columns={cols} />
        ))}

        {/* adicionar grupo */}
        <button
          type="button"
          onClick={() => groupsActions.addGroup()}
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
      </div>
    </div>
  );
}

/* ─── Larguras das colunas ───────────────────────────────────────────────── */

const W_CHECK = 36;
const W_NOME = 360;
const W_ADD = 44;
const W_DEFAULT = 150;

function colWidth(c: ColumnDef): number {
  if (c.builtin) return W_NOME;
  if (c.type === "person") return 96;
  if (c.type === "number") return 130;
  if (c.type === "link") return 150;
  if (c.type === "text") return 130;
  return W_DEFAULT;
}

/* ─── GroupBox ───────────────────────────────────────────────────────────── */

function GroupBox({
  group,
  columns,
}: {
  group: GroupModel;
  columns: ColumnDef[];
}) {
  const [open, setOpen] = useState(true);

  const spCol = columns.find((c) => c.type === "number");
  const totalSp = spCol
    ? group.tasks.reduce(
        (acc, t) => acc + (Number(t.fields[spCol.key]) || 0),
        0,
      )
    : 0;

  const minWidth =
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

        <EditableText
          value={group.nome}
          onCommit={(v) => groupsActions.renameGroup(group.id, v)}
          style={{ fontSize: 16, fontWeight: 700, color: group.cor, letterSpacing: ".2px" }}
        />

        <span style={{ fontSize: 12, color: "var(--muted-foreground)", marginLeft: 2 }}>
          {group.tasks.length}
        </span>

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

        {group.periodo && (
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted-foreground)" }}>
            {group.periodo}
          </span>
        )}
      </header>

      {open && (
        <div
          style={{
            position: "relative",
            borderRadius: 8,
            overflow: "hidden",
            border: "1px solid var(--border)",
            background: "var(--card)",
          }}
        >
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              background: group.cor,
              zIndex: 2,
            }}
          />

          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth }}>
            <colgroup>
              <col style={{ width: W_CHECK }} />
              {columns.map((c) => (
                <col key={c.key} style={{ width: colWidth(c) }} />
              ))}
              <col style={{ width: W_ADD }} />
            </colgroup>

            <HeadRow columns={columns} />

            <tbody>
              {group.tasks.map((t) => (
                <TaskRow key={t.id} groupId={group.id} task={t} columns={columns} />
              ))}
              <AddTaskRow colSpan={columns.length + 2} onAdd={() => groupsActions.addTask(group.id)} />
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

function HeadRow({ columns }: { columns: ColumnDef[] }) {
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
  return (
    <thead>
      <tr>
        <th style={{ ...th, padding: 0 }}>
          <span style={{ display: "inline-flex" }}>
            <Checkbox checked={false} />
          </span>
        </th>
        {columns.map((c) =>
          c.builtin ? (
            <th key={c.key} style={{ ...th, textAlign: "left", paddingLeft: 4 }}>
              {c.label}
            </th>
          ) : (
            <ColumnHeader key={c.key} column={c} thStyle={th} />
          ),
        )}
        <th style={th}>
          <AddColumnButton />
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
}: {
  groupId: string;
  task: TaskModel;
  columns: ColumnDef[];
}) {
  const [hover, setHover] = useState(false);
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
    <tr onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <td style={{ ...td, padding: 0, textAlign: "center" }}>
        <Checkbox checked={false} />
      </td>

      {columns.map((c, i) => {
        const last = i === columns.length - 1;
        if (c.builtin) {
          return (
            <td key={c.key} style={{ ...td, fontWeight: 500, borderRight: last ? "1px solid var(--border)" : td.borderRight }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
              </div>
            </td>
          );
        }
        return (
          <FieldCell
            key={c.key}
            tdStyle={td}
            column={c}
            value={task.fields[c.key] ?? null}
            onChange={(v) => groupsActions.setField(groupId, task.id, c.key, v)}
          />
        );
      })}

      <td style={{ ...td, borderRight: 0 }} />
    </tr>
  );
}

/* ─── Celula de campo — renderiza/edita conforme o tipo da coluna ────────── */

function FieldCell({
  column,
  value,
  onChange,
  tdStyle,
}: {
  column: ColumnDef;
  value: FieldValue;
  onChange: (v: FieldValue) => void;
  tdStyle: React.CSSProperties;
}) {
  const ref = useRef<HTMLTableCellElement>(null);
  const [open, setOpen] = useState(false);

  const options = column.config?.options ?? [];
  const selected = options.find((o) => o.id === value);

  // ── status / dropdown: pill colorida + popover de opcoes ──
  if (column.type === "status" || column.type === "dropdown") {
    const isStatus = column.type === "status";
    return (
      <td ref={ref} style={{ ...tdStyle, padding: 2, cursor: "pointer" }} onClick={() => setOpen(true)}>
        {selected ? (
          isStatus ? (
            <Pill bg={selected.color ?? "#6b7280"}>{selected.label}</Pill>
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
                onChange(id);
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
    return (
      <td style={{ ...tdStyle, textAlign: "center" }}>
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
          title="Pessoa (mock)"
        >
          <User size={13} />
        </span>
      </td>
    );
  }

  // ── checkbox ──
  if (column.type === "checkbox") {
    return (
      <td style={{ ...tdStyle, textAlign: "center", cursor: "pointer" }} onClick={() => onChange(!value)}>
        <Checkbox checked={value === true} />
      </td>
    );
  }

  // ── link ──
  if (column.type === "link") {
    return (
      <td ref={ref} style={{ ...tdStyle, textAlign: "center", cursor: "pointer" }} onClick={() => setOpen(true)}>
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
      <td ref={ref} style={{ ...tdStyle, textAlign: "center", cursor: "pointer", color: dateText ? "var(--foreground)" : "var(--muted-foreground)" }} onClick={() => setOpen(true)}>
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
      <td ref={ref} style={{ ...tdStyle, textAlign: "center", cursor: "pointer" }} onClick={() => setOpen(true)}>
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
  return (
    <td style={{ ...tdStyle, color: "var(--muted-foreground)" }}>
      <EditableText
        value={typeof value === "string" ? value : ""}
        placeholder="—"
        onCommit={(v) => onChange(v || null)}
        style={{ color: "var(--foreground)", width: "100%" }}
      />
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

  useEffect(() => setDraft(value), [value]);

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

/** Pill solida que preenche a celula (Status). */
function Pill({ bg, children }: { bg: string; children: React.ReactNode }) {
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
        fontSize: 12,
        fontWeight: 500,
        padding: "0 8px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
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

function Checkbox({ checked }: { checked: boolean }) {
  return (
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
