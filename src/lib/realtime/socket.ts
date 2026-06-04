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
 * URL base do namespace `/realtime`. O WebSocket sobe na MESMA origem do
 * HTTP da API (Traefik/Dokploy repassa o upgrade), então reusamos
 * `NEXT_PUBLIC_API_URL`.
 */
function realtimeUrl(): string {
  return `${process.env.NEXT_PUBLIC_API_URL ?? ""}/realtime`;
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
  if (isMockMode() || !token) return null;

  if (!socket) {
    socket = io(realtimeUrl(), {
      auth: { token },
      transports: ["websocket"],
      autoConnect: true,
    });
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
