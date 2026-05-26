"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ─── Internos ─────────────────────────────────────────────────────────────────
import { api, getApiErrorMessage } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { useAuthStore } from "@/lib/stores/auth";

// ─── Types ────────────────────────────────────────────────────────────────────
import type {
  ListNotificationsResponseDto,
  MarkAllReadResponseDto,
  NotificationDto,
  UnreadCountResponseDto,
} from "@/lib/types/api";

// ─── Filtros locais ───────────────────────────────────────────────────────────

/**
 * Filtros suportados pela página `/inbox`.
 *
 * - `all`: lista completa (servidor).
 * - `unread`: filtra apenas não lidas no servidor via `unreadOnly=true`.
 * - `mentions` / `assignments`: filtros locais sobre a lista completa (o
 *   backend ainda não expõe filtro por `eventType`, então fazemos client-side).
 */
export type NotificationFilter = "all" | "unread" | "mentions" | "assignments";

// ─── Hooks de leitura ─────────────────────────────────────────────────────────

/**
 * Lista notificações in-app do usuário autenticado.
 *
 * Mapeia para `GET /notifications`. Quando `filter='unread'` envia
 * `?unreadOnly=true`. Os filtros `mentions`/`assignments` são aplicados
 * client-side sobre a lista `all` (backend ainda sem filtro por eventType).
 *
 * @param filter - Filtro da aba ativa em `/inbox`. Default `'all'`.
 * @returns Lista de `NotificationDto` (já filtrada quando aplicável).
 *
 * @example
 * ```tsx
 * const { data: notifications = [], isLoading } = useNotifications('unread');
 * ```
 */
export function useNotifications(filter: NotificationFilter = "all") {
  const accessToken = useAuthStore((s) => s.accessToken);
  const unreadOnly = filter === "unread";

  return useQuery<NotificationDto[]>({
    queryKey: qk.notifications.list(unreadOnly),
    queryFn: async () => {
      const res = await api.get<ListNotificationsResponseDto>(
        "/notifications",
        {
          params: { limit: 50, ...(unreadOnly ? { unreadOnly: "true" } : {}) },
        },
      );
      const items = res.data.items;
      if (filter === "mentions") {
        return items.filter((n) =>
          (n.eventType ?? "").toLowerCase().includes("mention"),
        );
      }
      if (filter === "assignments") {
        return items.filter((n) =>
          (n.eventType ?? "").toLowerCase().includes("assign"),
        );
      }
      return items;
    },
    enabled: !!accessToken,
    staleTime: 15_000,
  });
}

/**
 * Conta de notificações não lidas — alimenta o badge do sino.
 *
 * Polling a cada 30 s; valor disponível mesmo quando a aba está em background.
 *
 * @example
 * ```tsx
 * const { data } = useUnreadCount();
 * const count = data?.count ?? 0;
 * ```
 */
export function useUnreadCount() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery<UnreadCountResponseDto>({
    queryKey: qk.notifications.unreadCount,
    queryFn: async () => {
      const res = await api.get<UnreadCountResponseDto>(
        "/notifications/unread-count",
      );
      return res.data;
    },
    enabled: !!accessToken,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    staleTime: 10_000,
  });
}

// ─── Hooks de mutação ─────────────────────────────────────────────────────────

/**
 * Marca uma notificação como lida (`PATCH /notifications/:id/read`).
 *
 * Após sucesso, invalida toda a árvore `notifications` (lista + contador).
 * Erro é exibido via toast — sucesso fica silencioso (UX padrão de inbox).
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation<NotificationDto | void, Error, string>({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.notifications.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

/**
 * Marca todas as notificações do usuário como lidas (`PATCH /notifications/read-all`).
 *
 * Após sucesso, invalida toda a árvore `notifications` e exibe toast com a
 * quantidade atualizada (UX confirmatório, ação destrutiva implícita).
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation<MarkAllReadResponseDto, Error, void>({
    mutationFn: async () => {
      const res = await api.patch<MarkAllReadResponseDto>(
        "/notifications/read-all",
      );
      return res.data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: qk.notifications.all });
      toast.success(
        data.updated > 0
          ? `${data.updated} notificação(ões) marcadas como lidas`
          : "Nada para marcar",
      );
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

/**
 * Exclui logicamente uma notificação (`DELETE /notifications/:id`).
 *
 * Após sucesso, invalida toda a árvore `notifications`.
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      await api.delete(`/notifications/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.notifications.all });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

// ─── Utilitário compartilhado entre popover e inbox ──────────────────────────

/**
 * Decide o destino de navegação ao clicar numa notificação.
 *
 * Regras (atualizadas após remoção das rotas `/tasks/*` standalone — task
 * sempre vive dentro de uma list = project filho):
 *
 * - `taskId` + `projectId` → `/lists/:projectId` (rota canônica de tasks).
 * - `taskId` sem `projectId` → `null` (raro; não há rota representativa).
 * - `projectId` sem `taskId` → `/spaces/:projectId`.
 * - `executionId` → `null` (ainda não há rota de execução isolada).
 *
 * Caller deve usar fallback (ex.: `/inbox`) quando o retorno for `null`.
 */
export function resolveNotificationTarget(n: NotificationDto): string | null {
  if (n.taskId && n.projectId) return `/lists/${n.projectId}`;
  if (n.taskId) return null;
  if (n.projectId) return `/spaces/${n.projectId}`;
  if (n.executionId) return null;
  return null;
}
