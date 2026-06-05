"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { toast } from "sonner";

// ─── Internos ─────────────────────────────────────────────────────────────────
import { getApiErrorMessage } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import {
  deleteKey,
  fetchKeys,
  setPreference,
  upsertKey,
} from "@/lib/services/nexus.service";
import { useAuthStore } from "@/lib/stores/auth";

// ─── Types ────────────────────────────────────────────────────────────────────
import type {
  AiKeyMasked,
  AiProviderName,
  AiProviderPreference,
} from "@/lib/types/nexus";

// ─── Query: chaves mascaradas da org (ADMIN-only) ──────────────────────────────

/**
 * Lista as chaves de IA da org (mascaradas) via `GET /ai/keys`.
 *
 * ADMIN-only no backend (403 caso contrário). O componente consumidor já
 * gateia por `orgRole` e só monta este hook quando o usuário é admin — por
 * isso `enabled` exige tanto `accessToken` quanto a flag `isAdmin`.
 *
 * @param isAdmin Se `false`, a query não dispara (evita 403 desnecessário).
 * @returns Resultado do `useQuery` (`data: AiKeyMasked[] | undefined`).
 */
export function useAiKeys(
  isAdmin: boolean,
): UseQueryResult<AiKeyMasked[], Error> {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<AiKeyMasked[], Error>({
    queryKey: qk.nexus.keys,
    queryFn: fetchKeys,
    enabled: !!accessToken && isAdmin,
    staleTime: 60_000,
  });
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

/**
 * Invalida as queries afetadas por mudanças de chave/preferência.
 *
 * `keys` (a lista admin), `providers` (disponibilidade vista no chat) e
 * `preference` (default da org) precisam ficar frescas após qualquer
 * cadastro/rotação/remoção/troca de default.
 */
function useInvalidateAiConfig(): () => void {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: qk.nexus.keys });
    void queryClient.invalidateQueries({ queryKey: qk.nexus.providers });
    void queryClient.invalidateQueries({ queryKey: qk.nexus.preference });
  };
}

/**
 * Cadastra/rotaciona a chave de um provider (`POST /ai/keys`, ADMIN-only).
 *
 * Em sucesso invalida `keys`/`providers`/`preference` e emite toast. O
 * componente é responsável por limpar o input (a chave crua nunca volta).
 *
 * @returns Mutation handle (`mutate`, `mutateAsync`, `isPending`, ...).
 */
export function useUpsertAiKey(): UseMutationResult<
  AiKeyMasked,
  Error,
  { provider: AiProviderName; key: string }
> {
  const invalidate = useInvalidateAiConfig();

  return useMutation({
    mutationFn: upsertKey,
    onSuccess: (data) => {
      invalidate();
      toast.success(`Chave do ${labelOf(data.provider)} salva com sucesso.`);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

/**
 * Remove a chave de um provider (`DELETE /ai/keys/:provider`, ADMIN-only).
 *
 * Trata 404 como "já removida" (sucesso silencioso). Invalida as queries
 * de config em sucesso.
 *
 * @returns Mutation handle.
 */
export function useDeleteAiKey(): UseMutationResult<
  { deleted: boolean; provider: AiProviderName },
  Error,
  AiProviderName
> {
  const invalidate = useInvalidateAiConfig();

  return useMutation({
    mutationFn: deleteKey,
    onSuccess: (data) => {
      invalidate();
      toast.success(`Chave do ${labelOf(data.provider)} removida.`);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

/**
 * Define o provider padrão da org (`PUT /ai/preference`, ADMIN-only).
 *
 * @returns Mutation handle.
 */
export function useSetAiPreference(): UseMutationResult<
  AiProviderPreference,
  Error,
  AiProviderPreference
> {
  const invalidate = useInvalidateAiConfig();

  return useMutation({
    mutationFn: setPreference,
    onSuccess: (data) => {
      invalidate();
      toast.success(`${labelOf(data.provider)} definido como padrão da organização.`);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Rótulo amigável do provider para mensagens de toast. */
function labelOf(provider: AiProviderName): string {
  const labels: Record<AiProviderName, string> = {
    gemini: "Gemini",
    claude: "Claude",
    openai: "OpenAI",
  };
  return labels[provider];
}
