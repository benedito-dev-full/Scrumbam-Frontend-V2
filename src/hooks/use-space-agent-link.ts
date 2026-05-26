'use client';

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ─── Internos ─────────────────────────────────────────────────────────────────
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
import type { DProjectDto, DeployKeyResponseDto } from '@/lib/types/api';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const linkKeys = {
  bySpace: (spaceId: string) => ['space-agent-link', spaceId] as const,
} as const;

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface AgentStatusItem {
  linkId: string;
  agentId: string;
  tipo: 'primary' | 'secondary';
  name: string;
  statusCode: string | null;
  lastSeen?: string | null;
  version?: string | null;
  tunnelPort: number | null;
  tunnelOk: boolean;
  projectSlug?: string | null;
}

interface AgentStatusResponse {
  projectId: string;
  agents: AgentStatusItem[];
}

// ─── Tipos de retorno públicos ────────────────────────────────────────────────

export interface SpaceAgentLink {
  spaceId: string;
  agentId: string;
  linkId: string;
  repoUrl: string;
  projectSlug: string | null;
  linkedAt: string;
}

export interface LinkedAgent {
  id: string;
  nome: string;
  hostname: string | null;
  status: 'online' | 'offline' | 'never_connected' | 'pending_install';
  tunnelOk: boolean;
}

export interface SpaceAgentLinkData {
  link: SpaceAgentLink | null;
  agent: LinkedAgent | null;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useSpaceAgentLink(spaceId: string) {
  return useQuery({
    queryKey: linkKeys.bySpace(spaceId),
    queryFn: async (): Promise<SpaceAgentLinkData> => {
      // Busca vínculo via DVincula -185
      const status = await api
        .get<AgentStatusResponse>(`/projects/${spaceId}/agent/status`)
        .then((r) => r.data)
        .catch(() => null);

      const primary = status?.agents?.find((a) => a.tipo === 'primary') ?? status?.agents?.[0] ?? null;
      if (!primary) return { link: null, agent: null };

      // Busca repoUrl do projeto
      const project = await api
        .get<DProjectDto>(`/projects/${spaceId}`)
        .then((r) => r.data)
        .catch(() => null);

      const online = primary.tunnelOk || primary.statusCode === '-510';

      const link: SpaceAgentLink = {
        spaceId,
        agentId: primary.agentId,
        linkId: primary.linkId,
        repoUrl: project?.repoUrl ?? '',
        projectSlug: primary.projectSlug ?? null,
        linkedAt: new Date().toISOString(),
      };

      const agent: LinkedAgent = {
        id: primary.agentId,
        nome: primary.name,
        hostname: null,
        status: online ? 'online' : 'offline',
        tunnelOk: primary.tunnelOk,
      };

      return { link, agent };
    },
    staleTime: 10_000,
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

export function useUnlinkSpaceAgent(spaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // Busca o agentId atual para chamar DELETE
      const status = await api
        .get<AgentStatusResponse>(`/projects/${spaceId}/agent/status`)
        .then((r) => r.data)
        .catch(() => null);
      const primary = status?.agents?.find((a) => a.tipo === 'primary') ?? status?.agents?.[0];
      if (primary) {
        await api.delete(`/projects/${spaceId}/agent/${primary.agentId}`);
      }
      // Limpa repoUrl do projeto
      await api.patch<DProjectDto>(`/projects/${spaceId}`, { repoUrl: null });
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
