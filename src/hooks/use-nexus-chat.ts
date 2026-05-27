"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "sonner";

// ─── Internos ─────────────────────────────────────────────────────────────────
import { getApiErrorMessage } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { fetchHistory, sendMessage } from "@/lib/services/nexus.service";
import { useAuthStore } from "@/lib/stores/auth";
import type { NexusChatHistoryResponse, NexusMessage } from "@/lib/types/nexus";

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Tamanho default do histórico carregado na primeira consulta. */
export const DEFAULT_HISTORY_LIMIT = 50;

// ─── Tipos auxiliares ─────────────────────────────────────────────────────────

/**
 * Context devolvido por `onMutate` em {@link useNexusChat} — guarda o snapshot
 * da query de histórico antes da mutação otimista para suportar rollback.
 */
interface SendMessageMutationContext {
  previous: NexusChatHistoryResponse | undefined;
}

/**
 * Retorno consolidado de {@link useNexusChat}.
 */
export interface UseNexusChatResult {
  /** Mensagens do chat (ordem ASC, cronológica). */
  messages: NexusMessage[];
  /** `true` enquanto a primeira leitura do histórico está em voo. */
  isLoadingHistory: boolean;
  /** `true` enquanto uma mensagem está sendo enviada. */
  isSending: boolean;
  /** Erro do `useQuery` de histórico (ou `null`). */
  historyError: Error | null;
  /** Erro da mutação de envio (ou `null`). */
  sendError: Error | null;
  /** Envia uma mensagem do usuário ao Nexus (fire-and-forget). */
  sendMessage: (content: string) => void;
  /** Refetch manual do histórico. */
  refetchHistory: UseQueryResult<NexusChatHistoryResponse, Error>["refetch"];
  /** Acesso direto à mutation (caso o consumer precise de `mutateAsync`/`reset`). */
  sendMutation: UseMutationResult<
    NexusMessage,
    Error,
    string,
    SendMessageMutationContext
  >;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook do chat Nexus.
 *
 * Carrega o histórico via TanStack Query, expõe a lista reativa de
 * mensagens e oferece `sendMessage` com optimistic update — a mensagem
 * do usuário aparece imediatamente; em sucesso, invalidamos a query
 * para trazer o histórico real (com a resposta do assistant); em erro,
 * fazemos rollback do snapshot.
 *
 * @example
 * ```tsx
 * const { messages, isSending, sendMessage } = useNexusChat();
 * sendMessage("Qual o status das minhas tarefas?");
 * ```
 */
export function useNexusChat(): UseNexusChatResult {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  const queryKey = qk.nexus.history;

  // ─── Query: histórico inicial ──────────────────────────────────────────────
  const historyQuery = useQuery<NexusChatHistoryResponse, Error>({
    queryKey,
    queryFn: () => fetchHistory({ limit: DEFAULT_HISTORY_LIMIT }),
    staleTime: 30_000,
    enabled: !!accessToken,
  });

  // ─── Mutation: enviar mensagem ─────────────────────────────────────────────
  const sendMutation = useMutation<
    NexusMessage,
    Error,
    string,
    SendMessageMutationContext
  >({
    mutationFn: (content: string) => sendMessage({ content }),

    onMutate: async (content) => {
      // Evita race com refetches em andamento.
      await queryClient.cancelQueries({ queryKey });

      const previous =
        queryClient.getQueryData<NexusChatHistoryResponse>(queryKey);

      // Optimistic: mensagem do user aparece no FIM da lista (ASC = cronológico).
      const optimistic: NexusMessage = {
        id: `temp-${Date.now()}`,
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<NexusChatHistoryResponse>(queryKey, (old) =>
        old
          ? { ...old, items: [...old.items, optimistic] }
          : { items: [optimistic], nextCursor: null },
      );

      return { previous };
    },

    onSuccess: () => {
      // Backend retorna a msg do ASSISTANT. Invalidamos para que a próxima
      // leitura traga tanto a user msg real (com id definitivo) quanto a
      // resposta do assistant no fim do histórico.
      void queryClient.invalidateQueries({ queryKey });
    },

    onError: (error, _content, context) => {
      // Rollback do snapshot.
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      } else {
        queryClient.removeQueries({ queryKey });
      }

      // Toasts específicos por status — fallback para mensagem genérica.
      const axiosError = error as AxiosError;
      const status = axiosError?.response?.status;
      if (status === 503) {
        toast.error(
          "IA temporariamente indisponível (rate limit). Tente em alguns segundos.",
        );
      } else if (status === 504) {
        toast.error("IA demorou demais pra responder. Tente novamente.");
      } else if (status === 502) {
        toast.error(
          "IA temporariamente indisponível. Tente novamente em alguns instantes.",
        );
      } else {
        toast.error(getApiErrorMessage(error));
      }
    },
  });

  return {
    messages: historyQuery.data?.items ?? [],
    isLoadingHistory: historyQuery.isLoading,
    isSending: sendMutation.isPending,
    historyError: historyQuery.error,
    sendError: sendMutation.error,
    sendMessage: sendMutation.mutate,
    refetchHistory: historyQuery.refetch,
    sendMutation,
  };
}
