"use client";

import React, { use, useEffect, useState } from "react";
import {
  Star,
  Share2,
  Sparkles,
  GripVertical,
  Lock,
  Layers,
  ChevronDown,
  ChevronRight,
  Columns3,
  List as LucideList,
} from "lucide-react";
import { AgentPopover } from "@/components/spaces/agent-popover";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query-keys";
import { api } from "@/lib/api";

import { ViewSwitcher } from "@/components/shell/view-switcher";
import {
  IcCaret,
  IcCheck,
  IcChat,
  IcFilter,
  IcGitFork,
  IcLayers,
  IcList,
  IcPending,
  IcPlus,
  IcSearch,
  IcUser,
} from "@/components/lists/icons";
import { STATUS_CONFIG, GROUP_PILL_STYLE } from "@/components/lists/config";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { TaskSheet } from "@/components/tasks/task-sheet";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";

// ─── Hooks e tipos do backend ─────────────────────────────────────────────────
import { useProject } from "@/hooks/use-projects";
import {
  useTasksByProject,
  useUpdateTask,
  useUpdateTaskStatus,
  useCreateTask,
  useSubtasks,
  useBlocks,
  useCreateBlock,
} from "@/hooks/use-tasks";
import { AI_ASSIGNEE_ID, useTaskExecution } from "@/hooks/use-task-execution";
import { useProjectMembers, type ProjectMemberDto } from "@/hooks/use-members";
import { useOrgMembers } from "@/hooks/use-org-members";
import {
  isOverdue,
  priorityToColor,
  priorityToLabel,
  calcBlockProgress,
} from "@/lib/mappers/task-status.mapper";
import type {
  TaskResponseDto,
  TaskPriority,
  V3Intention,
  BlockDto,
} from "@/lib/types/api";

// ─── Claude avatar SVG (logo pixel-art laranja da Anthropic) ─────────────────
function ClaudeAvatar({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <rect width="40" height="40" rx="8" fill="var(--card)" />
      {/* cabeça */}
      <rect x="10" y="8" width="20" height="14" rx="2" fill="#d97757" />
      {/* olho esquerdo */}
      <rect x="13" y="12" width="5" height="5" fill="var(--card)" />
      {/* olho direito */}
      <rect x="22" y="12" width="5" height="5" fill="var(--card)" />
      {/* pescoço */}
      <rect x="17" y="22" width="6" height="4" fill="#d97757" />
      {/* corpo */}
      <rect x="10" y="26" width="20" height="8" rx="2" fill="#d97757" />
      {/* perna esquerda */}
      <rect x="12" y="34" width="6" height="4" rx="1" fill="#d97757" />
      {/* perna direita */}
      <rect x="22" y="34" width="6" height="4" rx="1" fill="#d97757" />
    </svg>
  );
}

// ─── Views disponíveis na página de Lista ────────────────────────────────────
const LIST_VIEWS = [
  { id: "list", label: "Lista", icon: LucideList },
  { id: "board", label: "Quadro", icon: Columns3 },
  { id: "blocks", label: "Blocos", icon: Layers },
];

// ─── Tipo de status visual (espelha StatusTarefa da main) ────────────────────
type StatusVisual =
  | "backlog"
  | "pronto"
  | "em-progresso"
  | "concluido"
  | "falhou"
  | "atrasado";

// ─── Página ───────────────────────────────────────────────────────────────────
export default function ListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: projeto, isLoading: loadingProjeto } = useProject(id);
  const { data: tasks = [], isLoading: loadingTasks } = useTasksByProject(id);
  const { data: membersRaw = [] } = useProjectMembers(id);
  const { data: orgMembersRaw = [] } = useOrgMembers();
  const projectMembers = Array.isArray(membersRaw) ? membersRaw : [];
  // Espaço público: sem membros explícitos no projeto → usa org inteira como fallback
  const orgAsProjectMembers: ProjectMemberDto[] = orgMembersRaw.map((m) => ({
    userId: m.userId,
    nome: m.nome,
    email: m.email ?? null,
    role: m.role,
    cargo: null,
  }));
  const members =
    projectMembers.length > 0 ? projectMembers : orgAsProjectMembers;

  const [view, setView] = useState<"list" | "board" | "blocks">("list");
  const [subtarefasMode, setSubtarefasMode] =
    useState<SubtarefasMode>("recolhidas");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDefaultStatus, setModalDefaultStatus] = useState<
    StatusVisual | undefined
  >(undefined);
  const [selectedTask, setSelectedTask] = useState<TaskResponseDto | null>(
    null,
  );

  if (loadingProjeto) {
    return (
      <div
        className="grid h-full place-items-center p-8 text-sm"
        style={{ color: "var(--muted-foreground)" }}
      >
        Carregando...
      </div>
    );
  }

  if (!projeto) {
    return (
      <div
        className="grid h-full place-items-center p-8 text-sm"
        style={{ color: "var(--muted-foreground)" }}
      >
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
    <div
      className="flex h-full flex-col overflow-hidden"
      style={{ background: "var(--background)" }}
    >
      <PageHeader id={id} nome={projeto.nome} />
      <ViewSwitcher
        views={LIST_VIEWS}
        defaultValue="list"
        value={view}
        onChange={(v) => setView(v as "list" | "board" | "blocks")}
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
          members={members}
          projectId={id}
          allTasks={tasks}
        />
      ) : view === "board" ? (
        <BoardContent listId={id} tasks={tasks} onOpenTask={setSelectedTask} />
      ) : (
        <BlocksContent projectId={id} members={members} onOpenTask={setSelectedTask} />
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

const INTENTION_TO_STATUS: Record<string, StatusVisual> = {
  INBOX: "backlog",
  READY: "pronto",
  EXECUTING: "em-progresso",
  VALIDATING: "em-progresso",
  DONE: "concluido",
  VALIDATED: "concluido",
  CANCELLED: "concluido",
  DISCARDED: "concluido",
  FAILED: "falhou",
};

// Mapa reverso: StatusVisual → V3 Intention canônica para drag-and-drop
const INTENTION_TO_STATUS_REVERSE: Record<StatusVisual, string> = {
  backlog: "INBOX",
  pronto: "READY",
  "em-progresso": "EXECUTING",
  concluido: "DONE",
  falhou: "FAILED",
  atrasado: "INBOX",
};

function agruparTasks(
  tasks: TaskResponseDto[],
): { status: StatusVisual; tarefas: TaskResponseDto[] }[] {
  const mapa: Record<StatusVisual, TaskResponseDto[]> = {
    backlog: [],
    pronto: [],
    "em-progresso": [],
    concluido: [],
    falhou: [],
    atrasado: [],
  };

  for (const task of tasks) {
    if (isOverdue(task.dueDate, task.status as V3Intention)) {
      mapa["atrasado"].push(task);
    } else {
      const sv = INTENTION_TO_STATUS[task.status] ?? "backlog";
      mapa[sv].push(task);
    }
  }

  const ORDER: StatusVisual[] = [
    "backlog",
    "pronto",
    "em-progresso",
    "concluido",
    "falhou",
    "atrasado",
  ];
  return ORDER.filter((s) => mapa[s].length > 0).map((s) => ({
    status: s,
    tarefas: mapa[s],
  }));
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
      tasks={tasks}
      onSelectTask={(taskId) => {
        const found = tasks.find((t) => t.id === taskId);
        if (found) onOpenTask(found);
      }}
    />
  );
}

// ─── BlocksContent — grid de cards ───────────────────────────────────────────

type BlockSortKey = "recent" | "oldest" | "deadline_asc" | "deadline_desc" | "status";

const SORT_OPTIONS: { key: BlockSortKey; label: string }[] = [
  { key: "recent",       label: "Mais recentes"         },
  { key: "oldest",       label: "Mais antigas"           },
  { key: "deadline_asc", label: "Prazo mais próximo"     },
  { key: "deadline_desc",label: "Prazo mais distante"    },
  { key: "status",       label: "Status"                 },
];

const STATUS_ORDER: Partial<Record<V3Intention, number>> = {
  EXECUTING:  0,
  VALIDATING: 1,
  READY:      2,
  INBOX:      3,
  FAILED:     4,
  DISCARDED:  4,
  DONE:       5,
  VALIDATED:  5,
  CANCELLED:  5,
};

const STATUS_LABEL: Partial<Record<V3Intention, string>> = {
  EXECUTING:  "Em progresso",
  VALIDATING: "Validando",
  READY:      "Pronto",
  INBOX:      "Backlog",
  FAILED:     "Falhou",
  DISCARDED:  "Descartado",
  DONE:       "Concluído",
  VALIDATED:  "Validado",
  CANCELLED:  "Cancelado",
};

const STATUS_COLOR: Partial<Record<V3Intention, string>> = {
  EXECUTING:  "#f59e0b",
  VALIDATING: "#a78bfa",
  READY:      "#60a5fa",
  INBOX:      "#6b7280",
  FAILED:     "#ef4444",
  DISCARDED:  "#ef4444",
  DONE:       "#22c55e",
  VALIDATED:  "#22c55e",
  CANCELLED:  "#6b7280",
};

function sortTasks(tasks: TaskResponseDto[], key: BlockSortKey): TaskResponseDto[] {
  const copy = [...tasks];
  switch (key) {
    case "recent":
      return copy.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
    case "oldest":
      return copy.sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
    case "deadline_asc":
      return copy.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
    case "deadline_desc":
      return copy.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return b.dueDate.localeCompare(a.dueDate);
      });
    case "status":
      return copy.sort(
        (a, b) =>
          (STATUS_ORDER[a.status as V3Intention] ?? 99) -
          (STATUS_ORDER[b.status as V3Intention] ?? 99),
      );
  }
}

// ─── Drawer de tasks do bloco ─────────────────────────────────────────────────
function BlockDrawer({
  block,
  projectId,
  onClose,
}: {
  block: BlockDto;
  projectId: string;
  onClose: () => void;
}) {
  const [sortKey, setSortKey] = useState<BlockSortKey>("recent");
  const [sortOpen, setSortOpen] = useState(false);

  // modo do painel de adição: null=fechado, "new"=criar, "link"=vincular existente
  const [addMode, setAddMode] = useState<"new" | "link" | null>(null);
  const [newTaskName, setNewTaskName] = useState("");
  const [linkSearch, setLinkSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [linking, setLinking] = useState(false);
  const [unlinkSelected, setUnlinkSelected] = useState<Set<string>>(new Set());
  const [unlinking, setUnlinking] = useState(false);

  function toggleUnlink(taskId: string) {
    setUnlinkSelected((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  async function handleUnlinkSelected() {
    if (unlinkSelected.size === 0) return;
    setUnlinking(true);
    try {
      await Promise.all(
        [...unlinkSelected].map((taskId) =>
          api.put(`/tasks/${taskId}`, { idPai: null }),
        ),
      );
      void queryClient.invalidateQueries({ queryKey: qk.tasks.byProject(projectId) });
      void queryClient.invalidateQueries({ queryKey: qk.tasks.children(block.id) });
      setUnlinkSelected(new Set());
    } finally {
      setUnlinking(false);
    }
  }

  const createTask = useCreateTask();
  const queryClient = useQueryClient();

  // tasks da lista sem bloco (idPai null) — para vincular existente
  const { data: allTasks = [] } = useTasksByProject(projectId);
  const unassigned = allTasks.filter((t) => !t.idPai && t.idClasse !== "-200");

  const filtered = linkSearch.trim()
    ? unassigned.filter((t) =>
        t.nome.toLowerCase().includes(linkSearch.toLowerCase()),
      )
    : unassigned;

  function toggleSelect(taskId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  function handleCancelLink() {
    setAddMode(null);
    setLinkSearch("");
    setSelected(new Set());
  }

  function handleCreateTask() {
    const nome = newTaskName.trim();
    if (!nome) return;
    createTask.mutate(
      { titulo: nome, idProject: projectId, idPai: block.id },
      {
        onSuccess: () => {
          setNewTaskName("");
          setAddMode(null);
        },
      },
    );
  }

  async function handleLinkSelected() {
    if (selected.size === 0) return;
    setLinking(true);
    try {
      await Promise.all(
        [...selected].map((taskId) =>
          api.put(`/tasks/${taskId}`, { idPai: block.id }),
        ),
      );
      void queryClient.invalidateQueries({ queryKey: qk.tasks.byProject(projectId) });
      void queryClient.invalidateQueries({ queryKey: qk.tasks.children(block.id) });
      handleCancelLink();
    } finally {
      setLinking(false);
    }
  }

  const { data: tasks = [], isLoading: loadingTasks } = useSubtasks(block.id, true);
  const { done, total, percent } = calcBlockProgress(tasks);
  const endDate = block.dados?.endDate ?? null;
  const dl = deadlineInfo(endDate, percent);
  const sorted = sortTasks(tasks, sortKey);
  const currentSort = SORT_OPTIONS.find((o) => o.key === sortKey)!;

  return (
    <>
      {/* backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          background: "rgba(0,0,0,0.45)",
        }}
        onClick={onClose}
      />

      {/* painel lateral */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 201,
          width: 480,
          maxWidth: "90vw",
          background: "var(--card)",
          borderLeft: "1px solid #26262d",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.5)",
        }}
      >
        {/* header do drawer */}
        <div
          style={{
            padding: "18px 20px 16px",
            borderBottom: "1px solid #26262d",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            {/* dot de cor */}
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: block.dados?.cor ?? "#7c5cff",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)", flex: 1 }}>
              {block.nome}
            </span>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 28,
                height: 28,
                display: "grid",
                placeItems: "center",
                borderRadius: 6,
                background: "none",
                border: 0,
                color: "var(--muted-foreground)",
                cursor: "pointer",
                fontSize: 18,
                lineHeight: 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--accent)";
                e.currentTarget.style.color = "var(--foreground)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.color = "var(--muted-foreground)";
              }}
            >
              ×
            </button>
          </div>

          {/* métricas rápidas */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
              <span style={{ fontWeight: 700, color: "var(--foreground)" }}>{done}/{total}</span> tarefas
            </span>
            <span style={{ color: "#26262d" }}>·</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "2px 8px",
                borderRadius: 5,
                background: dl.bg,
                fontSize: 12,
                fontWeight: 600,
                color: dl.color,
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: dl.color }} />
              {dl.label}
            </span>
            <span style={{ color: "#26262d" }}>·</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: percent === 100 ? "#22c55e" : "var(--foreground)" }}>
              {percent}%
            </span>
          </div>

          {/* barra de progresso */}
          <div style={{ marginTop: 10, height: 4, borderRadius: 99, background: "#1f1f25", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${percent}%`,
                borderRadius: 99,
                background: percent === 100 ? "#22c55e" : percent > 60 ? "#7c5cff" : "#60a5fa",
                transition: "width .4s ease",
              }}
            />
          </div>
        </div>

        {/* toolbar de ordenação */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 20px",
            borderBottom: "1px solid #26262d",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
            {total} tarefa{total !== 1 ? "s" : ""}
          </span>

          {/* dropdown de ordenação */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setSortOpen((v) => !v)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                height: 28,
                padding: "0 10px",
                borderRadius: 6,
                border: "1px solid #2a2a32",
                background: "var(--background)",
                color: "var(--foreground)",
                fontSize: 12,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3a3a45")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2a2a32")}
            >
              <IcLayers size={12} />
              {currentSort.label}
              <ChevronDown size={11} style={{ color: "var(--muted-foreground)" }} />
            </button>

            {sortOpen && (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 300 }}
                  onClick={() => setSortOpen(false)}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    right: 0,
                    zIndex: 301,
                    background: "var(--card)",
                    border: "1px solid #2e2e38",
                    borderRadius: 8,
                    padding: "4px",
                    minWidth: 200,
                    boxShadow: "0 8px 24px rgba(0,0,0,.6)",
                  }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => { setSortKey(opt.key); setSortOpen(false); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: 5,
                        background: "none",
                        border: 0,
                        color: sortKey === opt.key ? "var(--foreground)" : "var(--muted-foreground)",
                        fontSize: 13,
                        cursor: "pointer",
                        fontWeight: sortKey === opt.key ? 600 : 400,
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                      {opt.label}
                      {sortKey === opt.key && <IcCheck size={13} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* lista de tasks */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loadingTasks ? (
            <div style={{ padding: "16px 20px" }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 36,
                    marginBottom: 4,
                    borderRadius: 6,
                    background: "var(--accent)",
                  }}
                />
              ))}
            </div>
          ) : sorted.map((task, idx) => {
            const taskColor = STATUS_COLOR[task.status as V3Intention] ?? "#6b7280";
            const taskLabel = STATUS_LABEL[task.status as V3Intention] ?? task.status;
            const isTerminal = ["DONE", "VALIDATED", "CANCELLED"].includes(task.status);
            const isUnlinkChecked = unlinkSelected.has(task.id);
            return (
              <div
                key={task.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "11px 20px",
                  borderBottom: idx < sorted.length - 1 ? "1px solid #1f1f25" : "none",
                  cursor: "default",
                  background: isUnlinkChecked ? "rgba(239,68,68,0.07)" : "transparent",
                  transition: "background .1s",
                }}
                onMouseEnter={(e) => {
                  if (!isUnlinkChecked)
                    (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background =
                    isUnlinkChecked ? "rgba(239,68,68,0.07)" : "transparent";
                }}
              >
                {/* checkbox de desvincular */}
                <span
                  onClick={() => toggleUnlink(task.id)}
                  title={isUnlinkChecked ? "Desmarcar" : "Marcar para desvincular"}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    border: isUnlinkChecked ? "none" : "1.5px solid #3a3a45",
                    background: isUnlinkChecked ? "#ef4444" : "transparent",
                    flexShrink: 0,
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                    transition: "background .1s",
                  }}
                >
                  {isUnlinkChecked && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                </span>

                {/* status dot */}
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: taskColor,
                    flexShrink: 0,
                  }}
                  title={taskLabel}
                />

                {/* nome */}
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: isTerminal ? "var(--muted-foreground)" : "var(--foreground)",
                    textDecoration: isTerminal ? "line-through" : "none",
                  }}
                >
                  {task.nome}
                </span>

                {/* dueDate */}
                {task.dueDate && (
                  <span style={{ fontSize: 11, color: "var(--muted-foreground)", flexShrink: 0 }}>
                    {new Date(task.dueDate + "T12:00:00").toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                )}

                {/* status badge */}
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: taskColor + "20",
                    color: taskColor,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {taskLabel}
                </span>
              </div>
            );
          })}
        </div>

        {/* barra de desvincular — aparece quando há seleção */}
        {unlinkSelected.size > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderTop: "1px solid #ef444430",
              background: "rgba(239,68,68,0.07)",
              flexShrink: 0,
            }}
          >
            <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#ef4444" }}>
              {unlinkSelected.size} selecionada{unlinkSelected.size !== 1 ? "s" : ""} para desvincular
            </span>
            <button
              type="button"
              onClick={() => setUnlinkSelected(new Set())}
              style={{
                height: 28,
                padding: "0 10px",
                borderRadius: 6,
                border: "1px solid #ef444440",
                background: "none",
                color: "var(--muted-foreground)",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleUnlinkSelected}
              disabled={unlinking}
              style={{
                height: 28,
                padding: "0 14px",
                borderRadius: 6,
                border: "none",
                background: "#ef4444",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {unlinking ? "Desvinculando…" : `Desvincular ${unlinkSelected.size}`}
            </button>
          </div>
        )}

        {/* rodapé — adicionar task */}
        <div
          style={{
            borderTop: "1px solid #26262d",
            flexShrink: 0,
          }}
        >
          {/* painel: criar nova tarefa */}
          {addMode === "new" && (
            <div style={{ padding: "12px 20px", borderBottom: "1px solid #26262d" }}>
              <input
                autoFocus
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateTask();
                  if (e.key === "Escape") { setAddMode(null); setNewTaskName(""); }
                }}
                placeholder="Nome da nova tarefa…"
                style={{
                  width: "100%",
                  background: "var(--background)",
                  border: "1px solid #3a3a45",
                  borderRadius: 6,
                  padding: "8px 12px",
                  fontSize: 13,
                  color: "var(--foreground)",
                  outline: 0,
                  marginBottom: 8,
                  boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={handleCreateTask}
                  disabled={!newTaskName.trim() || createTask.isPending}
                  style={{
                    height: 30,
                    padding: "0 14px",
                    borderRadius: 6,
                    border: "none",
                    background: "#7c5cff",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: newTaskName.trim() ? "pointer" : "default",
                    opacity: newTaskName.trim() ? 1 : 0.5,
                  }}
                >
                  {createTask.isPending ? "Criando…" : "Criar"}
                </button>
                <button
                  type="button"
                  onClick={() => { setAddMode(null); setNewTaskName(""); }}
                  style={{
                    height: 30,
                    padding: "0 12px",
                    borderRadius: 6,
                    border: "1px solid #2a2a32",
                    background: "none",
                    color: "var(--muted-foreground)",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* painel: vincular tarefa existente — seleção múltipla */}
          {addMode === "link" && (
            <div style={{ padding: "12px 20px 14px", borderBottom: "1px solid #26262d" }}>
              {/* busca */}
              <input
                autoFocus
                value={linkSearch}
                onChange={(e) => setLinkSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") handleCancelLink(); }}
                placeholder="Buscar tarefa existente…"
                style={{
                  width: "100%",
                  background: "var(--background)",
                  border: "1px solid #3a3a45",
                  borderRadius: 6,
                  padding: "8px 12px",
                  fontSize: 13,
                  color: "var(--foreground)",
                  outline: 0,
                  marginBottom: 8,
                  boxSizing: "border-box",
                }}
              />

              {/* lista — altura para ~25 tasks */}
              <div
                style={{
                  maxHeight: 360,
                  overflowY: "auto",
                  borderRadius: 6,
                  border: "1px solid #26262d",
                  background: "var(--background)",
                }}
              >
                {filtered.length === 0 ? (
                  <div style={{ padding: "14px 16px", fontSize: 13, color: "var(--muted-foreground)" }}>
                    {unassigned.length === 0
                      ? "Todas as tarefas já estão em um bloco."
                      : "Nenhuma tarefa encontrada."}
                  </div>
                ) : (
                  filtered.map((t) => {
                    const isChecked = selected.has(t.id);
                    return (
                      <div
                        key={t.id}
                        onClick={() => toggleSelect(t.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 14px",
                          borderBottom: "1px solid #1f1f25",
                          cursor: "pointer",
                          background: isChecked ? "rgba(124,92,255,0.10)" : "transparent",
                          transition: "background .1s",
                        }}
                        onMouseEnter={(e) => {
                          if (!isChecked)
                            (e.currentTarget as HTMLDivElement).style.background = "var(--accent)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.background =
                            isChecked ? "rgba(124,92,255,0.10)" : "transparent";
                        }}
                      >
                        {/* checkbox visual */}
                        <span
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 4,
                            border: isChecked ? "none" : "1.5px solid #3a3a45",
                            background: isChecked ? "#7c5cff" : "transparent",
                            flexShrink: 0,
                            display: "grid",
                            placeItems: "center",
                            transition: "background .1s",
                          }}
                        >
                          {isChecked && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>

                        {/* status dot */}
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: STATUS_COLOR[t.status as V3Intention] ?? "#6b7280",
                            flexShrink: 0,
                          }}
                        />

                        {/* nome */}
                        <span
                          style={{
                            flex: 1,
                            fontSize: 13,
                            color: "var(--foreground)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {t.nome}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* rodapé do painel: contador + confirmar + cancelar */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                {selected.size > 0 && (
                  <span style={{ fontSize: 12, color: "#7c5cff", fontWeight: 600, flex: 1 }}>
                    {selected.size} selecionada{selected.size !== 1 ? "s" : ""}
                  </span>
                )}
                {selected.size === 0 && (
                  <span style={{ fontSize: 12, color: "var(--muted-foreground)", flex: 1 }}>
                    Clique para selecionar
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleCancelLink}
                  style={{
                    height: 30,
                    padding: "0 12px",
                    borderRadius: 6,
                    border: "1px solid #2a2a32",
                    background: "none",
                    color: "var(--muted-foreground)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleLinkSelected}
                  disabled={selected.size === 0 || linking}
                  style={{
                    height: 30,
                    padding: "0 14px",
                    borderRadius: 6,
                    border: "none",
                    background: selected.size > 0 ? "#7c5cff" : "#2a2a32",
                    color: selected.size > 0 ? "#fff" : "var(--muted-foreground)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: selected.size > 0 ? "pointer" : "default",
                    transition: "background .15s",
                  }}
                >
                  {linking
                    ? "Vinculando…"
                    : selected.size > 0
                      ? `Vincular ${selected.size}`
                      : "Vincular"}
                </button>
              </div>
            </div>
          )}

          {/* botões principais */}
          {addMode === null && (
            <div style={{ display: "flex", gap: 8, padding: "12px 20px" }}>
              <button
                type="button"
                onClick={() => setAddMode("new")}
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  height: 32,
                  borderRadius: 6,
                  border: "1px solid #2a2a32",
                  background: "var(--background)",
                  color: "var(--foreground)",
                  fontSize: 13,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#7c5cff60")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2a2a32")}
              >
                <IcPlus size={13} />
                Nova tarefa
              </button>
              <button
                type="button"
                onClick={() => setAddMode("link")}
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  height: 32,
                  borderRadius: 6,
                  border: "1px solid #2a2a32",
                  background: "var(--background)",
                  color: "var(--muted-foreground)",
                  fontSize: 13,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#3a3a45";
                  e.currentTarget.style.color = "var(--foreground)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#2a2a32";
                  e.currentTarget.style.color = "var(--muted-foreground)";
                }}
              >
                <IcGitFork size={13} />
                Vincular existente
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function daysUntil(isoEnd: string): number {
  const end = new Date(isoEnd + "T12:00:00");
  const diff = end.getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function deadlineInfo(
  isoEnd: string | null | undefined,
  percent: number,
): { label: string; color: string; bg: string } {
  if (percent === 100) {
    return { label: "Concluído", color: "#22c55e", bg: "rgba(34,197,94,0.12)" };
  }
  if (!isoEnd) {
    return { label: "Sem prazo", color: "#6b7280", bg: "rgba(107,114,128,0.12)" };
  }
  const days = daysUntil(isoEnd);
  if (days < 0)
    return { label: `${Math.abs(days)}d atrasado`, color: "#ef4444", bg: "rgba(239,68,68,0.12)" };
  if (days < 10)
    return { label: `${days}d restantes`, color: "#ef4444", bg: "rgba(239,68,68,0.12)" };
  if (days < 30)
    return { label: `${days}d restantes`, color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
  return { label: `${days}d restantes`, color: "#22c55e", bg: "rgba(34,197,94,0.12)" };
}

function BlockCard({ block, onClick }: { block: BlockDto; onClick: () => void }) {
  const { data: subtasks = [] } = useSubtasks(block.id, true);
  const { done, total, percent } = calcBlockProgress(subtasks);
  const cor = block.dados?.cor ?? "#7c5cff";
  const endDate = block.dados?.endDate ?? null;
  const dl = deadlineInfo(endDate, percent);
  const barColor = percent === 100 ? "#22c55e" : percent > 60 ? "#7c5cff" : "#60a5fa";

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 12,
        border: "1px solid #26262d",
        background: "var(--card)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "border-color .15s, box-shadow .15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = cor + "60";
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 20px ${cor}18`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "#26262d";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* topo colorido */}
      <div style={{ height: 4, background: cor, flexShrink: 0 }} />

      {/* corpo do card */}
      <div style={{ padding: "16px 18px 14px", flex: 1 }}>
        {/* nome */}
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--foreground)",
            marginBottom: 10,
            lineHeight: 1.3,
          }}
        >
          {block.nome}
        </div>

        {/* contador de tarefas — destaque */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 4,
            marginBottom: 14,
          }}
        >
          <span
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "var(--foreground)",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {done}
          </span>
          <span
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: "var(--muted-foreground)",
              lineHeight: 1,
            }}
          >
            /{total}
          </span>
          <span
            style={{
              fontSize: 12,
              color: "var(--muted-foreground)",
              marginLeft: 4,
              alignSelf: "center",
            }}
          >
            tarefas
          </span>
        </div>

        {/* badge de prazo */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 9px",
            borderRadius: 6,
            background: dl.bg,
            fontSize: 12,
            fontWeight: 600,
            color: dl.color,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: dl.color,
              flexShrink: 0,
            }}
          />
          {dl.label}
        </div>
      </div>

      {/* rodapé — barra de progresso */}
      <div style={{ padding: "0 18px 16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
            fontSize: 11,
            color: "var(--muted-foreground)",
          }}
        >
          <span>Progresso</span>
          <span style={{ fontWeight: 600, color: percent === 100 ? "#22c55e" : "var(--foreground)" }}>
            {percent}%
          </span>
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 99,
            background: "#1f1f25",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${percent}%`,
              borderRadius: 99,
              background: barColor,
              transition: "width .4s ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function BlocksContent({
  projectId,
  members,
  onOpenTask,
}: {
  projectId: string;
  members: ProjectMemberDto[];
  onOpenTask: (task: TaskResponseDto) => void;
}) {
  const { data: blocks = [], isLoading: loadingBlocks } = useBlocks(projectId);
  const createBlock = useCreateBlock();
  const [creating, setCreating] = useState(false);
  const [newBlockName, setNewBlockName] = useState("");
  const [selectedBlock, setSelectedBlock] = useState<BlockDto | null>(null);

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ background: "var(--background)", padding: "24px 28px 80px" }}
    >
      {/* cabeçalho */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Layers size={15} style={{ color: "var(--muted-foreground)" }} />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--muted-foreground)",
              letterSpacing: ".4px",
              textTransform: "uppercase",
            }}
          >
            {loadingBlocks ? "..." : blocks.length} blocos
          </span>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            height: 30,
            padding: "0 14px",
            borderRadius: 6,
            border: "1px solid #2a2a32",
            background: "var(--card)",
            color: "var(--foreground)",
            fontSize: 13,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--secondary)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--card)")}
        >
          <IcPlus size={13} />
          Novo bloco
        </button>
      </div>

      {/* formulário inline de criação */}
      {creating && (
        <div
          style={{
            marginBottom: 20,
            padding: "14px 18px",
            borderRadius: 10,
            border: "1px dashed #7c5cff80",
            background: "rgba(124,92,255,0.06)",
          }}
        >
          <input
            autoFocus
            value={newBlockName}
            onChange={(e) => setNewBlockName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newBlockName.trim()) {
                createBlock.mutate(
                  { nome: newBlockName.trim(), projectId },
                  {
                    onSuccess: () => {
                      setCreating(false);
                      setNewBlockName("");
                    },
                  },
                );
              }
              if (e.key === "Escape") {
                setCreating(false);
                setNewBlockName("");
              }
            }}
            placeholder="Nome do bloco…"
            style={{
              width: "100%",
              background: "none",
              border: 0,
              outline: 0,
              fontSize: 14,
              fontWeight: 600,
              color: "var(--foreground)",
            }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted-foreground)" }}>
            Enter para salvar · Esc para cancelar
          </div>
        </div>
      )}

      {/* grid de cards — 3 colunas base, 4 em telas largas */}
      {loadingBlocks ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 180, borderRadius: 12, background: "var(--card)" }} />
          ))}
        </div>
      ) : blocks.length === 0 ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: "var(--muted-foreground)", fontSize: 13 }}>
          Nenhum bloco ainda. Crie o primeiro clicando em &quot;Novo bloco&quot;.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {blocks.map((block) => (
            <BlockCard key={block.id} block={block} onClick={() => setSelectedBlock(block)} />
          ))}
        </div>
      )}

      {/* drawer de detalhes do bloco */}
      {selectedBlock && (
        <BlockDrawer block={selectedBlock} projectId={projectId} onClose={() => setSelectedBlock(null)} />
      )}
    </div>
  );
}

// ─── ListContent ──────────────────────────────────────────────────────────────
function ListContent({
  grupos,
  isLoading,
  subtarefasMode,
  onAddTask,
  onOpenTask,
  members,
  projectId,
  allTasks,
}: {
  grupos: { status: StatusVisual; tarefas: TaskResponseDto[] }[];
  isLoading: boolean;
  subtarefasMode: SubtarefasMode;
  onAddTask: (defaultStatus?: StatusVisual) => void;
  onOpenTask: (task: TaskResponseDto) => void;
  members: ProjectMemberDto[];
  projectId: string;
  allTasks: TaskResponseDto[];
}) {
  const queryClient = useQueryClient();
  const updateStatus = useUpdateTaskStatus();
  const [draggingTask, setDraggingTask] = useState<TaskResponseDto | null>(
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    const task = allTasks.find((t) => t.id === event.active.id);
    setDraggingTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggingTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const targetStatus = over.id as StatusVisual;
    const newIntention = INTENTION_TO_STATUS_REVERSE[targetStatus];
    if (!newIntention) return;

    const task = allTasks.find((t) => t.id === taskId);
    if (!task) return;

    // Já está no grupo certo
    const currentStatus = INTENTION_TO_STATUS[task.status] ?? "backlog";
    if (currentStatus === targetStatus) return;

    // Otimista
    queryClient.setQueryData<TaskResponseDto[]>(
      qk.tasks.byProject(projectId),
      (prev) =>
        prev?.map((t) =>
          t.id === taskId ? { ...t, status: newIntention as V3Intention } : t,
        ) ?? [],
    );

    updateStatus.mutate(
      { id: taskId, status: newIntention, projectId },
      {
        onSuccess: () =>
          void queryClient.invalidateQueries({
            queryKey: qk.tasks.byProject(projectId),
          }),
        onError: () =>
          void queryClient.invalidateQueries({
            queryKey: qk.tasks.byProject(projectId),
          }),
      },
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="flex-1 overflow-y-auto overflow-x-auto"
        style={{ background: "var(--background)" }}
      >
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
                members={members}
                isDragging={draggingTask !== null}
              />
            ))
          )}
          <button
            type="button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              color: "var(--muted-foreground)",
              padding: "14px 4px 0 4px",
              fontSize: 13,
              cursor: "pointer",
              background: "none",
              border: 0,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--foreground)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--muted-foreground)")
            }
          >
            <IcPlus size={13} />
            Novo status
          </button>
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
        {draggingTask && (
          <div
            style={{
              background: "var(--card)",
              border: "1px solid #7c5cff40",
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 13,
              color: "var(--foreground)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              opacity: 0.95,
              display: "flex",
              alignItems: "center",
              gap: 8,
              minWidth: 300,
            }}
          >
            <GripVertical
              size={13}
              style={{ color: "var(--muted-foreground)", flexShrink: 0 }}
            />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                color: "var(--muted-foreground)",
                flexShrink: 0,
              }}
            >
              {draggingTask.identifier}
            </span>
            <span className="truncate">{draggingTask.nome}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────
function PageHeader({ id, nome }: { id: string; nome: string }) {
  return (
    <header
      className="flex h-11 shrink-0 items-center justify-between gap-4 px-5"
      style={{
        borderBottom: "1px solid #26262d",
        background: "var(--background)",
      }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <IcList size={16} />
        <h1
          className="truncate text-sm font-semibold"
          style={{ color: "var(--foreground)" }}
        >
          {nome}
        </h1>
        <button
          type="button"
          style={{
            display: "grid",
            width: 20,
            height: 20,
            placeItems: "center",
            borderRadius: 4,
            color: "var(--muted-foreground)",
            background: "none",
            border: 0,
          }}
        >
          <IcCaret size={12} />
        </button>
        <button
          type="button"
          style={{
            display: "grid",
            width: 24,
            height: 24,
            placeItems: "center",
            borderRadius: 4,
            color: "var(--muted-foreground)",
            background: "none",
            border: 0,
          }}
        >
          <Star className="size-3.5" />
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <AgentPopover projectId={id} projectName={nome} />
        <TbBtn icon={<Sparkles className="size-3.5" />} label="Pergunte à IA" />
        <div
          style={{
            width: 1,
            height: 16,
            background: "var(--accent)",
            margin: "0 4px",
          }}
        />
        <TbBtn
          icon={<Share2 className="size-3.5" />}
          label="Compartilhar"
          bordered
        />
      </div>
    </header>
  );
}

function TbBtn({
  icon,
  label,
  bordered,
}: {
  icon: React.ReactNode;
  label: string;
  bordered?: boolean;
}) {
  return (
    <button
      type="button"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 28,
        padding: "0 10px",
        borderRadius: 6,
        border: bordered ? "1px solid #2a2a32" : "none",
        background: bordered ? "var(--card)" : "none",
        color: "var(--muted-foreground)",
        fontSize: 13,
        cursor: "pointer",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
      onMouseLeave={(e) =>
        (e.currentTarget.style.color = "var(--muted-foreground)")
      }
    >
      {icon}
      {label}
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
        <SmallBtn icon={<IcFilter size={13} />} label="Filtro" />
        <SmallBtn icon={<IcCheck size={13} />} label="Fechado" />
        <SmallBtn icon={<IcUser size={13} />} label="Responsável" />
        <button
          type="button"
          style={{
            width: 28,
            height: 28,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 6,
            color: "var(--muted-foreground)",
            background: "none",
            border: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--card)";
            e.currentTarget.style.color = "var(--foreground)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "none";
            e.currentTarget.style.color = "var(--muted-foreground)";
          }}
        >
          <IcSearch size={15} />
        </button>
        {tarefasCount !== null && (
          <span
            style={{
              color: "var(--muted-foreground)",
              fontSize: 12,
              padding: "0 4px",
            }}
          >
            {tarefasCount} tarefas
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

function TabBtn({
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

function SmallBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 28,
        padding: "0 10px",
        border: "1px solid #2a2a32",
        background: "var(--card)",
        borderRadius: 6,
        color: "var(--muted-foreground)",
        fontSize: 13,
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--foreground)";
        e.currentTarget.style.borderColor = "var(--accent)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--muted-foreground)";
        e.currentTarget.style.borderColor = "var(--accent)";
      }}
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
  members,
  isDragging,
}: {
  status: StatusVisual;
  tarefas: TaskResponseDto[];
  subtarefasMode: SubtarefasMode;
  onAddTask: (defaultStatus?: StatusVisual) => void;
  onOpenTask: (task: TaskResponseDto) => void;
  members: ProjectMemberDto[];
  isDragging?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const cfg = STATUS_CONFIG[status];
  const StatusIcon = cfg.Icon;
  const { setNodeRef, isOver } = useDroppable({ id: status });

  const tarefasVisiveis = tarefas.filter((t) => !t.idPai);

  return (
    <div style={{ marginBottom: 8, marginTop: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 0 8px",
        }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            width: 18,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--muted-foreground)",
            background: "none",
            border: 0,
            cursor: "pointer",
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform .15s",
          }}
        >
          <IcCaret size={12} />
        </button>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "3px 9px",
            borderRadius: 5,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: ".7px",
            textTransform: "uppercase",
            background: GROUP_PILL_STYLE[status].bg,
            color: GROUP_PILL_STYLE[status].color,
          }}
        >
          <StatusIcon size={11} />
          {cfg.label}
        </span>
        <span
          style={{
            color: "var(--muted-foreground)",
            fontSize: 12,
            marginLeft: 2,
          }}
        >
          {tarefasVisiveis.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        style={{
          borderRadius: 8,
          transition: "background .15s",
          background: isOver ? "rgba(124,92,255,0.08)" : "transparent",
          outline: isOver ? "1px solid rgba(124,92,255,0.3)" : "none",
        }}
      >
        {open && (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              tableLayout: "fixed",
            }}
          >
            <colgroup>
              <col style={{ width: 24 }} />
              <col style={{ width: "auto" }} />
              <col style={{ width: 170 }} />
              <col style={{ width: 200 }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 200 }} />
              <col style={{ width: 48 }} />
              <col style={{ width: 36 }} />
            </colgroup>
            <thead>
              <HeadRow />
            </thead>
            <tbody>
              {tarefasVisiveis.map((t) => (
                <TaskRowBackend
                  key={t.id}
                  task={t}
                  onOpenTask={onOpenTask}
                  members={members}
                  subtarefasMode={subtarefasMode}
                />
              ))}
              {isDragging && tarefasVisiveis.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div
                      style={{
                        padding: "12px 16px",
                        fontSize: 12,
                        color: "var(--muted-foreground)",
                        textAlign: "center",
                      }}
                    >
                      {isOver ? "Soltar aqui" : "Arraste para cá"}
                    </div>
                  </td>
                </tr>
              )}
              <AddRow onAddTask={() => onAddTask(status)} />
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function HeadRow() {
  const thStyle: React.CSSProperties = {
    fontWeight: 500,
    color: "var(--muted-foreground)",
    fontSize: 12,
    textAlign: "left",
    padding: "6px 10px",
    borderTop: "1px solid #1f1f25",
    borderBottom: "1px solid #1f1f25",
    background: "transparent",
  };
  return (
    <tr>
      <th style={{ ...thStyle, width: 24, padding: 0 }} />
      <th style={{ ...thStyle, paddingLeft: 8 }}>Nome</th>
      <th style={thStyle}>Responsável</th>
      <th style={thStyle}>Data de vencimento</th>
      <th style={thStyle}>Prioridade</th>
      <th style={thStyle}>Status</th>
      <th style={{ ...thStyle, textAlign: "center" }}>
        <IcChat size={13} />
      </th>
      <th style={{ ...thStyle, textAlign: "center" }}>
        <span
          style={{
            display: "inline-flex",
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "var(--accent)",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--foreground)",
          }}
        >
          <IcPlus size={11} />
        </span>
      </th>
    </tr>
  );
}

// ─── Mapeamentos para dropdowns inline ───────────────────────────────────────

type StatusVisualKey =
  | "backlog"
  | "pronto"
  | "em-progresso"
  | "concluido"
  | "falhou"
  | "atrasado";

const INTENTION_TO_VISUAL_ROW: Record<V3Intention, StatusVisualKey> = {
  INBOX: "backlog",
  READY: "pronto",
  EXECUTING: "em-progresso",
  VALIDATING: "em-progresso",
  DONE: "concluido",
  VALIDATED: "concluido",
  FAILED: "falhou",
  CANCELLED: "concluido",
  DISCARDED: "concluido",
};

const VISUAL_TO_INTENTION_ROW: Record<StatusVisualKey, V3Intention> = {
  backlog: "INBOX",
  pronto: "READY",
  "em-progresso": "EXECUTING",
  concluido: "DONE",
  falhou: "FAILED",
  atrasado: "INBOX",
};

const PRIO_VISUAL_MAP: Record<TaskPriority, keyof typeof PRIO_CONFIG_MAP> = {
  URGENT: "urgente",
  HIGH: "alta",
  MEDIUM: "media",
  LOW: "baixa",
};
const PRIO_CONFIG_MAP = {
  urgente: { label: "Urgente", color: "#ef4444" },
  alta: { label: "Alta", color: "#f59e0b" },
  media: { label: "Média", color: "#60a5fa" },
  baixa: { label: "Baixa", color: "var(--muted-foreground)" },
};
const VISUAL_TO_BACKEND_PRIO: Record<
  keyof typeof PRIO_CONFIG_MAP,
  TaskPriority
> = {
  urgente: "URGENT",
  alta: "HIGH",
  media: "MEDIUM",
  baixa: "LOW",
};
const ALL_STATUS_VISUAL_ROW: StatusVisualKey[] = [
  "backlog",
  "pronto",
  "em-progresso",
  "concluido",
  "falhou",
];
const ALL_PRIO_VISUAL_ROW = Object.keys(
  PRIO_CONFIG_MAP,
) as (keyof typeof PRIO_CONFIG_MAP)[];

// ─── Ícones inline das células ────────────────────────────────────────────────
function IcCalendarInline({
  size = 13,
  color = "var(--muted-foreground)",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
function IcUserInline({
  size = 13,
  color = "var(--muted-foreground)",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

// ─── TaskRow adaptado para dados reais do backend ────────────────────────────
function TaskRowBackend({
  task,
  onOpenTask,
  members,
  depth = 0,
  subtarefasMode,
}: {
  task: TaskResponseDto;
  onOpenTask: (t: TaskResponseDto) => void;
  members: ProjectMemberDto[];
  depth?: number;
  subtarefasMode?: SubtarefasMode;
}) {
  const updateTask = useUpdateTask();
  const updateStatus = useUpdateTaskStatus();
  const createTask = useCreateTask();

  const [hovered, setHovered] = useState(false);
  const [openCell, setOpenCell] = useState<
    "status" | "prioridade" | "responsavel" | null
  >(null);
  const [editandoData, setEditandoData] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [newSubtaskName, setNewSubtaskName] = useState("");

  // TODO: refatorar para derivar expandido do subtarefasMode sem useEffect.
  // Preservado como-está nesta iteração para limitar escopo do fix de tasks
  // terminais (mudança não relacionada ao bug original deste effect).
  useEffect(() => {
    if (subtarefasMode === "expandidas") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpanded(true);
    } else if (subtarefasMode === "recolhidas") {
      setExpanded(false);
      setAddingSubtask(false);
      setNewSubtaskName("");
    }
  }, [subtarefasMode]);

  const { data: subtasks = [], isLoading: loadingSubtasks } = useSubtasks(
    task.id,
    expanded,
  );

  const overdue = isOverdue(task.dueDate, task.status as V3Intention);
  const prioColor = priorityToColor(task.priority);
  const prioLabel = priorityToLabel(task.priority);
  const statusVisual: StatusVisualKey = overdue
    ? "atrasado"
    : (INTENTION_TO_VISUAL_ROW[task.status as V3Intention] ?? "backlog");
  const statusCfg = STATUS_CONFIG[statusVisual];
  const StatusIcon = statusCfg.Icon;

  const isAiAssignee = task.assigneeId === AI_ASSIGNEE_ID;
  const {
    execution: aiExecution,
    startExecution: startAiExecution,
    isSubmitting: isAiSubmitting,
  } = useTaskExecution(task.id, task.projectId);
  const assignee =
    task.assigneeId && !isAiAssignee
      ? members.find((m) => m.userId === task.assigneeId)
      : null;
  const assigneeInitials = assignee
    ? assignee.nome
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : null;

  const dateLabel = task.dueDate
    ? new Date(task.dueDate.slice(0, 10) + "T12:00:00").toLocaleDateString(
        "pt-BR",
        { day: "2-digit", month: "short" },
      )
    : null;

  const tdStyle: React.CSSProperties = {
    borderBottom: "1px solid #1f1f25",
    background: hovered ? "var(--accent)" : "transparent",
    transition: "background .1s",
  };

  function closeDropdown() {
    setOpenCell(null);
  }

  // Defense-in-depth: mesmo que as UI fechem o dropdown quando isLocked,
  // gatekeep nos handlers garante que cliques rápidos ou bugs visuais
  // não disparem mutation em task travada pela execução IA.
  function handleStatusChange(sv: StatusVisualKey) {
    closeDropdown();
    if (isLocked) return;
    updateStatus.mutate({
      id: task.id,
      status: VISUAL_TO_INTENTION_ROW[sv],
      projectId: task.projectId,
    });
  }

  function handlePrioChange(p: keyof typeof PRIO_CONFIG_MAP | null) {
    closeDropdown();
    if (isLocked) return;
    updateTask.mutate({
      id: task.id,
      projectId: task.projectId,
      dto: { priority: p ? VISUAL_TO_BACKEND_PRIO[p] : undefined },
    });
  }

  function handleDateChange(val: string | null) {
    setEditandoData(false);
    if (isLocked) return;
    updateTask.mutate({
      id: task.id,
      projectId: task.projectId,
      dto: { dueDate: val },
    });
  }

  function handleAssigneeChange(memberId: string | null) {
    closeDropdown();
    if (isLocked) return;
    updateTask.mutate({
      id: task.id,
      projectId: task.projectId,
      dto: { assigneeId: memberId },
    });
  }

  const currentPrioVisual = task.priority
    ? PRIO_VISUAL_MAP[task.priority as TaskPriority]
    : null;
  const indent = 8 + depth * 30;
  // Estado terminal (DONE/FAILED) = histórico: sem botão Executar, sem badge,
  // sem bloqueio. Task acabada não exige ação nem trava UI mesmo que haja
  // DPedido pendente (zumbi).
  const isTerminalStatus = task.status === "DONE" || task.status === "FAILED";

  // Lock UI — `activeExecution` é a verdade canônica do backend (DPedido
  // -300..-304 com baixado=false e dados.taskId=task.id). Suprimido em
  // estado terminal.
  const isLocked = !isTerminalStatus && task.activeExecution != null;
  const lockTitle = isLocked
    ? "Em execução pela IA — aguarde a conclusão para editar"
    : undefined;
  const isDraggable = depth === 0 && !isLocked;
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging: isBeingDragged,
  } = useDraggable({
    id: task.id,
    disabled: !isDraggable,
  });

  function handleAddSubtask() {
    const nome = newSubtaskName.trim();
    if (!nome) return;
    createTask.mutate(
      { titulo: nome, idProject: task.projectId, idPai: task.id },
      {
        onSuccess: () => {
          setNewSubtaskName("");
          setAddingSubtask(false);
          setExpanded(true);
        },
      },
    );
  }

  return (
    <>
      <tr
        ref={isDraggable ? setDragRef : undefined}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ cursor: "default", opacity: isBeingDragged ? 0.4 : 1 }}
      >
        {/* Handle de drag — só em tasks raiz */}
        <td style={{ ...tdStyle, width: 24, padding: 0 }}>
          {isDraggable && (
            <div
              {...listeners}
              {...attributes}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 36,
                cursor: "grab",
                color: hovered ? "var(--muted-foreground)" : "transparent",
                transition: "color .15s",
              }}
            >
              <GripVertical size={13} />
            </div>
          )}
        </td>
        {/* Nome — clique no título abre TaskSheet */}
        <td style={{ ...tdStyle, padding: "0 10px 0 0" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 36,
              paddingLeft: indent,
            }}
          >
            {/* Caret — sempre caret. No hover expande + abre input; fora do hover só expande/recolhe */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (hovered && !expanded) {
                  setExpanded(true);
                  setAddingSubtask(true);
                } else {
                  // recolher: cancela input pendente
                  if (expanded) {
                    setAddingSubtask(false);
                    setNewSubtaskName("");
                  }
                  setExpanded((v) => !v);
                }
              }}
              style={{
                width: 16,
                height: 16,
                flexShrink: 0,
                background: "none",
                border: 0,
                color: hovered
                  ? "var(--foreground)"
                  : "var(--muted-foreground)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
                transition: "transform .15s, color .1s",
              }}
            >
              <IcCaret size={10} />
            </button>
            <span
              style={{
                color: statusCfg.iconColor,
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <StatusIcon size={13} />
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={() => onOpenTask(task)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onOpenTask(task);
              }}
              style={{
                fontSize: 13,
                color: "var(--foreground)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
              title="Abrir detalhes"
            >
              {task.nome}
            </span>
            {task.idPai && <IcGitFork size={12} />}
            {/* Lock badge — task com execução IA ativa fica read-only */}
            {isLocked && (
              <span
                title={lockTitle}
                aria-label={lockTitle}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 7px",
                  borderRadius: 4,
                  background: "rgba(124,92,255,0.18)",
                  color: "#cfc1ff",
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                  flexShrink: 0,
                }}
              >
                <Lock size={10} />
                {task.activeExecution?.status === "awaiting_approval"
                  ? "aprovar"
                  : "executando"}
              </span>
            )}
            {/* Botão Executar — só em tasks atribuídas ao Claude, sem lock
                ativo e fora de estado terminal (concluído/falhou é histórico) */}
            {isAiAssignee && !isLocked && !isTerminalStatus && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  startAiExecution();
                }}
                disabled={isAiSubmitting || !!aiExecution}
                title={
                  aiExecution
                    ? `Status: ${aiExecution.status}`
                    : "Executar com Claude"
                }
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 9px",
                  borderRadius: 6,
                  border: "1px solid rgba(34,197,94,0.35)",
                  cursor: "pointer",
                  background: "rgba(34,197,94,0.18)",
                  color: "#86efac",
                  fontSize: 11,
                  fontWeight: 600,
                  flexShrink: 0,
                  transition: "background .15s, border-color .15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(34,197,94,0.32)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(34,197,94,0.55)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(34,197,94,0.18)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "rgba(34,197,94,0.35)";
                }}
              >
                <svg
                  width="9"
                  height="10"
                  viewBox="0 0 9 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M1 1.5L8 5L1 8.5V1.5Z" fill="#86efac" />
                </svg>
                Executar
              </button>
            )}
            {/* "+" no final da célula Nome, antes de Responsável — só no hover */}
            {hovered && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(true);
                  setAddingSubtask(true);
                }}
                title="Adicionar subtarefa"
                style={{
                  marginLeft: "auto",
                  flexShrink: 0,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  border: 0,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--foreground)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#7c5cff";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "var(--accent)";
                }}
              >
                <IcPlus size={11} />
              </button>
            )}
          </div>
        </td>

        {/* Responsável — dropdown inline com membros reais */}
        <td style={{ ...tdStyle, padding: "0 10px", position: "relative" }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenCell(openCell === "responsavel" ? null : "responsavel");
            }}
            style={{
              background: "none",
              border: 0,
              cursor: "pointer",
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
            title="Alterar responsável"
          >
            {isAiAssignee ? (
              <>
                <ClaudeAvatar size={22} />
                <span
                  style={{ fontSize: 12, color: "#d97757", fontWeight: 600 }}
                >
                  Claude
                </span>
              </>
            ) : assignee ? (
              <>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: "var(--accent)",
                    color: "#d8ccff",
                    fontSize: 9,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {assigneeInitials}
                </span>
                <span style={{ fontSize: 12, color: "var(--foreground)" }}>
                  {assignee.nome.split(" ")[0]}
                </span>
              </>
            ) : (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  color: "var(--muted-foreground)",
                }}
              >
                <IcUserInline size={13} color="var(--muted-foreground)" />
                <span style={{ fontSize: 12 }}>Atribuir</span>
              </span>
            )}
          </button>
          {openCell === "responsavel" && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 100 }}
                onClick={closeDropdown}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  zIndex: 101,
                  background: "var(--card)",
                  border: "1px solid #2e2e38",
                  borderRadius: 10,
                  padding: "6px",
                  minWidth: 220,
                  maxHeight: 320,
                  overflowY: "auto",
                  boxShadow: "0 12px 32px rgba(0,0,0,.6)",
                }}
              >
                <button
                  type="button"
                  onClick={() => handleAssigneeChange(null)}
                  style={{
                    ...assigneeItemStyle("var(--muted-foreground)"),
                    gap: 10,
                  }}
                >
                  <IcUserInline size={14} color="var(--muted-foreground)" />
                  <span style={{ color: "var(--foreground)" }}>
                    Sem responsável
                  </span>
                  {!task.assigneeId && <IcCheck size={12} />}
                </button>
                {members.map((m) => {
                  const initials = m.nome
                    .split(" ")
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase();
                  const isSelected = task.assigneeId === m.userId;
                  return (
                    <button
                      key={m.userId}
                      type="button"
                      onClick={() => handleAssigneeChange(m.userId)}
                      style={{
                        ...assigneeItemStyle("var(--foreground)"),
                        gap: 10,
                        background: isSelected
                          ? "rgba(124,92,255,0.14)"
                          : "none",
                      }}
                    >
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          flexShrink: 0,
                          background: "var(--accent)",
                          color: "#d8ccff",
                          fontSize: 11,
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {initials}
                      </span>
                      <span style={{ flex: 1, fontSize: 13 }}>{m.nome}</span>
                      {isSelected && <IcCheck size={12} />}
                    </button>
                  );
                })}
                <div
                  style={{ borderTop: "1px solid #2e2e38", margin: "6px 4px" }}
                />
                <button
                  type="button"
                  onClick={() => handleAssigneeChange(AI_ASSIGNEE_ID)}
                  style={{
                    ...assigneeItemStyle("#d97757"),
                    gap: 10,
                    background:
                      task.assigneeId === AI_ASSIGNEE_ID
                        ? "rgba(217,119,87,0.14)"
                        : "none",
                  }}
                >
                  <ClaudeAvatar size={28} />
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: "#d97757",
                      fontWeight: 600,
                    }}
                  >
                    Claude
                  </span>
                  {task.assigneeId === AI_ASSIGNEE_ID && <IcCheck size={12} />}
                </button>
              </div>
            </>
          )}
        </td>

        {/* Data de vencimento — ícone de calendário quando vazia */}
        <td style={{ ...tdStyle, padding: "0 10px", position: "relative" }}>
          {editandoData ? (
            <input
              type="date"
              autoFocus
              defaultValue={task.dueDate?.slice(0, 10) ?? ""}
              onChange={(e) => handleDateChange(e.target.value || null)}
              onBlur={() => setEditandoData(false)}
              style={{
                background: "var(--card)",
                border: "1px solid #7c5cff",
                borderRadius: 5,
                color: "var(--foreground)",
                fontSize: 12,
                padding: "2px 6px",
                outline: "none",
                colorScheme: "dark",
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditandoData(true)}
              style={{
                background: "none",
                border: 0,
                cursor: "pointer",
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
              title="Alterar data"
            >
              {dateLabel ? (
                <span
                  style={{
                    fontSize: 12,
                    color: overdue ? "#fbbf24" : "var(--muted-foreground)",
                  }}
                >
                  {overdue && "⚠ "}
                  {dateLabel}
                </span>
              ) : (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <IcCalendarInline size={13} color="var(--muted-foreground)" />
                  <span
                    style={{ fontSize: 12, color: "var(--muted-foreground)" }}
                  >
                    Definir data
                  </span>
                </span>
              )}
            </button>
          )}
        </td>

        {/* Prioridade — ícone de bandeira quando vazia */}
        <td style={{ ...tdStyle, padding: "0 10px", position: "relative" }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenCell(openCell === "prioridade" ? null : "prioridade");
            }}
            style={{
              background: "none",
              border: 0,
              cursor: "pointer",
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
            title="Alterar prioridade"
          >
            {task.priority ? (
              <>
                <IcFlagInline size={12} color={prioColor} />
                <span style={{ fontSize: 12, color: prioColor }}>
                  {prioLabel}
                </span>
              </>
            ) : (
              <span
                style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
              >
                <IcFlagInline size={12} color="var(--muted-foreground)" />
                <span
                  style={{ fontSize: 12, color: "var(--muted-foreground)" }}
                >
                  Definir
                </span>
              </span>
            )}
          </button>
          {openCell === "prioridade" && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 100 }}
                onClick={closeDropdown}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 2px)",
                  left: 0,
                  zIndex: 101,
                  background: "var(--card)",
                  border: "1px solid #2e2e38",
                  borderRadius: 8,
                  padding: 4,
                  minWidth: 150,
                  boxShadow: "0 8px 24px rgba(0,0,0,.5)",
                }}
              >
                <button
                  type="button"
                  onClick={() => handlePrioChange(null)}
                  style={dropItemStyle("var(--muted-foreground)")}
                >
                  <IcFlagInline size={12} color="var(--muted-foreground)" />
                  <span style={{ color: "var(--foreground)" }}>
                    Sem prioridade
                  </span>
                  {!task.priority && <IcCheck size={11} />}
                </button>
                {ALL_PRIO_VISUAL_ROW.map((p) => {
                  const cfg = PRIO_CONFIG_MAP[p];
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePrioChange(p)}
                      style={dropItemStyle(cfg.color)}
                    >
                      <IcFlagInline size={12} color={cfg.color} />
                      <span style={{ color: "var(--foreground)" }}>
                        {cfg.label}
                      </span>
                      {currentPrioVisual === p && <IcCheck size={11} />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </td>

        {/* Status — ícone do status atual + dropdown */}
        <td style={{ ...tdStyle, padding: "0 10px", position: "relative" }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenCell(openCell === "status" ? null : "status");
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: "none",
              border: 0,
              cursor: "pointer",
              padding: 0,
              color: statusCfg.iconColor,
              fontSize: 12,
              fontWeight: 600,
            }}
            title="Alterar status"
          >
            <StatusIcon size={12} />
            <span>{statusCfg.label}</span>
          </button>
          {openCell === "status" && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 100 }}
                onClick={closeDropdown}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 2px)",
                  left: 0,
                  zIndex: 101,
                  background: "var(--card)",
                  border: "1px solid #2e2e38",
                  borderRadius: 8,
                  padding: 4,
                  minWidth: 160,
                  boxShadow: "0 8px 24px rgba(0,0,0,.5)",
                }}
              >
                {ALL_STATUS_VISUAL_ROW.map((sv) => {
                  const cfg = STATUS_CONFIG[sv];
                  const Icon = cfg.Icon;
                  const isSelected = statusVisual === sv;
                  return (
                    <button
                      key={sv}
                      type="button"
                      onClick={() => handleStatusChange(sv)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: 5,
                        background: isSelected
                          ? "rgba(124,92,255,0.12)"
                          : "none",
                        border: 0,
                        cursor: "pointer",
                        textAlign: "left" as const,
                        color: cfg.iconColor,
                        fontSize: 12,
                      }}
                    >
                      <Icon size={12} />
                      <span style={{ color: "var(--foreground)" }}>
                        {cfg.label}
                      </span>
                      {isSelected && <IcCheck size={11} />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </td>

        {/* Comentários */}
        <td
          style={{
            ...tdStyle,
            textAlign: "center",
            color: "var(--muted-foreground)",
          }}
        >
          <IcChat size={13} />
        </td>

        {/* Ações */}
        <td style={{ ...tdStyle }} />
      </tr>

      {/* Subtarefas — lazy, recursivas */}
      {expanded && (
        <>
          {loadingSubtasks && (
            <tr>
              <td
                colSpan={7}
                style={{
                  padding: "6px 0 6px",
                  paddingLeft: indent + 22,
                  color: "var(--muted-foreground)",
                  fontSize: 12,
                  borderBottom: "1px solid #1f1f25",
                }}
              >
                Carregando...
              </td>
            </tr>
          )}
          {subtasks.map((sub) => (
            <TaskRowBackend
              key={sub.id}
              task={sub}
              onOpenTask={onOpenTask}
              members={members}
              depth={depth + 1}
              subtarefasMode={subtarefasMode}
            />
          ))}
          {/* Linha de adicionar subtarefa */}
          {addingSubtask ? (
            <tr>
              <td
                colSpan={7}
                style={{ borderBottom: "1px solid #1f1f25", padding: 0 }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    height: 34,
                    paddingLeft: indent + 22,
                  }}
                >
                  <span
                    style={{
                      color: "var(--muted-foreground)",
                      flexShrink: 0,
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    <IcPending size={13} />
                  </span>
                  <input
                    autoFocus
                    value={newSubtaskName}
                    onChange={(e) => setNewSubtaskName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddSubtask();
                      if (e.key === "Escape") {
                        setAddingSubtask(false);
                        setNewSubtaskName("");
                      }
                    }}
                    placeholder="Nome da subtarefa..."
                    style={{
                      flex: 1,
                      background: "none",
                      border: "none",
                      outline: "none",
                      color: "var(--foreground)",
                      fontSize: 13,
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    disabled={createTask.isPending || !newSubtaskName.trim()}
                    style={{
                      background: "none",
                      border: 0,
                      color: "#7c5cff",
                      cursor: "pointer",
                      fontSize: 12,
                      padding: "0 8px",
                    }}
                  >
                    {createTask.isPending ? "..." : "Salvar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingSubtask(false);
                      setNewSubtaskName("");
                    }}
                    style={{
                      background: "none",
                      border: 0,
                      color: "var(--muted-foreground)",
                      cursor: "pointer",
                      fontSize: 12,
                      padding: "0 8px",
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </td>
            </tr>
          ) : (
            <tr>
              <td colSpan={7} style={{ borderBottom: "1px solid #1f1f25" }}>
                <button
                  type="button"
                  onClick={() => setAddingSubtask(true)}
                  style={{
                    background: "none",
                    border: 0,
                    cursor: "pointer",
                    paddingLeft: indent + 22,
                    height: 30,
                    width: "100%",
                    textAlign: "left",
                    color: "var(--muted-foreground)",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <IcPlus size={11} />
                  Adicionar subtarefa
                </button>
              </td>
            </tr>
          )}
        </>
      )}
    </>
  );
}

function dropItemStyle(color: string): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "7px 10px",
    borderRadius: 5,
    background: "none",
    border: 0,
    cursor: "pointer",
    color,
    fontSize: 12,
    textAlign: "left" as const,
  };
}

function assigneeItemStyle(color: string): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "9px 12px",
    borderRadius: 7,
    background: "none",
    border: 0,
    cursor: "pointer",
    color,
    fontSize: 13,
    textAlign: "left" as const,
    transition: "background .1s",
  };
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
      <td
        colSpan={8}
        style={{
          height: 34,
          borderBottom: "1px solid #1f1f25",
          background: hovered ? "var(--accent)" : "transparent",
        }}
      >
        <div
          style={{
            paddingLeft: 30,
            height: 34,
            display: "flex",
            alignItems: "center",
            gap: 7,
            color: hovered ? "var(--foreground)" : "var(--muted-foreground)",
            fontSize: 13,
          }}
        >
          <IcPlus size={13} />
          Adicionar Tarefa
        </div>
      </td>
    </tr>
  );
}

function EmptyState({ onAddTask }: { onAddTask: () => void }) {
  return (
    <div
      style={{
        marginTop: 40,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        padding: 40,
        border: "1px dashed #26262d",
        borderRadius: 8,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--muted-foreground)",
        }}
      >
        <IcPlus size={18} />
      </div>
      <p
        style={{
          color: "var(--foreground)",
          fontSize: 14,
          fontWeight: 500,
          margin: 0,
        }}
      >
        Nenhuma tarefa nesta lista ainda
      </p>
      <p style={{ color: "var(--muted-foreground)", fontSize: 12, margin: 0 }}>
        Crie a primeira tarefa para começar.
      </p>
      <button
        type="button"
        onClick={onAddTask}
        style={{
          marginTop: 8,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          height: 32,
          padding: "0 14px",
          borderRadius: 7,
          border: "none",
          background: "linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)",
          color: "var(--background)",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
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
        <div
          key={i}
          style={{
            height: 36,
            marginBottom: 2,
            borderRadius: 4,
            background: "var(--card)",
          }}
        />
      ))}
    </div>
  );
}

// ─── Ícones inline (não exportados do icons.tsx) ──────────────────────────────
function IcFlagInline({ size, color }: { size: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M3 2v12M3 2h8l-2 3.5L11 9H3"
        stroke={color ?? "currentColor"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
