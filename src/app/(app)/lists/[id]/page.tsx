"use client";

import React, { use, useState } from "react";
import {
  BarChart3,
  Calendar as LucideCalendar,
  Columns3,
  Layers,
  List as LucideList,
} from "lucide-react";
import { ViewSwitcher } from "@/components/shell/view-switcher";
import { TaskSheet } from "@/components/tasks/task-sheet";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { CalendarView } from "@/components/lists/calendar-view";
import { GanttView } from "@/components/lists/gantt-view";
import {
  applyTaskFilters,
  emptyTaskFilters,
  type TaskFilters,
} from "@/lib/filters/task-filters";
import { useProject } from "@/hooks/use-projects";
import { useTasksByProject } from "@/hooks/use-tasks";
import { useListRoom } from "@/hooks/use-list-room";
import { useSocketEvents } from "@/hooks/use-socket-events";
import { useProjectMembers, type ProjectMemberDto } from "@/hooks/use-members";
import { useOrgMembers } from "@/hooks/use-org-members";
import { useTeams } from "@/hooks/use-teams";
import type { TaskResponseDto } from "@/lib/types/api";

// Tipos e helpers locais
import {
  agruparTasks,
  type ListViewId,
  type StatusVisual,
  type SubtarefasMode,
} from "./_lib/list-view-types";

// Componentes extraídos
import { PageHeader } from "./_components/list-header";
import { Toolbar } from "./_components/list-toolbar";
import {
  ListContent,
  BoardContent,
  GroupsViewContent,
} from "./_components/list-content";

// ─── Views disponíveis na página de Lista ────────────────────────────────────
const LIST_VIEWS = [
  { id: "blocks", label: "Blocos", icon: Layers },
  { id: "list", label: "Lista", icon: LucideList },
  { id: "board", label: "Quadro", icon: Columns3 },
  { id: "calendar", label: "Calendário", icon: LucideCalendar },
  { id: "gantt", label: "Gantt", icon: BarChart3 },
];

// ─── Página ───────────────────────────────────────────────────────────────────
export default function ListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // Tempo real (ADR-V2-063): entra na sala da lista e recarrega os dados
  // quando outro usuário muda task/bloco. No-op em modo mock. Design intocado.
  useListRoom(id);
  useSocketEvents(id);

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
  const { data: teams = [] } = useTeams();

  const [view, setView] = useState<ListViewId>("blocks");
  const [subtarefasMode, setSubtarefasMode] =
    useState<SubtarefasMode>("recolhidas");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDefaultStatus, setModalDefaultStatus] = useState<
    StatusVisual | undefined
  >(undefined);
  const [selectedTask, setSelectedTask] = useState<TaskResponseDto | null>(
    null,
  );
  // Filtros compartilhados entre TODAS as views (client-side, em memória).
  const [filters, setFilters] = useState<TaskFilters>(emptyTaskFilters);

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

  // Blocos (idClasse=-200) têm aba dedicada "Blocos" — não devem aparecer
  // na Lista por Status nem no Quadro. Só os agrupam-se no view="blocks"
  // via BlocksContent (que usa hook próprio).
  const tasksWithoutBlocks = tasks.filter((t) => t.idClasse !== "-200");
  // Resultado dos filtros (client-side) — fonte ÚNICA para todas as views.
  const filteredTasks = applyTaskFilters(tasksWithoutBlocks, filters);
  const grupos = agruparTasks(filteredTasks);

  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      style={{ background: "var(--background)" }}
    >
      <PageHeader projeto={projeto} />
      <ViewSwitcher
        views={LIST_VIEWS}
        defaultValue="blocks"
        value={view}
        onChange={(v) => setView(v as ListViewId)}
      />
      {view !== "calendar" && view !== "gantt" && (
        <Toolbar
          tarefasCount={loadingTasks ? null : filteredTasks.length}
          totalCount={loadingTasks ? null : tasksWithoutBlocks.length}
          onAddTask={() => openModal()}
          subtarefasMode={subtarefasMode}
          onSubtarefasMode={setSubtarefasMode}
          filters={filters}
          onFiltersChange={setFilters}
          members={members}
          teams={teams}
        />
      )}
      {view === "list" ? (
        <ListContent
          grupos={grupos}
          isLoading={loadingTasks}
          subtarefasMode={subtarefasMode}
          onAddTask={openModal}
          onOpenTask={setSelectedTask}
          members={members}
          projectId={id}
          allTasks={filteredTasks}
        />
      ) : view === "board" ? (
        <BoardContent
          listId={id}
          tasks={filteredTasks}
          onOpenTask={setSelectedTask}
        />
      ) : view === "calendar" ? (
        <CalendarView tasks={filteredTasks} onOpenTask={setSelectedTask} />
      ) : view === "gantt" ? (
        <GanttView tasks={filteredTasks} onOpenTask={setSelectedTask} />
      ) : (
        // Aba "Blocos" — novo conceito de Blocos: visualizacao de Grupos
        // (estilo Monday) integrada ao backend. Cada Bloco vira um grupo;
        // tasks sem bloco caem em "Sem bloco". Read-only nesta v1.
        // onOpenTask: resolve o taskId (mesma fonte useTasksByProject) e abre a
        // TaskSheet compartilhada — paridade com Lista/Quadro/Calendário/Gantt.
        // filters: aplicados também aqui (Blocos respeita a toolbar).
        <GroupsViewContent
          projectId={id}
          filters={filters}
          subtarefasMode={subtarefasMode}
          onOpenTask={(taskId) => {
            const found = tasks.find((t) => t.id === taskId);
            if (found) setSelectedTask(found);
          }}
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
