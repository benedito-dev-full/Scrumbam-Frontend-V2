'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { qk } from '@/lib/query-keys';
import { useAuthStore } from '@/lib/stores/auth';
import type { TeamResponseDto } from '@/lib/types/api';

interface CreateTeamPayload {
  nome: string;
  prefix?: string;
  description?: string;
  color?: string;
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
      if (!orgId) throw new Error('Nenhuma organização ativa');
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
