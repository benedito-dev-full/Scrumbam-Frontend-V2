// ─── Auth ────────────────────────────────────────────────────────────────────

export interface UserDto {
  id: string;
  email: string;
  name: string;
  entidadeId: string;
  organizationId?: string;
  organizationName?: string;
  orgRole?: "ADMIN" | "MEMBER" | "VIEWER";
  availableOrgs?: Array<{
    id: string;
    nome: string;
    role: "ADMIN" | "MEMBER" | "VIEWER";
  }>;
  isOrphan: boolean;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
  user: UserDto;
}

// ─── Projects (= Spaces no frontend) ─────────────────────────────────────────

export interface ProjectResponseDto {
  id: string;
  nome: string;
  prefix: string | null;
  description: string | null;
  orgId: string | null;
  memberCount: number;
  repoUrl: string | null;
  teamId: string | null;
  folderId: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CreateProjectDto {
  nome: string;
  prefix?: string;
  description?: string;
  repoUrl?: string;
  teamId?: string;
}

export interface UpdateProjectDto {
  nome?: string;
  description?: string;
  repoUrl?: string;
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export type TaskStatus =
  | "INBOX"
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "VALIDATED"
  | "DONE"
  | "CANCELLED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TaskType =
  | "FEATURE"
  | "BUG"
  | "IMPROVEMENT"
  | "REVIEW"
  | "EXPLAIN";

export interface TaskResponseDto {
  id: string;
  nome: string;
  descricao: string | null;
  projectId: string;
  identifier: string;
  status: TaskStatus;
  priority: TaskPriority | null;
  taskType: TaskType | null;
  assigneeId: string | null;
  sprintId: string | null;
  dados: Record<string, unknown> | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CreateTaskDto {
  nome: string;
  projectId: string;
  descricao?: string;
  priority?: TaskPriority;
  assigneeId?: string;
  sprintId?: string;
  taskType?: TaskType;
}

export interface UpdateTaskDto {
  nome?: string;
  descricao?: string;
  priority?: TaskPriority;
  assigneeId?: string;
}

export interface TaskFilters {
  projectId?: string;
  status?: TaskStatus;
  assigneeId?: string;
  sprintId?: string;
}

// ─── Sprints ─────────────────────────────────────────────────────────────────

export interface SprintResponseDto {
  id: string;
  nome: string;
  projectId?: string;
  startDate: string | null;
  endDate: string | null;
  status?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CreateSprintDto {
  nome: string;
  projectId: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateSprintDto {
  nome?: string;
  startDate?: string;
  endDate?: string;
}

// ─── Teams ───────────────────────────────────────────────────────────────────

export interface TeamResponseDto {
  id: string;
  nome: string;
  orgId?: string;
  memberCount?: number;
  criadoEm: string;
  atualizadoEm: string;
}

export interface TeamMemberDto {
  id: string;
  name: string;
  email: string;
  role?: string;
}

// ─── Organizations ───────────────────────────────────────────────────────────

export interface OrganizationResponseDto {
  id: string;
  nome: string;
  description?: string | null;
  memberCount: number;
  criadoEm: string;
  atualizadoEm: string;
}

export interface OrgMemberDto {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER" | "VIEWER";
}

// ─── Invites ─────────────────────────────────────────────────────────────────

export interface InviteResponseDto {
  id: string;
  email: string;
  role: "MEMBER" | "VIEWER";
  status: "PENDING" | "ACCEPTED" | "CANCELLED";
  expiresAt: string;
  criadoEm: string;
}

export interface CreateInviteDto {
  email: string;
  role: "MEMBER" | "VIEWER";
}

// ─── Notifications ───────────────────────────────────────────────────────────

export interface NotificationResponseDto {
  id: string;
  title?: string;
  message: string;
  read: boolean;
  type?: string;
  criadoEm: string;
}

// ─── Workflow Statuses ────────────────────────────────────────────────────────

export interface WorkflowStatusResponseDto {
  id: string;
  nome: string;
  projectId: string;
  color?: string;
  order?: number;
}

// ─── Error ───────────────────────────────────────────────────────────────────

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}
