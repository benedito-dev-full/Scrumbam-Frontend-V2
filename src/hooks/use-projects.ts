'use client';

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ─── Internos ─────────────────────────────────────────────────────────────────
import { api } from '@/lib/api';
import { qk } from '@/lib/query-keys';
import { useAuthStore } from '@/lib/stores/auth';

// ─── Types ────────────────────────────────────────────────────────────────────
import type { CreateProjectDto, DProjectDto, UpdateProjectDto } from '@/lib/types/api';

// ─── Constantes ───────────────────────────────────────────────────────────────

/** idClasse canônico do SPACE (ADR-V2-051 §3.2). */
const ID_CLASSE_SPACE = '-350' as const;

/** idClasse canônico do FOLDER (ADR-V2-051 §3.2). */
const ID_CLASSE_FOLDER = '-351' as const;

/** idClasse canônico do LIST (ADR-V2-051 §3.2). */
const ID_CLASSE_LIST = '-352' as const;

// ─── Tipos de resposta paginada ───────────────────────────────────────────────

interface ProjectPageDto {
  items: DProjectDto[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
  };
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Lista os SPACEs (idClasse=-350) do usuário na org ativa.
 *
 * Mapeia para `GET /projects?idClasse=-350`.
 * Só executa quando há accessToken no store (usuário autenticado).
 *
 * staleTime de 30 segundos — SPACEs mudam raramente, mas 30s é
 * suficiente para refletir criação/remoção feita em outra aba.
 *
 * @returns Resultado do useQuery com `data: DProjectDto[] | undefined`
 *
 * @example
 * ```tsx
 * const { data: spaces, isLoading } = useSpaces();
 * if (isLoading) return <Skeleton />;
 * return spaces?.map(s => <SpaceChip key={s.id} space={s} />);
 * ```
 */
export function useSpaces() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<DProjectDto[]>({
    queryKey: qk.projects.spaces,
    queryFn: async () => {
      const res = await api.get<ProjectPageDto>('/projects', {
        params: { idClasse: ID_CLASSE_SPACE, limit: 100 },
      });
      return res.data.items;
    },
    enabled: !!accessToken,
    staleTime: 30_000,
  });
}

/**
 * Lista os FOLDERs (idClasse=-351) filhos de um SPACE específico.
 *
 * Mapeia para `GET /projects?idClasse=-351&idPai={spaceId}`.
 * Desabilitado automaticamente quando `spaceId` é null.
 *
 * @param spaceId - ID do SPACE pai. Quando null, a query fica desabilitada.
 * @returns Resultado do useQuery com `data: DProjectDto[] | undefined`
 *
 * @example
 * ```tsx
 * const { data: folders } = useFolders(selectedSpaceId);
 * ```
 */
export function useFolders(spaceId: string | null) {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<DProjectDto[]>({
    queryKey: spaceId ? qk.projects.folders(spaceId) : ['projects', 'folders', null],
    queryFn: async () => {
      const res = await api.get<ProjectPageDto>('/projects', {
        params: {
          idClasse: ID_CLASSE_FOLDER,
          idPai: spaceId,
          limit: 100,
        },
      });
      return res.data.items;
    },
    enabled: !!accessToken && !!spaceId,
    staleTime: 30_000,
  });
}

/**
 * Lista os LISTs (idClasse=-352) filhos de um FOLDER específico.
 *
 * Mapeia para `GET /projects?idClasse=-352&idPai={folderId}`.
 * Desabilitado automaticamente quando `folderId` é null.
 *
 * @param folderId - ID do FOLDER pai. Quando null, a query fica desabilitada.
 * @returns Resultado do useQuery com `data: DProjectDto[] | undefined`
 *
 * @example
 * ```tsx
 * const { data: lists } = useLists(selectedFolderId);
 * ```
 */
export function useLists(folderId: string | null) {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<DProjectDto[]>({
    queryKey: folderId ? qk.projects.lists(folderId) : ['projects', 'lists', null],
    queryFn: async () => {
      const res = await api.get<ProjectPageDto>('/projects', {
        params: {
          idClasse: ID_CLASSE_LIST,
          idPai: folderId,
          limit: 100,
        },
      });
      return res.data.items;
    },
    enabled: !!accessToken && !!folderId,
    staleTime: 30_000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Cria um novo SPACE (idClasse=-350) na org ativa.
 *
 * Mapeia para `POST /projects { idClasse: '-350', nome, privado? }`.
 * Após sucesso, invalida a query `qk.projects.spaces` para forçar refetch.
 *
 * @returns Resultado do useMutation com `mutate({ nome, privado? })`
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useCreateSpace();
 * mutate({ nome: 'Produto', privado: false });
 * ```
 */
export function useCreateSpace() {
  const queryClient = useQueryClient();

  return useMutation<DProjectDto, Error, Pick<CreateProjectDto, 'nome' | 'privado'>>({
    mutationFn: async (dto) => {
      const res = await api.post<DProjectDto>('/projects', {
        ...dto,
        idClasse: ID_CLASSE_SPACE,
      });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.projects.spaces });
    },
  });
}

/**
 * Renomeia ou atualiza parcialmente qualquer DProject.
 *
 * Mapeia para `PATCH /projects/:chave { nome?, privado?, idPai? }`.
 * Invalida as queries afetadas com base no `idClasse` do projeto atualizado:
 * - SPACE  → invalida `qk.projects.spaces`
 * - FOLDER → invalida `qk.projects.folders(idPai)` (pai do folder)
 * - LIST   → invalida `qk.projects.lists(idPai)` (pai da list)
 *
 * @returns Resultado do useMutation com `mutate({ id, idClasse, idPai?, dto })`
 *
 * @example
 * ```tsx
 * const { mutate } = useRenameProject();
 * mutate({ id: '500', idClasse: '-350', dto: { nome: 'Novo Nome' } });
 * ```
 */
export function useRenameProject() {
  const queryClient = useQueryClient();

  return useMutation<
    DProjectDto,
    Error,
    { id: string; idClasse: string; idPai?: string | null; dto: UpdateProjectDto }
  >({
    mutationFn: async ({ id, dto }) => {
      const res = await api.patch<DProjectDto>(`/projects/${id}`, dto);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      const { idClasse, idPai } = variables;

      if (idClasse === ID_CLASSE_SPACE) {
        void queryClient.invalidateQueries({ queryKey: qk.projects.spaces });
      } else if (idClasse === ID_CLASSE_FOLDER && idPai) {
        void queryClient.invalidateQueries({ queryKey: qk.projects.folders(idPai) });
      } else if (idClasse === ID_CLASSE_LIST && idPai) {
        void queryClient.invalidateQueries({ queryKey: qk.projects.lists(idPai) });
      } else {
        // Fallback: invalida tudo relacionado a projects
        void queryClient.invalidateQueries({ queryKey: qk.projects.all });
      }
    },
  });
}

/**
 * Cria um novo FOLDER (idClasse=-351) dentro de um SPACE.
 *
 * Mapeia para `POST /projects { idClasse: '-351', nome, idPai: spaceId }`.
 * Após sucesso, invalida `qk.projects.folders(spaceId)` para forçar refetch.
 *
 * @returns Resultado do useMutation com `mutate({ nome, idPai: spaceId })`
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useCreateFolder();
 * mutate({ nome: 'Sprint 1', idPai: spaceId });
 * ```
 */
export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation<DProjectDto, Error, Pick<CreateProjectDto, 'nome'> & { idPai: string }>({
    mutationFn: async (dto) => {
      const res = await api.post<DProjectDto>('/projects', {
        ...dto,
        idClasse: ID_CLASSE_FOLDER,
      });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: qk.projects.folders(variables.idPai),
      });
    },
  });
}

/**
 * Cria uma nova LIST (idClasse=-352) dentro de um FOLDER ou SPACE.
 *
 * Mapeia para `POST /projects { idClasse: '-352', nome, idPai: parentId }`.
 * Após sucesso, invalida `qk.projects.lists(parentId)` para forçar refetch.
 *
 * @returns Resultado do useMutation com `mutate({ nome, idPai: parentId })`
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useCreateList();
 * mutate({ nome: 'Backlog', idPai: folderId });
 * ```
 */
export function useCreateList() {
  const queryClient = useQueryClient();

  return useMutation<DProjectDto, Error, Pick<CreateProjectDto, 'nome'> & { idPai: string }>({
    mutationFn: async (dto) => {
      const res = await api.post<DProjectDto>('/projects', {
        ...dto,
        idClasse: ID_CLASSE_LIST,
      });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: qk.projects.lists(variables.idPai),
      });
    },
  });
}

/**
 * Arquiva (soft-delete) qualquer DProject.
 *
 * Mapeia para `DELETE /projects/:chave`.
 * Invalida as queries afetadas com base no `idClasse` do projeto arquivado.
 *
 * @returns Resultado do useMutation com `mutate({ id, idClasse, idPai? })`
 *
 * @example
 * ```tsx
 * const { mutate } = useArchiveProject();
 * mutate({ id: '500', idClasse: '-350' });
 * ```
 */
export function useArchiveProject() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string; idClasse: string; idPai?: string | null }>({
    mutationFn: async ({ id }) => {
      await api.delete(`/projects/${id}`);
    },
    onSuccess: (_data, variables) => {
      const { idClasse, idPai } = variables;

      if (idClasse === ID_CLASSE_SPACE) {
        void queryClient.invalidateQueries({ queryKey: qk.projects.spaces });
      } else if (idClasse === ID_CLASSE_FOLDER && idPai) {
        void queryClient.invalidateQueries({ queryKey: qk.projects.folders(idPai) });
      } else if (idClasse === ID_CLASSE_LIST && idPai) {
        void queryClient.invalidateQueries({ queryKey: qk.projects.lists(idPai) });
      } else {
        void queryClient.invalidateQueries({ queryKey: qk.projects.all });
      }
    },
  });
}
