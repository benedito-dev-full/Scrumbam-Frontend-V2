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

// ─── Projects (= Spaces/Folders/Lists no frontend) ───────────────────────────

/**
 * Espelha o campo idClasse do DProject (ADR-V2-051 hierarquia).
 *
 * Valores canônicos (chaves negativas do seed V2):
 * - `-350` → SPACE  (raiz da hierarquia, nunca tem pai)
 * - `-351` → FOLDER (filho de SPACE, agrupador de LISTs)
 * - `-352` → LIST   (filho de FOLDER, contém DTask)
 * - `-353` → DOC    (filho de FOLDER, conteúdo livre)
 *
 * Backend serializa BigInt como string — por isso `string`.
 */
export type DProjectIdClasse = '-350' | '-351' | '-352' | '-353' | string;

/**
 * Representação canônica de um DProject V2 (ADR-V2-051).
 *
 * Usado pelos hooks `useSpaces`, `useFolders`, `useLists` para tipar
 * as respostas do endpoint `GET /projects`.
 *
 * @example
 * ```typescript
 * const space: DProjectDto = {
 *   id: '100',
 *   idClasse: '-350',
 *   idPai: null,
 *   nome: 'Produto',
 *   // ...
 * };
 * ```
 */
export interface DProjectDto {
  /** Chave do DProject, serializada como string (BigInt no banco). */
  id: string;
  /**
   * Tipo do projeto (ADR-V2-051).
   * `-350`=SPACE, `-351`=FOLDER, `-352`=LIST, `-353`=DOC.
   */
  idClasse: DProjectIdClasse;
  /**
   * ID do DProject pai ou null para SPACEs (raízes).
   * Serializado como string (BigInt).
   */
  idPai: string | null;
  nome: string;
  prefix: string | null;
  description: string | null;
  orgId: string | null;
  memberCount: number;
  repoUrl: string | null;
  teamId: string | null;
  folderId: string | null;
  /** Projeto privado (true) ou público na org (false). ADR-V2-051 §8. */
  privado: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ProjectResponseDto extends DProjectDto {}

export interface CreateProjectDto {
  nome: string;
  prefix?: string;
  description?: string;
  repoUrl?: string;
  teamId?: string;
  /** idClasse do tipo: -350=SPACE, -351=FOLDER, -352=LIST, -353=DOC */
  idClasse?: DProjectIdClasse;
  /** ID do projeto pai (SPACE ou FOLDER) */
  idPai?: string | null;
  /** Tornar projeto privado (visível apenas a membros explícitos). */
  privado?: boolean;
}

export interface UpdateProjectDto {
  nome?: string;
  description?: string;
  repoUrl?: string;
  /** ID do projeto pai | null para mover à raiz | omitir para manter. */
  idPai?: string | null;
  /** Tornar projeto privado (true) ou público (false) | omitir para manter. */
  privado?: boolean;
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

// ─── Agents ──────────────────────────────────────────────────────────────────

export type AgentStatus =
  | "pending_install"
  | "never_connected"
  | "online"
  | "offline";

export type ExecutionRisk = "LOW" | "MEDIUM" | "HIGH";

export interface AgentDto {
  id: string;
  name: string;
  hostname: string;
  status: AgentStatus;
  lastHeartbeat: string | null;
  repoUrl: string | null;
  repoApiKey: string | null;
  autonomyLevel: ExecutionRisk;
  orgId: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CreateAgentDto {
  name: string;
  hostname: string;
  repoUrl?: string;
  autonomyLevel?: ExecutionRisk;
}

export interface UpdateAgentDto {
  name?: string;
  hostname?: string;
  repoUrl?: string;
  repoApiKey?: string;
  autonomyLevel?: ExecutionRisk;
}

export interface InstallTokenDto {
  token: string;
  installCommand: string;
  expiresAt: string;
}

export interface ExecutionDto {
  id: string;
  agentId: string;
  taskId?: string | null;
  prompt: string;
  status: "queued" | "running" | "done" | "failed";
  risk: ExecutionRisk;
  output: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CreateExecutionDto {
  agentId: string;
  prompt: string;
  risk?: ExecutionRisk;
  taskId?: string;
}
