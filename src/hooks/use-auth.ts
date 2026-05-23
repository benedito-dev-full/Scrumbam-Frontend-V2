'use client';

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// ─── Internos ─────────────────────────────────────────────────────────────────
import { api, getApiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/auth';
import { qk } from '@/lib/query-keys';

// ─── Types ────────────────────────────────────────────────────────────────────
import type { UserDto, AuthResponseDto } from '@/lib/types/api';

// ─── Tipos locais ─────────────────────────────────────────────────────────────

interface LoginDto {
  email: string;
  password: string;
}

interface RegisterDto {
  name: string;
  email: string;
  password: string;
  organizationName?: string;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Busca os dados do usuário autenticado via GET /auth/me.
 *
 * Só executa a query quando há um accessToken ativo no store.
 * staleTime de 5 minutos — evita refetch excessivo de dados estáticos do perfil.
 *
 * @returns Resultado do useQuery com `data: UserDto | undefined`
 *
 * @example
 * const { data: user, isLoading } = useMe();
 */
export function useMe() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<UserDto>({
    queryKey: qk.auth.me,
    queryFn: () => api.get<UserDto>('/auth/me').then((r) => r.data),
    enabled: !!accessToken,
    staleTime: 5 * 60_000,
  });
}

/**
 * Mutation para autenticar um usuário existente (POST /auth/login).
 *
 * Em caso de sucesso: salva tokens e dados do usuário no store,
 * depois redireciona para a raiz da aplicação.
 * Em caso de erro: exibe toast com a mensagem do backend.
 *
 * @returns Handle de mutation (`mutate`, `mutateAsync`, `isPending`, ...)
 *
 * @example
 * const login = useLogin();
 * login.mutate({ email: 'a@b.com', password: '123456' });
 */
export function useLogin() {
  const router = useRouter();

  return useMutation<AuthResponseDto, unknown, LoginDto>({
    mutationFn: (data) =>
      api.post<AuthResponseDto>('/auth/login', data).then((r) => r.data),
    onSuccess: (data) => {
      useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
      useAuthStore.getState().setUser(data.user);
      router.push('/');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

/**
 * Mutation para criar uma nova conta de usuário (POST /auth/register).
 *
 * Em caso de sucesso: salva tokens e dados do usuário no store,
 * depois redireciona para a raiz da aplicação.
 * Em caso de erro: exibe toast com a mensagem do backend.
 *
 * @returns Handle de mutation (`mutate`, `mutateAsync`, `isPending`, ...)
 *
 * @example
 * const register = useRegister();
 * register.mutate({ name: 'João', email: 'j@b.com', password: '12345678' });
 */
export function useRegister() {
  const router = useRouter();

  return useMutation<AuthResponseDto, unknown, RegisterDto>({
    mutationFn: (data) =>
      api.post<AuthResponseDto>('/auth/register', data).then((r) => r.data),
    onSuccess: (data) => {
      useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
      useAuthStore.getState().setUser(data.user);
      router.push('/');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

/**
 * Mutation para encerrar a sessão do usuário (POST /auth/logout).
 *
 * Usa `onSettled` (roda com sucesso E com erro) para garantir que a sessão
 * local sempre seja limpa, independentemente do estado do backend.
 * Após limpar: limpa o cache do TanStack Query e redireciona para /login.
 *
 * @returns Handle de mutation (`mutate`, `mutateAsync`, `isPending`, ...)
 *
 * @example
 * const logout = useLogout();
 * logout.mutate();
 */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<unknown, unknown, void>({
    mutationFn: () => api.post('/auth/logout').then((r) => r.data),
    onSettled: () => {
      useAuthStore.getState().clearSession();
      queryClient.clear();
      router.push('/login');
    },
  });
}
