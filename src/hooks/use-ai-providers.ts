"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useQuery, type UseQueryResult } from "@tanstack/react-query";

// ─── Internos ─────────────────────────────────────────────────────────────────
import { qk } from "@/lib/query-keys";
import {
  fetchPreference,
  fetchProviders,
} from "@/lib/services/nexus.service";
import { useAuthStore } from "@/lib/stores/auth";

// ─── Types ────────────────────────────────────────────────────────────────────
import type {
  AiProviderPreference,
  AiProvidersResponse,
} from "@/lib/types/nexus";

// ─── Constantes ───────────────────────────────────────────────────────────────

/**
 * Disponibilidade muda pouco (admin cadastra/remove chave esporadicamente).
 * 5 min de `staleTime` evita refetch a cada foco de janela.
 */
const PROVIDERS_STALE_TIME = 5 * 60_000;

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Busca a disponibilidade dos provedores de IA da org (`GET /ai/providers`).
 *
 * Acessível a qualquer membro. Usado para popular o seletor de provider no
 * chat Nexus e desabilitar/sinalizar os não-configurados. Só executa quando
 * há `accessToken` no store.
 *
 * @returns Resultado do `useQuery` (`data: AiProvidersResponse | undefined`).
 *
 * @example
 * const { data, isLoading } = useAiProviders();
 * const providers = data?.providers ?? [];
 */
export function useAiProviders(): UseQueryResult<AiProvidersResponse, Error> {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<AiProvidersResponse, Error>({
    queryKey: qk.nexus.providers,
    queryFn: fetchProviders,
    staleTime: PROVIDERS_STALE_TIME,
    enabled: !!accessToken,
  });
}

/**
 * Busca a preferência default de provedor da org (`GET /ai/preference`).
 *
 * Acessível a qualquer membro. Define qual provider abre selecionado no chat
 * (cai para Gemini se `null`). Só executa quando há `accessToken` no store.
 *
 * @returns Resultado do `useQuery` (`data: AiProviderPreference | null | undefined`).
 *
 * @example
 * const { data: preference } = useAiPreference();
 * const defaultProvider = preference?.provider ?? "gemini";
 */
export function useAiPreference(): UseQueryResult<
  AiProviderPreference | null,
  Error
> {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<AiProviderPreference | null, Error>({
    queryKey: qk.nexus.preference,
    queryFn: fetchPreference,
    staleTime: PROVIDERS_STALE_TIME,
    enabled: !!accessToken,
  });
}
