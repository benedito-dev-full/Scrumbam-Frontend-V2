import { api } from "@/lib/api";
import type {
  NexusChatHistoryQuery,
  NexusChatHistoryResponse,
  NexusMessage,
  SendNexusMessageDto,
} from "@/lib/types/nexus";

/**
 * Serviço HTTP do chat Nexus (backend V2 — Sprint B.2).
 *
 * Wrappers finos sobre o axios singleton (`@/lib/api`), que já injeta o
 * Bearer token e cuida de refresh em 401. Tratamento de erro é
 * responsabilidade das camadas superiores (hooks React Query) —
 * deixamos a `AxiosError` propagar naturalmente via `await`.
 *
 * @see `@/lib/types/nexus` para os contratos HTTP.
 */

/**
 * Envia mensagem do usuário ao Nexus e recebe a resposta do assistant.
 *
 * Internamente o backend carrega o histórico, encaminha para o Gemini,
 * executa tools quando necessário, persiste user+assistant e retorna
 * APENAS a mensagem do ASSISTANT.
 *
 * @param dto Conteúdo da mensagem do usuário (1–10000 caracteres).
 * @returns Mensagem do assistant gerada pela IA.
 * @throws {AxiosError} 400 se conteúdo inválido,
 *                     502 erro de configuração Gemini,
 *                     503 rate limit Gemini,
 *                     504 timeout (30s).
 */
export async function sendMessage(
  dto: SendNexusMessageDto,
): Promise<NexusMessage> {
  const res = await api.post<NexusMessage>("/ai/chat", dto);
  return res.data;
}

/**
 * Lista mensagens do chat Nexus com paginação por cursor (ASC).
 *
 * @param query Cursor e limite opcionais (default backend: limit=50).
 * @returns Página de mensagens (ordem cronológica) e cursor para o passado.
 * @throws {AxiosError} 401 se não autenticado.
 */
export async function fetchHistory(
  query?: NexusChatHistoryQuery,
): Promise<NexusChatHistoryResponse> {
  const res = await api.get<NexusChatHistoryResponse>("/ai/chat/history", {
    params: query,
  });
  return res.data;
}

/**
 * Apaga (soft-delete) toda a conversa atual do usuário.
 *
 * Útil para "Nova conversa". O backend marca as DEventos como excluídas
 * mas mantém os registros para auditoria.
 *
 * @returns `{ cleared: true }` quando OK.
 * @throws {AxiosError} 401 se não autenticado.
 */
export async function clearHistory(): Promise<{ cleared: boolean; count: number }> {
  const res = await api.delete<{ cleared: boolean; count: number }>(
    "/ai/chat/history",
  );
  return res.data;
}
