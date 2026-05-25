'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { qk } from '@/lib/query-keys';
import { useAuthStore } from '@/lib/stores/auth';
import type { OrgMemberDto, InviteResponseDto, CreateInviteDto } from '@/lib/types/api';

interface ListMembersResponse {
  members: OrgMemberDto[];
}

interface ListInvitesResponse {
  items: InviteResponseDto[];
  pagination: { hasMore: boolean; nextCursor: string | null };
}

// ─── Membros ──────────────────────────────────────────────────────────────────

export function useOrgMembers() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const orgId = user?.organizationId;

  return useQuery<OrgMemberDto[]>({
    queryKey: qk.organizations.members(orgId ?? ''),
    queryFn: async () => {
      const res = await api.get<ListMembersResponse>(
        `/organizations/${orgId}/members`,
      );
      return res.data.members;
    },
    enabled: !!accessToken && !!orgId,
    staleTime: 30_000,
  });
}

export function useRemoveOrgMember() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const orgId = user?.organizationId;

  return useMutation<void, Error, string>({
    mutationFn: async (memberUserId) => {
      await api.delete(`/organizations/${orgId}/members/${memberUserId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.organizations.members(orgId ?? '') });
    },
  });
}

export function useUpdateOrgMemberRole() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const orgId = user?.organizationId;

  return useMutation<void, Error, { userId: string; role: 'ADMIN' | 'MEMBER' | 'VIEWER' }>({
    mutationFn: async ({ userId, role }) => {
      await api.patch(`/organizations/${orgId}/members/${userId}`, { role });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.organizations.members(orgId ?? '') });
    },
  });
}

// ─── Convites ─────────────────────────────────────────────────────────────────

export function useOrgInvites() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const orgId = user?.organizationId;

  return useQuery<InviteResponseDto[]>({
    queryKey: qk.organizations.invites(orgId ?? ''),
    queryFn: async () => {
      const res = await api.get<ListInvitesResponse>(
        `/organizations/${orgId}/invites`,
      );
      return res.data.items ?? [];
    },
    enabled: !!accessToken && !!orgId,
    staleTime: 30_000,
  });
}

export function useCreateInvite() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const orgId = user?.organizationId;

  return useMutation<InviteResponseDto, Error, CreateInviteDto>({
    mutationFn: async (dto) => {
      const res = await api.post<InviteResponseDto>(
        `/organizations/${orgId}/invites`,
        dto,
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.organizations.invites(orgId ?? '') });
    },
  });
}

export function useCancelInvite() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const orgId = user?.organizationId;

  return useMutation<void, Error, string>({
    mutationFn: async (inviteId) => {
      await api.delete(`/organizations/${orgId}/invites/${inviteId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.organizations.invites(orgId ?? '') });
    },
  });
}
