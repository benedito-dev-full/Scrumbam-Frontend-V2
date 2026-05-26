"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { useAuthStore } from "@/lib/stores/auth";
import type { TeamResponseDto, TeamMemberDto } from "@/lib/types/api";

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
