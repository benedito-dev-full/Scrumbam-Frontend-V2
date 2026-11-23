"use client";

import { useState } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { ExecutionResponseDto } from "@/hooks/use-task-execution";

const DETAIL_POLL_MS = 5000;

/**
 * Busca o detalhe de uma execução (risco + expiração).
 *
 * Só faz polling quando `poll` é true (usuário que NÃO disparou: não há outra
 * fonte de polling). Se a execução já saiu de `awaiting_approval`, invalida as
 * tasks para destravar a UI.
 *
 * @param executionId - ID do DPedido da execução (null desabilita a query)
 * @param poll - Liga o polling enquanto aguarda aprovação
 * @returns Resultado do `useQuery` com o `ExecutionResponseDto` (risco, aprovação)
 */
export function useExecutionDetail(executionId: string | null, poll: boolean) {
  const queryClient = useQueryClient();
  return useQuery<ExecutionResponseDto>({
    queryKey: qk.executions.byId(executionId ?? ""),
    queryFn: async () => {
      const { data } = await api.get<ExecutionResponseDto>(
        `/executions/${executionId}`,
      );
      if (data.approval.status !== "awaiting_approval") {
        void queryClient.invalidateQueries({ queryKey: qk.tasks.all });
      }
      return data;
    },
    enabled: !!executionId,
    refetchInterval: (query) =>
      poll && query.state.data?.approval.status === "awaiting_approval"
        ? DETAIL_POLL_MS
        : false,
  });
}

function errorMessage(err: unknown): string {
  const message = axios.isAxiosError(err)
    ? (err.response?.data as { message?: string | string[] } | undefined)
        ?.message
    : undefined;
  return (
    (Array.isArray(message) ? message[0] : message) ??
    "Não foi possível concluir a ação. Tente novamente."
  );
}

/**
 * Mutations de Aprovar/Rejeitar com tratamento padronizado de erros.
 *
 * - 403: não é gestor → toast + `forbidden=true` (a UI esconde os botões)
 * - 409/400: outro gestor já decidiu / expirou (400 = "não está em
 *   awaiting_approval") → refaz o GET e adota o estado atual
 * - demais: toast com a mensagem do backend
 *
 * @param executionId - Execução alvo
 * @param onDecided - Recebe o estado mais recente da execução (sucesso ou 409)
 * @returns `approve()` / `reject(motivo)` (retornam `true` quando concluídas),
 *   `isPending` e `forbidden` (true após 403, para a UI esconder os botões)
 */
export function useExecutionDecision(
  executionId: string,
  onDecided: (data: ExecutionResponseDto) => void,
) {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  async function run(
    path: "approve" | "reject",
    body: Record<string, string | undefined>,
    successMessage: string,
  ): Promise<boolean> {
    setPending(true);
    try {
      const { data } = await api.post<ExecutionResponseDto>(
        `/executions/${executionId}/${path}`,
        body,
      );
      queryClient.setQueryData(qk.executions.byId(executionId), data);
      onDecided(data);
      toast.success(successMessage);
      return true;
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 403) {
        setForbidden(true);
        toast.error("Apenas o gestor do projeto pode aprovar ou rejeitar.");
      } else if (status === 409 || status === 400) {
        // Estado velho: confere o estado real. Se ainda aguarda aprovação, o
        // 400 foi de validação (não de estado) e cai no toast de erro.
        try {
          const { data } = await api.get<ExecutionResponseDto>(
            `/executions/${executionId}`,
          );
          queryClient.setQueryData(qk.executions.byId(executionId), data);
          if (data.approval.status !== "awaiting_approval") {
            toast.info("Esta execução já foi decidida ou expirou.");
            onDecided(data);
            return true;
          }
        } catch {
          // sem rede: segue para o toast de erro
        }
        toast.error(errorMessage(err));
      } else {
        toast.error(errorMessage(err));
      }
      return false;
    } finally {
      setPending(false);
    }
  }

  return {
    approve: () => run("approve", {}, "Execução aprovada"),
    reject: (reason: string) => run("reject", { reason }, "Execução rejeitada"),
    isPending: pending,
    forbidden,
  };
}

/**
 * Converte a explicação do Risk Gate em texto amigável, sem expor regex cru.
 *
 * O backend pode devolver algo como "Padrão de risco ALTO detectado (prompt):
 * /\bproduction\b/i". Removemos literais de regex e marcadores técnicos; se
 * nada útil sobrar, cai no texto genérico.
 */
export function friendlyRiskReason(
  risk: { explanation: string; matchedPatterns: { pattern: string }[] } | null,
  level: string | null,
): string {
  const fallback = `Padrão de risco detectado${level ? ` (nível ${level})` : ""}`;
  if (!risk?.explanation) return fallback;
  let text = risk.explanation;
  for (const m of risk.matchedPatterns) {
    if (m.pattern) text = text.split(m.pattern).join("");
  }
  text = text
    .replace(/\/(?:\\.|[^/\\\n])+\/[a-z]*/g, "")
    .replace(/engine:[\w:-]+/gi, "")
    .replace(/\(\s*\)/g, "")
    .replace(/\s*[:;,-]\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return text.length >= 8 ? text : fallback;
}

/** "expira em 45 minutos" / "expirada" a partir do ISO `expiresAt`. */
export function formatExpiresIn(expiresAt: string, now: number): string {
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return "";
  if (date.getTime() <= now) return "Aprovação expirada";
  return `Expira em ${formatDistanceStrict(date, new Date(now), { locale: ptBR })}`;
}
