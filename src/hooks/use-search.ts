'use client';

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useQuery } from '@tanstack/react-query';

// ─── Internos ─────────────────────────────────────────────────────────────────
import { api } from '@/lib/api';
import { qk } from '@/lib/query-keys';
import { useAuthStore } from '@/lib/stores/auth';

// ─── Tipos (espelham SearchResponseDto do Scrumban-Backend-V2 /search) ──────────

/** Resultado de busca de uma task (DTask). */
export interface TaskSearchResult {
  /** Chave da DTask (BigInt serializado como string). */
  chave: string;
  nome: string;
  /** Descrição truncada (até 150 chars) ou null. */
  descricao: string | null;
  /** ID do DProject (List) ao qual a task pertence — usado para navegação. */
  idProject: string | null;
  /** Nome do projeto, para exibir como sublabel. */
  projectNome: string | null;
  idStatus: string | null;
  criadoEm: string;
}

/** Resultado de busca de um projeto (DProject: Space/Folder/List). */
export interface ProjectSearchResult {
  chave: string;
  nome: string;
  descricao: string | null;
  criadoEm: string;
}

/** Resultado de busca de uma pessoa (DEntidade USER -150). */
export interface PersonSearchResult {
  chave: string;
  nome: string;
  email: string | null;
  criadoEm: string;
}

export interface SearchResponse {
  tasks: TaskSearchResult[];
  projects: ProjectSearchResult[];
  people: PersonSearchResult[];
  cursors: {
    task: string | null;
    project: string | null;
    person: string | null;
  };
  meta: {
    q: string;
    limit: number;
    organizationId: string;
  };
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

/**
 * Busca cross-entity no workspace (tasks + projects + people) via `GET /search`.
 *
 * O backend exige mínimo de 2 caracteres em `q`; por isso a query só é
 * habilitada quando `query.trim().length >= 2` (e há sessão). O caller é
 * responsável por debouncar o termo antes de passar aqui — evita uma request
 * por tecla. Resultado cacheado por `qk.search.byQuery(q)` com `staleTime` de
 * 30s, suficiente para o uso efêmero do command palette.
 *
 * @param query - Termo de busca (será normalizado com trim internamente).
 * @returns Resultado do `useQuery` com `data: SearchResponse | undefined`.
 *
 * @example
 * ```tsx
 * const { data, isFetching } = useSearch(debouncedQuery);
 * data?.tasks.map((t) => ...);
 * ```
 */
export function useSearch(query: string) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const q = query.trim();

  return useQuery<SearchResponse>({
    queryKey: qk.search.byQuery(q),
    queryFn: async () => {
      const res = await api.get<SearchResponse>('/search', {
        params: { q, limit: 20 },
      });
      return res.data;
    },
    enabled: !!accessToken && q.length >= 2,
    staleTime: 30_000,
  });
}
