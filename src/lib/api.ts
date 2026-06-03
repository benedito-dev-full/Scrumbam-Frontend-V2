import axios from "axios";
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import type { ApiErrorResponse } from "@/lib/types/api";

// Augmenta o config do axios com `skipAuth`: quando true, a request não anexa
// o token da sessão nem dispara refresh/redirect em 401 (usado em rotas
// públicas como aceitar convite).
declare module "axios" {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
  }
}

// ─── Controle de refresh ──────────────────────────────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null): void {
  for (const entry of failedQueue) {
    if (error) {
      entry.reject(error);
    } else {
      entry.resolve(token as string);
    }
  }
  failedQueue = [];
}

// ─── Aviso global de 403 (sem permissão) ──────────────────────────────────────

/**
 * Timestamp do último toast de 403 exibido. Throttle simples: uma rajada de
 * 403 (ex: vários PATCH em lote) não deve empilhar N toasts idênticos.
 */
let last403ToastAt = 0;
const TOAST_403_THROTTLE_MS = 4000;

/**
 * Exibe um toast explicativo quando o backend nega uma ação por falta de
 * permissão (HTTP 403). É a rede de segurança: mesmo onde a UI não conseguiu
 * desabilitar o botão a tempo (ou em fluxos não previstos), o usuário recebe um
 * motivo claro em vez de um silêncio confuso.
 *
 * Client-only (usa `sonner`) e com import lazy para não pesar no SSR.
 */
async function notifyForbidden(error: AxiosError<ApiErrorResponse>): Promise<void> {
  if (typeof window === "undefined") return;

  const now = Date.now();
  if (now - last403ToastAt < TOAST_403_THROTTLE_MS) return;
  last403ToastAt = now;

  // Prefere a mensagem do backend (ex: "requer role MANAGER no projeto"); cai
  // para um texto genérico amigável quando ausente.
  const backendMsg = getApiErrorMessage(error);
  const description =
    backendMsg && backendMsg !== "Erro inesperado"
      ? backendMsg
      : "Fale com um administrador da workspace.";

  try {
    const { toast } = await import("sonner");
    toast.error("Você não tem permissão para isso", { description });
  } catch {
    // sonner indisponível (ambiente sem Toaster montado) — silencioso.
  }
}

// ─── Instância principal ──────────────────────────────────────────────────────

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? '';

// Em modo mock não precisamos da URL do backend — só avisamos em dev se ambos estão ausentes
if (
  !baseURL &&
  process.env.NEXT_PUBLIC_MOCK_AUTH !== 'true' &&
  process.env.NODE_ENV === 'development'
) {
  console.warn(
    '[api] NEXT_PUBLIC_API_URL não definida — adicione NEXT_PUBLIC_MOCK_AUTH=true ao .env.local para modo offline'
  );
}

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

// ─── Interceptor de REQUEST ───────────────────────────────────────────────────

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // Requests públicas (ex: aceitar convite) NÃO devem anexar o token de uma
  // sessão antiga do navegador — senão um token expirado força 401 → /login,
  // sequestrando o fluxo de convite. Ver `skipAuth` na response abaixo.
  if (config.skipAuth) {
    return config;
  }

  // Import lazy para evitar dependência circular
  const { useAuthStore } = await import("@/lib/stores/auth");
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Interceptor de RESPONSE ──────────────────────────────────────────────────

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 403 = autenticado mas sem permissão (ex: renomear espaço sem ser MANAGER).
    // Rede de segurança: avisa o usuário com um motivo claro. Não bloqueia o
    // fluxo — a própria chamada ainda recebe o reject para tratar localmente.
    if (error.response?.status === 403 && !originalRequest?.skipAuth) {
      void notifyForbidden(error as AxiosError<ApiErrorResponse>);
      return Promise.reject(error);
    }

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Requests públicas (skipAuth) NUNCA disparam refresh nem redirect p/ /login.
    // A própria página trata o erro (ex: convite inválido/expirado).
    if (originalRequest.skipAuth) {
      return Promise.reject(error);
    }

    // Evita loop infinito se o próprio refresh falhou
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Se já há um refresh em andamento, enfileirar e aguardar
    if (isRefreshing) {
      return new Promise<AxiosResponse>((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { useAuthStore } = await import("@/lib/stores/auth");
      const { refreshToken } = useAuthStore.getState();

      // Instância separada para não acionar os interceptors novamente
      const refreshResponse = await axios.post<{
        accessToken: string;
        refreshToken: string;
      }>(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, { refreshToken });

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        refreshResponse.data;

      useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);
      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      const { useAuthStore } = await import("@/lib/stores/auth");
      useAuthStore.getState().clearSession();

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ─── Utilitários ─────────────────────────────────────────────────────────────

/**
 * Extrai a mensagem legível de um erro da API.
 *
 * Trata o campo `message` do backend (NestJS) que pode ser string ou array.
 */
export function getApiErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const message = axiosError.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
  }
  return "Erro inesperado";
}

export { api };
export default api;
