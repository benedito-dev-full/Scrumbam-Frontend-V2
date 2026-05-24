'use client';

// Hooks TanStack Query para gerenciamento de vínculos Espaço↔Agente VPS.
// Usa mock localStorage enquanto não existe endpoint real no backend.
// TODO: substituir queryFn/mutationFn por chamadas à api quando o backend estiver pronto.

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ─── Mock store ───────────────────────────────────────────────────────────────
import {
  getSpaceLink,
  linkSpaceToAgent,
  unlinkSpace,
  type SpaceAgentLink,
} from '@/lib/mock/space-agent-link';

// ─── Types ────────────────────────────────────────────────────────────────────
import type { AgentDto } from '@/lib/types/api';

// ─── Constants ────────────────────────────────────────────────────────────────
const AGENTS_STORAGE_KEY = 'scrumban_agents_mock';

// ─── Helpers internos ─────────────────────────────────────────────────────────

/**
 * Lê os agentes direto do localStorage — necessário dentro de queryFn
 * onde não é possível chamar hooks (useAgents).
 */
function readAgentsFromStorage(): AgentDto[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(AGENTS_STORAGE_KEY) ?? '[]') as AgentDto[];
  } catch {
    return [];
  }
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

/**
 * Factory de query keys para vínculos Espaço↔Agente.
 *
 * @example
 * queryClient.invalidateQueries({ queryKey: linkKeys.bySpace(spaceId) })
 */
export const linkKeys = {
  bySpace: (spaceId: string) => ['space-agent-link', spaceId] as const,
} as const;

// ─── Tipos de retorno ─────────────────────────────────────────────────────────

/** Dados retornados por useSpaceAgentLink */
export interface SpaceAgentLinkData {
  link: SpaceAgentLink | null;
  agent: AgentDto | null;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * Retorna o vínculo atual do Espaço e os dados do agente vinculado (se houver).
 *
 * Cache com staleTime de 5s. Invalide com `linkKeys.bySpace(spaceId)` após mutations.
 *
 * @param spaceId - ID do Espaço
 * @returns `{ data: { link, agent }, isLoading, ... }`
 *
 * @example
 * const { data } = useSpaceAgentLink(spaceId);
 * if (data?.link) { ... }
 */
export function useSpaceAgentLink(spaceId: string) {
  return useQuery({
    queryKey: linkKeys.bySpace(spaceId),
    queryFn: (): SpaceAgentLinkData => {
      const link = getSpaceLink(spaceId);
      if (!link) return { link: null, agent: null };

      const agents = readAgentsFromStorage();
      const agent = agents.find((a) => a.id === link.agentId) ?? null;
      return { link, agent };
    },
    staleTime: 5_000,
  });
}

/** DTO para criar ou atualizar um vínculo */
export interface LinkSpaceAgentDto {
  agentId: string;
  remoteRepoUrl: string;
  remoteBranch: string;
  remotePath: string;
}

/**
 * Vincula (ou re-configura) um agente VPS a um Espaço.
 *
 * onSuccess invalida `linkKeys.bySpace(spaceId)` para forçar refetch.
 *
 * @param spaceId - ID do Espaço alvo
 * @returns Handle de mutation com `mutate`, `mutateAsync`, `isPending`
 *
 * @example
 * const link = useLinkSpaceAgent(spaceId);
 * await link.mutateAsync({ agentId, remoteRepoUrl, remoteBranch, remotePath });
 */
export function useLinkSpaceAgent(spaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: LinkSpaceAgentDto): Promise<SpaceAgentLink> => {
      const newLink: SpaceAgentLink = {
        spaceId,
        agentId: dto.agentId,
        remoteRepoUrl: dto.remoteRepoUrl,
        remoteBranch: dto.remoteBranch,
        remotePath: dto.remotePath,
        linkedAt: new Date().toISOString(),
      };
      linkSpaceToAgent(newLink);
      return newLink;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.bySpace(spaceId) });
    },
  });
}

/**
 * Remove o vínculo entre o Espaço e qualquer agente.
 *
 * onSuccess invalida `linkKeys.bySpace(spaceId)` para forçar refetch.
 *
 * @param spaceId - ID do Espaço a desvincular
 * @returns Handle de mutation com `mutate`, `isPending`
 *
 * @example
 * const unlink = useUnlinkSpaceAgent(spaceId);
 * unlink.mutate();
 */
export function useUnlinkSpaceAgent(spaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      unlinkSpace(spaceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.bySpace(spaceId) });
    },
  });
}
