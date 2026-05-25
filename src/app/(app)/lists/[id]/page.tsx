"use client";

import React, { use, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { LayoutGrid, ChevronDown, Star } from "lucide-react";

import { KanbanBoard } from "@/components/tasks/kanban-board";
import { TaskDetailDrawer } from "@/components/tasks/task-detail-drawer";
import { useProject } from "@/hooks/use-projects";
import { useTasksByProject, useCreateTask, useUpdateTask } from "@/hooks/use-tasks";
import {
  KANBAN_COLUMNS,
  intentionToColumn,
  isOverdue,
  priorityToColor,
  priorityToLabel,
} from "@/lib/mappers/task-status.mapper";
import {
  IcCaret, IcChat, IcFilter, IcGitFork, IcColumns,
  IcList, IcPlus, IcSearch, IcUser, IcCalPlus, IcFlag, IcUserPlus, IcCheck,
} from "@/components/lists/icons";
import type { TaskResponseDto, V3Intention } from "@/lib/types/api";
import { cn } from "@/lib/utils";

// ─── Config visual por status ─────────────────────────────────────────────────

type ColCfg = {
  label: string;
  dotColor: string;
  pillBg: string;
  pillColor: string;
  iconType: "circle-dot" | "circle-half" | "circle-check" | "circle-x" | "circle";
};

const COL_CFG: Record<string, ColCfg> = {
  backlog:   { label: "BACKLOG",      dotColor: "#6b7280", pillBg: "#2a2a31",    pillColor: "#9ca3af", iconType: "circle"       },
  ready:     { label: "READY",        dotColor: "#3b82f6", pillBg: "#1e3a5f",    pillColor: "#93c5fd", iconType: "circle-dot"   },
  progresso: { label: "EM PROGRESSO", dotColor: "#7c5cff", pillBg: "#5b3fcb",    pillColor: "#ffffff", iconType: "circle-half"  },
  concluido: { label: "CONCLUÍDO",    dotColor: "#10b981", pillBg: "#065f46",    pillColor: "#6ee7b7", iconType: "circle-check" },
  falhou:    { label: "FALHOU",       dotColor: "#ef4444", pillBg: "#7f1d1d",    pillColor: "#fca5a5", iconType: "circle-x"     },
};

const PRIO_CFG: Record<string, { label: string; color: string }> = {
  URGENT: { label: "Urgente", color: "#ef4444" },
  HIGH:   { label: "Alta",    color: "#f59e0b" },
  MEDIUM: { label: "Média",   color: "#60a5fa" },
  LOW:    { label: "Baixa",   color: "#71717a" },
};

// ─── Ícone de status do grupo ─────────────────────────────────────────────────

function StatusIcon({ type, color, size = 14 }: { type: ColCfg["iconType"]; color: string; size?: number }) {
  const s = size;
  if (type === "circle-dot") {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" stroke={color} strokeWidth="1.5" />
        <circle cx="8" cy="8" r="2.5" fill={color} />
      </svg>
    );
  }
  if (type === "circle-half") {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" stroke={color} strokeWidth="1.5" />
        <path d="M8 1a7 7 0 0 1 0 14V1z" fill={color} />
      </svg>
    );
  }
  if (type === "circle-check") {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" fill={color} />
        <path d="M5 8.5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === "circle-x") {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" fill={color} />
        <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  // circle (backlog)
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke={color} strokeWidth="1.5" strokeDasharray="3 2" />
    </svg>
  );
}

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

      {/* ── Linha 1: Breadcrumb + ações ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-2 pb-0.5">
        {/* Breadcrumb com / como separador */}
        <div className="flex items-center gap-1 text-[12px] text-[#6a6a75]">
          {spaceData && (
            <>
              <Link href={`/spaces/${spaceData.id}`} className="transition-colors hover:text-[#b6b6bf]">
                {spaceData.nome}
              </Link>
              <span className="text-[#3a3a45]">/</span>
            </>
          )}
          {folderData && (
            <>
              <Link href={`/folders/${folderData.id}`} className="transition-colors hover:text-[#b6b6bf]">
                {folderData.nome}
              </Link>
              <span className="text-[#3a3a45]">/</span>
            </>
          )}
          {/* Ícone + nome da lista + chevron dropdown + estrela */}
          <span className="flex items-center gap-1 text-[#b6b6bf]">
            <IcList size={12} />
            <span className="font-medium">{listData.nome}</span>
            <svg width={10} height={10} viewBox="0 0 12 12" fill="currentColor" className="text-[#5a5a65]" style={{ transform: "rotate(-90deg)" }}>
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <button type="button" className="ml-0.5 text-[#4a4a55] transition-colors hover:text-[#9a9aaa]">
            <Star size={12} />
          </button>
        </div>

        {/* Ações do lado direito */}
        <div className="flex items-center gap-1">
          <TopBtn label="Agentes" />
          <TopBtn label="Pergunte à IA" accent />
          <TopBtn label="⚡ Compartilhar" />
        </div>
      </div>

      {/* ── Linha 2: Tabs de view ────────────────────────────────────────────── */}
      <div className="flex items-center gap-0 border-b border-[#1e1e24] px-2">
        {/* "Adicionar canal" só aparece no ClickUp — botão fantasma */}
        <button type="button" className="flex h-9 items-center gap-1 px-3 text-[13px] text-[#5a5a65] transition-colors hover:text-[#b6b6bf]">
          Adicionar canal
        </button>
        <ViewTab label="Lista" icon={<IcList size={13} />} active={view === "lista"} onClick={() => setView("lista")} />
        <ViewTab label="Quadro" icon={<LayoutGrid size={13} />} active={view === "quadro"} onClick={() => setView("quadro")} />
        <button type="button" className="flex items-center gap-1 px-3 py-2 text-[13px] text-[#6a6a75] hover:text-[#b6b6bf]">
          <IcPlus size={12} />
          Visualização
        </button>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <Toolbar listId={id} />

      {/* ── Conteúdo ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {view === "lista" ? (
          <ListView listId={id} onSelectTask={setSelectedTaskId} />
        ) : (
          <KanbanBoard projectId={id} onSelectTask={setSelectedTaskId} />
        )}
      </div>

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

// ─── Vista Lista ──────────────────────────────────────────────────────────────

function ListView({ listId, onSelectTask }: { listId: string; onSelectTask: (id: string) => void }) {
  const { data: tasks = [], isLoading } = useTasksByProject(listId);

  const groups = KANBAN_COLUMNS.map((col) => ({
    col,
    tasks: tasks.filter((t) => intentionToColumn(t.status as V3Intention) === col.id),
  }));

  return (
    <div className="flex-1 overflow-y-auto overflow-x-auto">
      <div style={{ minWidth: 720 }}>
        {isLoading ? (
          <Skeleton />
        ) : (
          <>
            {groups.map(({ col, tasks: gt }) => {
              const cfg = COL_CFG[col.id] ?? COL_CFG.backlog;
              return (
                <GroupBlock
                  key={col.id}
                  colId={col.id}
                  cfg={cfg}
                  tasks={gt}
                  listId={listId}
                  onSelectTask={onSelectTask}
                />
              );
            })}

            <button
              type="button"
              className="flex h-9 items-center gap-2 px-4 text-[13px] text-[#4a4a55] transition-colors hover:text-[#b6b6bf]"
            >
              <IcPlus size={13} />
              Novo status
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Bloco de grupo ───────────────────────────────────────────────────────────

function GroupBlock({
  colId, cfg, tasks, listId, onSelectTask,
}: {
  colId: string;
  cfg: ColCfg;
  tasks: TaskResponseDto[];
  listId: string;
  onSelectTask: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [addingInline, setAddingInline] = useState(false);
  const [draft, setDraft] = useState("");
  const { mutate: createTask, isPending } = useCreateTask();

  function handleInlineSubmit() {
    if (!draft.trim()) return;
    createTask(
      { titulo: draft.trim(), idProject: listId },
      { onSuccess: () => { setDraft(""); setAddingInline(false); } },
    );
  }

  return (
    <div>
      {/* ── Cabeçalho do grupo ── */}
      <div
        className="group flex h-9 cursor-pointer items-center gap-2 px-3 transition-colors hover:bg-[#141418]"
        onClick={() => setOpen((v) => !v)}
      >
        {/* Chevron */}
        <span
          className="flex-shrink-0 text-[#4a4a55] transition-transform duration-150"
          style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)", display: "inline-flex" }}
        >
          <IcCaret size={12} />
        </span>

        {/* Ícone circular do status */}
        <span className="flex-shrink-0">
          <StatusIcon type={cfg.iconType} color={cfg.dotColor} size={14} />
        </span>

        {/* Badge pill */}
        <span
          style={{
            display: "inline-flex", alignItems: "center",
            padding: "2px 8px", borderRadius: 4,
            fontSize: 11, fontWeight: 700, letterSpacing: ".6px",
            background: cfg.pillBg, color: cfg.pillColor,
            whiteSpace: "nowrap",
          }}
        >
          {cfg.label}
        </span>

        {/* Contador */}
        <span className="text-[12px] text-[#4a4a55]">{tasks.length}</span>
      </div>

      {/* ── Cabeçalho de colunas (dentro do grupo, como no ClickUp) ── */}
      {open && (
        <div
          className="flex items-center border-b border-[#232329]"
          style={{ height: 30 }}
        >
          <div className="flex-1 px-4 text-[12px] font-medium text-[#4a4a55]">Nome</div>
          <div style={{ width: 140 }} className="px-3 text-[12px] font-medium text-[#4a4a55]">Responsável</div>
          <div style={{ width: 150 }} className="px-3 text-[12px] font-medium text-[#4a4a55]">Data de vencimento</div>
          <div style={{ width: 110 }} className="px-3 text-[12px] font-medium text-[#4a4a55]">Prioridade</div>
          <div style={{ width: 40 }} className="flex items-center justify-center">
            <button type="button" className="flex size-5 items-center justify-center rounded text-[#4a4a55] hover:bg-[#1e1e24] hover:text-[#9a9aaa]">
              <IcPlus size={11} />
            </button>
          </div>
        </div>
      )}

      {/* ── Linhas de tasks ── */}
      {open && (
        <div>
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              cfg={cfg}
              listId={listId}
              onOpen={() => onSelectTask(task.id)}
            />
          ))}

          {/* Adicionar tarefa inline */}
          {addingInline ? (
            <div
              className="flex items-center gap-3 border-b border-[#1e1e24]"
              style={{ height: 36, paddingLeft: 16 }}
            >
              <StatusIcon type={cfg.iconType} color={cfg.dotColor} size={13} />
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
                className="flex-1 bg-transparent text-[13px] text-[#e6e6ea] outline-none placeholder:text-[#4a4a55]"
              />
              <span className="pr-4 text-[11px] text-[#4a4a55]">Enter · Esc</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingInline(true)}
              className="flex h-9 w-full items-center gap-2 border-b border-[#1a1a1f] px-4 text-[13px] text-[#4a4a55] transition-colors hover:bg-[#141418] hover:text-[#9a9aaa]"
            >
              <IcPlus size={12} />
              Adicionar Tarefa
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Linha de task ────────────────────────────────────────────────────────────

function TaskRow({
  task, cfg, listId, onOpen,
}: {
  task: TaskResponseDto;
  cfg: ColCfg;
  listId: string;
  onOpen: () => void;
}) {
  const { mutate: updateTask } = useUpdateTask();
  const [rowHovered, setRowHovered] = useState(false);
  const [flashCell, setFlashCell] = useState<string | null>(null);
  const [openDD, setOpenDD] = useState<string | null>(null);

  const respTd = useRef<HTMLDivElement>(null);
  const dataTd = useRef<HTMLDivElement>(null);
  const prioTd = useRef<HTMLDivElement>(null);

  function saveAndFlash(cell: string, dto: { priority?: string; dueDate?: string | null; assigneeId?: string | null }) {
    updateTask({ id: task.id, projectId: listId, dto });
    setFlashCell(cell);
    setTimeout(() => setFlashCell(null), 600);
  }

  const overdue = isOverdue(task.dueDate, task.status as V3Intention);
  const dateLabel = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    : null;
  const prioLabel = task.priority ? priorityToLabel(task.priority) : null;
  const prioColor = task.priority ? priorityToColor(task.priority) : null;

  return (
    <div
      className="group flex items-center border-b border-[#1a1a1f] transition-colors"
      style={{
        height: 36,
        background: rowHovered ? "#141418" : "transparent",
      }}
      onMouseEnter={() => setRowHovered(true)}
      onMouseLeave={() => setRowHovered(false)}
    >
      {/* ── Nome ── */}
      <div className="flex flex-1 items-center gap-2 overflow-hidden px-3" style={{ paddingLeft: 14 }}>
        {/* ícone de status da task */}
        <span className="flex-shrink-0 opacity-60">
          <StatusIcon type={cfg.iconType} color={cfg.dotColor} size={13} />
        </span>
        <button
          type="button"
          onClick={onOpen}
          className="truncate text-[13px] font-medium text-[#d4d4dc] transition-colors hover:text-[#cfc1ff] hover:underline"
          style={{ textAlign: "left" }}
        >
          {task.title}
        </button>
        {task.identifier && (
          <span
            className="flex-shrink-0 font-mono text-[11px] text-[#4a4a55] transition-opacity"
            style={{ opacity: rowHovered ? 1 : 0 }}
          >
            {task.identifier}
          </span>
        )}
      </div>

      {/* ── Responsável ── */}
      <EditableCell
        cellRef={respTd}
        active={openDD === "resp"}
        flash={flashCell === "resp"}
        rowHovered={rowHovered}
        onClick={() => setOpenDD((v) => v === "resp" ? null : "resp")}
        width={140}
      >
        {task.assigneeId ? (
          <div className="flex size-6 items-center justify-center rounded-full bg-[#3d2a6b] text-[10px] font-semibold text-[#d8ccff]">
            {task.assigneeId.slice(0, 2).toUpperCase()}
          </div>
        ) : (
          <span style={{ color: rowHovered ? "#5a5a65" : "transparent" }}>
            <IcUserPlus size={14} />
          </span>
        )}
        {openDD === "resp" && (
          <CellDropdown anchorRef={respTd} onClose={() => setOpenDD(null)}>
            <DropItem active={!task.assigneeId} onClick={() => setOpenDD(null)}>
              <span className="text-[#7a7a85]">Sem responsável</span>
            </DropItem>
          </CellDropdown>
        )}
      </EditableCell>

      {/* ── Data de vencimento ── */}
      <EditableCell
        cellRef={dataTd}
        active={openDD === "data"}
        flash={flashCell === "data"}
        rowHovered={rowHovered}
        onClick={() => setOpenDD((v) => v === "data" ? null : "data")}
        width={150}
      >
        {dateLabel ? (
          <span className="text-[13px]" style={{ color: overdue ? "#fbbf24" : "#9a9aaa" }}>
            {dateLabel}
          </span>
        ) : (
          <span style={{ color: rowHovered ? "#5a5a65" : "transparent" }}>
            <IcCalPlus size={14} />
          </span>
        )}
        {openDD === "data" && (
          <CellDropdown anchorRef={dataTd} onClose={() => setOpenDD(null)}>
            <div className="p-1.5">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6a6a75]">
                Data de vencimento
              </p>
              <input
                type="date"
                autoFocus
                defaultValue={task.dueDate ? task.dueDate.slice(0, 10) : ""}
                onChange={(e) => saveAndFlash("data", { dueDate: e.target.value || null })}
                onBlur={() => setOpenDD(null)}
                className="w-full rounded-md border border-[#3a3a46] bg-[#26262f] px-2 py-1 text-[12px] text-[#d4d4dc] outline-none"
                style={{ colorScheme: "dark" }}
              />
              {task.dueDate && (
                <button
                  type="button"
                  onClick={() => { saveAndFlash("data", { dueDate: null }); setOpenDD(null); }}
                  className="mt-1.5 w-full rounded border border-[#2e2e38] py-1 text-[12px] text-[#ef4444] transition-colors hover:bg-red-950/20"
                >
                  Remover data
                </button>
              )}
            </div>
          </CellDropdown>
        )}
      </EditableCell>

      {/* ── Prioridade ── */}
      <EditableCell
        cellRef={prioTd}
        active={openDD === "prio"}
        flash={flashCell === "prio"}
        rowHovered={rowHovered}
        onClick={() => setOpenDD((v) => v === "prio" ? null : "prio")}
        width={110}
      >
        {prioLabel && prioColor ? (
          <span className="flex items-center gap-1.5 text-[13px]" style={{ color: prioColor }}>
            <IcFlag size={12} />{prioLabel}
          </span>
        ) : (
          <span style={{ color: rowHovered ? "#5a5a65" : "transparent" }}>
            <IcFlag size={14} />
          </span>
        )}
        {openDD === "prio" && (
          <CellDropdown anchorRef={prioTd} onClose={() => setOpenDD(null)}>
            <DropItem active={!task.priority} onClick={() => { saveAndFlash("prio", { priority: undefined }); setOpenDD(null); }}>
              <IcFlag size={12} />
              <span className="text-[#7a7a85]">Sem prioridade</span>
            </DropItem>
            {(["URGENT", "HIGH", "MEDIUM", "LOW"] as const).map((p) => {
              const c = PRIO_CFG[p];
              return (
                <DropItem key={p} active={task.priority === p} onClick={() => { saveAndFlash("prio", { priority: p }); setOpenDD(null); }}>
                  <IcFlag size={12} />
                  <span style={{ color: c.color }}>{c.label}</span>
                </DropItem>
              );
            })}
          </CellDropdown>
        )}
      </EditableCell>

      {/* ── Extra slot ── */}
      <div style={{ width: 40 }} />
    </div>
  );
}

// ─── Célula editável (div, não td) ────────────────────────────────────────────

function EditableCell({
  cellRef, active, flash, rowHovered, onClick, children, width,
}: {
  cellRef: React.RefObject<HTMLDivElement | null>;
  active: boolean;
  flash: boolean;
  rowHovered: boolean;
  onClick: () => void;
  children: React.ReactNode;
  width: number;
}) {
  const [hov, setHov] = useState(false);
  const [phase, setPhase] = useState<"idle" | "in" | "out">("idle");

  useEffect(() => {
    if (!flash) return;
    setPhase("in");
    const t1 = setTimeout(() => setPhase("out"), 200);
    const t2 = setTimeout(() => setPhase("idle"), 650);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [flash]);

  return (
    <div
      ref={cellRef}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width,
        flexShrink: 0,
        height: 36,
        padding: "0 10px",
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        position: "relative",
        boxShadow: hov || active ? "inset 0 0 0 1px #3a3a46" : "none",
        borderRadius: 4,
        transition: "box-shadow .1s",
      }}
    >
      {phase !== "idle" && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: 4, pointerEvents: "none",
          background: "rgba(34,197,94,0.28)",
          opacity: phase === "in" ? 1 : 0,
          transition: phase === "in" ? "opacity .15s ease-in" : "opacity .45s ease-out",
        }} />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
        {children}
      </div>
    </div>
  );
}

// ─── Dropdown portal ──────────────────────────────────────────────────────────

function CellDropdown({
  anchorRef, onClose, children,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left });
  }, [anchorRef]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (dropRef.current?.contains(e.target as Node)) return;
      if (anchorRef.current?.contains(e.target as Node)) return;
      onClose();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [anchorRef, onClose]);

  return createPortal(
    <div
      ref={dropRef}
      style={{
        position: "fixed", top: pos.top, left: pos.left, zIndex: 99999,
        background: "#1c1c24", border: "1px solid #2e2e38", borderRadius: 8,
        padding: 4, minWidth: 180,
        boxShadow: "0 8px 24px rgba(0,0,0,.5)",
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

function DropItem({ children, active, onClick }: {
  children: React.ReactNode; active?: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-[12px] text-[#d4d4dc] transition-colors hover:bg-[#26262f]"
      style={{ background: active ? "rgba(124,92,255,0.12)" : undefined, textAlign: "left" }}
    >
      {children}
      {active && <span className="ml-auto text-[#7c5cff]"><IcCheck size={11} /></span>}
    </button>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

function Toolbar({ listId }: { listId: string }) {
  const { mutate: createTask } = useCreateTask();

  return (
    <div
      className="flex items-center justify-between border-b border-[#1e1e24] px-3"
      style={{ height: 38, flexShrink: 0 }}
    >
      {/* Esquerda: agrupadores */}
      <div className="flex items-center gap-0.5">
        <TbTab active icon={<IcColumns size={12} />} label="Grupo: Status" />
        <TbTab icon={<IcGitFork size={12} />} label="Subtarefas" />
        <TbTab icon={
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
          </svg>
        } label="Colunas" />
      </div>

      {/* Direita: ações */}
      <div className="flex items-center gap-1">
        <SmTbBtn icon={<IcFilter size={11} />} label="Filtro" />
        <SmTbBtn icon={<IcCheck size={11} />} label="Fechado" />
        <SmTbBtn icon={<IcUser size={11} />} label="Responsável" />
        {/* Avatar usuário */}
        <div className="mx-0.5 flex size-6 items-center justify-center rounded-full bg-[#3d2a6b] text-[10px] font-bold text-[#d8ccff]">
          B
        </div>
        <button type="button" className="flex size-7 items-center justify-center rounded text-[#6a6a75] hover:bg-[#1c1c22] hover:text-[#e6e6ea]">
          <IcSearch size={12} />
        </button>
        {/* Personalizar */}
        <button type="button" className="flex h-7 items-center gap-1.5 rounded px-2 text-[13px] text-[#6a6a75] transition-colors hover:bg-[#1c1c22] hover:text-[#e6e6ea]">
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
          </svg>
          Personalizar
        </button>
        {/* Add Tarefa */}
        <div className="flex overflow-hidden rounded-md" style={{ height: 28 }}>
          <button
            type="button"
            onClick={() => createTask({ titulo: "Nova tarefa", idProject: listId })}
            className="flex items-center gap-1.5 bg-[#5a4fcf] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[#4e44b8]"
          >
            Add Tarefa
          </button>
          <div className="w-px bg-[#4a40b8]" />
          <button type="button" className="flex w-6 items-center justify-center bg-[#5a4fcf] text-white hover:bg-[#4e44b8]">
            <ChevronDown size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

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
          ? "text-[#e6e6ea] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#7c5cfc]"
          : "text-[#6a6a75] hover:text-[#b6b6bf]",
      )}
    >
      {icon}{label}
    </button>
  );
}

function TopBtn({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-7 items-center gap-1 rounded px-2.5 text-[13px] font-medium transition-colors",
        accent
          ? "bg-[#5a4fcf] text-white hover:bg-[#4e44b8]"
          : "text-[#7a7a85] hover:text-[#e6e6ea]",
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
        "flex h-7 items-center gap-1.5 rounded px-2 text-[12px] font-medium transition-colors",
        active
          ? "bg-[rgba(124,92,255,0.15)] text-[#cfc1ff]"
          : "text-[#6a6a75] hover:bg-[#17171c] hover:text-[#e6e6ea]",
      )}
    >
      {icon}{label}
    </button>
  );
}

function SmTbBtn({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      className="flex h-7 items-center gap-1 rounded px-2 text-[12px] text-[#6a6a75] transition-colors hover:bg-[#1c1c22] hover:text-[#e6e6ea]"
    >
      {icon}{label}
    </button>
  );
}

function Skeleton() {
  return (
    <div>
      {[1, 2, 3].map((g) => (
        <div key={g}>
          <div className="flex h-9 items-center gap-3 px-3">
            <div className="h-5 w-24 animate-pulse rounded bg-[#2a2a32]" />
          </div>
          {[1, 2].map((r) => (
            <div key={r} className="flex h-9 items-center gap-3 border-b border-[#1a1a1f] px-3">
              <div className="size-3.5 animate-pulse rounded-full bg-[#2a2a32]" />
              <div className="h-3 w-48 animate-pulse rounded bg-[#2a2a32]" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
