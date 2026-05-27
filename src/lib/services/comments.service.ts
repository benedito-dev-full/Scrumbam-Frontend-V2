import { api } from "@/lib/api";
import type {
  Comment,
  CommentTargetType,
  CreateCommentDto,
  ListCommentsQuery,
  ListCommentsResponse,
} from "@/lib/types/comment";

/**
 * Serviço HTTP de comentários polimórficos (backend V2).
 *
 * Wrappers finos sobre o axios singleton (`@/lib/api`), que já injeta o
 * Bearer token e cuida de refresh em 401. Tratamento de erro é
 * responsabilidade das camadas superiores (hooks React Query) —
 * deixamos a exceção propagar naturalmente via `await`.
 *
 * @see `@/lib/types/comment` para os contratos HTTP.
 */

/**
 * Cria um novo comentário no alvo informado.
 *
 * @param targetType Tipo do alvo (`task`, `project`, `folder`, `list`).
 * @param targetId   ID do alvo (string — BigInt serializado).
 * @param dto        Texto do comentário (1–10000 caracteres).
 * @returns Comentário recém-criado.
 * @throws {AxiosError} 400 se texto inválido ou targetType inválido,
 *                     403 se sem acesso, 404 se o alvo não existe ou é cross-tenant.
 */
export async function createComment(
  targetType: CommentTargetType,
  targetId: string,
  dto: CreateCommentDto,
): Promise<Comment> {
  const res = await api.post<Comment>(
    `/comments/${targetType}/${targetId}`,
    dto,
  );
  return res.data;
}

/**
 * Lista comentários de um alvo com paginação por cursor (DESC).
 *
 * @param targetType Tipo do alvo (`task`, `project`, `folder`, `list`).
 * @param targetId   ID do alvo (string — BigInt serializado).
 * @param query      Cursor e limite opcionais (default backend: limit=20).
 * @returns Página de comentários e cursor para a próxima página.
 * @throws {AxiosError} 400 se targetType inválido, 403 se sem acesso,
 *                     404 se o alvo não existe ou é cross-tenant.
 */
export async function listComments(
  targetType: CommentTargetType,
  targetId: string,
  query?: ListCommentsQuery,
): Promise<ListCommentsResponse> {
  const res = await api.get<ListCommentsResponse>(
    `/comments/${targetType}/${targetId}`,
    { params: query },
  );
  return res.data;
}
