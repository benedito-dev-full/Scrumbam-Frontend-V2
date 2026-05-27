"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
  type UseInfiniteQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query";
import { toast } from "sonner";

// ─── Internos ─────────────────────────────────────────────────────────────────
import { getApiErrorMessage } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { createComment, listComments } from "@/lib/services/comments.service";
import { useAuthStore } from "@/lib/stores/auth";

// ─── Types ────────────────────────────────────────────────────────────────────
import type {
  Comment,
  CommentTargetType,
  CreateCommentDto,
  ListCommentsResponse,
} from "@/lib/types/comment";

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Tamanho default da página (alinhado ao backend, que também usa 20). */
export const DEFAULT_PAGE_SIZE = 20;

// ─── Tipos auxiliares expostos ────────────────────────────────────────────────

/**
 * Retorno de {@link useComments} — estende o `UseInfiniteQueryResult` do
 * TanStack Query com dois helpers derivados que cobrem o uso típico em UI:
 *
 * - `comments`: flatmap das páginas em uma única lista (ordem DESC vinda do backend).
 * - `hasMore`:  alias amigável para `hasNextPage`.
 */
export type UseCommentsResult = UseInfiniteQueryResult<
  InfiniteData<ListCommentsResponse, string | undefined>,
  Error
> & {
  /** Lista achatada de comentários já carregados (todas as páginas). */
  comments: Comment[];
  /** `true` se ainda existem páginas adicionais — alias de `hasNextPage`. */
  hasMore: boolean;
};

/**
 * Context devolvido por `onMutate` em {@link useCreateComment}.
 *
 * Mantém o snapshot da query antes da mutação otimista para que o `onError`
 * consiga restaurar o estado em caso de falha do backend.
 */
interface CreateCommentMutationContext {
  previousData:
    | InfiniteData<ListCommentsResponse, string | undefined>
    | undefined;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Lista paginada (por cursor, DESC) de comentários polimórficos para um alvo.
 *
 * Wrapper sobre `useInfiniteQuery` que delega o IO para
 * `@/lib/services/comments.service`. Cursor inicial é `undefined` (primeira
 * página); a próxima página vem de `lastPage.nextCursor` — quando `null`,
 * o TanStack interpreta como fim do feed.
 *
 * @param targetType - Tipo do alvo (`task`, `project`, `folder`, `list`).
 * @param targetId   - ID do alvo (string — BigInt serializado). Quando vazio,
 *                     o hook fica `enabled: false` e não dispara request.
 * @param pageSize   - Tamanho da página (default 20, alinhado ao backend).
 * @returns Resultado do `useInfiniteQuery` enriquecido com `comments` e
 *          `hasMore` para consumo direto em listas/scroll infinito.
 *
 * @example
 * ```tsx
 * const { comments, hasMore, fetchNextPage, isFetchingNextPage } =
 *   useComments('task', taskId);
 * ```
 */
export function useComments(
  targetType: CommentTargetType,
  targetId: string,
  pageSize: number = DEFAULT_PAGE_SIZE,
): UseCommentsResult {
  const accessToken = useAuthStore((s) => s.accessToken);

  const query = useInfiniteQuery<
    ListCommentsResponse,
    Error,
    InfiniteData<ListCommentsResponse, string | undefined>,
    ReturnType<typeof qk.comments.byTarget>,
    string | undefined
  >({
    queryKey: qk.comments.byTarget(targetType, targetId),
    queryFn: ({ pageParam }) =>
      listComments(targetType, targetId, {
        cursor: pageParam,
        limit: pageSize,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!accessToken && !!targetId,
    staleTime: 15_000,
  });

  // Flat list derivada — mantém ordem DESC do backend (página 0 = mais recentes).
  const comments: Comment[] =
    query.data?.pages.flatMap((page) => page.items) ?? [];

  return {
    ...query,
    comments,
    hasMore: query.hasNextPage,
  };
}

/**
 * Cria um comentário no alvo informado, com optimistic update na primeira página.
 *
 * Pipeline:
 * 1. `onMutate`: cancela queries em voo, tira snapshot do cache atual e injeta
 *    um `Comment` temporário (id `temp-…`) no TOPO da primeira página.
 * 2. `onError`: faz rollback usando o snapshot e exibe toast com a mensagem
 *    derivada do erro Axios.
 * 3. `onSettled`: invalida a query do alvo para que a próxima leitura traga
 *    o registro real (com o id definitivo gerado pelo backend).
 *
 * Não trata sucesso silenciosamente — feedback visual fica a cargo do consumer
 * (ex.: limpar input após `mutateAsync` resolver).
 *
 * @param targetType - Tipo do alvo.
 * @param targetId   - ID do alvo.
 * @returns Resultado do `useMutation`, tipado com o context de rollback.
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useCreateComment('task', taskId);
 * mutate({ texto: 'Comentário rápido' });
 * ```
 */
export function useCreateComment(
  targetType: CommentTargetType,
  targetId: string,
): UseMutationResult<
  Comment,
  Error,
  CreateCommentDto,
  CreateCommentMutationContext
> {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const queryKey = qk.comments.byTarget(targetType, targetId);

  return useMutation<
    Comment,
    Error,
    CreateCommentDto,
    CreateCommentMutationContext
  >({
    mutationFn: (dto) => createComment(targetType, targetId, dto),

    onMutate: async (dto) => {
      // 1. Evita race com refetches em andamento — o snapshot abaixo poderia ficar stale.
      await queryClient.cancelQueries({ queryKey });

      // 2. Snapshot do estado atual para rollback em caso de erro.
      const previousData =
        queryClient.getQueryData<
          InfiniteData<ListCommentsResponse, string | undefined>
        >(queryKey);

      // 3. Constrói comentário otimista — id temporário é substituído pelo real no invalidate.
      const optimistic: Comment = {
        id: `temp-${Date.now()}`,
        texto: dto.texto,
        targetType,
        targetId,
        autorId: user?.entidadeId ?? "me",
        autorNome: user?.name ?? "Você",
        createdAt: new Date().toISOString(),
      };

      // 4. Injeta no topo da primeira página (ordem DESC = mais recentes primeiro).
      queryClient.setQueryData<
        InfiniteData<ListCommentsResponse, string | undefined>
      >(queryKey, (current) => {
        if (!current || current.pages.length === 0) {
          return {
            pages: [{ items: [optimistic], nextCursor: null }],
            pageParams: [undefined],
          };
        }
        const [firstPage, ...rest] = current.pages;
        return {
          ...current,
          pages: [
            { ...firstPage, items: [optimistic, ...firstPage.items] },
            ...rest,
          ],
        };
      });

      return { previousData };
    },

    onError: (error, _dto, context) => {
      // Rollback — restaura snapshot antes da mutação.
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      } else {
        // Sem snapshot, removemos qualquer estado intermediário do cache.
        queryClient.removeQueries({ queryKey });
      }
      toast.error(getApiErrorMessage(error));
    },

    onSettled: () => {
      // Sucesso ou erro: revalida para obter id definitivo / corrigir cache.
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
