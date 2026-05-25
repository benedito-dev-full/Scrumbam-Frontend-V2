"use client";

import React, { use, useState } from "react";
import { Star, Share2, Bot, Sparkles } from "lucide-react";

import { ViewSwitcher } from "@/components/shell/view-switcher";
import {
  IcCaret, IcCheck, IcChat, IcFilter, IcGitFork,
  IcLayers, IcList, IcPlus, IcSearch, IcUser,
} from "@/components/lists/icons";
import { STATUS_CONFIG, GROUP_PILL_STYLE } from "@/components/lists/config";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { TaskSheet } from "@/components/tasks/task-sheet";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";

// ─── Hooks e tipos do backend ─────────────────────────────────────────────────
import { useProject } from "@/hooks/use-projects";
import { useTasksByProject } from "@/hooks/use-tasks";
import { intentionToColumn, isOverdue, priorityToColor, priorityToLabel } from "@/lib/mappers/task-status.mapper";
import type { TaskResponseDto, V3Intention } from "@/lib/types/api";

// ─── Tipo de status visual (espelha StatusTarefa da main) ────────────────────
type StatusVisual = "em-progresso" | "pendente" | "bloqueado" | "atrasado" | "concluido";

const COLUMN_TO_STATUS: Record<string, StatusVisual> = {
  backlog:        "pendente",
  ready:          "pendente",
  "em-progresso": "em-progresso",
  concluido:      "concluido",
  falhou:         "bloqueado",
};

// ─── Página ───────────────────────────────────────────────────────────────────
export default function ListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: projeto, isLoading: loadingProjeto } = useProject(id);
  const { data: tasks = [], isLoading: loadingTasks } = useTasksByProject(id);

  const [view, setView] = useState<"list" | "board">("list");
  const [subtarefasMode, setSubtarefasMode] = useState<SubtarefasMode>("recolhidas");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDefaultStatus, setModalDefaultStatus] = useState<StatusVisual | undefined>(undefined);
  const [selectedTask, setSelectedTask] = useState<TaskResponseDto | null>(null);

  if (loadingProjeto) {
    return (
      <div className="grid h-full place-items-center p-8 text-sm" style={{ color: "#7a7a85" }}>
        Carregando...
      </div>
    );
  }

  if (!projeto) {
    return (
      <div className="grid h-full place-items-center p-8 text-sm" style={{ color: "#7a7a85" }}>
        Lista não encontrada.
      </div>
    );
  }

  function openModal(defaultStatus?: StatusVisual) {
    setModalDefaultStatus(defaultStatus);
    setModalOpen(true);
  }

  const grupos = agruparTasks(tasks);

  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ background: "#111111" }}>
      <PageHeader nome={projeto.nome} />
      <ViewSwitcher
        defaultValue="list"
        value={view}
        onChange={(v) => setView(v as "list" | "board")}
      />
      <Toolbar
        tarefasCount={loadingTasks ? null : tasks.length}
        onAddTask={() => openModal()}
        subtarefasMode={subtarefasMode}
        onSubtarefasMode={setSubtarefasMode}
      />
      {view === "list" ? (
        <ListContent
          grupos={grupos}
          isLoading={loadingTasks}
          subtarefasMode={subtarefasMode}
          onAddTask={openModal}
          onOpenTask={setSelectedTask}
        />
      ) : (
        <BoardContent
          listId={id}
          tasks={tasks}
          onOpenTask={setSelectedTask}
        />
      )}
      <TaskSheet task={selectedTask} onClose={() => setSelectedTask(null)} />
      <CreateTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        listId={id}
        defaultStatus={modalDefaultStatus}
      />
    </div>
  );
}

// ─── Agrupamento de tasks do backend ─────────────────────────────────────────
function agruparTasks(tasks: TaskResponseDto[]): { status: StatusVisual; tarefas: TaskResponseDto[] }[] {
  const mapa: Record<StatusVisual, TaskResponseDto[]> = {
    "em-progresso": [],
    pendente:       [],
    bloqueado:      [],
    atrasado:       [],
    concluido:      [],
  };

  for (const task of tasks) {
    if (isOverdue(task.dueDate, task.status as V3Intention)) {
      mapa["atrasado"].push(task);
    } else {
      const col = intentionToColumn(task.status as V3Intention);
      const sv = COLUMN_TO_STATUS[col] ?? "pendente";
      mapa[sv].push(task);
    }
  }

  const ORDER: StatusVisual[] = ["em-progresso", "pendente", "bloqueado", "atrasado", "concluido"];
  return ORDER
    .filter((s) => mapa[s].length > 0)
    .map((s) => ({ status: s, tarefas: mapa[s] }));
}

// ─── BoardContent ─────────────────────────────────────────────────────────────
function BoardContent({
  listId,
  tasks,
  onOpenTask,
}: {
  listId: string;
  tasks: TaskResponseDto[];
  onOpenTask: (task: TaskResponseDto) => void;
}) {
  return (
    <KanbanBoard
      projectId={listId}
      onSelectTask={(taskId) => {
        const found = tasks.find((t) => t.id === taskId);
        if (found) onOpenTask(found);
      }}
    />
  );
}

// ─── ListContent ──────────────────────────────────────────────────────────────
function ListContent({
  grupos,
  isLoading,
  subtarefasMode,
  onAddTask,
  onOpenTask,
}: {
  grupos: { status: StatusVisual; tarefas: TaskResponseDto[] }[];
  isLoading: boolean;
  subtarefasMode: SubtarefasMode;
  onAddTask: (defaultStatus?: StatusVisual) => void;
  onOpenTask: (task: TaskResponseDto) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto overflow-x-auto" style={{ background: "#111111" }}>
      <div style={{ minWidth: 860, padding: "0 22px 60px" }}>
        {isLoading ? (
          <ListSkeleton />
        ) : grupos.length === 0 ? (
          <EmptyState onAddTask={() => onAddTask()} />
        ) : (
          grupos.map((g) => (
            <GroupBlock
              key={g.status}
              status={g.status}
              tarefas={g.tarefas}
              subtarefasMode={subtarefasMode}
              onAddTask={onAddTask}
              onOpenTask={onOpenTask}
            />
          ))
        )}
        <button
          type="button"
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            color: "#5a5a64", padding: "14px 4px 0 4px",
            fontSize: 13, cursor: "pointer", background: "none", border: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#e6e6ea")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#5a5a64")}
        >
          <IcPlus size={13} />
          Novo status
        </button>
      </div>
    </div>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────
function PageHeader({ nome }: { nome: string }) {
  return (
    <header
      className="flex h-11 shrink-0 items-center justify-between gap-4 px-5"
      style={{ borderBottom: "1px solid #26262d", background: "#111111" }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <IcList size={16} />
        <h1 className="truncate text-sm font-semibold" style={{ color: "#e6e6ea" }}>
          {nome}
        </h1>
        <button type="button" style={{ display: "grid", width: 20, height: 20, placeItems: "center", borderRadius: 4, color: "#7a7a85", background: "none", border: 0 }}>
          <IcCaret size={12} />
        </button>
        <button type="button" style={{ display: "grid", width: 24, height: 24, placeItems: "center", borderRadius: 4, color: "#7a7a85", background: "none", border: 0 }}>
          <Star className="size-3.5" />
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <TbBtn icon={<Bot className="size-3.5" />} label="Agentes" />
        <TbBtn icon={<Sparkles className="size-3.5" />} label="Pergunte à IA" />
        <div style={{ width: 1, height: 16, background: "#26262d", margin: "0 4px" }} />
        <TbBtn icon={<Share2 className="size-3.5" />} label="Compartilhar" bordered />
      </div>
    </header>
  );
}

function TbBtn({ icon, label, bordered }: { icon: React.ReactNode; label: string; bordered?: boolean }) {
  return (
    <button type="button" style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      height: 28, padding: "0 10px", borderRadius: 6,
      border: bordered ? "1px solid #2a2a32" : "none",
      background: bordered ? "#1c1c22" : "none",
      color: "#b6b6bf", fontSize: 13, cursor: "pointer",
    }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#e6e6ea")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "#b6b6bf")}
    >
      {icon}{label}
    </button>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────
type SubtarefasMode = "recolhidas" | "expandidas" | "separar";

function Toolbar({
  tarefasCount,
  onAddTask,
  subtarefasMode,
  onSubtarefasMode,
}: {
  tarefasCount: number | null;
  onAddTask: () => void;
  subtarefasMode: SubtarefasMode;
  onSubtarefasMode: (m: SubtarefasMode) => void;
}) {
  const [subtarefasOpen, setSubtarefasOpen] = useState(false);

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 12, padding: "0 22px", height: 44,
      borderBottom: "1px solid #26262d", background: "#111111", flexShrink: 0,
    }}>
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
              <div style={{ position: "fixed", inset: 0, zIndex: 100 }} onClick={() => setSubtarefasOpen(false)} />
              <div style={{
                position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 101,
                background: "#1c1c24", border: "1px solid #2e2e38", borderRadius: 8,
                padding: "6px 4px", minWidth: 220, boxShadow: "0 8px 24px rgba(0,0,0,.5)",
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#5a5a64", letterSpacing: ".6px", textTransform: "uppercase", padding: "4px 10px 6px", margin: 0 }}>
                  Mostrar subtarefas
                </p>
                {(["recolhidas", "expandidas", "separar"] as SubtarefasMode[]).map((opt) => {
                  const labels: Record<SubtarefasMode, string> = { recolhidas: "Recolhidas", expandidas: "Expandidas", separar: "Separar" };
                  const descs: Record<SubtarefasMode, string | null> = { recolhidas: "(padrão)", expandidas: null, separar: "Usar isto para filtrar subtarefas" };
                  const active = subtarefasMode === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => { onSubtarefasMode(opt); setSubtarefasOpen(false); }}
                      style={{
                        display: "flex", alignItems: "baseline", gap: 6,
                        width: "100%", padding: "7px 10px", borderRadius: 5,
                        background: "none", border: 0, color: "#d4d4dc", fontSize: 13, cursor: "pointer", textAlign: "left",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#26262f"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                    >
                      <span style={{ flex: 1 }}>
                        {labels[opt]}
                        {descs[opt] && <span style={{ color: "#7a7a85", fontSize: 12, marginLeft: 5 }}>{descs[opt]}</span>}
                      </span>
                      {active && <span style={{ color: "#b6b6bf", marginLeft: "auto", flexShrink: 0 }}><IcCheck size={13} /></span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <SmallBtn icon={<IcFilter size={13} />} label="Filtro" />
        <SmallBtn icon={<IcCheck size={13} />} label="Fechado" />
        <SmallBtn icon={<IcUser size={13} />} label="Responsável" />
        <button type="button" style={{ width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 6, color: "#b6b6bf", background: "none", border: 0 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#17171c"; e.currentTarget.style.color = "#e6e6ea"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#b6b6bf"; }}
        >
          <IcSearch size={15} />
        </button>
        {tarefasCount !== null && (
          <span style={{ color: "#7a7a85", fontSize: 12, padding: "0 4px" }}>{tarefasCount} tarefas</span>
        )}
        <div style={{ display: "inline-flex", alignItems: "stretch", height: 28, border: "1px solid #2a2a32", background: "#1c1c22", borderRadius: 6, overflow: "hidden" }}>
          <button
            type="button"
            onClick={onAddTask}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0 12px", fontSize: 13, color: "#e6e6ea", background: "none", border: 0, cursor: "pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#252530"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
          >
            Add Tarefa
          </button>
          <div style={{ width: 1, background: "#2a2a32" }} />
          <button type="button" style={{ width: 26, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#b6b6bf", background: "none", border: 0, cursor: "pointer" }}>
            <IcCaret size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

function TabBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 6, height: 28, padding: "0 10px",
      borderRadius: 6, background: active ? "rgba(124,92,255,0.16)" : "none",
      border: 0, color: active ? "#cfc1ff" : "#b6b6bf", fontSize: 13, fontWeight: 500, cursor: "pointer",
    }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "#17171c"; e.currentTarget.style.color = "#e6e6ea"; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#b6b6bf"; } }}
    >
      {icon} {label}
    </button>
  );
}

function SmallBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button type="button" style={{
      display: "inline-flex", alignItems: "center", gap: 6, height: 28, padding: "0 10px",
      border: "1px solid #2a2a32", background: "#1c1c22", borderRadius: 6, color: "#b6b6bf", fontSize: 13, cursor: "pointer",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.color = "#e6e6ea"; e.currentTarget.style.borderColor = "#34343d"; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = "#b6b6bf"; e.currentTarget.style.borderColor = "#2a2a32"; }}
    >
      {icon} {label}
    </button>
  );
}

// ─── GroupBlock ───────────────────────────────────────────────────────────────
function GroupBlock({
  status,
  tarefas,
  subtarefasMode,
  onAddTask,
  onOpenTask,
}: {
  status: StatusVisual;
  tarefas: TaskResponseDto[];
  subtarefasMode: SubtarefasMode;
  onAddTask: (defaultStatus?: StatusVisual) => void;
  onOpenTask: (task: TaskResponseDto) => void;
}) {
  const [open, setOpen] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const cfg = STATUS_CONFIG[status];
  const StatusIcon = cfg.Icon;

  function isExpanded(id: string) {
    if (subtarefasMode === "expandidas") return true;
    if (subtarefasMode === "recolhidas") return false;
    return !!expandedRows[id];
  }

  const tarefasVisiveis = subtarefasMode === "separar"
    ? tarefas.filter((t) => !t.idPai)
    : tarefas;

  return (
    <div style={{ marginBottom: 8, marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0 8px" }}>
        <button type="button" onClick={() => setOpen((v) => !v)} style={{
          width: 18, display: "inline-flex", alignItems: "center", justifyContent: "center",
          color: "#7a7a85", background: "none", border: 0, cursor: "pointer",
          transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform .15s",
        }}>
          <IcCaret size={12} />
        </button>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 9px",
          borderRadius: 5, fontSize: 11, fontWeight: 700, letterSpacing: ".7px", textTransform: "uppercase",
          background: GROUP_PILL_STYLE[status].bg, color: GROUP_PILL_STYLE[status].color,
        }}>
          <StatusIcon size={11} />
          {cfg.label}
        </span>
        <span style={{ color: "#7a7a85", fontSize: 12, marginLeft: 2 }}>{tarefasVisiveis.length}</span>
      </div>

      {open && (
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "auto" }} />
            <col style={{ width: 170 }} />
            <col style={{ width: 200 }} />
            <col style={{ width: 130 }} />
            <col style={{ width: 200 }} />
            <col style={{ width: 48 }} />
            <col style={{ width: 36 }} />
          </colgroup>
          <thead><HeadRow /></thead>
          <tbody>
            {tarefasVisiveis.map((t) => (
              <TaskRowBackend
                key={t.id}
                task={t}
                expanded={isExpanded(t.id)}
                onToggle={() => setExpandedRows((s) => ({ ...s, [t.id]: !s[t.id] }))}
                onOpen={() => onOpenTask(t)}
              />
            ))}
            <AddRow onAddTask={() => onAddTask(status)} />
          </tbody>
        </table>
      )}
    </div>
  );
}

function HeadRow() {
  const thStyle: React.CSSProperties = {
    fontWeight: 500, color: "#7a7a85", fontSize: 12, textAlign: "left",
    padding: "6px 10px", borderTop: "1px solid #1f1f25", borderBottom: "1px solid #1f1f25", background: "transparent",
  };
  return (
    <tr>
      <th style={{ ...thStyle, paddingLeft: 30 }}>Nome</th>
      <th style={thStyle}>Responsável</th>
      <th style={thStyle}>Data de vencimento</th>
      <th style={thStyle}>Prioridade</th>
      <th style={thStyle}>Status</th>
      <th style={{ ...thStyle, textAlign: "center" }}><IcChat size={13} /></th>
      <th style={{ ...thStyle, textAlign: "center" }}>
        <span style={{ display: "inline-flex", width: 18, height: 18, borderRadius: "50%", background: "#2a2a32", alignItems: "center", justifyContent: "center", color: "#cfcfd6" }}>
          <IcPlus size={11} />
        </span>
      </th>
    </tr>
  );
}

// ─── TaskRow adaptado para dados reais do backend ────────────────────────────
function TaskRowBackend({
  task,
  expanded: _expanded,
  onToggle,
  onOpen,
}: {
  task: TaskResponseDto;
  expanded: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const overdue = isOverdue(task.dueDate, task.status as V3Intention);
  const prioColor = priorityToColor(task.priority);
  const prioLabel = priorityToLabel(task.priority);

  const dateLabel = task.dueDate
    ? new Date(task.dueDate.slice(0, 10) + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    : null;

  const tdStyle: React.CSSProperties = {
    borderBottom: "1px solid #1f1f25",
    background: hovered ? "#15151a" : "transparent",
    transition: "background .1s",
  };

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOpen}
      style={{ cursor: "pointer" }}
    >
      {/* Nome */}
      <td style={{ ...tdStyle, padding: "0 10px 0 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, height: 36, paddingLeft: 8 }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            style={{ width: 16, height: 16, flexShrink: 0, background: "none", border: 0, color: "#5a5a64", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
          >
            <IcCaret size={10} />
          </button>
          <span style={{ fontFamily: "monospace", fontSize: 10, color: "#5a5a64", flexShrink: 0 }}>
            {task.identifier}
          </span>
          <span style={{ fontSize: 13, color: "#e6e6ea", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {task.nome}
          </span>
          {task.idPai && <IcGitFork size={12} />}
        </div>
      </td>

      {/* Responsável */}
      <td style={{ ...tdStyle, padding: "0 10px" }}>
        <span style={{ fontSize: 12, color: "#5a5a64" }}>—</span>
      </td>

      {/* Data de vencimento */}
      <td style={{ ...tdStyle, padding: "0 10px" }}>
        {dateLabel ? (
          <span style={{ fontSize: 12, color: overdue ? "#fbbf24" : "#b6b6bf" }}>
            {overdue && "⚠ "}{dateLabel}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "#5a5a64" }}>—</span>
        )}
      </td>

      {/* Prioridade */}
      <td style={{ ...tdStyle, padding: "0 10px" }}>
        {task.priority ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12 }}>
            <IcFlagInline size={12} color={prioColor} />
            <span style={{ color: prioColor }}>{prioLabel}</span>
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "#5a5a64" }}>—</span>
        )}
      </td>

      {/* Status */}
      <td style={{ ...tdStyle, padding: "0 10px" }}>
        <span style={{ fontSize: 12, color: "#b6b6bf" }}>{task.status}</span>
      </td>

      {/* Comentários */}
      <td style={{ ...tdStyle, textAlign: "center" }}>
        <IcChat size={13} />
      </td>

      {/* Ações */}
      <td style={{ ...tdStyle }} />
    </tr>
  );
}

function AddRow({ onAddTask }: { onAddTask: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onAddTask}
      style={{ cursor: "pointer" }}
    >
      <td colSpan={7} style={{ height: 34, borderBottom: "1px solid #1f1f25", background: hovered ? "#15151a" : "transparent" }}>
        <div style={{ paddingLeft: 30, height: 34, display: "flex", alignItems: "center", gap: 7, color: hovered ? "#e6e6ea" : "#7a7a85", fontSize: 13 }}>
          <IcPlus size={13} />Adicionar Tarefa
        </div>
      </td>
    </tr>
  );
}

function EmptyState({ onAddTask }: { onAddTask: () => void }) {
  return (
    <div style={{ marginTop: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 40, border: "1px dashed #26262d", borderRadius: 8, textAlign: "center" }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#1f1f25", display: "flex", alignItems: "center", justifyContent: "center", color: "#7a7a85" }}>
        <IcPlus size={18} />
      </div>
      <p style={{ color: "#e6e6ea", fontSize: 14, fontWeight: 500, margin: 0 }}>Nenhuma tarefa nesta lista ainda</p>
      <p style={{ color: "#7a7a85", fontSize: 12, margin: 0 }}>Crie a primeira tarefa para começar.</p>
      <button
        type="button"
        onClick={onAddTask}
        style={{
          marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6,
          height: 32, padding: "0 14px", borderRadius: 7, border: "none",
          background: "linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)",
          color: "#0a0a0a", fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}
      >
        <IcPlus size={13} />
        Nova tarefa
      </button>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div style={{ marginTop: 16 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ height: 36, marginBottom: 2, borderRadius: 4, background: "#1a1a1f" }} />
      ))}
    </div>
  );
}

// ─── Ícones inline (não exportados do icons.tsx) ──────────────────────────────
function IcFlagInline({ size, color }: { size: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <path d="M3 2v12M3 2h8l-2 3.5L11 9H3" stroke={color ?? "currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
