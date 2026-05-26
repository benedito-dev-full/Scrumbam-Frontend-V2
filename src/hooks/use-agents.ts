'use client';

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ─── Internos ─────────────────────────────────────────────────────────────────
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
import type {
  AgentDto,
  CreateAgentDto,
  UpdateAgentDto,
  InstallTokenDto,
} from '@/lib/types/api';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const agentKeys = {
  all: ['agents'] as const,
  installToken: (agentId: string) => ['agents', 'token', agentId] as const,
  executions: (agentId: string) => ['agents', 'executions', agentId] as const,
} as const;

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useAgents() {
  return useQuery({
    queryKey: agentKeys.all,
    queryFn: () => api.get<AgentDto[]>('/agents').then((r) => r.data),
    staleTime: 10_000,
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAgentDto) =>
      api.post<AgentDto>('/agents', dto).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (agentId: string) =>
      api.delete<void>(`/agents/${agentId}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & UpdateAgentDto) =>
      api.patch<AgentDto>(`/agents/${id}`, dto).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
    },
  });
}

export function useInstallToken(agentId: string) {
  return useQuery({
    queryKey: agentKeys.installToken(agentId),
    queryFn: () =>
      api.post<InstallTokenDto>(`/agents/${agentId}/install-token`).then((r) => r.data),
    enabled: !!agentId,
    staleTime: 60_000,
  });
}
