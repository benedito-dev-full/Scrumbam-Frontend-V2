"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Internos ─────────────────────────────────────────────────────────────────
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { useMe } from "@/hooks/use-auth";

// ─── Types ────────────────────────────────────────────────────────────────────
import type {
  UpdateMeDto,
  UserAppearancePreferences,
  UserDto,
  UserLocalePreferences,
  UserNotificationsPreferences,
  UserPreferences,
} from "@/lib/types/api";

const USE_MOCK = process.env.NEXT_PUBLIC_MOCK_AUTH === "true";

/**
 * Defaults aplicados quando o backend retorna `preferences === undefined`
 * (usuário antigo, sem nenhum PATCH /auth/me { preferences } prévio).
 */
export const PREFERENCES_DEFAULTS = {
  appearance: {
    theme: "system",
    density: "normal",
    accent: "#6366F1",
  } as Required<UserAppearancePreferences>,
  locale: {
    language: "pt-BR",
    timezone: "America/Sao_Paulo",
    dateFormat: "dd/MM/yyyy",
  } as Required<UserLocalePreferences>,
  notifications: {
    emailOnMention: true,
    emailDigest: false,
    inAppEnabled: true,
  } as Required<UserNotificationsPreferences>,
};

type Block = keyof UserPreferences;
type SubPatch<B extends Block> = NonNullable<UserPreferences[B]>;

/**
 * Hook server-backed para preferências do usuário (Task E1 backend).
 *
 * - Lê via `useMe()` (`GET /auth/me`, cache compartilhado por `qk.auth.me`).
 * - Escreve via `PATCH /auth/me` mandando APENAS o sub-bloco alterado.
 *   Backend faz merge por chave de 1º nível — escrever `appearance` não
 *   toca `locale` ou `notifications`.
 * - Optimistic update para UX snappy; rollback em erro.
 *
 * Em modo mock (`NEXT_PUBLIC_MOCK_AUTH=true`) o mutate é no-op —
 * mantém a UI funcional sem backend rodando.
 */
export function useUserPreferences() {
  const queryClient = useQueryClient();
  const meQuery = useMe();

  const raw = meQuery.data?.preferences ?? {};
  const preferences = {
    appearance: {
      ...PREFERENCES_DEFAULTS.appearance,
      ...(raw.appearance ?? {}),
    },
    locale: { ...PREFERENCES_DEFAULTS.locale, ...(raw.locale ?? {}) },
    notifications: {
      ...PREFERENCES_DEFAULTS.notifications,
      ...(raw.notifications ?? {}),
    },
  };

  const mutation = useMutation<
    unknown,
    Error,
    { block: Block; patch: SubPatch<Block> },
    { previous?: UserDto }
  >({
    mutationFn: async ({ block, patch }) => {
      if (USE_MOCK) return null;
      const body: UpdateMeDto = {
        preferences: { [block]: patch } as UserPreferences,
      };
      const { data } = await api.patch("/auth/me", body);
      return data;
    },
    onMutate: async ({ block, patch }) => {
      await queryClient.cancelQueries({ queryKey: qk.auth.me });
      const previous = queryClient.getQueryData<UserDto>(qk.auth.me);
      if (previous) {
        const nextPrefs: UserPreferences = {
          ...(previous.preferences ?? {}),
          [block]: patch,
        };
        queryClient.setQueryData<UserDto>(qk.auth.me, {
          ...previous,
          preferences: nextPrefs,
        });
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(qk.auth.me, ctx.previous);
      }
    },
    onSettled: () => {
      if (!USE_MOCK) {
        queryClient.invalidateQueries({ queryKey: qk.auth.me });
      }
    },
  });

  const setAppearance = useCallback(
    (patch: UserAppearancePreferences) => {
      const merged = { ...preferences.appearance, ...patch };
      return mutation.mutateAsync({ block: "appearance", patch: merged });
    },
    [mutation, preferences.appearance],
  );

  const setLocale = useCallback(
    (patch: UserLocalePreferences) => {
      const merged = { ...preferences.locale, ...patch };
      return mutation.mutateAsync({ block: "locale", patch: merged });
    },
    [mutation, preferences.locale],
  );

  const setNotifications = useCallback(
    (patch: UserNotificationsPreferences) => {
      const merged = { ...preferences.notifications, ...patch };
      return mutation.mutateAsync({ block: "notifications", patch: merged });
    },
    [mutation, preferences.notifications],
  );

  return {
    preferences,
    isLoading: meQuery.isLoading,
    isError: meQuery.isError,
    isSaving: mutation.isPending,
    setAppearance,
    setLocale,
    setNotifications,
  };
}
