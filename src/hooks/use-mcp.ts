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
  AllowedMcpScopesDto,
  CreateMcpKeyDto,
  McpKeyCreatedDto,
  McpKeyListItemDto,
} from "@/lib/types/api";
import type { McpScope } from "@/lib/mcp-scopes";

/**
 * Lista os scopes que o usuário autenticado PODE conceder a uma nova chave
 * (`GET /mcp/keys/allowed-scopes`).
 *
 * Derivado do role do usuário (RBAC duplo — ADR-V2-003). A UI consome para
 * desabilitar presets/scopes fora do alcance, evitando o "pedir e ver falhar".
 *
 * @example
 * ```tsx
 * const { data: allowed = [] } = useAllowedMcpScopes(modalOpen);
 * ```
 */
export function useAllowedMcpScopes(enabled = true) {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery<McpScope[]>({
    queryKey: qk.mcp.allowedScopes,
    queryFn: async () => {
      const res = await api.get<AllowedMcpScopesDto>(
        "/mcp/keys/allowed-scopes",
      );
      return res.data.allowedScopes;
    },
    enabled: !!accessToken && enabled,
    staleTime: 60_000,
    retry: false,
  });
}

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
 * O caller deve passar os scopes escolhidos (catálogo canônico — ADR-V2-068);
 * não há mais default. Erros 403 (scope acima do nível de acesso) já são
 * notificados pelo interceptor global de 403 (`notifyForbidden`), então aqui
 * só tratamos os demais erros — evita toast duplicado.
 *
 * @example
 * ```tsx
 * const createKey = useCreateMcpKey();
 * createKey.mutate({ scopes }, { onSuccess: (k) => setRevealed(k) });
 * ```
 */
export function useCreateMcpKey() {
  const queryClient = useQueryClient();
  return useMutation<McpKeyCreatedDto, Error, CreateMcpKeyDto>({
    mutationFn: async (dto) => {
      const res = await api.post<McpKeyCreatedDto>("/mcp/keys", {
        scopes: dto.scopes,
      });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.mcp.keys });
      toast.success("Chave MCP gerada");
    },
    onError: (error) => {
      // 403 já é tratado pelo interceptor global (mostra os scopes negados a
      // partir da mensagem do backend). Aqui cobrimos os demais (400, 5xx).
      const status =
        typeof error === "object" && error !== null && "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;
      if (status === 403) return;
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
