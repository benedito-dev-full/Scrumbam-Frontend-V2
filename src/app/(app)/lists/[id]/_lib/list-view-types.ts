import type { TaskResponseDto, V3Intention } from "@/lib/types/api";
import type { DProjectDto } from "@/lib/types/api";
import { isOverdue } from "@/lib/mappers/task-status.mapper";

// ─── IDs das views disponíveis na página de Lista ───────────────────────────
export type ListViewId = "list" | "board" | "blocks" | "calendar" | "gantt";

// ─── Status visual (espelha StatusTarefa da main) ────────────────────────────
export type StatusVisual =
  | "backlog"
  | "pronto"
  | "em-progresso"
  | "concluido"
  | "falhou"
  | "atrasado";

// ─── Status visual key — subset sem "atrasado" para dropdowns de edição ──────
export type StatusVisualKey =
  | "backlog"
  | "pronto"
  | "em-progresso"
  | "concluido"
  | "falhou"
  | "atrasado";

// ─── Modo de exibição de subtarefas ─────────────────────────────────────────
export type SubtarefasMode = "recolhidas" | "expandidas" | "separar";

// ─── Crumb do breadcrumb de hierarquia ──────────────────────────────────────
export type HierarchyCrumb = {
  id: string;
  label: string;
  type: "space" | "folder" | "list";
  href?: string;
  project?: DProjectDto;
};

// ─── Mapeamentos status backend → visual ─────────────────────────────────────
export const INTENTION_TO_STATUS: Record<string, StatusVisual> = {
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
export const INTENTION_TO_STATUS_REVERSE: Record<StatusVisual, string> = {
  backlog: "INBOX",
  pronto: "READY",
  "em-progresso": "EXECUTING",
  concluido: "DONE",
  falhou: "FAILED",
  atrasado: "INBOX",
};

// ─── Helper: agrupa tasks por status visual ──────────────────────────────────
export function agruparTasks(
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
