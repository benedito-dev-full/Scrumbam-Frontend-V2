"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { useAuthStore } from "@/lib/stores/auth";
import type {
  TeamResponseDto,
  TeamMemberDto,
  TeamFeedResponseDto,
} from "@/lib/types/api";

interface CreateTeamPayload {
  nome: string;
  prefix?: string;
  description?: string;
  color?: string;
  icon?: string;
}

interface ListTeamsResponse {
  items: TeamResponseDto[];
  pagination: { hasMore: boolean; nextCursor: string | null };
}

export function useCreateTeam() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation<TeamResponseDto, Error, CreateTeamPayload>({
    mutationFn: async (payload) => {
      const orgId = user?.organizationId;
      if (!orgId) throw new Error("Nenhuma organização ativa");
      const res = await api.post<TeamResponseDto>(
        `/organizations/${orgId}/teams`,
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.teams.all });
    },
  });
}

export function useDeleteTeam() {
  const qc = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (teamId) => {
      await api.delete(`/teams/${teamId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.teams.all });
    },
  });
}

interface ListTeamMembersResponse {
  members: TeamMemberDto[];
}

export function useTeamMembers(teamId: string) {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<TeamMemberDto[]>({
    queryKey: qk.teams.members(teamId),
    queryFn: async () => {
      const res = await api.get<ListTeamMembersResponse>(
        `/teams/${teamId}/members`,
      );
      return res.data.members;
    },
    enabled: !!accessToken && !!teamId,
    staleTime: 30_000,
  });
}

export function useAddTeamMember(teamId: string) {
  const qc = useQueryClient();

  return useMutation<
    void,
    Error,
    { userId: string; cargo?: "LEAD" | "MEMBER" }
  >({
    mutationFn: async (payload) => {
      await api.post(`/teams/${teamId}/members`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.teams.members(teamId) });
    },
  });
}

export function useRemoveTeamMember(teamId: string) {
  const qc = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (userId) => {
      await api.delete(`/teams/${teamId}/members/${userId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.teams.members(teamId) });
    },
  });
}

export function useTeam(teamId: string) {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<TeamResponseDto>({
    queryKey: qk.teams.byId(teamId),
    queryFn: async () => {
      const res = await api.get<TeamResponseDto>(`/teams/${teamId}`);
      return res.data;
    },
    enabled: !!accessToken && !!teamId,
    staleTime: 30_000,
  });
}

export function useUpdateTeam(teamId: string) {
  const qc = useQueryClient();

  return useMutation<
    TeamResponseDto,
    Error,
    { nome?: string; description?: string | null; color?: string | null }
  >({
    mutationFn: async (payload) => {
      const res = await api.patch<TeamResponseDto>(`/teams/${teamId}`, payload);
      return res.data;
    },
    onSuccess: (updated) => {
      qc.setQueryData(qk.teams.byId(teamId), updated);
      qc.invalidateQueries({ queryKey: qk.teams.all });
    },
  });
}

export function useTeams() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const orgId = user?.organizationId;

  return useQuery<TeamResponseDto[]>({
    queryKey: qk.teams.all,
    queryFn: async () => {
      const res = await api.get<ListTeamsResponse>(
        `/organizations/${orgId}/teams`,
      );
      return res.data.items;
    },
    enabled: !!accessToken && !!orgId,
    staleTime: 30_000,
  });
}

/**
 * Lista os times dos quais o usuário logado faz parte (na org ativa).
 *
 * Mapeia para `GET /teams/mine`. Mais barato que `useTeams()` (que traz
 * todos os times da org) quando você só precisa dos times do user.
 */
export function useMyTeams() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<TeamResponseDto[]>({
    queryKey: [...qk.teams.all, "mine"],
    queryFn: async () => {
      const res = await api.get<ListTeamsResponse>("/teams/mine");
      return res.data.items;
    },
    enabled: !!accessToken,
    staleTime: 30_000,
  });
}

/**
 * Feed de atividades do time (DEvento) — mapeia `GET /teams/:id/feed`.
 *
 * Retorna eventos TASK_CREATED, TASK_ASSIGNED, TASK_STATUS_CHANGED e
 * TASK_COMPLETED em ordem decrescente (mais recente primeiro). Requer
 * que o usuário logado seja membro do time (backend valida).
 */
export function useTeamFeed(teamId: string, limit = 20) {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<TeamFeedResponseDto>({
    queryKey: qk.teams.feed(teamId),
    queryFn: async () => {
      const res = await api.get<TeamFeedResponseDto>(`/teams/${teamId}/feed`, {
        params: { limit },
      });
      return res.data;
    },
    enabled: !!accessToken && !!teamId,
    staleTime: 15_000,
  });
}
