"use client";

import React, { useState } from "react";

import { STATUS_CONFIG, PRIO_CONFIG, GROUP_PILL_STYLE } from "@/components/lists/config";
import { IcPlus, IcGitFork, IcFlag, IcCalPlus } from "@/components/lists/icons";
import { mockMembros } from "@/lib/mocks/entidades";
import { diasUntil } from "@/lib/mocks/tarefas";
import type { StatusTarefa, Tarefa } from "@/lib/types/tarefa";

/* ─── Ordem das colunas ──────────────────────────────────────────────────── */

const COLUMN_ORDER: StatusTarefa[] = [
  "em-progresso",
  "pendente",
  "bloqueado",
  "atrasado",
  "concluido",
];

/* ─── Props ──────────────────────────────────────────────────────────────── */

interface KanbanBoardProps {
  /** Tasks a serem distribuídas nas colunas por status */
  tarefas: Tarefa[];
  /** ID do espaço pai — reservado para futuras integrações */
  espacoId: string;
  /** Callback para abrir o sheet de detalhe de uma tarefa */
  onOpenTask: (tarefa: Tarefa) => void;
  /** Callback para criar uma task em um status específico */
  onAddTask: (status: StatusTarefa) => void;
}

/* ─── KanbanBoard (componente público) ───────────────────────────────────── */

/**
 * Quadro Kanban com colunas por status.
 *
 * Distribui as `tarefas` em colunas fixas (em-progresso, pendente,
 * bloqueado, atrasado, concluido). Scroll horizontal no container e
 * scroll vertical independente por coluna. Sem DnD — apenas visual,
 * abertura de sheet e botão de adicionar task.
 *
 * @example
 * <KanbanBoard
 *   tarefas={tasks}
 *   espacoId={espacoId}
 *   onOpenTask={setSelectedTask}
 *   onAddTask={openModal}
 * />
 */
export function KanbanBoard({
  tarefas,
  onOpenTask,
  onAddTask,
}: KanbanBoardProps) {
  /* Agrupa tasks por status preservando a ordem das colunas */
  const byStatus = COLUMN_ORDER.reduce<Record<StatusTarefa, Tarefa[]>>(
    (acc, status) => {
      acc[status] = tarefas.filter((t) => t.status === status);
      return acc;
    },
    {
      "em-progresso": [],
      pendente: [],
      bloqueado: [],
      atrasado: [],
      concluido: [],
    },
  );

  return (
    <div
      style={{
        flex: 1,
        overflowX: "auto",
        overflowY: "hidden",
        background: "#111111",
        padding: "16px 22px 24px",
      }}
    >
      {/* Faixa de colunas com scroll horizontal */}
      <div
        style={{
          display: "flex",
          gap: 12,
          height: "100%",
          minWidth: "max-content",
        }}
      >
        {COLUMN_ORDER.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tarefas={byStatus[status]}
            onOpenTask={onOpenTask}
            onAddTask={onAddTask}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── KanbanColumn ───────────────────────────────────────────────────────── */

interface KanbanColumnProps {
  status: StatusTarefa;
  tarefas: Tarefa[];
  onOpenTask: (tarefa: Tarefa) => void;
  onAddTask: (status: StatusTarefa) => void;
}

function KanbanColumn({
  status,
  tarefas,
  onOpenTask,
  onAddTask,
}: KanbanColumnProps) {
  const cfg = STATUS_CONFIG[status];
  const pill = GROUP_PILL_STYLE[status];
  const StatusIcon = cfg.Icon;

  return (
    <div
      style={{
        width: 272,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: "#16161b",
        borderRadius: 10,
        border: "1px solid #1f1f27",
        overflow: "hidden",
      }}
    >
      {/* Header da coluna */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px 10px",
          flexShrink: 0,
          borderBottom: "1px solid #1f1f27",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Pill de status */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 8px",
              borderRadius: 5,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: ".7px",
              textTransform: "uppercase",
              background: pill.bg,
              color: pill.color,
            }}
          >
            <StatusIcon size={10} />
            {cfg.label}
          </span>

          {/* Contador */}
          <span style={{ fontSize: 12, color: "#5a5a64", fontWeight: 500 }}>
            {tarefas.length}
          </span>
        </div>

        {/* Botão + para adicionar task na coluna */}
        <AddColumnButton onClick={() => onAddTask(status)} />
      </div>

      {/* Lista de cards com scroll vertical independente */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 8px 4px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {tarefas.map((tarefa) => (
          <KanbanCard
            key={tarefa.id}
            tarefa={tarefa}
            onOpen={() => onOpenTask(tarefa)}
          />
        ))}

        {/* Botão "Adicionar" inline no final da coluna */}
        <AddInlineButton onClick={() => onAddTask(status)} />
      </div>
    </div>
  );
}

/* ─── Botão + no header da coluna ────────────────────────────────────────── */

function AddColumnButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      aria-label="Adicionar tarefa nesta coluna"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 24,
        height: 24,
        borderRadius: 5,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: hovered ? "#252530" : "none",
        border: "none",
        color: hovered ? "#e6e6ea" : "#5a5a64",
        cursor: "pointer",
        transition: "background .12s, color .12s",
      }}
    >
      <IcPlus size={13} />
    </button>
  );
}

/* ─── Botão "Adicionar" inline no final da coluna ───────────────────────── */

function AddInlineButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        width: "100%",
        padding: "7px 8px",
        borderRadius: 7,
        background: hovered ? "#1e1e27" : "none",
        border: "none",
        color: hovered ? "#b6b6bf" : "#5a5a64",
        fontSize: 12,
        cursor: "pointer",
        transition: "background .12s, color .12s",
        marginBottom: 4,
      }}
    >
      <IcPlus size={12} />
      Adicionar
    </button>
  );
}

/* ─── KanbanCard ─────────────────────────────────────────────────────────── */

interface KanbanCardProps {
  tarefa: Tarefa;
  onOpen: () => void;
}

/**
 * Card individual de uma tarefa no quadro Kanban.
 *
 * Exibe: nome (clicável → abre sheet), badge de prioridade, avatar do
 * responsável, data de vencimento com badge ATRASADO/HOJE e contador
 * de subtarefas.
 */
function KanbanCard({ tarefa, onOpen }: KanbanCardProps) {
  const [hovered, setHovered] = useState(false);

  const membro = tarefa.responsavelId
    ? mockMembros.find((m) => m.id === tarefa.responsavelId) ?? null
    : null;

  const prio = tarefa.prioridade ? PRIO_CONFIG[tarefa.prioridade] : null;

  /* Formatação da data de vencimento */
  const dias = diasUntil(tarefa.dataVencimento);
  let dateText = "";
  let dateColor = "#7a7a85";
  let dateBadge = "";
  let dateBadgeColor = "#7a7a85";

  if (tarefa.dataVencimento) {
    const d = new Date(tarefa.dataVencimento + "T00:00:00.000Z");
    dateText = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    if (dias !== null) {
      if (dias < 0) {
        dateColor = "#fbbf24";
        dateBadge = `ATRASADO ${Math.abs(dias)}D`;
        dateBadgeColor = "#fbbf24";
      } else if (dias === 0) {
        dateColor = "#7c5cff";
        dateBadge = "HOJE";
        dateBadgeColor = "#7c5cff";
      }
    }
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#1e1e26" : "#1a1a1f",
        border: hovered
          ? "1px solid rgba(255,255,255,0.12)"
          : "1px solid rgba(255,255,255,0.07)",
        borderRadius: 8,
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 9,
        transition: "background .12s, border-color .12s",
        cursor: "default",
      }}
    >
      {/* Nome da task — clicável */}
      <span
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onOpen();
        }}
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#e6e6ea",
          lineHeight: 1.4,
          cursor: "pointer",
          display: "block",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#cfc1ff";
          e.currentTarget.style.textDecoration = "underline";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#e6e6ea";
          e.currentTarget.style.textDecoration = "none";
        }}
      >
        {tarefa.nome}
      </span>

      {/* Rodapé do card: prioridade, data, responsável, subtarefas */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
        }}
      >
        {/* Lado esquerdo: badge de prioridade + data de vencimento */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {/* Badge de prioridade */}
          {prio && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                fontSize: 10,
                fontWeight: 600,
                color: prio.color,
                background: `${prio.color}1a`,
                borderRadius: 4,
                padding: "2px 6px",
                letterSpacing: ".3px",
              }}
            >
              <IcFlag size={10} />
              {prio.label}
            </span>
          )}

          {/* Data de vencimento */}
          {dateText ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                color: dateColor,
              }}
            >
              {dateText}
              {dateBadge && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: ".5px",
                    textTransform: "uppercase",
                    color: dateBadgeColor,
                    background: `${dateBadgeColor}1a`,
                    borderRadius: 3,
                    padding: "1px 4px",
                  }}
                >
                  {dateBadge}
                </span>
              )}
            </span>
          ) : (
            /* Ícone de data vazio quando não há data — só aparece no hover */
            hovered && (
              <span style={{ color: "#3a3a44" }}>
                <IcCalPlus size={12} />
              </span>
            )
          )}

          {/* Contador de subtarefas */}
          {tarefa.subtarefas > 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                fontSize: 11,
                color: "#5a5a6e",
              }}
            >
              <IcGitFork size={10} />
              {tarefa.subtarefas}
            </span>
          )}
        </div>

        {/* Lado direito: avatar do responsável */}
        {membro ? (
          <div
            title={membro.nome}
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#3d2a6b",
              color: "#d8ccff",
              fontSize: 8,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {membro.iniciais}
          </div>
        ) : (
          /* Placeholder de avatar no hover */
          hovered && (
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#1f1f2a",
                border: "1px dashed #3a3a44",
                flexShrink: 0,
              }}
            />
          )
        )}
      </div>
    </div>
  );
}
