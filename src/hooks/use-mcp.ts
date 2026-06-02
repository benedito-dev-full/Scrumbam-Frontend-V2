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
  CreateMcpKeyDto,
  McpKeyCreatedDto,
  McpKeyListItemDto,
} from "@/lib/types/api";

/**
 * Escopos padrão de uma nova chave MCP: leitura do catálogo de ferramentas
 * (`tools:read`) e execução delas (`tools:call`). Cobre o uso típico de um
 * cliente como Claude/Cursor consumindo o workspace.
 */
export const DEFAULT_MCP_SCOPES = ["tools:read", "tools:call"];

/**
 * Lista as chaves MCP do usuário autenticado (`GET /mcp/keys`).
 *
 * Os itens NÃO trazem o token em claro (só `prefix`) — o plaintext só existe
 * no momento da criação. Erro de query normalmente indica `MCP_ENABLED=false`
 * no backend; o caller decide como exibir (ex.: estado "servidor indisponível").
 *
 * @example
 * ```tsx
 * const { data: keys = [], isLoading, isError } = useMcpKeys();
 * ```
 */
export function useMcpKeys() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery<McpKeyListItemDto[]>({
    queryKey: qk.mcp.keys,
    queryFn: async () => {
      const res = await api.get<McpKeyListItemDto[]>("/mcp/keys");
      return res.data;
    },
    enabled: !!accessToken,
    staleTime: 30_000,
    retry: false,
  });
}

/**
 * Gera uma nova chave MCP (`POST /mcp/keys`).
 *
 * Retorna o token completo (`plaintext`) UMA ÚNICA VEZ — o caller deve exibir
 * para o usuário copiar imediatamente. Invalida a listagem após sucesso.
 *
 * @example
 * ```tsx
 * const createKey = useCreateMcpKey();
 * createKey.mutate(undefined, { onSuccess: (k) => setRevealed(k) });
 * ```
 */
export function useCreateMcpKey() {
  const queryClient = useQueryClient();
  return useMutation<McpKeyCreatedDto, Error, CreateMcpKeyDto | void>({
    mutationFn: async (dto) => {
      const res = await api.post<McpKeyCreatedDto>("/mcp/keys", {
        scopes: dto?.scopes ?? DEFAULT_MCP_SCOPES,
      });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.mcp.keys });
      toast.success("Chave MCP gerada");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

/**
 * Revoga uma chave MCP (`DELETE /mcp/keys/:id`).
 *
 * Após sucesso, invalida a listagem. A chave deixa de autenticar imediatamente.
 */
export function useRevokeMcpKey() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/mcp/keys/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.mcp.keys });
      toast.success("Chave revogada");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
