"use client";

import React, { use, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { Star, ChevronRight, LayoutGrid, Plus, SlidersHorizontal, CheckCircle2, User, Search, ChevronDown } from "lucide-react";

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
  IcCaret, IcCaretR, IcChat, IcFilter, IcGitFork, IcColumns,
  IcList, IcPlus, IcSearch, IcUser, IcCalPlus, IcFlag, IcUserPlus, IcCheck,
} from "@/components/lists/icons";
import type { TaskResponseDto, V3Intention } from "@/lib/types/api";
import { cn } from "@/lib/utils";

// ─── Mapa V3 → config visual ──────────────────────────────────────────────────

type ColCfg = { label: string; color: string; bg: string; pillBg: string; pillColor: string };

const COL_CFG: Record<string, ColCfg> = {
  backlog:     { label: "BACKLOG",      color: "#6b7280", bg: "#232329", pillBg: "#2a2a31", pillColor: "#d4d4dc" },
  ready:       { label: "READY",        color: "#3b82f6", bg: "#1a2133", pillBg: "#1e3a5f", pillColor: "#93c5fd" },
  progresso:   { label: "EM PROGRESSO", color: "#7c5cff", bg: "#1e1828", pillBg: "#7c5cff", pillColor: "#fff"    },
  concluido:   { label: "CONCLUÍDO",    color: "#10b981", bg: "#0d2820", pillBg: "#0d2e1e", pillColor: "#6ee7b7" },
  falhou:      { label: "FALHOU",       color: "#ef4444", bg: "#2a1212", pillBg: "#3d1212", pillColor: "#fca5a5" },
};

const PRIO_CFG: Record<string, { label: string; color: string }> = {
  URGENT: { label: "Urgente", color: "#ef4444" },
  HIGH:   { label: "Alta",    color: "#f59e0b" },
  MEDIUM: { label: "Média",   color: "#60a5fa" },
  LOW:    { label: "Baixa",   color: "#71717a" },
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

      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-5 pt-2 text-[12px] text-[#7a7a85]">
        {spaceData && (
          <>
            <Link href={`/spaces/${spaceData.id}`} className="transition-colors hover:text-[#b6b6bf]">
              {spaceData.nome}
            </Link>
            <ChevronRight size={11} className="text-[#4a4a54]" />
          </>
        )}
        {folderData && (
          <>
            <Link href={`/folders/${folderData.id}`} className="transition-colors hover:text-[#b6b6bf]">
              {folderData.nome}
            </Link>
            <ChevronRight size={11} className="text-[#4a4a54]" />
          </>
        )}
        <span className="flex items-center gap-1 text-[#b6b6bf]">
          <IcList size={12} />
          List
        </span>
        <ChevronRight size={11} className="text-[#4a4a54]" />
        <span className="font-medium text-[#b6b6bf]">{listData.nome}</span>
        <button type="button" className="ml-0.5 text-[#4a4a54] hover:text-[#7a7a85]">
          <Star size={11} />
        </button>
      </div>

      {/* ── Header: tabs de view + ações ───────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-1.5">
        <div className="flex items-center gap-0.5">
          <ViewTab
            label="Lista"
            icon={<IcList size={13} />}
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
            <IcPlus size={12} /> Visualização
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <HdrBtn label="Agentes" />
          <HdrBtn label="Pergunte à IA" accent />
          <HdrBtn label="⚡ Compartilhar" bordered />
        </div>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <Toolbar listId={id} />

      {/* ── Conteúdo ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {view === "lista" ? (
          <ListView listId={id} onSelectTask={setSelectedTaskId} />
        ) : (
          <KanbanBoard projectId={id} onSelectTask={setSelectedTaskId} />
        )}
      </div>

      {/* ── Drawer de detalhe ──────────────────────────────────────────────── */}
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
  const { mutate: createTask } = useCreateTask();

  const groups = KANBAN_COLUMNS.map((col) => ({
    col,
    tasks: tasks.filter((t) => intentionToColumn(t.status as V3Intention) === col.id),
  }));

  return (
    <div className="flex-1 overflow-y-auto overflow-x-auto">
      <div style={{ minWidth: 760 }}>
        {/* Cabeçalho de colunas */}
        <HeadRow />

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
              className="flex h-9 items-center gap-2 px-5 text-[13px] text-[#5a5a64] transition-colors hover:text-[#b6b6bf]"
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

// ─── Cabeçalho da tabela ──────────────────────────────────────────────────────

function HeadRow() {
  return (
    <div
      className="sticky top-0 z-10 border-b border-[#26262d] bg-[#111111]"
      style={{ minWidth: 760 }}
    >
      <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse" }}>
        <colgroup>
          <col style={{ width: "100%" }} />
          <col style={{ width: 148 }} />
          <col style={{ width: 148 }} />
          <col style={{ width: 120 }} />
          <col style={{ width: 120 }} />
          <col style={{ width: 36 }} />
          <col style={{ width: 36 }} />
        </colgroup>
        <thead>
          <tr>
            {(["Nome", "Responsável", "Data de vencimento", "Prioridade", "Status"] as const).map((h) => (
              <th
                key={h}
                style={{
                  padding: "6px 10px", textAlign: "left",
                  fontSize: 12, fontWeight: 500, color: "#5a5a64",
                  borderBottom: "1px solid #26262d",
                }}
              >
                {h}
              </th>
            ))}
            {/* chat / plus — sem label */}
            <th style={{ borderBottom: "1px solid #26262d" }} />
            <th style={{ borderBottom: "1px solid #26262d" }} />
          </tr>
        </thead>
      </table>
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

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div>
      {/* ── Cabeçalho do grupo ── */}
      <div
        className="flex h-9 cursor-pointer items-center gap-2 px-3 transition-colors hover:bg-[#161619]"
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className="text-[#5a5a64] transition-transform duration-150"
          style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)", display: "inline-flex" }}
        >
          <IcCaret size={13} />
        </span>
        {/* pill colorida */}
        <span
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "3px 10px", borderRadius: 5,
            fontSize: 11, fontWeight: 700, letterSpacing: ".7px",
            background: cfg.pillBg, color: cfg.pillColor,
          }}
        >
          {cfg.label}
        </span>
        <span className="text-[12px] text-[#5a5a64]">{tasks.length}</span>
      </div>

      {/* ── Tabela de tasks ── */}
      {open && (
        <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse" }}>
          <colgroup>
            <col style={{ width: "100%" }} />
            <col style={{ width: 148 }} />
            <col style={{ width: 148 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 36 }} />
            <col style={{ width: 36 }} />
          </colgroup>
          <tbody>
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                cfg={cfg}
                listId={listId}
                expanded={expandedRows.has(task.id)}
                onToggle={() => toggleRow(task.id)}
                onOpen={() => onSelectTask(task.id)}
              />
            ))}

            {/* ── Adicionar tarefa inline ── */}
            {addingInline ? (
              <tr>
                <td
                  colSpan={7}
                  style={{ padding: 0, borderBottom: "1px solid #1f1f25", height: 38 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 38 }}>
                    <span
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "3px 9px", borderRadius: 5,
                        fontSize: 11, fontWeight: 700, letterSpacing: ".7px",
                        background: cfg.pillBg, color: cfg.pillColor,
                      }}
                    >
                      {cfg.label}
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
                      style={{
                        flex: 1, background: "transparent",
                        border: 0, outline: "none",
                        color: "#e6e6ea", fontSize: 13,
                      }}
                    />
                    <span style={{ fontSize: 11, color: "#5a5a64", paddingRight: 12 }}>
                      Enter para salvar · Esc para cancelar
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              <tr>
                <td
                  colSpan={7}
                  style={{ padding: 0, borderBottom: "1px solid #1f1f25" }}
                >
                  <button
                    type="button"
                    onClick={() => setAddingInline(true)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      width: "100%", height: 36, paddingLeft: 14,
                      background: "none", border: 0, cursor: "pointer",
                      color: "#5a5a64", fontSize: 13,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#161619";
                      e.currentTarget.style.color = "#b6b6bf";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "none";
                      e.currentTarget.style.color = "#5a5a64";
                    }}
                  >
                    <IcPlus size={13} />
                    Adicionar Tarefa
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Linha de task (TableRow) ──────────────────────────────────────────────────

function TaskRow({
  task, cfg, listId, expanded, onToggle, onOpen,
}: {
  task: TaskResponseDto;
  cfg: ColCfg;
  listId: string;
  expanded: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const { mutate: updateTask } = useUpdateTask();
  const [rowHovered, setRowHovered] = useState(false);
  const [flashCell, setFlashCell] = useState<string | null>(null);
  const [openDD, setOpenDD] = useState<string | null>(null);

  const respTd  = useRef<HTMLTableCellElement>(null);
  const dataTd  = useRef<HTMLTableCellElement>(null);
  const prioTd  = useRef<HTMLTableCellElement>(null);

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

  const tdBase: React.CSSProperties = {
    padding: 0, borderBottom: "1px solid #1f1f25", height: 38,
    verticalAlign: "middle",
    background: rowHovered ? "#15151a" : "transparent",
    transition: "background .1s",
  };
  const cellInner: React.CSSProperties = {
    padding: "0 10px", height: 38, display: "flex", alignItems: "center", gap: 8,
  };

  return (
    <>
      <tr onMouseEnter={() => setRowHovered(true)} onMouseLeave={() => setRowHovered(false)}>

        {/* ── Nome ── */}
        <td style={tdBase}>
          <div style={{ ...cellInner, paddingLeft: 14, gap: 10 }}>
            {/* chevron subtarefas (placeholder) */}
            <span style={{ width: 14, display: "inline-flex", visibility: "hidden" }}>
              <IcCaretR size={12} />
            </span>
            {/* pill de status minúscula */}
            <span
              style={{
                display: "inline-flex", alignItems: "center",
                padding: "2px 7px", borderRadius: 4,
                fontSize: 10, fontWeight: 700, letterSpacing: ".5px",
                background: cfg.pillBg, color: cfg.pillColor, whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {cfg.label}
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={onOpen}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onOpen(); }}
              style={{
                color: "#e6e6ea", fontWeight: 600, fontSize: 13,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                cursor: "pointer",
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
              {task.title}
            </span>
            {task.identifier && (
              <span style={{
                flexShrink: 0, fontFamily: "monospace", fontSize: 11,
                color: "#5a5a64",
                opacity: rowHovered ? 1 : 0, transition: "opacity .15s",
              }}>
                {task.identifier}
              </span>
            )}
          </div>
        </td>

        {/* ── Responsável ── */}
        <EditableTd
          tdRef={respTd}
          active={openDD === "resp"}
          flash={flashCell === "resp"}
          rowHovered={rowHovered}
          onClick={() => setOpenDD((v) => v === "resp" ? null : "resp")}
        >
          {task.assigneeId ? (
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: "#3d2a6b", color: "#d8ccff",
              fontSize: 10, fontWeight: 600, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {task.assigneeId.slice(0, 2).toUpperCase()}
            </div>
          ) : (
            <span style={{ color: rowHovered ? "#6a6a75" : "transparent" }}>
              <IcUserPlus size={14} />
            </span>
          )}
          {openDD === "resp" && (
            <CellDropdown anchorRef={respTd} onClose={() => setOpenDD(null)}>
              <DropItem active={!task.assigneeId} onClick={() => { setOpenDD(null); }}>
                <span style={{ color: "#7a7a85" }}>Sem responsável</span>
              </DropItem>
            </CellDropdown>
          )}
        </EditableTd>

        {/* ── Data de vencimento ── */}
        <EditableTd
          tdRef={dataTd}
          active={openDD === "data"}
          flash={flashCell === "data"}
          rowHovered={rowHovered}
          onClick={() => setOpenDD((v) => v === "data" ? null : "data")}
        >
          {dateLabel ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 13, color: overdue ? "#fbbf24" : "#b6b6bf" }}>{dateLabel}</span>
              {overdue && (
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase", color: "#7a7a85" }}>
                  ATRASADO
                </span>
              )}
            </div>
          ) : (
            <span style={{ color: rowHovered ? "#6a6a75" : "transparent" }}>
              <IcCalPlus size={14} />
            </span>
          )}
          {openDD === "data" && (
            <CellDropdown anchorRef={dataTd} onClose={() => setOpenDD(null)}>
              <div style={{ padding: "4px 6px 6px" }}>
                <p style={{ fontSize: 11, color: "#7a7a85", margin: "0 0 6px", fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase" }}>
                  Data de vencimento
                </p>
                <input
                  type="date"
                  autoFocus
                  defaultValue={task.dueDate ? task.dueDate.slice(0, 10) : ""}
                  onChange={(e) => saveAndFlash("data", { dueDate: e.target.value || null })}
                  onBlur={() => setOpenDD(null)}
                  style={{
                    background: "#26262f", border: "1px solid #3a3a46",
                    borderRadius: 6, color: "#d4d4dc", fontSize: 12,
                    padding: "5px 8px", outline: "none", width: "100%",
                    colorScheme: "dark" as React.CSSProperties["colorScheme"],
                  }}
                />
                {task.dueDate && (
                  <button
                    type="button"
                    onClick={() => { saveAndFlash("data", { dueDate: null }); setOpenDD(null); }}
                    style={{
                      marginTop: 6, width: "100%", padding: "5px 0",
                      background: "none", border: "1px solid #2e2e38",
                      borderRadius: 5, color: "#ef4444", fontSize: 12, cursor: "pointer",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                  >
                    Remover data
                  </button>
                )}
              </div>
            </CellDropdown>
          )}
        </EditableTd>

        {/* ── Prioridade ── */}
        <EditableTd
          tdRef={prioTd}
          active={openDD === "prio"}
          flash={flashCell === "prio"}
          rowHovered={rowHovered}
          onClick={() => setOpenDD((v) => v === "prio" ? null : "prio")}
        >
          {prioLabel && prioColor ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: prioColor }}>
              <IcFlag size={13} />{prioLabel}
            </span>
          ) : (
            <span style={{ color: rowHovered ? "#6a6a75" : "transparent" }}>
              <IcFlag size={14} />
            </span>
          )}
          {openDD === "prio" && (
            <CellDropdown anchorRef={prioTd} onClose={() => setOpenDD(null)}>
              <DropItem active={!task.priority} onClick={() => { saveAndFlash("prio", { priority: undefined }); setOpenDD(null); }}>
                <IcFlag size={12} />
                <span style={{ color: "#7a7a85" }}>Sem prioridade</span>
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
        </EditableTd>

        {/* ── Status (pill) ── */}
        <td style={tdBase}>
          <div style={cellInner}>
            <span
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "3px 9px", borderRadius: 5,
                fontSize: 11, fontWeight: 700, letterSpacing: ".7px", textTransform: "uppercase",
                background: cfg.pillBg, color: cfg.pillColor, whiteSpace: "nowrap",
              }}
            >
              {cfg.label}
            </span>
          </div>
        </td>

        {/* ── Chat ── */}
        <td style={{ ...tdBase, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 38 }}>
            <span style={{ color: "#6a6a75" }}><IcChat size={14} /></span>
          </div>
        </td>

        {/* ── Coluna extra ── */}
        <td style={tdBase} />
      </tr>
    </>
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
      style={{
        display: "flex", alignItems: "center", gap: 8,
        width: "100%", padding: "7px 10px", borderRadius: 5,
        background: active ? "rgba(124,92,255,0.12)" : "none",
        border: 0, color: "#d4d4dc", fontSize: 12,
        cursor: "pointer", textAlign: "left",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#26262f"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = active ? "rgba(124,92,255,0.12)" : "none"; }}
    >
      {children}
      {active && <span style={{ marginLeft: "auto", color: "#7c5cff" }}><IcCheck size={11} /></span>}
    </button>
  );
}

// ─── Célula editável ──────────────────────────────────────────────────────────

function EditableTd({
  tdRef, active, flash, rowHovered, onClick, children,
}: {
  tdRef: React.RefObject<HTMLTableCellElement | null>;
  active: boolean;
  flash: boolean;
  rowHovered: boolean;
  onClick: () => void;
  children: React.ReactNode;
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
    <td
      ref={tdRef}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "0 10px", borderBottom: "1px solid #1f1f25", height: 38,
        verticalAlign: "middle", cursor: "pointer", position: "relative",
        background: rowHovered ? "#15151a" : "transparent",
        boxShadow: hov || active ? "inset 0 0 0 1px #3a3a46" : "none",
        borderRadius: 4, transition: "box-shadow .1s",
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
      <div style={{ display: "flex", alignItems: "center", gap: 6, height: "100%", position: "relative" }}>
        {children}
      </div>
    </td>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

function Toolbar({ listId }: { listId: string }) {
  const { mutate: createTask } = useCreateTask();

  return (
    <div
      className="flex items-center justify-between border-b border-[#26262d] bg-[#111111] px-5"
      style={{ height: 40, flexShrink: 0 }}
    >
      <div className="flex items-center gap-1">
        <TbTab active icon={<IcColumns size={13} />} label="Grupo: Status" />
        <TbTab icon={<IcGitFork size={13} />} label="Subtarefas" />
        <TbTab icon={
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
          </svg>
        } label="Colunas" />
      </div>
      <div className="flex items-center gap-1.5">
        <SmTbBtn icon={<IcFilter size={12} />} label="Filtro" />
        <SmTbBtn icon={<IcCheck size={12} />} label="Fechado" />
        <SmTbBtn icon={<IcUser size={12} />} label="Responsável" />
        <button type="button" className="flex size-7 items-center justify-center rounded text-[#7a7a85] hover:bg-[#1c1c22] hover:text-[#e6e6ea]">
          <IcSearch size={13} />
        </button>
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

// ─── Sub-componentes menores ───────────────────────────────────────────────────

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
      {icon}{label}
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
      {icon}{label}
    </button>
  );
}

function SmTbBtn({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      className="flex h-7 items-center gap-1.5 rounded border border-[#2a2a32] bg-[#1c1c22] px-2.5 text-[13px] text-[#7a7a85] transition-colors hover:text-[#e6e6ea]"
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
          <div className="flex h-9 items-center gap-3 px-5">
            <div className="h-5 w-24 animate-pulse rounded bg-[#2a2a32]" />
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
