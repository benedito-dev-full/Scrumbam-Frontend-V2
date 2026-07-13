"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Internos ─────────────────────────────────────────────────────────────────
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth";

// ─── Types ────────────────────────────────────────────────────────────────────
import type {
  AgentDto,
  CreateAgentDto,
  UpdateAgentDto,
  InstallTokenDto,
} from "@/lib/types/api";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const agentKeys = {
  all: ["agents"] as const,
  installToken: (agentId: string) => ["agents", "token", agentId] as const,
  executions: (agentId: string) => ["agents", "executions", agentId] as const,
} as const;

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useAgents() {
  // Gate de hidratação (F2 — item 2.7). O store usa `skipHydration`: no
  // primeiro render o `accessToken` ainda é null. Sem este gate, a query
  // dispara SEM Authorization e toma um 401 espúrio — que o interceptor
  // tentava "corrigir" com refresh e, na aba nova (sem refresh token),
  // terminava em logout. Só consultamos o backend depois de hidratar.
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery({
    queryKey: agentKeys.all,
    queryFn: () => api.get<AgentDto[]>("/agents").then((r) => r.data),
    enabled: !!accessToken,
    staleTime: 10_000,
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAgentDto) =>
      api.post<AgentDto>("/agents", dto).then((r) => r.data),
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
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery({
    queryKey: agentKeys.installToken(agentId),
    queryFn: () =>
      api
        .post<InstallTokenDto>(`/agents/${agentId}/install-token`)
        .then((r) => r.data),
    // Gate de hidratação (F2 — item 2.7): ver comentário em `useAgents`.
    enabled: !!agentId && !!accessToken,
    staleTime: 60_000,
  });
}
