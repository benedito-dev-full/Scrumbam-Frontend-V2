"use client";

import React, { useState } from "react";
import {
  KANBAN_COLUMNS,
  priorityToLabel,
  priorityToColor,
} from "@/lib/mappers/task-status.mapper";
import { cn } from "@/lib/utils";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

/** Mapeia coluna Kanban -> V3 Intention primaria para o PATCH de status. */
// Poda 9 -> 5: 4 colunas de board. FAILED NAO esta aqui de proposito — e badge,
// nao coluna, e so a automacao escreve (o usuario nao pode escolher "Falhou").
const COLUMN_TO_INTENTION: Record<string, string> = {
  backlog: "INBOX",
  ready: "READY",
  "em-progresso": "EXECUTING",
  concluido: "DONE",
};

// â”€â”€â”€ Sub-componentes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function DrawerShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-[420px] flex-col border-l border-border bg-background shadow-2xl">
        {children}
      </div>
    </>
  );
}

export function DrawerSkeleton() {
  return (
    <div className="flex flex-col gap-[var(--section-gap)] p-4">
      <div className="h-6 w-32 animate-pulse rounded bg-muted" />
      <div className="h-4 w-full animate-pulse rounded bg-muted" />
      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

export function EditableTitle({
  value,
  onSave,
  disabled,
}: {
  value: string;
  onSave: (v: string) => void;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <input
        autoFocus
        className="w-full rounded bg-transparent px-1 text-[15px] font-semibold outline-none ring-1 ring-ring"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (draft.trim() && draft !== value) onSave(draft.trim());
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setEditing(false);
            setDraft(value);
          }
        }}
        disabled={disabled}
      />
    );
  }

  return (
    <h2
      className="cursor-text text-[15px] font-semibold text-foreground hover:text-primary"
      onDoubleClick={() => setEditing(true)}
      title="Double-click para editar"
    >
      {value}
    </h2>
  );
}

export function EditableTextarea({
  value,
  placeholder,
  onSave,
  disabled,
}: {
  value: string;
  placeholder?: string;
  onSave: (v: string) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(value);

  return (
    <textarea
      rows={3}
      className="w-full resize-none rounded-md border border-border bg-muted/20 px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== value) onSave(draft);
      }}
      disabled={disabled}
    />
  );
}

export function StatusPicker({
  current,
  onChange,
  disabled = false,
}: {
  current: string;
  onChange: (s: string) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-1.5",
        disabled && "cursor-not-allowed opacity-60",
      )}
      title={
        disabled ? "Em execuÃ§Ã£o pela IA â€” nÃ£o Ã© possÃ­vel alterar" : undefined
      }
    >
      {KANBAN_COLUMNS.map((col) => {
        const intention = COLUMN_TO_INTENTION[col.id];
        // Mapeamento 1:1 apos a poda — nao ha mais estados finos para achatar.
        const isActive = current === intention;

        return (
          <button
            key={col.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(intention)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors",
              isActive
                ? "border-transparent text-white"
                : "border-border text-muted-foreground hover:border-border/60 hover:text-foreground",
              disabled && "pointer-events-none",
            )}
            style={isActive ? { background: col.color } : {}}
          >
            <span
              className="size-1.5 rounded-full"
              style={{ background: isActive ? "white" : col.color }}
            />
            {col.label}
          </button>
        );
      })}
    </div>
  );
}

export function PriorityPicker({
  current,
  onChange,
  disabled = false,
}: {
  current?: string;
  onChange: (p: string) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-1.5",
        disabled && "cursor-not-allowed opacity-60",
      )}
      title={
        disabled ? "Em execuÃ§Ã£o pela IA â€” nÃ£o Ã© possÃ­vel alterar" : undefined
      }
    >
      {PRIORITIES.map((p) => {
        const isActive = current === p;
        return (
          <button
            key={p}
            type="button"
            disabled={disabled}
            onClick={() => onChange(p)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors",
              isActive
                ? "border-transparent text-white"
                : "border-border text-muted-foreground hover:text-foreground",
              disabled && "pointer-events-none",
            )}
            style={isActive ? { background: priorityToColor(p) } : {}}
          >
            {priorityToLabel(p)}
          </button>
        );
      })}
    </div>
  );
}
