'use client';

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ─── Internos ─────────────────────────────────────────────────────────────────
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
import type { AgentDto, DProjectDto, DeployKeyResponseDto } from '@/lib/types/api';

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
  repoUrl: string;
}

export function useLinkSpaceAgent(spaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: LinkSpaceAgentDto) => {
      // 1. Salva URL do repo no projeto
      await api.patch<DProjectDto>(`/projects/${spaceId}`, { repoUrl: dto.repoUrl });
      // 2. Cria/atualiza vínculo agente↔projeto (DVincula -185)
      await api.post(`/projects/${spaceId}/agent`, { agentId: dto.agentId, tipo: 'primary' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.bySpace(spaceId) });
    },
  });
}

export function useGenerateDeployKey() {
  return useMutation({
    mutationFn: ({ projectId, agentId }: { projectId: string; agentId: string }) =>
      api
        .post<DeployKeyResponseDto>(`/projects/${projectId}/agent/${agentId}/deploy-key`)
        .then((r) => r.data),
  });
}

export function useProvisionProject() {
  return useMutation({
    mutationFn: ({ projectId, agentId }: { projectId: string; agentId: string }) =>
      api
        .post<{ dispatched: boolean }>(`/projects/${projectId}/agent/${agentId}/provision`)
        .then((r) => r.data),
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
