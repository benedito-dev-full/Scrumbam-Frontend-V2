'use client';

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ─── Internos ─────────────────────────────────────────────────────────────────
import { api } from '@/lib/api';
import { qk } from '@/lib/query-keys';
import { useAuthStore } from '@/lib/stores/auth';

// ─── Types ────────────────────────────────────────────────────────────────────
import type {
  BookmarkDto,
  BookmarkTargetType,
  CreateBookmarkDto,
  ListBookmarksResponseDto,
} from '@/lib/types/api';

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Lista todos os bookmarks do usuário autenticado.
 *
 * Mapeia para `GET /bookmarks`. staleTime de 30s — bookmarks mudam
 * raramente mas precisam refletir adições/remoções feitas em outra aba.
 *
 * @returns Resultado do useQuery com `data: BookmarkDto[] | undefined`
 *
 * @example
 * const { data: bookmarks, isLoading } = useBookmarks();
 */
export function useBookmarks() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<BookmarkDto[]>({
    queryKey: qk.bookmarks.all,
    queryFn: async () => {
      const res = await api.get<ListBookmarksResponseDto>('/bookmarks');
      return res.data.items;
    },
    enabled: !!accessToken,
    staleTime: 30_000,
  });
}

/**
 * Verifica se um item específico já está nos favoritos do usuário.
 *
 * Derivado do cache de `useBookmarks` — sem query extra ao backend.
 *
 * @param targetId - ID do item alvo
 * @param targetType - Tipo do item alvo
 * @returns `{ isBookmarked: boolean, bookmark: BookmarkDto | undefined }`
 *
 * @example
 * const { isBookmarked } = useIsBookmarked(space.id, 'space');
 */
export function useIsBookmarked(targetId: string, targetType: BookmarkTargetType) {
  const accessToken = useAuthStore((s) => s.accessToken);

  const { data: bookmarks } = useQuery<BookmarkDto[]>({
    queryKey: qk.bookmarks.all,
    queryFn: async () => {
      const res = await api.get<ListBookmarksResponseDto>('/bookmarks');
      return res.data.items;
    },
    enabled: !!accessToken,
    staleTime: 30_000,
  });

  const bookmark = bookmarks?.find(
    (b) => b.targetId === targetId && b.targetType === targetType,
  );

  return { isBookmarked: !!bookmark, bookmark };
}

/**
 * Cria um novo bookmark para o item especificado.
 *
 * Mapeia para `POST /bookmarks`. Invalida `qk.bookmarks.all` ao sucesso.
 *
 * @returns Resultado do useMutation com `mutate(CreateBookmarkDto)`
 *
 * @example
 * const { mutate: bookmark } = useCreateBookmark();
 * bookmark({ targetId: space.id, targetType: 'space' });
 */
export function useCreateBookmark() {
  const queryClient = useQueryClient();

  return useMutation<BookmarkDto, Error, CreateBookmarkDto>({
    mutationFn: async (dto) => {
      const res = await api.post<BookmarkDto>('/bookmarks', dto);
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.bookmarks.all });
    },
  });
}

/**
 * Remove um bookmark pelo seu ID (soft-delete no backend).
 *
 * Mapeia para `DELETE /bookmarks/:id`. Invalida `qk.bookmarks.all` ao sucesso.
 *
 * @returns Resultado do useMutation com `mutate(bookmarkId: string)`
 *
 * @example
 * const { mutate: removeBookmark } = useRemoveBookmark();
 * removeBookmark(bookmark.id);
 */
export function useRemoveBookmark() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/bookmarks/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.bookmarks.all });
    },
  });
}

/**
 * Toggle de bookmark — favorita se não estiver, desfavorita se estiver.
 *
 * Utilitário que combina `useCreateBookmark` e `useRemoveBookmark` em um
 * único hook para uso em botões de toggle (estrela cheia/vazia).
 *
 * @returns `{ toggle, isPending }`
 *
 * @example
 * const { toggle, isPending } = useToggleBookmark();
 * toggle({ targetId: space.id, targetType: 'space', bookmarkId: bookmark?.id });
 */
export function useToggleBookmark() {
  const { mutate: create, isPending: isCreating } = useCreateBookmark();
  const { mutate: remove, isPending: isRemoving } = useRemoveBookmark();

  function toggle({
    targetId,
    targetType,
    bookmarkId,
  }: {
    targetId: string;
    targetType: BookmarkTargetType;
    bookmarkId?: string;
  }) {
    if (bookmarkId) {
      remove(bookmarkId);
    } else {
      create({ targetId, targetType });
    }
  }

  return { toggle, isPending: isCreating || isRemoving };
}
