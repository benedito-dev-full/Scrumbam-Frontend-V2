/**
 * Tipos relativos ao módulo de comentários polimórficos do backend V2.
 *
 * O backend persiste comentários como DEvento (storage polimórfico),
 * mas o contrato HTTP é genérico: qualquer alvo (`task`, `project`,
 * `folder`, `list`) compartilha o mesmo shape de response.
 *
 * Endpoints:
 * - `POST /comments/:targetType/:targetId` → cria comentário
 * - `GET  /comments/:targetType/:targetId?cursor=&limit=` → lista paginada
 *
 * @see Backend `CommentsModule` (Fase 2 da sprint A — comentários polimórficos).
 */

/**
 * Tipos de alvo aos quais um comentário pode ser anexado.
 *
 * Espelha o enum `CommentTargetType` do backend (validado por DTO).
 * O valor `'doc'` foi adiado para uma sprint futura — não usar.
 */
export const CommentTargetType = {
  TASK: "task",
  PROJECT: "project",
  FOLDER: "folder",
  LIST: "list",
} as const;

export type CommentTargetType =
  (typeof CommentTargetType)[keyof typeof CommentTargetType];

/**
 * Comentário retornado pelo backend (mesmo shape em POST e GET).
 *
 * BigInts são serializados como string para preservar precisão (ADR-V2-025).
 */
export interface Comment {
  /** Chave do DEvento serializada como string. */
  id: string;
  /** Texto do comentário (1–10000 caracteres, validado no backend). */
  texto: string;
  /** Tipo do alvo ao qual o comentário pertence. */
  targetType: CommentTargetType;
  /** ID do alvo (DTask, DProject, etc.) — string por causa do BigInt. */
  targetId: string;
  /** ID do autor (DEntidade do usuário) — string por causa do BigInt. */
  autorId: string;
  /** Nome do autor (resolvido pelo backend). */
  autorNome: string;
  /** ISO 8601 da criação do comentário. */
  createdAt: string;
}

/**
 * Payload aceito por `POST /comments/:targetType/:targetId`.
 *
 * Backend valida `texto.length` entre 1 e 10000.
 */
export interface CreateCommentDto {
  texto: string;
}

/**
 * Query string aceita por `GET /comments/:targetType/:targetId`.
 *
 * Paginação por cursor (DESC, mais recente primeiro).
 */
export interface ListCommentsQuery {
  /** Cursor opaco retornado em `nextCursor` da página anterior. */
  cursor?: string;
  /** Tamanho da página (1–100, default 20). */
  limit?: number;
}

/**
 * Resposta paginada de `GET /comments/:targetType/:targetId`.
 *
 * Ordem: DESC (mais recente primeiro). `nextCursor === null` indica fim.
 */
export interface ListCommentsResponse {
  items: Comment[];
  nextCursor: string | null;
}
