'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { qk } from '@/lib/query-keys';
import { useAuthStore } from '@/lib/stores/auth';

export interface ProjectMemberDto {
  id: string;
  name: string;
  email: string;
  role?: string;
}

/**
 * Lista membros de um projeto (List).
 *
 * Mapeia para `GET /projects/:projectId/members`.
 * Mais seguro que o endpoint da org — não requer ADMIN e já filtra
 * pelos membros do contexto correto.
 *
 * staleTime de 5 minutos — membros mudam raramente.
 */
export function useProjectMembers(projectId: string | null | undefined) {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery<ProjectMemberDto[]>({
    queryKey: qk.projects.members(projectId ?? ''),
    queryFn: async () => {
      const res = await api.get<ProjectMemberDto[]>(`/projects/${projectId}/members`);
      return res.data;
    },
    enabled: !!accessToken && !!projectId,
    staleTime: 5 * 60_000,
    throwOnError: false,
  });
}
