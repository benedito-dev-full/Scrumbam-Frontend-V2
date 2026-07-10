"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

// ─── Internos ─────────────────────────────────────────────────────────────────
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { TaskDuplicateResult } from "@/lib/types/api";

/**
 * Detecção de duplicata de task ANTES de criar (task #799 / DEV-128).
 *
 * Diferente do `useSearch` (que é reativo, `useQuery` por tecla), aqui a checagem
 * é IMPERATIVA: o modal chama `checkDuplicates(nome, projectId)` uma única vez no
 * momento do submit e decide se mostra o passo intermediário. Usa
 * `queryClient.fetchQuery` para reaproveitar o cache (`qk.tasks.duplicates`) com
 * `staleTime` curto — dois cliques seguidos no mesmo título não refazem a request.
 *
 * SEMPRE informativo: em erro de rede/servidor, resolve `[]` (a criação nunca
 * pode ser bloqueada por uma falha da detecção — mesma filosofia do backend).
 *
 * @returns `{ checkDuplicates }` — função async que retorna a lista de candidatas.
 *
 * @example
 * ```tsx
 * const { checkDuplicates } = useCheckDuplicates();
 * const dups = await checkDuplicates(nome, listId);
 * if (dups.length > 0) setDupStep(true);
 * ```
 */
export function useCheckDuplicates() {
  const queryClient = useQueryClient();

  const checkDuplicates = useCallback(
    async (nome: string, projectId: string): Promise<TaskDuplicateResult[]> => {
      const nomeTrim = nome.trim();
      if (!nomeTrim || !projectId) return [];

      try {
        return await queryClient.fetchQuery({
          queryKey: qk.tasks.duplicates(projectId, nomeTrim.toLowerCase()),
          queryFn: async () => {
            const res = await api.get<TaskDuplicateResult[]>(
              "/tasks/check-duplicates",
              { params: { nome: nomeTrim, projectId } },
            );
            return res.data;
          },
          staleTime: 15_000,
        });
      } catch {
        // Detecção é cortesia — nunca bloqueia a criação.
        return [];
      }
    },
    [queryClient],
  );

  return { checkDuplicates };
}
