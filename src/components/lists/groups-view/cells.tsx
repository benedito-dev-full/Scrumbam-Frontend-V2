"use client";

import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  Check,
  GitBranch,
  Link2,
  Lock,
  User,
} from "lucide-react";
import type { ColumnDef, ColumnOption, FieldValue } from "@/lib/types/table-fields";
import type { MemberLike } from "@/lib/mappers/groups-from-tasks";
import { V3_TERMINAL_VALIDATED } from "@/lib/mappers/groups-from-tasks";
import { AI_ASSIGNEE_ID } from "@/hooks/use-task-execution";
import { ClaudeAvatar } from "@/app/(app)/lists/[id]/_components/claude-avatar";

/* ─── inputStyle (compartilhado entre células) ───────────────────────────── */

export const inputStyle: React.CSSProperties = {
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

/* ─── Popover ancorado (via portal, escapa do overflow da tabela) ────────── */

export function Popover({
  anchorRef,
  onClose,
  align = "left",
  placement = "bottom",
  children,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  align?: "left" | "right";
  /** Abre abaixo (default) ou acima do anchor. "top" e usado pela barra de
   *  selecao, que fica no rodape — abrir pra baixo cortaria o menu. */
  placement?: "bottom" | "top";
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  // useLayoutEffect: mede a altura real do popover e posiciona ANTES do paint —
  // para `placement="top"` isso evita o flash de aparecer na posicao errada
  // (precisa do height ja renderizado). Para "bottom" o comportamento e igual.
  useLayoutEffect(() => {
    if (!anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    const left = align === "right" ? r.right : r.left;
    if (placement === "top") {
      const h = ref.current?.getBoundingClientRect().height ?? 0;
      setPos({ top: r.top - h - 4, left });
    } else {
      setPos({ top: r.bottom + 4, left });
    }
  }, [anchorRef, align, placement, children]);

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

/* ─── Texto editavel inline ──────────────────────────────────────────────── */

/** Texto editavel inline — clique entra em edicao; Enter/blur commitam. */
export function EditableText({
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
      {value || (
        <span style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>
          {placeholder ?? "—"}
        </span>
      )}
    </span>
  );
}

/* ─── Primitivos visuais ─────────────────────────────────────────────────── */

/**
 * Pill solida que preenche a celula (Status). Quando `locked`, exibe um
 * cadeado indicando estado terminal (VALIDATED) — nao editavel.
 */
export function Pill({
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
export function ChipDropdown({ option }: { option: ColumnOption }) {
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

export function EmptyCell() {
  return (
    <div
      style={{
        height: 34,
        borderRadius: 4,
        background:
          "color-mix(in srgb, var(--muted-foreground) 12%, transparent)",
      }}
    />
  );
}

export function SegmentBar({ colors }: { colors: string[] }) {
  if (colors.length === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        height: 22,
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
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
export function Checkbox({
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
export function OptionList({
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
            if (o.id !== currentId)
              e.currentTarget.style.background = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            if (o.id !== currentId) e.currentTarget.style.background = "none";
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: o.color ?? "#6b7280",
              flexShrink: 0,
            }}
          />
          {o.label}
          {o.id === currentId && (
            <Check size={14} color="#7c5cff" style={{ marginLeft: "auto" }} />
          )}
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
export function PersonList({
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
    <div
      style={{ padding: 4, minWidth: 200, maxHeight: 320, overflowY: "auto" }}
    >
      {/* Sem responsavel */}
      <button
        type="button"
        onClick={() => onPick("")}
        style={{
          ...row,
          background: !currentId ? "rgba(124,92,255,0.12)" : "none",
        }}
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
        <span style={{ color: "var(--muted-foreground)" }}>
          Sem responsável
        </span>
        {!currentId && (
          <Check size={14} color="#7c5cff" style={{ marginLeft: "auto" }} />
        )}
      </button>

      {members.length === 0 ? (
        <div
          style={{
            padding: "8px 10px",
            fontSize: 12,
            color: "var(--muted-foreground)",
          }}
        >
          Nenhum membro no projeto.
        </div>
      ) : (
        members.map((m) => (
          <button
            key={m.userId}
            type="button"
            onClick={() => onPick(m.userId)}
            style={{
              ...row,
              background:
                m.userId === currentId ? "rgba(124,92,255,0.12)" : "none",
            }}
            onMouseEnter={(e) => {
              if (m.userId !== currentId)
                e.currentTarget.style.background = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              if (m.userId !== currentId)
                e.currentTarget.style.background = "none";
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
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {m.nome}
            </span>
            {m.userId === currentId && (
              <Check size={14} color="#7c5cff" style={{ marginLeft: "auto" }} />
            )}
          </button>
        ))
      )}

      {/* Claude (IA) — paridade com a Lista: divisor + opcao destacada em
          laranja. Atribuir aqui habilita o botao "Executar" na celula Nome. */}
      <div style={{ borderTop: "1px solid var(--border)", margin: "6px 4px" }} />
      <button
        type="button"
        onClick={() => onPick(AI_ASSIGNEE_ID)}
        style={{
          ...row,
          background:
            currentId === AI_ASSIGNEE_ID ? "rgba(217,119,87,0.14)" : "none",
        }}
        onMouseEnter={(e) => {
          if (currentId !== AI_ASSIGNEE_ID)
            e.currentTarget.style.background = "var(--accent)";
        }}
        onMouseLeave={(e) => {
          if (currentId !== AI_ASSIGNEE_ID)
            e.currentTarget.style.background = "none";
        }}
      >
        <ClaudeAvatar size={22} />
        <span style={{ flex: 1, color: "#d97757", fontWeight: 600 }}>
          Claude
        </span>
        {currentId === AI_ASSIGNEE_ID && (
          <Check size={14} color="#d97757" style={{ marginLeft: "auto" }} />
        )}
      </button>
    </div>
  );
}

/* ─── Celula de campo — renderiza/edita conforme o tipo da coluna ────────── */

export function FieldCell({
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
    const isAi = userId === AI_ASSIGNEE_ID;
    const nome = isAi
      ? "Claude"
      : userId
        ? (members?.find((m) => m.userId === userId)?.nome ?? userId)
        : null;
    return (
      <td
        ref={ref}
        style={{
          ...tdStyle,
          ...savingStyle,
          textAlign: nome ? "left" : "center",
          cursor: editCursor,
        }}
        onClick={openCell}
      >
        {nome ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              maxWidth: "100%",
            }}
          >
            {isAi ? (
              <ClaudeAvatar size={22} />
            ) : (
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
            )}
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                ...(isAi ? { color: "#d97757", fontWeight: 600 } : {}),
              }}
              title={nome}
            >
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
      <td
        style={{
          ...tdStyle,
          ...savingStyle,
          textAlign: "center",
          cursor: editCursor,
        }}
        onClick={locked ? undefined : () => onChange(!value)}
      >
        <Checkbox checked={value === true} />
      </td>
    );
  }

  // ── link ──
  if (column.type === "link") {
    return (
      <td
        ref={ref}
        style={{ ...tdStyle, textAlign: "center", cursor: editCursor }}
        onClick={openCell}
      >
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
                    onChange(
                      (e.target as HTMLInputElement).value.trim() || null,
                    );
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
        ? new Date(value.slice(0, 10) + "T12:00:00").toLocaleDateString(
            "pt-BR",
            {
              day: "2-digit",
              month: "short",
            },
          )
        : "";
    return (
      <td
        ref={ref}
        style={{
          ...tdStyle,
          ...savingStyle,
          textAlign: "center",
          cursor: editCursor,
          color: dateText ? "var(--foreground)" : "var(--muted-foreground)",
        }}
        onClick={openCell}
      >
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
          ? new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: column.config.currency,
            }).format(Number(value))
          : column.key === "sp"
            ? `${value} SP`
            : String(value)
        : "";
    return (
      <td
        ref={ref}
        style={{ ...tdStyle, textAlign: "center", cursor: editCursor }}
        onClick={openCell}
      >
        {display || (
          <span style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>
            —
          </span>
        )}
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
                onBlur={(e) =>
                  onChange(
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
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
