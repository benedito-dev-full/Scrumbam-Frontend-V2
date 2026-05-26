'use client';

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ─── Internos ─────────────────────────────────────────────────────────────────
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
import type { AgentDto, DProjectDto } from '@/lib/types/api';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const linkKeys = {
  bySpace: (spaceId: string) => ['space-agent-link', spaceId] as const,
} as const;

// ─── Tipos de retorno ─────────────────────────────────────────────────────────

export interface SpaceAgentLink {
  spaceId: string;
  agentId: string;
  remoteRepoUrl: string;
  remoteBranch: string;
  remotePath: string;
  linkedAt: string;
}

export interface SpaceAgentLinkData {
  link: SpaceAgentLink | null;
  agent: AgentDto | null;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useSpaceAgentLink(spaceId: string) {
  return useQuery({
    queryKey: linkKeys.bySpace(spaceId),
    queryFn: async (): Promise<SpaceAgentLinkData> => {
      const project = await api
        .get<DProjectDto>(`/projects/${spaceId}`)
        .then((r) => r.data);

      if (!project.idAgent) return { link: null, agent: null };

      const agent = await api
        .get<AgentDto>(`/agents/${project.idAgent}`)
        .then((r) => r.data);

      const link: SpaceAgentLink = {
        spaceId,
        agentId: project.idAgent,
        remoteRepoUrl: project.remoteRepoUrl ?? '',
        remoteBranch: project.remoteBranch ?? '',
        remotePath: project.remotePath ?? '',
        linkedAt: project.atualizadoEm ?? project.criadoEm ?? new Date().toISOString(),
      };

      return { link, agent };
    },
    staleTime: 5_000,
    enabled: !!spaceId,
  });
}

export interface LinkSpaceAgentDto {
  agentId: string;
  remoteRepoUrl: string;
  remoteBranch: string;
  remotePath: string;
}

export function useLinkSpaceAgent(spaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: LinkSpaceAgentDto) =>
      api
        .patch<DProjectDto>(`/projects/${spaceId}`, {
          idAgent: dto.agentId,
          remoteRepoUrl: dto.remoteRepoUrl,
          remoteBranch: dto.remoteBranch,
          remotePath: dto.remotePath,
        })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.bySpace(spaceId) });
    },
  });
}

export function useUnlinkSpaceAgent(spaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api
        .patch<DProjectDto>(`/projects/${spaceId}`, {
          idAgent: null,
          remoteRepoUrl: null,
          remoteBranch: null,
          remotePath: null,
        })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.bySpace(spaceId) });
    },
  });
}
