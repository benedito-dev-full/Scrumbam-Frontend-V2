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

export type ProjectResponseDto = DProjectDto;

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

/**
 * V3 Intentions — estados canônicos do workflow Scrumban (backend).
 *
 * Mapeadas para colunas Kanban via `intentionToColumn()` em
 * `src/lib/mappers/task-status.mapper.ts`.
 *
 * @see ADR-V2-047 (V3 Intentions)
 */
export type V3Intention =
  | "INBOX"
  | "READY"
  | "EXECUTING"
  | "DONE"
  | "FAILED"
  | "CANCELLED"
  | "DISCARDED"
  | "VALIDATING"
  | "VALIDATED";

/**
 * @deprecated Usar `V3Intention` — este tipo reflete estados legados incompatíveis com V3.
 */
export type TaskStatus = V3Intention;

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TaskType =
  | "FEATURE"
  | "BUG"
  | "IMPROVEMENT"
  | "REVIEW"
  | "EXPLAIN";

/**
 * Representação canônica de uma DTask V2.
 *
 * Campo `status` contém a V3 Intention (ex: 'INBOX', 'EXECUTING').
 * Campo `idClasse` distingue TASK (-154) de PHASE (-200).
 *
 * @see ADR-V2-047 (V3 Intentions)
 * @see ADR-V2-050 (idClasse em TaskResponseDto)
 */
export interface TaskResponseDto {
  id: string;
  /** Identificador legível (ex: 'DEV-1'). */
  identifier: string;
  /** Título da task. */
  title: string;
  description?: string;
  /** V3 Intention atual (estado do workflow). */
  status: V3Intention;
  statusId: string;
  priority?: TaskPriority;
  priorityId?: string;
  /** ID do DProject (List, idClasse=-352) ao qual a task pertence. */
  projectId: string;
  assigneeId?: string;
  /** ID da task pai (fase, idClasse=-200), ou undefined se task raiz. */
  idPai?: string;
  /**
   * Data de vencimento em ISO 8601, null quando explicitamente removida,
   * ou undefined quando o campo não foi definido.
   */
  dueDate?: string | null;
  /** idClasse canônico: '-154' = TASK, '-200' = PHASE. */
  idClasse: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CreateTaskDto {
  titulo: string;
  idProject: string;
  priority?: TaskPriority;
  dueDate?: string;
  assigneeId?: string;
  descricao?: string;
}

export interface UpdateTaskDto {
  titulo?: string;
  descricao?: string;
  priority?: TaskPriority;
  dueDate?: string | null;
  assigneeId?: string | null;
}

export interface TaskFilters {
  projectId?: string;
  status?: V3Intention;
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
