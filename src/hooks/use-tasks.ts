"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ─── Internos ─────────────────────────────────────────────────────────────────
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { useAuthStore } from "@/lib/stores/auth";

// ─── Types ────────────────────────────────────────────────────────────────────
import type { TaskResponseDto } from "@/lib/types/api";

// ─── Tipos de resposta paginada ───────────────────────────────────────────────

interface TasksPage {
  items: TaskResponseDto[];
  pagination: { hasMore: boolean; nextCursor: string | null };
}

// ─── Hooks de leitura ─────────────────────────────────────────────────────────

/**
 * Lista tasks de um projeto (List, idClasse=-352) pelo seu ID.
 *
 * Mapeia para `GET /tasks?projectId={projectId}&limit=200`.
 * Desabilitado automaticamente quando `projectId` é null.
 *
 * staleTime de 15 segundos — tasks mudam com frequência moderada;
 * refetch manual via invalidateQueries é o fluxo principal após mutações.
 *
 * @param projectId - ID do DProject (List). Quando null, a query fica desabilitada.
 * @returns Resultado do useQuery com `data: TaskResponseDto[]`
 *
 * @example
 * ```tsx
 * const { data: tasks = [], isLoading } = useTasksByProject(listId);
 * ```
 */
export function useTasksByProject(projectId: string | null) {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery<TaskResponseDto[]>({
    queryKey: qk.tasks.byProject(projectId ?? ""),
    queryFn: async () => {
      const res = await api.get<TasksPage>("/tasks", {
        params: { projectId, limit: 100 },
      });
      return res.data.items;
    },
    enabled: !!accessToken && !!projectId,
    staleTime: 15_000,
  });
}

/**
 * Busca uma task individual pelo ID.
 *
 * Mapeia para `GET /tasks/:id`.
 * Desabilitado automaticamente quando `id` é null.
 *
 * @param id - ID da DTask. Quando null, a query fica desabilitada.
 * @returns Resultado do useQuery com `data: TaskResponseDto`
 *
 * @example
 * ```tsx
 * const { data: task } = useTask(taskId);
 * ```
 */
export function useTask(id: string | null) {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery<TaskResponseDto>({
    queryKey: qk.tasks.byId(id ?? ""),
    queryFn: async () => {
      const res = await api.get<TaskResponseDto>(`/tasks/${id}`);
      return res.data;
    },
    enabled: !!accessToken && !!id,
    staleTime: 15_000,
  });
}

/**
 * Lista tasks atribuídas ao usuário logado.
 *
 * Mapeia para `GET /tasks?assigneeId={entidadeId}&status={status}&limit=100`.
 * Quando `status` é omitido, retorna tasks em todos os estados.
 *
 * @param status - Filtro opcional de V3 Intention (ex: 'INBOX', 'EXECUTING').
 * @returns Resultado do useQuery com `data: TaskResponseDto[]`
 *
 * @example
 * ```tsx
 * const { data: tasks = [] } = useMyTasks();
 * const { data: active = [] } = useMyTasks('EXECUTING');
 * ```
 */
export function useMyTasks(status?: string) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const entidadeId = useAuthStore((s) => s.user?.entidadeId);
  return useQuery<TaskResponseDto[]>({
    queryKey: [...qk.tasks.all, "my", entidadeId, status],
    queryFn: async () => {
      const res = await api.get<TasksPage>("/tasks", {
        params: { assigneeId: entidadeId, status, limit: 100 },
      });
      return res.data.items;
    },
    enabled: !!accessToken && !!entidadeId,
    staleTime: 15_000,
  });
}

/**
 * Lista subtarefas diretas de uma task (filhas via idPai).
 *
 * Lazy: só dispara quando `enabled=true` (usuário expandiu a row).
 * Mapeia para `GET /tasks?idPai={parentId}&limit=100`.
 */
export function useSubtasks(parentId: string, enabled: boolean) {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery<TaskResponseDto[]>({
    queryKey: qk.tasks.children(parentId),
    queryFn: async () => {
      const res = await api.get<TasksPage>("/tasks", {
        params: { idPai: parentId, limit: 100 },
      });
      return res.data.items;
    },
    enabled: !!accessToken && !!parentId && enabled,
    staleTime: 15_000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Cria uma nova task em um projeto.
 *
 * Mapeia para `POST /tasks { titulo, idProject, priority?, dueDate?, assigneeId? }`.
 * Após sucesso, invalida `qk.tasks.byProject(idProject)` para forçar refetch do Kanban.
 *
 * @returns Resultado do useMutation
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useCreateTask();
 * mutate({ titulo: 'Nova task', idProject: listId });
 * ```
 */
export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation<
    TaskResponseDto,
    Error,
    {
      titulo: string;
      idProject: string;
      priority?: string;
      dueDate?: string;
      assigneeId?: string;
      idPai?: string;
    }
  >({
    mutationFn: async ({ titulo, idProject, ...rest }) => {
      const res = await api.post<TaskResponseDto>("/tasks", {
        nome: titulo,
        projectId: idProject,
        ...rest,
      });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: qk.tasks.byProject(variables.idProject),
      });
      if (variables.idPai) {
        void queryClient.invalidateQueries({
          queryKey: qk.tasks.children(variables.idPai),
        });
      }
    },
  });
}

/**
 * Atualiza a V3 Intention (status) de uma task.
 *
 * Mapeia para `PATCH /tasks/:id/status { status }`.
 * Após sucesso, invalida as queries do projeto e da task individual.
 *
 * @returns Resultado do useMutation
 *
 * @example
 * ```tsx
 * const { mutate } = useUpdateTaskStatus();
 * mutate({ id: taskId, status: 'EXECUTING', projectId: listId });
 * ```
 */
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation<
    TaskResponseDto,
    Error,
    { id: string; status: string; projectId: string }
  >({
    mutationFn: async ({ id, status }) => {
      const res = await api.put<TaskResponseDto>(`/tasks/${id}/status`, {
        status,
      });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: qk.tasks.byProject(variables.projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: qk.tasks.byId(variables.id),
      });
    },
  });
}

/**
 * Atualiza campos editáveis de uma task (título, descrição, prioridade, dueDate, assignee).
 *
 * Mapeia para `PATCH /tasks/:id { titulo?, descricao?, priority?, dueDate?, assigneeId? }`.
 * Semântica de `dueDate`: undefined = não toca; null = remove; string = nova data.
 * Após sucesso, invalida as queries do projeto e da task individual.
 *
 * @returns Resultado do useMutation
 *
 * @example
 * ```tsx
 * const { mutate } = useUpdateTask();
 * mutate({ id: taskId, projectId: listId, dto: { titulo: 'Novo título' } });
 * mutate({ id: taskId, projectId: listId, dto: { dueDate: null } }); // remove data
 * ```
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation<
    TaskResponseDto,
    Error,
    {
      id: string;
      projectId: string;
      dto: {
        titulo?: string;
        descricao?: string;
        priority?: string;
        dueDate?: string | null;
        assigneeId?: string | null;
      };
    }
  >({
    mutationFn: async ({ id, dto }) => {
      const { titulo, descricao, ...rest } = dto;
      const body = {
        ...rest,
        ...(titulo !== undefined ? { nome: titulo } : {}),
        ...(descricao !== undefined ? { descricao } : {}),
      };
      const res = await api.put<TaskResponseDto>(`/tasks/${id}`, body);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: qk.tasks.byProject(variables.projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: qk.tasks.byId(variables.id),
      });
    },
  });
}

/**
 * Deleta uma task (soft delete no backend — task vai para lixeira).
 *
 * Mapeia para `DELETE /tasks/:id` (retorna 204). Se a task for uma fase
 * (idClasse=-200), o backend executa cascade automaticamente em filhas
 * conforme ADR-V2-047.
 *
 * Após sucesso, invalida:
 * - `qk.tasks.byProject(projectId)` (sempre) — refetch do Kanban
 * - `qk.tasks.byId(id)` (sempre) — limpa cache da task individual
 * - `qk.tasks.children(parentId)` (se a task era subtask) — atualiza a lista
 *   de filhas no pai
 *
 * @returns Resultado do useMutation
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useDeleteTask();
 * mutate({ id: taskId, projectId: listId });
 * mutate({ id: subtaskId, projectId: listId, parentId: parentTaskId });
 * ```
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    Error,
    { id: string; projectId: string; parentId?: string }
  >({
    mutationFn: async ({ id }) => {
      await api.delete(`/tasks/${id}`);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: qk.tasks.byProject(variables.projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: qk.tasks.byId(variables.id),
      });
      if (variables.parentId) {
        void queryClient.invalidateQueries({
          queryKey: qk.tasks.children(variables.parentId),
        });
      }
    },
  });
}
