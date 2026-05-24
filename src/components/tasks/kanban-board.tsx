"use client";

import React, { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  rectIntersection,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { STATUS_CONFIG, PRIO_CONFIG, GROUP_PILL_STYLE } from "@/components/lists/config";
import { IcPlus, IcGitFork, IcFlag, IcCalPlus } from "@/components/lists/icons";
import { mockMembros } from "@/lib/mocks/entidades";
import { diasUntil } from "@/lib/mocks/tarefas";
import { useTasksStore } from "@/lib/stores/tasks";
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
  tarefas: Tarefa[];
  espacoId: string;
  onOpenTask: (tarefa: Tarefa) => void;
  onAddTask: (status: StatusTarefa) => void;
}

/* ─── KanbanBoard ────────────────────────────────────────────────────────── */

/**
 * Quadro Kanban com drag-and-drop entre colunas via @dnd-kit.
 *
 * Arrastar um card entre colunas atualiza o status no store Zustand
 * de forma otimista (sem rollback — dados são mock).
 */
export function KanbanBoard({ tarefas, onOpenTask, onAddTask }: KanbanBoardProps) {
  const updateTask = useTasksStore((s) => s.updateTask);
  const [activeId, setActiveId] = useState<string | null>(null);
  /* status de destino durante o drag — para highlight da coluna */
  const [overColumn, setOverColumn] = useState<StatusTarefa | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const byStatus = COLUMN_ORDER.reduce<Record<StatusTarefa, Tarefa[]>>(
    (acc, status) => {
      acc[status] = tarefas.filter((t) => t.status === status);
      return acc;
    },
    { "em-progresso": [], pendente: [], bloqueado: [], atrasado: [], concluido: [] },
  );

  const activeTask = activeId ? tarefas.find((t) => t.id === activeId) ?? null : null;

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  function resolveColumn(overId: string): StatusTarefa | null {
    if (COLUMN_ORDER.includes(overId as StatusTarefa)) return overId as StatusTarefa;
    return tarefas.find((t) => t.id === overId)?.status ?? null;
  }

  function handleDragOver({ over }: DragOverEvent) {
    setOverColumn(over ? resolveColumn(over.id as string) : null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    setOverColumn(null);
    if (!over || !activeTask) return;
    const destStatus = resolveColumn(over.id as string);
    if (destStatus && destStatus !== activeTask.status) {
      updateTask(activeTask.id, { status: destStatus });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div style={{
        flex: 1, overflowX: "auto", overflowY: "hidden",
        background: "#111111", padding: "16px 22px 24px",
      }}>
        <div style={{ display: "flex", gap: 12, height: "100%", minWidth: "max-content" }}>
          {COLUMN_ORDER.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tarefas={byStatus[status]}
              isDragOver={overColumn === status}
              onOpenTask={onOpenTask}
              onAddTask={onAddTask}
            />
          ))}
        </div>
      </div>

      {/* Card fantasma que segue o cursor durante o drag */}
      <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
        {activeTask ? <CardGhost tarefa={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

/* ─── KanbanColumn ───────────────────────────────────────────────────────── */

function KanbanColumn({
  status,
  tarefas,
  isDragOver,
  onOpenTask,
  onAddTask,
}: {
  status: StatusTarefa;
  tarefas: Tarefa[];
  isDragOver: boolean;
  onOpenTask: (tarefa: Tarefa) => void;
  onAddTask: (status: StatusTarefa) => void;
}) {
  const cfg = STATUS_CONFIG[status];
  const pill = GROUP_PILL_STYLE[status];
  const StatusIcon = cfg.Icon;
  const ids = tarefas.map((t) => t.id);

  /* Registra a coluna como drop target — essencial para colunas vazias */
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      style={{
        width: 272, flexShrink: 0, display: "flex", flexDirection: "column",
        background: isDragOver ? "#1a1a22" : "#16161b",
        borderRadius: 10,
        border: isDragOver ? "1px solid #3a3a50" : "1px solid #1f1f27",
        overflow: "hidden",
        transition: "background .15s, border-color .15s",
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 12px", flexShrink: 0, borderBottom: "1px solid #1f1f27",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "3px 8px", borderRadius: 5,
            fontSize: 10, fontWeight: 700, letterSpacing: ".7px", textTransform: "uppercase",
            background: pill.bg, color: pill.color,
          }}>
            <StatusIcon size={10} />{cfg.label}
          </span>
          <span style={{ fontSize: 12, color: "#5a5a64", fontWeight: 500 }}>{tarefas.length}</span>
        </div>
        <AddColumnButton onClick={() => onAddTask(status)} />
      </div>

      {/* Cards sortable */}
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div style={{
          flex: 1, overflowY: "auto", padding: "8px 8px 4px",
          display: "flex", flexDirection: "column", gap: 6,
          /* área de drop mínima para colunas vazias */
          minHeight: 60,
        }}>
          {tarefas.map((tarefa) => (
            <SortableCard key={tarefa.id} tarefa={tarefa} onOpen={() => onOpenTask(tarefa)} />
          ))}
          <AddInlineButton onClick={() => onAddTask(status)} />
        </div>
      </SortableContext>
    </div>
  );
}

/* ─── SortableCard (wrapper DnD) ─────────────────────────────────────────── */

function SortableCard({ tarefa, onOpen }: { tarefa: Tarefa; onOpen: () => void }) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: tarefa.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
        touchAction: "none",
      }}
      {...attributes}
      {...listeners}
    >
      <KanbanCard tarefa={tarefa} onOpen={onOpen} />
    </div>
  );
}

/* ─── Card fantasma no DragOverlay ──────────────────────────────────────── */

function CardGhost({ tarefa }: { tarefa: Tarefa }) {
  return (
    <div style={{
      background: "#22222e", border: "1px solid rgba(124,92,255,0.4)",
      borderRadius: 8, padding: "10px 12px",
      boxShadow: "0 12px 32px rgba(0,0,0,.6)",
      opacity: 0.95, cursor: "grabbing",
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#e6e6ea" }}>{tarefa.nome}</span>
    </div>
  );
}

/* ─── Botões auxiliares ──────────────────────────────────────────────────── */

function AddColumnButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button type="button" aria-label="Adicionar tarefa" onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        width: 24, height: 24, borderRadius: 5, display: "flex",
        alignItems: "center", justifyContent: "center",
        background: hovered ? "#252530" : "none", border: "none",
        color: hovered ? "#e6e6ea" : "#5a5a64", cursor: "pointer",
        transition: "background .12s, color .12s",
      }}
    >
      <IcPlus size={13} />
    </button>
  );
}

function AddInlineButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 6, width: "100%",
        padding: "7px 8px", borderRadius: 7,
        background: hovered ? "#1e1e27" : "none", border: "none",
        color: hovered ? "#b6b6bf" : "#5a5a64", fontSize: 12, cursor: "pointer",
        transition: "background .12s, color .12s", marginBottom: 4,
      }}
    >
      <IcPlus size={12} />Adicionar
    </button>
  );
}

/* ─── KanbanCard ─────────────────────────────────────────────────────────── */

function KanbanCard({ tarefa, onOpen }: { tarefa: Tarefa; onOpen: () => void }) {
  const [hovered, setHovered] = useState(false);

  const membro = tarefa.responsavelId
    ? mockMembros.find((m) => m.id === tarefa.responsavelId) ?? null
    : null;
  const prio = tarefa.prioridade ? PRIO_CONFIG[tarefa.prioridade] : null;

  const dias = diasUntil(tarefa.dataVencimento);
  let dateText = "", dateColor = "#7a7a85", dateBadge = "", dateBadgeColor = "#7a7a85";
  if (tarefa.dataVencimento) {
    const d = new Date(tarefa.dataVencimento + "T00:00:00.000Z");
    dateText = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    if (dias !== null) {
      if (dias < 0) { dateColor = "#fbbf24"; dateBadge = `ATRASADO ${Math.abs(dias)}D`; dateBadgeColor = "#fbbf24"; }
      else if (dias === 0) { dateColor = "#7c5cff"; dateBadge = "HOJE"; dateBadgeColor = "#7c5cff"; }
    }
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#1e1e26" : "#1a1a1f",
        border: hovered ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.07)",
        borderRadius: 8, padding: "10px 12px",
        display: "flex", flexDirection: "column", gap: 9,
        transition: "background .12s, border-color .12s",
        cursor: "grab",
      }}
    >
      {/* Nome clicável — stopPropagation para não iniciar drag ao clicar */}
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); onOpen(); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onOpen(); }}
        style={{ fontSize: 13, fontWeight: 600, color: "#e6e6ea", lineHeight: 1.4, cursor: "pointer", display: "block" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#cfc1ff"; e.currentTarget.style.textDecoration = "underline"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "#e6e6ea"; e.currentTarget.style.textDecoration = "none"; }}
      >
        {tarefa.nome}
      </span>

      {/* Rodapé: prioridade, data, subtarefas, avatar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {prio && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 3,
              fontSize: 10, fontWeight: 600, color: prio.color,
              background: `${prio.color}1a`, borderRadius: 4, padding: "2px 6px", letterSpacing: ".3px",
            }}>
              <IcFlag size={10} />{prio.label}
            </span>
          )}
          {dateText ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: dateColor }}>
              {dateText}
              {dateBadge && (
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase",
                  color: dateBadgeColor, background: `${dateBadgeColor}1a`, borderRadius: 3, padding: "1px 4px",
                }}>
                  {dateBadge}
                </span>
              )}
            </span>
          ) : hovered && (
            <span style={{ color: "#3a3a44" }}><IcCalPlus size={12} /></span>
          )}
          {tarefa.subtarefas > 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: "#5a5a6e" }}>
              <IcGitFork size={10} />{tarefa.subtarefas}
            </span>
          )}
        </div>
        {membro ? (
          <div title={membro.nome} style={{
            width: 20, height: 20, borderRadius: "50%", background: "#3d2a6b",
            color: "#d8ccff", fontSize: 8, fontWeight: 700, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {membro.iniciais}
          </div>
        ) : hovered && (
          <div style={{
            width: 20, height: 20, borderRadius: "50%", background: "#1f1f2a",
            border: "1px dashed #3a3a44", flexShrink: 0,
          }} />
        )}
      </div>
    </div>
  );
}
