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
import {
  clearHistory,
  fetchHistory,
  sendMessage,
} from "@/lib/services/nexus.service";
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
  /** Apaga (soft-delete) toda a conversa atual do usuário. */
  clearChat: () => void;
  /** `true` enquanto a limpeza da conversa está em voo. */
  isClearing: boolean;
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
      const axiosError = error as AxiosError;
      const status = axiosError?.response?.status;
      const code = axiosError?.code;

      // 400 (validacao do conteudo enviado): nao e falha "de conversa" — eh
      // problema do input do usuario. Rollback da mensagem otimista + toast.
      if (status === 400) {
        if (context?.previous) {
          queryClient.setQueryData(queryKey, context.previous);
        } else {
          queryClient.removeQueries({ queryKey });
        }
        toast.error(getApiErrorMessage(error));
        return;
      }

      // Demais erros: mantemos a mensagem do user na conversa e injetamos
      // uma resposta "fake" do assistant com a explicacao amigavel. UX fica
      // como se a IA tivesse respondido pedindo para tentar de novo, em
      // vez de um popup vermelho que parece bug do site.
      let friendlyMsg: string;
      // 503 = backend traduz 429 do Gemini (cota/rate limit do provedor).
      // No free-tier do Gemini sao 20 req/dia, entao na pratica e quase
      // sempre cota diaria estourada — orientamos o usuario a esperar horas.
      if (status === 503) {
        friendlyMsg =
          "Você atingiu o limite de requisições da IA por agora. Provavelmente a cota diária foi excedida — tente novamente em algumas horas. 🙏";
      } else if (
        status === 502 ||
        status === 504 ||
        (status && status >= 500)
      ) {
        friendlyMsg =
          "Opa, estou com instabilidade no momento — meu provedor de IA está sobrecarregado. Pode tentar de novo daqui a alguns segundos?";
      } else if (status === 429) {
        // 429 vindo do nosso proprio backend (rate limit interno, nao do Gemini)
        friendlyMsg =
          "Estou recebendo muitas requisições agora. Aguarde um instante e tente novamente, por favor.";
      } else if (
        !axiosError?.response ||
        code === "ERR_NETWORK" ||
        code === "ECONNABORTED"
      ) {
        friendlyMsg =
          "Não consegui me conectar agora. Verifique sua conexão e tente de novo, por favor.";
      } else {
        friendlyMsg =
          "Hmm, algo deu errado por aqui. Pode tentar reformular sua pergunta ou enviar novamente?";
      }

      // Adiciona o assistant fake APOS a mensagem otimista do user. Nao
      // invalidamos a query — assim a "resposta de erro" fica visivel ate
      // o usuario enviar outra mensagem (que dispara refetch e zera o fake).
      queryClient.setQueryData<NexusChatHistoryResponse>(queryKey, (old) => {
        const errorMsg: NexusMessage = {
          id: `temp-err-${Date.now()}`,
          role: "assistant",
          content: friendlyMsg,
          createdAt: new Date().toISOString(),
        };
        return old
          ? { ...old, items: [...old.items, errorMsg] }
          : { items: [errorMsg], nextCursor: null };
      });
    },
  });

  // ─── Mutation: limpar conversa ────────────────────────────────────────────
  const clearMutation = useMutation<{ cleared: boolean; count: number }, Error>({
    mutationFn: () => clearHistory(),
    onSuccess: ({ count }) => {
      // Esvazia cache local imediatamente (UI responde sem aguardar refetch).
      queryClient.setQueryData<NexusChatHistoryResponse>(queryKey, {
        items: [],
        nextCursor: null,
      });
      void queryClient.invalidateQueries({ queryKey });
      toast.success(
        count > 0
          ? `Conversa apagada (${count} ${count === 1 ? "mensagem" : "mensagens"}).`
          : "Conversa já estava vazia.",
      );
    },
    onError: (error) => {
      const axiosError = error as AxiosError;
      if (!axiosError?.response) {
        toast.error("Não foi possível apagar a conversa. Verifique sua conexão.");
        return;
      }
      toast.error("Não foi possível apagar a conversa. Tente novamente.");
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
    clearChat: clearMutation.mutate,
    isClearing: clearMutation.isPending,
    sendMutation,
  };
}
