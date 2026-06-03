"use client";

import React, { useState } from "react";
import { TaskFilterControls } from "@/components/lists/task-filter-controls";
import {
  IcCaret,
  IcCheck,
  IcGitFork,
  IcLayers,
} from "@/components/lists/icons";
import { AI_ASSIGNEE_ID } from "@/hooks/use-task-execution";
import type { TaskFilters } from "@/lib/filters/task-filters";
import type { ProjectMemberDto } from "@/hooks/use-members";
import type { SubtarefasMode } from "../_lib/list-view-types";

// ─── TabBtn ───────────────────────────────────────────────────────────────────
export function TabBtn({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 28,
        padding: "0 10px",
        borderRadius: 6,
        background: active ? "rgba(124,92,255,0.16)" : "none",
        border: 0,
        color: active ? "#cfc1ff" : "var(--muted-foreground)",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "var(--card)";
          e.currentTarget.style.color = "var(--foreground)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "none";
          e.currentTarget.style.color = "var(--muted-foreground)";
        }
      }}
    >
      {icon} {label}
    </button>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────
export function Toolbar({
  tarefasCount,
  totalCount,
  onAddTask,
  subtarefasMode,
  onSubtarefasMode,
  filters,
  onFiltersChange,
  members,
  teams,
}: {
  /** Contagem APÓS filtros (resultado visível). */
  tarefasCount: number | null;
  /** Contagem total (antes dos filtros) — para exibir "X de Y". */
  totalCount: number | null;
  onAddTask: () => void;
  subtarefasMode: SubtarefasMode;
  onSubtarefasMode: (m: SubtarefasMode) => void;
  filters: TaskFilters;
  onFiltersChange: (next: TaskFilters) => void;
  members: ProjectMemberDto[];
  teams: { id: string; nome: string; color?: string | null }[];
}) {
  const [subtarefasOpen, setSubtarefasOpen] = useState(false);
  const isFiltered =
    totalCount !== null && tarefasCount !== null && tarefasCount !== totalCount;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "0 22px",
        height: 44,
        borderBottom: "1px solid #26262d",
        background: "var(--background)",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <TabBtn active icon={<IcLayers size={14} />} label="Grupo: Status" />
        <div style={{ position: "relative" }}>
          <TabBtn
            icon={<IcGitFork size={14} />}
            label="Subtarefas"
            onClick={() => setSubtarefasOpen((v) => !v)}
          />
          {subtarefasOpen && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 100 }}
                onClick={() => setSubtarefasOpen(false)}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  zIndex: 101,
                  background: "var(--card)",
                  border: "1px solid #2e2e38",
                  borderRadius: 8,
                  padding: "6px 4px",
                  minWidth: 220,
                  boxShadow: "0 8px 24px rgba(0,0,0,.5)",
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--muted-foreground)",
                    letterSpacing: ".6px",
                    textTransform: "uppercase",
                    padding: "4px 10px 6px",
                    margin: 0,
                  }}
                >
                  Mostrar subtarefas
                </p>
                {(
                  ["recolhidas", "expandidas", "separar"] as SubtarefasMode[]
                ).map((opt) => {
                  const labels: Record<SubtarefasMode, string> = {
                    recolhidas: "Recolhidas",
                    expandidas: "Expandidas",
                    separar: "Separar",
                  };
                  const descs: Record<SubtarefasMode, string | null> = {
                    recolhidas: "(padrão)",
                    expandidas: null,
                    separar: "Usar isto para filtrar subtarefas",
                  };
                  const active = subtarefasMode === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        onSubtarefasMode(opt);
                        setSubtarefasOpen(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 6,
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: 5,
                        background: "none",
                        border: 0,
                        color: "var(--foreground)",
                        fontSize: 13,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--accent)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "none";
                      }}
                    >
                      <span style={{ flex: 1 }}>
                        {labels[opt]}
                        {descs[opt] && (
                          <span
                            style={{
                              color: "var(--muted-foreground)",
                              fontSize: 12,
                              marginLeft: 5,
                            }}
                          >
                            {descs[opt]}
                          </span>
                        )}
                      </span>
                      {active && (
                        <span
                          style={{
                            color: "var(--muted-foreground)",
                            marginLeft: "auto",
                            flexShrink: 0,
                          }}
                        >
                          <IcCheck size={13} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <TaskFilterControls
          filters={filters}
          onChange={onFiltersChange}
          members={members}
          teams={teams}
          aiAssigneeId={AI_ASSIGNEE_ID}
        />
        {tarefasCount !== null && (
          <span
            style={{
              color: isFiltered ? "#cfc1ff" : "var(--muted-foreground)",
              fontSize: 12,
              padding: "0 4px",
            }}
            title={isFiltered ? "Resultado filtrado" : undefined}
          >
            {isFiltered
              ? `${tarefasCount} de ${totalCount} tarefas`
              : `${tarefasCount} tarefas`}
          </span>
        )}
        <div
          style={{
            display: "inline-flex",
            alignItems: "stretch",
            height: 28,
            border: "1px solid #2a2a32",
            background: "var(--card)",
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <button
            type="button"
            onClick={onAddTask}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "0 12px",
              fontSize: 13,
              color: "var(--foreground)",
              background: "none",
              border: 0,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--secondary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
            }}
          >
            Add Tarefa
          </button>
          <div style={{ width: 1, background: "var(--accent)" }} />
          <button
            type="button"
            style={{
              width: 26,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--muted-foreground)",
              background: "none",
              border: 0,
              cursor: "pointer",
            }}
          >
            <IcCaret size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}
