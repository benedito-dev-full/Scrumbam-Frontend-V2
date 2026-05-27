// ─── Auth ────────────────────────────────────────────────────────────────────

/**
 * Preferências pessoais do usuário (Task E1 backend — `DEntidade.dados.preferences`).
 *
 * Persistidas via `PATCH /auth/me` com merge por chave de 1º nível:
 * mandar `appearance` substitui o sub-bloco inteiro, sem tocar `locale`
 * ou `notifications`. Backend hoje só CONSOME `appearance.theme` ativamente
 * (next-themes no cliente). Os demais ficam salvos aguardando o backend
 * ligar a leitura (EmailService, NotificationsService, i18n, etc.).
 */
export interface UserAppearancePreferences {
  theme?: "light" | "dark" | "system";
  density?: "compact" | "normal" | "cozy";
}
export interface UserLocalePreferences {
  language?: string;
  timezone?: string;
  dateFormat?: string;
}
export interface UserNotificationsPreferences {
  emailOnMention?: boolean;
  emailDigest?: boolean;
  inAppEnabled?: boolean;
}
export interface UserPreferences {
  appearance?: UserAppearancePreferences;
  locale?: UserLocalePreferences;
  notifications?: UserNotificationsPreferences;
}

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
  /**
   * Preferências pessoais — backend retorna apenas em `GET /auth/me`;
   * `undefined` para usuários sem preferências salvas.
   */
  preferences?: UserPreferences;
}

/**
 * Payload aceito por `PATCH /auth/me`. Os campos `preferences.*` fazem
 * merge por chave de 1º nível no backend.
 */
export interface UpdateMeDto {
  name?: string;
  email?: string;
  defaultProjectId?: string;
  defaultTeamId?: string;
  onboardingCompleted?: boolean;
  preferences?: UserPreferences;
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
export type DProjectIdClasse = "-350" | "-351" | "-352" | "-353" | string;

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
  /** Cor hex do espaço (#RRGGBB), lida de dados.color. Null se não definida. */
  color?: string | null;
  /** Ícone do espaço (emoji ou slug), lido de dados.icon. Null se não definido. */
  icon?: string | null;
  /** ID do agente VPS vinculado a este projeto. Null se não vinculado. */
  idAgent?: string | null;
  /** URL do repositório remoto no agente vinculado. */
  remoteRepoUrl?: string | null;
  /** Branch remota no agente vinculado. */
  remoteBranch?: string | null;
  /** Caminho no servidor do agente vinculado. */
  remotePath?: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export type ProjectResponseDto = DProjectDto;

// ─── Bookmarks ────────────────────────────────────────────────────────────────

/** Tipos de item que podem ser favoritados. */
export type BookmarkTargetType = "space" | "folder" | "list" | "doc" | "team";

/**
 * Resposta do backend para um bookmark (DVincula -187).
 *
 * `id` é o `chave` da DVincula serializado como string.
 */
export interface BookmarkDto {
  id: string;
  targetId: string;
  targetType: BookmarkTargetType;
  criadoEm: string;
}

/** DTO de criação de bookmark — espelha o CreateBookmarkDto do backend. */
export interface CreateBookmarkDto {
  targetId: string;
  targetType: BookmarkTargetType;
}

/** Resposta paginada de GET /bookmarks. */
export interface ListBookmarksResponseDto {
  items: BookmarkDto[];
  nextCursor: string | null;
  hasMore: boolean;
}

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
  /** Cor hex do espaço (#RRGGBB). */
  color?: string | null;
  /** Ícone do espaço (emoji ou slug). */
  icon?: string | null;
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

export type TaskType = "FEATURE" | "BUG" | "IMPROVEMENT" | "REVIEW" | "EXPLAIN";

/**
 * Estado de execução IA ativa (DPedido idClasse=-300..-304 com `baixado=false`).
 *
 * Quando uma task tem `activeExecution !== null`, o usuário clicou em
 * "Executar" e o trabalho está rodando no agente VPS — a janela é
 * irreversível (consome tokens da assinatura Claude Max). Por isso a UI
 * deve tratar a task como **read-only** enquanto este campo estiver
 * populado: sem drag-and-drop, sem edição inline, sem mover de coluna.
 *
 * O backend só inclui o objeto quando há uma execução **viva** (baixado=false).
 * Quando o agente conclui (sucesso/falha/expira/rejeita), o campo volta a
 * `null` no próximo refresh — o frontend deve invalidar `['tasks']` ao
 * detectar status terminal no polling para destravar a UI sem reload.
 */
export interface ActiveExecutionDto {
  /** ID do DPedido (BigInt como string) — usado como chave do polling. */
  id: string;
  /**
   * Estado simplificado derivado dos campos `aprovado`/`baixado` do DPedido.
   * - `awaiting_approval`: aprovado=false (gate de risco MEDIUM/HIGH pendente)
   * - `running`: aprovado=true, baixado=false (executando no agente VPS)
   * - `queued`: reservado para variantes futuras
   */
  status: "queued" | "running" | "awaiting_approval";
  /** Risco derivado de idClasse: -301=LOW, -302=MEDIUM, -303=HIGH. */
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  /** Data ISO 8601 de criação do DPedido. */
  startedAt: string;
}

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
  /** Título da task (campo retornado pelo backend como `nome`). */
  nome: string;
  description?: string;
  /** V3 Intention atual (estado do workflow). */
  status: V3Intention;
  statusId: string;
  priority?: TaskPriority;
  priorityId?: string;
  /** ID do DProject (List, idClasse=-352) ao qual a task pertence. */
  projectId: string;
  assigneeId?: string;
  /** ID do time responsável pela task, ou null quando sem time atribuído. */
  assigneeTeamId?: string | null;
  /** ID da task pai (fase, idClasse=-200), ou undefined se task raiz. */
  idPai?: string;
  /**
   * Data de vencimento em ISO 8601, null quando explicitamente removida,
   * ou undefined quando o campo não foi definido.
   */
  dueDate?: string | null;
  /** idClasse canônico: '-154' = TASK, '-200' = PHASE. */
  idClasse: string;
  /**
   * Execução IA ativa associada à task. `null` quando não há execução
   * em andamento. Quando presente, a UI deve travar a task (read-only).
   */
  activeExecution?: ActiveExecutionDto | null;
  /**
   * Dados livres armazenados em DTask.dados (JSON).
   * Usado por Blocks para `startDate`, `endDate` e `cor`.
   */
  dados?: Record<string, unknown> | null;
  criadoEm: string;
  atualizadoEm: string;
}

/**
 * Bloco de planejamento visual (DTask idClasse=-200) com campos de período e cor.
 *
 * Estende `TaskResponseDto` tipando o campo `dados` de forma estrita para
 * garantir que os componentes de Blocks consumam apenas os campos esperados.
 *
 * @see ADR-V2-050 (idClasse em TaskResponseDto)
 */
export interface BlockDto extends TaskResponseDto {
  dados: {
    /** Data de início do bloco (ISO 8601, ex: '2026-06-01'). */
    startDate?: string;
    /** Data de fim do bloco (ISO 8601, ex: '2026-06-30'). */
    endDate?: string;
    /** Cor hex do bloco (ex: '#3B82F6'). */
    cor?: string;
  } | null;
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
  assigneeTeamId?: string | null;
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
  prefix?: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  memberCount?: number;
  myCargo?: "LEAD" | "MEMBER" | null;
  canEdit?: boolean;
  canDelete?: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface TeamMemberDto {
  userId: string;
  nome: string;
  email?: string | null;
  cargo: "LEAD" | "MEMBER";
}

export type TeamFeedAction =
  | "TASK_CREATED"
  | "TASK_ASSIGNED"
  | "TASK_STATUS_CHANGED"
  | "TASK_COMPLETED";

export interface TeamFeedItemDto {
  id: string;
  acao: TeamFeedAction | string;
  descricao: string;
  taskId: string | null;
  taskNome: string | null;
  userId: string | null;
  userName: string | null;
  statusAnterior: string | null;
  statusNovo: string | null;
  criadoEm: string;
}

export interface TeamFeedResponseDto {
  items: TeamFeedItemDto[];
  nextCursor: string | null;
  hasMore: boolean;
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
  userId: string;
  nome: string;
  email?: string | null;
  role: "ADMIN" | "MEMBER" | "VIEWER";
  idClasse?: string;
}

// ─── Invites ─────────────────────────────────────────────────────────────────

export interface InviteResponseDto {
  id: string;
  email: string;
  role: "MEMBER" | "VIEWER";
  expiresAt: string;
  createdAt: string;
}

export interface CreateInviteDto {
  email: string;
  role: "MEMBER" | "VIEWER";
}

// ─── Notifications ───────────────────────────────────────────────────────────

/**
 * Notificação in-app (DEvento idClasse=-490) serializada pelo backend V2.
 *
 * BigInts são strings para preservar precisão (ADR-V2-025).
 *
 * @see `GET /notifications` — backend `NotificationResponseDto`.
 */
export interface NotificationDto {
  /** DEvento.chave (BigInt como string). */
  id: string;
  /** Classe canônica em DEvento (atualmente "-490"). */
  idClasse: string;
  /** Destinatário (DEntidade.chave) — null em casos raros legados. */
  recipientId: string | null;
  /** Tipo do evento original (ex: "task.status.changed", "task.mention"). */
  eventType: string | null;
  /** Título curto exibido na UI. */
  title: string;
  /** Mensagem principal. */
  message: string;
  /** Lida derivada de DEvento.metaDados.read. */
  read: boolean;
  /** Task relacionada, se disponível. */
  taskId?: string | null;
  /** Projeto relacionado, se disponível. */
  projectId?: string | null;
  /** Execução relacionada, se disponível. */
  executionId?: string | null;
  /** ISO 8601 da criação do evento. */
  createdAt: string;
  /** metaDados originais do DEvento (payload livre). */
  metadata: Record<string, unknown>;
}

export interface NotificationsPaginationDto {
  hasMore: boolean;
  nextCursor: string | null;
}

export interface ListNotificationsResponseDto {
  items: NotificationDto[];
  pagination: NotificationsPaginationDto;
}

export interface UnreadCountResponseDto {
  count: number;
}

export interface MarkAllReadResponseDto {
  updated: number;
}

/**
 * @deprecated Use `NotificationDto` (espelha o backend V2). Mantido apenas
 * para evitar quebra durante o roll-out — remover quando todas as
 * referências forem migradas.
 */
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
  nome: string;
  hostname: string | null;
  status: AgentStatus;
  lastHeartbeat: string | null;
  agentVersion: string | null;
  tunnelPort: number | null;
  installedAt: string | null;
  createdAt: string;
  installTokenId: string | null;
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

export interface DeployKeyResponseDto {
  publicKey: string;
  fingerprint: string;
  sshConfigSnippet: string;
  instructions: string[];
  generatedAt: string;
  alreadyExisted: boolean;
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
