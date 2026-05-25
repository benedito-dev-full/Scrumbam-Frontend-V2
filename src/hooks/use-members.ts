'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { qk } from '@/lib/query-keys';
import { useAuthStore } from '@/lib/stores/auth';
import type { OrgMemberDto } from '@/lib/types/api';

/**
 * Lista membros da organização ativa do usuário.
 *
 * Mapeia para `GET /organizations/:orgId/members`.
 * Usado nos dropdowns de responsável nas tasks.
 *
 * staleTime de 5 minutos — membros mudam raramente.
 */
export function useOrgMembers(orgId: string | null | undefined) {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery<OrgMemberDto[]>({
    queryKey: qk.organizations.members(orgId ?? ''),
    queryFn: async () => {
      const res = await api.get<OrgMemberDto[]>(`/organizations/${orgId}/members`);
      return res.data;
    },
    enabled: !!accessToken && !!orgId,
    staleTime: 5 * 60_000,
  });
}
