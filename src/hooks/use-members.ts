'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { qk } from '@/lib/query-keys';
import { useAuthStore } from '@/lib/stores/auth';

export interface ProjectMemberDto {
  userId: string;
  nome: string;
  email: string | null;
  role: string;
  cargo: string | null;
}

interface ListProjectMembersResponseDto {
  members: ProjectMemberDto[];
}

/**
 * Lista membros de um projeto (List).
 *
 * Mapeia para `GET /projects/:projectId/members`.
 * Retorna `{ members: ProjectMemberDto[] }` — extrai o array internamente.
 */
export function useProjectMembers(projectId: string | null | undefined) {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery<ProjectMemberDto[]>({
    queryKey: qk.projects.members(projectId ?? ''),
    queryFn: async () => {
      const res = await api.get<ListProjectMembersResponseDto>(`/projects/${projectId}/members`);
      const data = res.data;
      if (Array.isArray(data)) return data;
      return data?.members ?? [];
    },
    enabled: !!accessToken && !!projectId,
    staleTime: 5 * 60_000,
    throwOnError: false,
  });
}
