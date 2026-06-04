"use client";

import { io, type Socket } from "socket.io-client";

/**
 * Envelope de evento de tempo real enviado pelo backend para a sala
 * `list:{listId}` no canal único `'list:event'`.
 *
 * Estratégia "avisar para invalidar": o servidor manda apenas o mínimo —
 * o front reage disparando `invalidateQueries` (NÃO recebe o patch da
 * entidade). Contrato fechado com o backend (ADR-V2-063).
 *
 * @see useSocketEvents — consumidor que invalida as queries da lista
 * @see useListRoom — entra/sai da sala `list:{listId}`
 */
export interface ListEventEnvelope {
  /**
   * Tipo do evento de board. Um dos 7 do contrato:
   * `task.created` | `task.updated` | `task.status.changed` | `task.deleted` |
   * `block.created` | `block.updated` | `block.deleted`.
   */
  event: string;
  /** Chave do DProject (List) — a sala de onde veio o evento. */
  listId: string;
  /** Chave da entidade afetada (task ou block). */
  entityId: string;
  /**
   * `entidadeId` de quem causou a mudança. Usado para filtrar o "eco" da
   * própria ação (front ignora eventos cujo `actorId` é o próprio usuário).
   * Pode ser `''` quando a origem não tem ator (ex.: automação).
   */
  actorId: string;
}

/**
 * Detecta o modo mock/offline — quando o front roda sem backend real.
 *
 * Sem `NEXT_PUBLIC_API_URL` (ou com `NEXT_PUBLIC_MOCK_AUTH=true`), o socket
 * vira no-op: `getSocket` retorna `null` e os hooks de realtime não fazem nada.
 * Espelha a mesma detecção usada em `src/lib/api.ts`.
 */
function isMockMode(): boolean {
  return (
    process.env.NEXT_PUBLIC_MOCK_AUTH === "true" ||
    !process.env.NEXT_PUBLIC_API_URL
  );
}

/**
 * Origem (protocolo + host) da API, SEM o caminho.
 *
 * `NEXT_PUBLIC_API_URL` inclui o prefixo HTTP `/api/v1` (ex.:
 * `https://api.scrumban.com.br/api/v1`), mas o gateway WebSocket vive no
 * namespace `/realtime` na RAIZ do servidor — o `setGlobalPrefix` do NestJS
 * só afeta rotas HTTP, não namespaces Socket.io. Por isso extraímos apenas a
 * origem e descartamos `/api/v1`.
 *
 * @example `https://api.scrumban.com.br/api/v1` → `https://api.scrumban.com.br`
 */
function apiOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "";
  try {
    return new URL(raw).origin;
  } catch {
    // Fallback: corta tudo a partir de `/api` se não for uma URL absoluta válida.
    return raw.replace(/\/api(\/v\d+)?\/?$/, "");
  }
}

/**
 * URL de conexão do Socket.io: `{origin}/realtime`. O socket.io-client
 * interpreta o caminho como o NAMESPACE — então conecta no host raiz e
 * entra no namespace `/realtime`.
 */
function realtimeUrl(): string {
  return `${apiOrigin()}/realtime`;
}

let socket: Socket | null = null;

/**
 * Retorna o singleton do Socket.io conectado ao namespace `/realtime`,
 * criando-o na primeira chamada. Reusa a MESMA conexão entre todas as
 * salas/abas da aplicação.
 *
 * O JWT vai no handshake via `auth: { token }` (o `WsJwtGuard` do backend
 * aceita essa via). Em modo mock, retorna `null` (no-op).
 *
 * @param token - Access token JWT do usuário autenticado.
 * @returns O socket conectado, ou `null` em modo mock / sem token.
 *
 * @example
 * ```ts
 * const socket = getSocket(accessToken);
 * socket?.emit("join:list", { listId });
 * ```
 */
export function getSocket(token: string | null): Socket | null {
  // [DIAG] temporário — remover após confirmar a causa do socket não conectar.
  if (typeof window !== "undefined") {
    console.warn("[realtime] getSocket", {
      mock: isMockMode(),
      hasToken: !!token,
      apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "(undefined)",
      mockAuth: process.env.NEXT_PUBLIC_MOCK_AUTH ?? "(undefined)",
      url: realtimeUrl(),
    });
  }

  if (isMockMode() || !token) return null;

  if (!socket) {
    socket = io(realtimeUrl(), {
      auth: { token },
      // Mantém o polling como fallback: atrás de proxy (Traefik/Dokploy) o
      // upgrade direto pra WebSocket pode falhar silenciosamente. O socket.io
      // começa em polling e faz upgrade pra ws quando possível.
      transports: ["polling", "websocket"],
      withCredentials: true,
      autoConnect: true,
    });
    // [DIAG] temporário — observabilidade da conexão.
    socket.on("connect", () => console.warn("[realtime] connected", socket?.id));
    socket.on("connect_error", (err) =>
      console.error("[realtime] connect_error", err.message),
    );
    socket.on("joined:list", (d) => console.warn("[realtime] joined:list", d));
    socket.on("list:event", (d) => console.warn("[realtime] list:event", d));
  } else if (socket.auth && typeof socket.auth === "object") {
    // Token pode ter sido renovado (refresh) — mantém o handshake atual.
    (socket.auth as { token?: string }).token = token;
  }

  return socket;
}

/**
 * Desconecta e descarta o singleton. Chamar no logout para encerrar a
 * conexão de tempo real e liberar a sala no servidor.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
