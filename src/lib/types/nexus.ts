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
 * Provedores de IA suportados pelo backend multi-provider.
 *
 * A escolha vai como override no `POST /ai/chat`. Se ausente, o backend
 * resolve via preferência da org → fallback global (Gemini).
 *
 * @see Backend `AIChatModule` (feature multi-provider).
 */
export type AiProviderName = "gemini" | "claude" | "openai";

/**
 * Payload aceito por `POST /ai/chat`.
 *
 * O backend cuida do histórico — frontend NÃO envia array de mensagens.
 */
export interface SendNexusMessageDto {
  /** Conteúdo da mensagem do usuário (1–10000 caracteres, validado no backend). */
  content: string;
  /**
   * Override do provedor SÓ desta mensagem. Se ausente, backend usa a
   * preferência da org → senão Gemini (default).
   */
  provider?: AiProviderName;
  /**
   * Modelo específico (opcional, secundário). Mantido como hook para o
   * futuro — a UI atual seleciona apenas `provider`, não `model`.
   */
  model?: string;
}

/**
 * Disponibilidade de um provedor para a org atual (`GET /ai/providers`).
 *
 * `configured: true` significa que a org cadastrou chave OU (Gemini) que
 * há fallback global no servidor. Use para popular/desabilitar o seletor.
 */
export interface AiProviderAvailability {
  provider: AiProviderName;
  /** `true` se a org pode usar este provedor agora. */
  configured: boolean;
}

/**
 * Resposta de `GET /ai/providers` — disponibilidade de todos os provedores.
 *
 * Acessível a QUALQUER membro (não exige ADMIN).
 */
export interface AiProvidersResponse {
  providers: AiProviderAvailability[];
}

/**
 * Preferência default de provedor/modelo da organização.
 *
 * Retornada por `GET /ai/preference` (pode ser `null` quando não há
 * preferência ou não há org ativa) e aceita por `PUT /ai/preference`
 * (ADMIN-only).
 */
export interface AiProviderPreference {
  provider: AiProviderName;
  /** Modelo específico opcional. */
  model?: string;
}

/**
 * Chave de provedor da org, SEMPRE mascarada (`GET`/`POST /ai/keys`).
 *
 * O backend nunca devolve a chave crua — cifrada at-rest (AES-256-GCM).
 * Cadastrar de novo o mesmo provider = rotação (substitui, não duplica).
 */
export interface AiKeyMasked {
  provider: AiProviderName;
  /** Prefixo legível da chave (ex.: `sk-ant-`). */
  prefix: string;
  /** Chave mascarada para exibição (ex.: `sk-ant-…f3a9`). */
  masked: string;
  configured: boolean;
  /** ISO 8601 da criação. */
  createdAt: string;
  /** ISO 8601 da última rotação. */
  lastRotatedAt: string;
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
