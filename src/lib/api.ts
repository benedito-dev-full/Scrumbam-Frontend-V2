import axios from "axios";
import type {
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { performRefresh } from "@/lib/auth/refresh";
import type { ApiErrorResponse } from "@/lib/types/api";

// Augmenta o config do axios com `skipAuth`: quando true, a request não anexa
// o token da sessão nem dispara refresh/redirect em 401 (usado em rotas
// públicas como aceitar convite).
declare module "axios" {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
  }
}

/** Config interno com os flags de controle do interceptor. */
type RetryableConfig = InternalAxiosRequestConfig & {
  /** Já passou por um ciclo de refresh — não tenta de novo (anti-loop). */
  _retry?: boolean;
  /** Nº de tentativas já feitas para um 503 de infra. */
  _infraRetries?: number;
};

// ─── Códigos de erro do backend (contrato: docs/auth-error-codes.md) ─────────

/**
 * `code` machine-readable devolvido pelo backend a partir da F1 (RFC 9457 —
 * Problem Details). Antes da F1 o filter DESCARTAVA este campo, e o frontend
 * tratava todo 401 da mesma forma: refresh ou logout, no escuro.
 */
type AuthErrorCode =
  | "TOKEN_INVALID"
  | "TOKEN_EXPIRED"
  | "SESSION_REVOKED"
  | "SESSION_REUSE_DETECTED"
  | "ORG_CONTEXT_STALE"
  | "NO_WORKSPACE"
  | "FORBIDDEN_ROLE"
  | "AUTH_BACKEND_UNAVAILABLE"
  | "INTERNAL_ERROR";

/**
 * 401 em que a sessão está comprovadamente morta no servidor: tentar refresh
 * seria inútil (e, no caso de reuse, ruidoso). Logout imediato.
 */
const HARD_LOGOUT_CODES: ReadonlySet<string> = new Set<AuthErrorCode>([
  "TOKEN_INVALID",
  "SESSION_REVOKED",
  "SESSION_REUSE_DETECTED",
]);

/**
 * 401 recuperável por rotação de token:
 *  - `TOKEN_EXPIRED`      → access token venceu (caso normal a cada 15 min);
 *  - `ORG_CONTEXT_STALE`  → o claim `organizationId` do JWT ficou obsoleto; o
 *    refresh reemite o token com a org correta (ou órfão, ADR-V2-038) e o
 *    request original é repetido. ZERO logout.
 *
 * `undefined` (backend antigo, sem `code`) também cai aqui — back-compat.
 */
const REFRESHABLE_CODES: ReadonlySet<string> = new Set<AuthErrorCode>([
  "TOKEN_EXPIRED",
  "ORG_CONTEXT_STALE",
]);

/** Backoff exponencial do 503 de infra: 1 s, 2 s, 4 s. Depois, desiste (SEM logout). */
const INFRA_MAX_RETRIES = 3;
const INFRA_BASE_DELAY_MS = 1000;

function errorCode(error: AxiosError): string | undefined {
  const data = error.response?.data as { code?: string } | undefined;
  return data?.code;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Controle de refresh (fila da própria aba) ───────────────────────────────
//
// A serialização entre ABAS mora em `lib/auth/refresh.ts` (Web Locks). Aqui só
// enfileiramos os requests DESTA aba que tomaram 401 enquanto um refresh já
// estava em voo — para que eles sejam repetidos com o token novo em vez de
// dispararem N refreshes concorrentes.

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

/** Encerra a sessão local e manda o usuário para o login. */
async function forceLogout(): Promise<void> {
  const { useAuthStore } = await import("@/lib/stores/auth");
  useAuthStore.getState().clearSession();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
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
async function notifyForbidden(
  error: AxiosError<ApiErrorResponse>,
): Promise<void> {
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

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "";

// Em modo mock não precisamos da URL do backend — só avisamos em dev se ambos estão ausentes
if (
  !baseURL &&
  process.env.NEXT_PUBLIC_MOCK_AUTH !== "true" &&
  process.env.NODE_ENV === "development"
) {
  console.warn(
    "[api] NEXT_PUBLIC_API_URL não definida — adicione NEXT_PUBLIC_MOCK_AUTH=true ao .env.local para modo offline",
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
    const originalRequest = error.config as RetryableConfig | undefined;
    const status = error.response?.status;
    const code = errorCode(error);

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // ─── 503 — falha de INFRAESTRUTURA (nunca é logout) ─────────────────────
    //
    // Par frontend do item 1.5 do backend: pool do Postgres esgotado, timeout,
    // Redis fora. Antes isso virava 401 e o usuário era DESLOGADO por lentidão
    // de banco (RFC 6750: 401 significa `invalid_token` — um pool esgotado NÃO
    // é token inválido). Agora o backend devolve 503 AUTH_BACKEND_UNAVAILABLE e
    // aqui a resposta é BACKOFF + RETRY. Nunca `clearSession`, nunca /login.
    if (status === 503 || code === "AUTH_BACKEND_UNAVAILABLE") {
      const attempts = originalRequest._infraRetries ?? 0;
      if (attempts >= INFRA_MAX_RETRIES) {
        // Desistimos do request — o chamador mostra o erro. A SESSÃO CONTINUA.
        return Promise.reject(error);
      }
      originalRequest._infraRetries = attempts + 1;
      await sleep(INFRA_BASE_DELAY_MS * 2 ** attempts); // 1 s, 2 s, 4 s
      return api(originalRequest);
    }

    // 403 = autenticado mas sem permissão (ex: renomear espaço sem ser MANAGER).
    // Rede de segurança: avisa o usuário com um motivo claro. Não bloqueia o
    // fluxo — a própria chamada ainda recebe o reject para tratar localmente.
    if (status === 403 && !originalRequest.skipAuth) {
      void notifyForbidden(error as AxiosError<ApiErrorResponse>);
      return Promise.reject(error);
    }

    if (status !== 401) {
      return Promise.reject(error);
    }

    // Requests públicas (skipAuth) NUNCA disparam refresh nem redirect p/ /login.
    // A própria página trata o erro (ex: convite inválido/expirado).
    if (originalRequest.skipAuth) {
      return Promise.reject(error);
    }

    // ─── 401 terminal — a sessão morreu no servidor ─────────────────────────
    // Refresh aqui seria inútil (TOKEN_INVALID/SESSION_REVOKED) ou ruidoso
    // (SESSION_REUSE_DETECTED — sem mensagem amigável, por contrato).
    if (code && HARD_LOGOUT_CODES.has(code)) {
      await forceLogout();
      return Promise.reject(error);
    }

    // 401 com `code` conhecido que NÃO é refreshável nem terminal (ex: um code
    // novo do backend) — não inventamos comportamento: propaga.
    if (code && !REFRESHABLE_CODES.has(code)) {
      return Promise.reject(error);
    }

    // Evita loop infinito: este request já voltou de um ciclo de refresh.
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Se já há um refresh em andamento NESTA aba, enfileirar e aguardar.
    if (isRefreshing) {
      return new Promise<AxiosResponse>((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            // ANTI-LOOP (2.3b): o request da fila também precisa carregar
            // `_retry`. Sem isso, se o token novo ainda tomasse 401, ele
            // dispararia OUTRO refresh — o anti-loop era furado justamente
            // para os requests enfileirados (a maioria, numa tela cheia).
            originalRequest._retry = true;
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
      // Um refresh por NAVEGADOR (Web Locks) + guard de refreshToken nulo +
      // baseURL do axios. Tudo em `lib/auth/refresh.ts`.
      const newAccessToken = await performRefresh();

      // Sem refresh token: não há o que renovar (antes, o interceptor mandava
      // `{ refreshToken: undefined }` ao backend e se auto-deslogava com o 401
      // resultante).
      if (!newAccessToken) {
        const noSession = new Error("Sessão ausente — refresh impossível");
        processQueue(noSession, null);
        await forceLogout();
        return Promise.reject(error);
      }

      processQueue(null, newAccessToken);
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      // O refresh falhou por INFRA? Então a sessão pode estar viva — não
      // deslogamos. O request é rejeitado e a tela mostra erro.
      const refreshStatus = (refreshError as AxiosError).response?.status;
      const refreshCode = errorCode(refreshError as AxiosError);
      if (refreshStatus === 503 || refreshCode === "AUTH_BACKEND_UNAVAILABLE") {
        return Promise.reject(refreshError);
      }

      await forceLogout();
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
  if (typeof error === "object" && error !== null && "response" in error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const message = axiosError.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
  }
  return "Erro inesperado";
}

export { api };
export default api;
