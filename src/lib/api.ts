import axios from "axios";
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import type { ApiErrorResponse } from "@/lib/types/api";

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

    if (error.response?.status !== 401) {
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
