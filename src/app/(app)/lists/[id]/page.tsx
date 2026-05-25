"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import {
  Star, Share2, ChevronDown, ChevronRight,
  Bell, Calendar, Flag, Plus, SlidersHorizontal,
  CheckCircle2, User, Search, LayoutGrid,
} from "lucide-react";

import { KanbanBoard } from "@/components/tasks/kanban-board";
import { TaskDetailDrawer } from "@/components/tasks/task-detail-drawer";
import { useProject } from "@/hooks/use-projects";
import { useTasksByProject, useCreateTask } from "@/hooks/use-tasks";
import {
  KANBAN_COLUMNS,
  intentionToColumn,
  isOverdue,
  priorityToColor,
  priorityToLabel,
} from "@/lib/mappers/task-status.mapper";
import type { DProjectDto, TaskResponseDto, V3Intention } from "@/lib/types/api";
import { cn } from "@/lib/utils";

// ─── Mapeamento status → label e cor ─────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  INBOX: "Backlog", READY: "Ready", EXECUTING: "Em Progresso",
  VALIDATING: "Validando", DONE: "Concluído", VALIDATED: "Validado",
  FAILED: "Falhou", CANCELLED: "Cancelado", DISCARDED: "Descartado",
};

const STATUS_COLOR: Record<string, string> = {
  INBOX: "#6b7280", READY: "#3b82f6", EXECUTING: "#8b5cf6",
  VALIDATING: "#f59e0b", DONE: "#10b981", VALIDATED: "#10b981",
  FAILED: "#ef4444", CANCELLED: "#71717a", DISCARDED: "#6b7280",
};

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: listData, isLoading } = useProject(id);
  const { data: folderData } = useProject(listData?.idPai ?? null);
  const { data: spaceData } = useProject(folderData?.idPai ?? null);

  const [view, setView] = useState<"lista" | "quadro">("lista");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="grid h-full place-items-center text-sm text-muted-foreground">Carregando…</div>;
  }
  if (!listData) {
    return <div className="grid h-full place-items-center text-sm text-muted-foreground">Lista não encontrada.</div>;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#111111]">
      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-5 pt-2 text-[12px] text-[#7a7a85]">
        {spaceData && (
          <>
            <Link href={`/spaces/${spaceData.id}`} className="hover:text-[#b6b6bf] transition-colors">
              {spaceData.nome}
            </Link>
            <ChevronRight size={11} className="text-[#4a4a54]" />
          </>
        )}
        {folderData && (
          <>
            <Link href={`/folders/${folderData.id}`} className="hover:text-[#b6b6bf] transition-colors">
              {folderData.nome}
            </Link>
            <ChevronRight size={11} className="text-[#4a4a54]" />
          </>
        )}
        <span className="flex items-center gap-1 text-[#b6b6bf]">
          {/* ícone lista inline no breadcrumb */}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          List
        </span>
        <ChevronRight size={11} className="text-[#4a4a54]" />
        <span className="text-[#b6b6bf] font-medium">{listData.nome}</span>
        <button type="button" className="ml-0.5 text-[#4a4a54] hover:text-[#7a7a85]">
          <Star size={11} />
        </button>
      </div>

      {/* ── Header: título + ações ───────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-1.5">
        {/* Tabs de view */}
        <div className="flex items-center gap-0.5">
          <ViewTab
            label="Lista"
            icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            }
            active={view === "lista"}
            onClick={() => setView("lista")}
          />
          <ViewTab
            label="Quadro"
            icon={<LayoutGrid size={13} />}
            active={view === "quadro"}
            onClick={() => setView("quadro")}
          />
          <button type="button" className="flex items-center gap-1 px-3 py-1 text-[13px] text-[#7a7a85] hover:text-[#b6b6bf]">
            <Plus size={12} /> Visualização
          </button>
        </div>

        {/* Ações direita */}
        <div className="flex items-center gap-1.5">
          <HdrBtn label="Agentes" />
          <HdrBtn label="Pergunte à IA" accent />
          <HdrBtn label="⚡ Compartilhar" bordered />
        </div>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <Toolbar listId={id} />

      {/* ── Conteúdo ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {view === "lista" ? (
          <ListView listId={id} onSelectTask={setSelectedTaskId} />
        ) : (
          <KanbanBoard projectId={id} onSelectTask={setSelectedTaskId} />
        )}
      </div>

      {/* ── Drawer de detalhe ───────────────────────────────────────────── */}
      {selectedTaskId && (
        <TaskDetailDrawer
          taskId={selectedTaskId}
          projectId={id}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}

// ─── View Lista (agrupada por status, estilo ClickUp) ─────────────────────────

function ListView({ listId, onSelectTask }: { listId: string; onSelectTask: (id: string) => void }) {
  const { data: tasks = [], isLoading } = useTasksByProject(listId);
  const { mutate: createTask } = useCreateTask();

  // Agrupa tasks pelas 5 colunas Kanban
  const groups = KANBAN_COLUMNS.map((col) => ({
    col,
    tasks: tasks.filter((t) => intentionToColumn(t.status as V3Intention) === col.id),
  }));

  return (
    <div className="flex-1 overflow-y-auto overflow-x-auto">
      <div style={{ minWidth: 700 }}>
        {/* Cabeçalho de colunas — fixo */}
        <div className="sticky top-0 z-10 flex items-center border-b border-[#26262d] bg-[#111111] px-5 py-0" style={{ minWidth: 700 }}>
          <div className="flex-1 py-2 text-[12px] font-medium text-[#5a5a64]">Nome</div>
          <div className="w-[140px] shrink-0 py-2 text-[12px] font-medium text-[#5a5a64]">Responsável</div>
          <div className="w-[150px] shrink-0 py-2 text-[12px] font-medium text-[#5a5a64]">Data de vencimento</div>
          <div className="w-[120px] shrink-0 py-2 text-[12px] font-medium text-[#5a5a64]">Prioridade</div>
          <div className="w-[32px] shrink-0" />
        </div>

        {isLoading ? (
          <ListSkeleton />
        ) : (
          <>
            {groups.map(({ col, tasks: groupTasks }) => (
              <StatusGroup
                key={col.id}
                label={col.label}
                color={col.color}
                tasks={groupTasks}
                onSelectTask={onSelectTask}
                onAddTask={() =>
                  createTask({ titulo: "Nova tarefa", idProject: listId })
                }
              />
            ))}

            {/* + Novo status */}
            <button
              type="button"
              className="flex h-9 items-center gap-2 px-5 text-[13px] text-[#5a5a64] hover:text-[#b6b6bf] transition-colors"
            >
              <Plus size={13} />
              Novo status
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Grupo de status ──────────────────────────────────────────────────────────

function StatusGroup({
  label, color, tasks, onSelectTask, onAddTask,
}: {
  label: string;
  color: string;
  tasks: TaskResponseDto[];
  onSelectTask: (id: string) => void;
  onAddTask: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [addingInline, setAddingInline] = useState(false);
  const { mutate: createTask, isPending } = useCreateTask();
  const [draft, setDraft] = useState("");

  function handleInlineSubmit(listId?: string) {
    if (!draft.trim() || !listId) return;
    createTask(
      { titulo: draft.trim(), idProject: listId },
      { onSuccess: () => { setDraft(""); setAddingInline(false); } },
    );
  }

  return (
    <div>
      {/* Header do grupo */}
      <div
        className="group flex h-9 cursor-pointer items-center gap-2 px-5 hover:bg-[#161619]"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-[#5a5a64] transition-transform" style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)", display: "inline-flex" }}>
          <ChevronDown size={13} />
        </span>
        {/* Ícone de status circular */}
        <span className="flex size-4 shrink-0 items-center justify-center rounded-full border-2" style={{ borderColor: color }}>
          <span className="size-1.5 rounded-full" style={{ background: color }} />
        </span>
        <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color }}>
          {label}
        </span>
        <span className="text-[12px] text-[#5a5a64]">{tasks.length}</span>
      </div>

      {/* Linhas de tasks */}
      {open && (
        <>
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} onClick={() => onSelectTask(task.id)} />
          ))}

          {/* Inline add */}
          {addingInline ? (
            <div className="flex h-9 items-center gap-3 border-b border-[#26262d] px-5">
              <span className="flex size-4 shrink-0 items-center justify-center rounded-full border-2" style={{ borderColor: color }}>
                <span className="size-1.5 rounded-full" style={{ background: color }} />
              </span>
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleInlineSubmit();
                  if (e.key === "Escape") { setAddingInline(false); setDraft(""); }
                }}
                placeholder="Nome da tarefa…"
                disabled={isPending}
                className="flex-1 bg-transparent text-[13px] text-[#e6e6ea] placeholder:text-[#5a5a64] outline-none"
              />
              <span className="text-[11px] text-[#5a5a64]">Enter para salvar · Esc para cancelar</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingInline(true)}
              className="flex h-9 w-full items-center gap-2 border-b border-[#1e1e22] px-5 text-[13px] text-[#5a5a64] transition-colors hover:bg-[#161619] hover:text-[#b6b6bf]"
            >
              <Plus size={13} />
              Adicionar Tarefa
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ─── Linha de task ────────────────────────────────────────────────────────────

function TaskRow({ task, onClick }: { task: TaskResponseDto; onClick: () => void }) {
  const color = STATUS_COLOR[task.status] ?? "#6b7280";
  const overdue = isOverdue(task.dueDate, task.status as V3Intention);
  const dateLabel = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    : null;
  const prioColor = priorityToColor(task.priority);
  const prioLabel = priorityToLabel(task.priority);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      className="group flex h-9 cursor-pointer items-center border-b border-[#1e1e22] px-5 transition-colors hover:bg-[#161619]"
    >
      {/* Nome */}
      <div className="flex flex-1 items-center gap-2 min-w-0">
        {/* Ícone circular do status */}
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="flex size-4 shrink-0 items-center justify-center rounded-full border-2 hover:opacity-80 transition-opacity"
          style={{ borderColor: color }}
          title={STATUS_LABEL[task.status]}
        >
          <span className="size-1.5 rounded-full" style={{ background: color }} />
        </button>
        <span className="truncate text-[13px] text-[#e6e6ea]">{task.title}</span>
        {task.identifier && (
          <span className="shrink-0 font-mono text-[11px] text-[#5a5a64] opacity-0 transition-opacity group-hover:opacity-100">
            {task.identifier}
          </span>
        )}
      </div>

      {/* Responsável */}
      <div className="flex w-[140px] shrink-0 items-center">
        {task.assigneeId ? (
          <span className="flex size-6 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
            {task.assigneeId.slice(0, 2).toUpperCase()}
          </span>
        ) : (
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="flex size-6 items-center justify-center rounded-full border border-dashed border-[#3a3a44] text-[#5a5a64] opacity-0 transition-opacity group-hover:opacity-100 hover:border-[#7a7a85] hover:text-[#b6b6bf]"
          >
            <Bell size={11} />
          </button>
        )}
      </div>

      {/* Data de vencimento */}
      <div className="flex w-[150px] shrink-0 items-center">
        {dateLabel ? (
          <span className={cn(
            "flex items-center gap-1 text-[12px]",
            overdue ? "text-red-400 font-medium" : "text-[#7a7a85]",
          )}>
            <Calendar size={11} />
            {dateLabel}
            {overdue && <span className="rounded-sm bg-red-500/15 px-1 py-px text-[10px] text-red-400">atrasado</span>}
          </span>
        ) : (
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-[12px] text-[#5a5a64] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[#b6b6bf]"
          >
            <Calendar size={11} />
          </button>
        )}
      </div>

      {/* Prioridade */}
      <div className="flex w-[120px] shrink-0 items-center">
        {task.priority ? (
          <span className="flex items-center gap-1.5 text-[12px] text-[#b6b6bf]">
            <Flag size={11} style={{ color: prioColor }} />
            {prioLabel}
          </span>
        ) : (
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-[12px] text-[#5a5a64] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[#b6b6bf]"
          >
            <Flag size={11} />
          </button>
        )}
      </div>

      {/* Coluna extra (+ campo) */}
      <div className="flex w-[32px] shrink-0 items-center justify-center">
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="size-5 text-[#5a5a64] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[#b6b6bf]"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

function Toolbar({ listId }: { listId: string }) {
  const { mutate: createTask } = useCreateTask();

  return (
    <div className="flex items-center justify-between border-b border-[#26262d] bg-[#111111] px-5" style={{ height: 40, flexShrink: 0 }}>
      {/* Esquerda */}
      <div className="flex items-center gap-1">
        <TbTab active icon={
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        } label="Grupo: Status" />
        <TbTab icon={
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
        } label="Subtarefas" />
        <TbTab icon={
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
        } label="Colunas" />
      </div>

      {/* Direita */}
      <div className="flex items-center gap-1.5">
        <SmTbBtn icon={<SlidersHorizontal size={12} />} label="Filtro" />
        <SmTbBtn icon={<CheckCircle2 size={12} />} label="Fechado" />
        <SmTbBtn icon={<User size={12} />} label="Responsável" />
        <button type="button" className="flex size-7 items-center justify-center rounded text-[#7a7a85] hover:bg-[#1c1c22] hover:text-[#e6e6ea]">
          <Search size={13} />
        </button>
        {/* Add Tarefa split button */}
        <div className="flex overflow-hidden rounded border border-[#2a2a32]">
          <button
            type="button"
            onClick={() => createTask({ titulo: "Nova tarefa", idProject: listId })}
            className="flex items-center gap-1.5 bg-[#1c1c22] px-3 text-[13px] text-[#e6e6ea] transition-colors hover:bg-[#252530]"
            style={{ height: 28 }}
          >
            Add Tarefa
          </button>
          <div className="w-px bg-[#2a2a32]" />
          <button type="button" className="flex w-6 items-center justify-center bg-[#1c1c22] text-[#7a7a85] hover:bg-[#252530]">
            <ChevronDown size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-componentes menores ──────────────────────────────────────────────────

function ViewTab({ label, icon, active, onClick }: {
  label: string; icon: React.ReactNode; active: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex h-9 items-center gap-1.5 px-3 text-[13px] font-medium transition-colors",
        active
          ? "text-[#e6e6ea] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#7c5cfc]"
          : "text-[#7a7a85] hover:text-[#b6b6bf]",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function HdrBtn({ label, accent, bordered }: { label: string; accent?: boolean; bordered?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-colors",
        accent && "bg-[#5a4fcf] text-white hover:bg-[#4e44b8]",
        bordered && !accent && "border border-[#2a2a32] bg-[#1c1c22] text-[#b6b6bf] hover:text-[#e6e6ea]",
        !accent && !bordered && "text-[#b6b6bf] hover:text-[#e6e6ea]",
      )}
    >
      {label}
    </button>
  );
}

function TbTab({ label, icon, active }: { label: string; icon: React.ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-7 items-center gap-1.5 rounded px-2.5 text-[13px] font-medium transition-colors",
        active
          ? "bg-[rgba(124,92,255,0.16)] text-[#cfc1ff]"
          : "text-[#7a7a85] hover:bg-[#17171c] hover:text-[#e6e6ea]",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function SmTbBtn({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      className="flex h-7 items-center gap-1.5 rounded border border-[#2a2a32] bg-[#1c1c22] px-2.5 text-[13px] text-[#7a7a85] transition-colors hover:text-[#e6e6ea]"
    >
      {icon}
      {label}
    </button>
  );
}

function ListSkeleton() {
  return (
    <div>
      {[1, 2, 3].map((g) => (
        <div key={g}>
          <div className="flex h-9 items-center gap-3 px-5">
            <div className="size-4 animate-pulse rounded-full bg-[#2a2a32]" />
            <div className="h-3 w-24 animate-pulse rounded bg-[#2a2a32]" />
          </div>
          {[1, 2].map((r) => (
            <div key={r} className="flex h-9 items-center gap-3 border-b border-[#1e1e22] px-5">
              <div className="size-4 animate-pulse rounded-full bg-[#2a2a32]" />
              <div className="h-3 w-[200px] animate-pulse rounded bg-[#2a2a32]" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
