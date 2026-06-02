"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ─── Internos ─────────────────────────────────────────────────────────────────
import { api, getApiErrorMessage } from "@/lib/api";
import { qk } from "@/lib/query-keys";

// ─── Types ────────────────────────────────────────────────────────────────────
import type {
  CreateOrganizationDto,
  OrganizationResponseDto,
} from "@/lib/types/api";

/**
 * Cria uma nova organização/workspace (`POST /organizations`).
 *
 * O backend cria a org + time default + contador + vínculo ADMIN de forma
 * atômica e aceita JWT órfão — então serve tanto para a primeira workspace
 * quanto para workspaces adicionais.
 *
 * Após sucesso invalida `qk.auth.me` (atualiza `availableOrgs` do switcher).
 * O caller normalmente segue com `useSwitchOrg` para entrar na org recém-criada.
 *
 * @example
 * ```tsx
 * const createOrg = useCreateOrganization();
 * const org = await createOrg.mutateAsync({ nome: "Acme" });
 * switchOrg.mutate(org.id);
 * ```
 */
export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation<OrganizationResponseDto, Error, CreateOrganizationDto>({
    mutationFn: async (dto) => {
      const res = await api.post<OrganizationResponseDto>("/organizations", dto);
      return res.data;
    },
    onSuccess: (org) => {
      void queryClient.invalidateQueries({ queryKey: qk.auth.me });
      void queryClient.invalidateQueries({ queryKey: qk.organizations.all });
      toast.success(`Workspace "${org.nome}" criada`);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
