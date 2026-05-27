/**
 * Tipos do chat Nexus (IA) — contrato HTTP do backend V2.
 *
 * Endpoints:
 * - `POST /ai/chat` → envia mensagem do usuário; backend persiste user+assistant,
 *   executa Gemini + tools, retorna a mensagem do ASSISTANT.
 * - `GET  /ai/chat/history?cursor=&limit=` → histórico paginado (ASC, cronológico).
 * - `DELETE /ai/chat/history` → soft-delete da conversa (opcional v1).
 *
 * BigInts são serializados como string (ADR-V2-025).
 *
 * @see Backend `AIChatModule` (Sprint B.2 — chat Nexus).
 */

/** Papel da mensagem na conversa. */
export type NexusMessageRole = "user" | "assistant";

/**
 * Mensagem do chat Nexus retornada pelo backend.
 *
 * O mesmo shape vale para o resultado de `POST /ai/chat` (assistant) e para
 * cada item de `GET /ai/chat/history` (user ou assistant).
 */
export interface NexusMessage {
  /** Chave do DEvento serializada como string. */
  id: string;
  /** Origem da mensagem (`user` digitou; `assistant` foi gerada pela IA). */
  role: NexusMessageRole;
  /** Conteúdo textual da mensagem (1–10000 caracteres). */
  content: string;
  /** Modelo que gerou a resposta (apenas para `role: 'assistant'`). */
  model?: string;
  /** ISO 8601 da criação da mensagem. */
  createdAt: string;
  /** Metadados opcionais (tokens consumidos, tool calls invocadas, etc.). */
  metaDados?: {
    tokens?: number;
    toolCalls?: unknown[];
  };
}

/**
 * Payload aceito por `POST /ai/chat`.
 *
 * O backend cuida do histórico — frontend NÃO envia array de mensagens.
 */
export interface SendNexusMessageDto {
  /** Conteúdo da mensagem do usuário (1–10000 caracteres, validado no backend). */
  content: string;
}

/**
 * Query string aceita por `GET /ai/chat/history`.
 *
 * Paginação por cursor para carregar mensagens MAIS ANTIGAS.
 */
export interface NexusChatHistoryQuery {
  /** Cursor opaco retornado em `nextCursor` da página anterior. */
  cursor?: string;
  /** Tamanho da página (default backend: 50). */
  limit?: number;
}

/**
 * Resposta paginada de `GET /ai/chat/history`.
 *
 * Ordem: ASC (cronológica — mais antigas primeiro).
 * `nextCursor === null` indica fim do histórico.
 */
export interface NexusChatHistoryResponse {
  items: NexusMessage[];
  nextCursor: string | null;
}
