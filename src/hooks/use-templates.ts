"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ─── Internos ─────────────────────────────────────────────────────────────────
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { useAuthStore } from "@/lib/stores/auth";

// ─── Types ────────────────────────────────────────────────────────────────────
import type { DProjectDto } from "@/lib/types/api";

/**
 * Hooks de Templates (feature Templates — ADR-V2-061).
 *
 * Um template é um DProject com idClasse dedicado:
 *   `-401` TEMPLATE_LIST · `-402` TEMPLATE_SPACE.
 *
 * O catálogo é o endpoint genérico de projetos filtrado por essas classes
 * (`GET /projects?idClasse=-401`), devolvendo templates da org ativa + os
 * globais (idEstab NULL, padrão de plataforma). Criar a partir de um template
 * é clonar o galho inteiro via `POST /projects/:id/from-template`.
 */

/** idClasse canônico do TEMPLATE_LIST (ADR-V2-061). */
export const ID_CLASSE_TEMPLATE_LIST = "-401" as const;
/** idClasse canônico do TEMPLATE_SPACE (ADR-V2-061). */
export const ID_CLASSE_TEMPLATE_SPACE = "-402" as const;

interface ProjectPageDto {
  items: DProjectDto[];
  pagination: { hasMore: boolean; nextCursor: string | null };
}

/**
 * Lista os templates de Lista (idClasse=-401) do catálogo.
 *
 * Mapeia para `GET /projects?idClasse=-401[&categoria]`. Devolve os templates
 * da org ativa + os globais (plataforma). A galeria agrupa por `categoria`.
 *
 * @param categoria - Filtro opcional por categoria (`dados.categoria`).
 */
export function useListTemplates(categoria?: string) {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<DProjectDto[]>({
    queryKey: ["templates", "list", categoria ?? null],
    queryFn: async () => {
      const res = await api.get<ProjectPageDto>("/projects", {
        params: {
          idClasse: ID_CLASSE_TEMPLATE_LIST,
          ...(categoria ? { categoria } : {}),
        },
      });
      return res.data.items;
    },
    enabled: !!accessToken,
    staleTime: 60_000,
  });
}

/** Payload de criação a partir de um template. */
interface CreateFromTemplateVars {
  /** Chave (id) do DProject-template a clonar. */
  id: string;
  /** SPACE/FOLDER destino onde o nó nasce. */
  idPai: string;
  /** Nome da raiz da cópia (default no backend: "<nome> (cópia)"). */
  novoNome?: string;
  /** Ícone da raiz da cópia. */
  novoIcone?: string;
  /** Copiar as tarefas de trabalho além dos blocos (default true). */
  includeTasks?: boolean;
}

/**
 * Cria um projeto (List/Space) a partir de um template — clone do galho.
 *
 * Mapeia para `POST /projects/:id/from-template`. Exige MANAGER no destino
 * (403 caso contrário). Devolve o `DProjectDto` da raiz criada (idClasse já
 * materializada: -401→-352 LIST, -402→-350 SPACE).
 *
 * @returns Mutation com `mutateAsync({ id, idPai, novoNome?, novoIcone?, includeTasks? })`
 */
export function useCreateFromTemplate() {
  const queryClient = useQueryClient();

  return useMutation<DProjectDto, Error, CreateFromTemplateVars>({
    mutationFn: async ({ id, ...rest }) => {
      const res = await api.post<DProjectDto>(`/projects/${id}/from-template`, {
        includeTasks: true,
        ...rest,
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
