/**
 * Formata "desde X" de forma compacta em pt-BR ("há 5 min", "há 2 h", "há 1 d").
 *
 * Puramente visual — o backend é a fonte de verdade do `startedAt`. Usa
 * `Intl.RelativeTimeFormat` (sem dependência externa, compatível com o CSP).
 *
 * Extraído de `work-session-badge.tsx` (task #794) para reuso entre o badge
 * "em trabalho por Fulano" e o diálogo de confirmação de takeover (task #795).
 * Mantém o "há X" idêntico entre as duas superfícies.
 *
 * @param startedAt - ISO 8601 de início da sessão de trabalho.
 * @returns Texto relativo ("agora mesmo", "há 5 min", ...) ou "" se inválido.
 */
export function formatSince(startedAt: string): string {
  const startedMs = new Date(startedAt).getTime();
  if (!Number.isFinite(startedMs)) return "";
  const diffMs = Date.now() - startedMs;
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.round(hours / 24);
  return rtf.format(-days, "day");
}
