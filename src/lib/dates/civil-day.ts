/**
 * Dia civil — a fonte única para decidir "atrasada" vs "vence hoje".
 *
 * ## O problema que isto resolve
 *
 * `dueDate` é uma **data civil** ("dia 13 de julho"), mas o backend a persiste
 * como um **instante**: `new Date('2026-07-13')` → `2026-07-13T00:00:00.000Z`,
 * ou seja, meia-noite em UTC — que em America/Sao_Paulo é **21:00 do dia 12**.
 *
 * Comparar esse instante com `new Date()` faz toda task que vence hoje nascer
 * "atrasada" às 21h do dia anterior. O bug não é o operador de comparação: é
 * comparar instante onde se deveria comparar dia.
 *
 * ## A regra
 *
 * Compare sempre **strings de dia civil** (`"2026-07-13"`), nunca timestamps:
 *
 * ```
 * atrasada    →  dia(dueDate) <  dia(hoje)   — o prazo JÁ PASSOU
 * vence hoje  →  dia(dueDate) === dia(hoje)  — ainda tem o dia inteiro
 * ```
 *
 * Uma task com prazo hoje **não está atrasada**: ela vence hoje. Só passa a
 * estar atrasada quando o dia vira.
 */

/** Timezone de operação do produto. */
export const APP_TIMEZONE = "America/Sao_Paulo";

/**
 * Extrai o dia civil (`"yyyy-MM-dd"`) de um `dueDate` vindo da API.
 *
 * Lê os 10 primeiros caracteres do ISO — que são a data civil que o usuário
 * escolheu. **Não** converte de timezone: converter reintroduziria exatamente
 * o off-by-one que esta função existe para evitar (00:00Z vira o dia anterior
 * em qualquer fuso a oeste de Greenwich).
 *
 * @param dueDate - ISO 8601 (`"2026-07-13"` ou `"2026-07-13T00:00:00.000Z"`).
 * @returns `"yyyy-MM-dd"`, ou `null` se não houver data.
 */
export function toCivilDay(
  dueDate: string | Date | null | undefined,
): string | null {
  if (!dueDate) return null;
  const iso = dueDate instanceof Date ? dueDate.toISOString() : dueDate;
  const day = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

/**
 * O dia civil de hoje em {@link APP_TIMEZONE}, como `"yyyy-MM-dd"`.
 *
 * Usa `en-CA`, cujo formato de data já é ISO — evita montar a string à mão a
 * partir de `getFullYear/getMonth/getDate`, que leriam o fuso da máquina do
 * usuário (um usuário em Lisboa veria o dia errado).
 */
export function todayCivilDay(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE });
}

/**
 * `true` se o prazo já passou — isto é, se o dia do prazo é **anterior** a hoje.
 *
 * Uma task que vence hoje retorna `false` (ela tem o dia todo). Não considera
 * o status da task; quem precisa ignorar tasks concluídas deve checar isso
 * antes (ver `isOverdue` em `task-status.mapper.ts`).
 */
export function isPastDue(dueDate: string | Date | null | undefined): boolean {
  const day = toCivilDay(dueDate);
  return day !== null && day < todayCivilDay();
}

/** `true` se o prazo é exatamente hoje. */
export function isDueOnToday(
  dueDate: string | Date | null | undefined,
): boolean {
  const day = toCivilDay(dueDate);
  return day !== null && day === todayCivilDay();
}

/**
 * Dias inteiros de atraso: positivo = atrasada, `0` = vence hoje, negativo =
 * ainda no futuro. Conta **dias de calendário**, não frações de dia — uma task
 * concluída às 23h do dia do prazo tem 0 dias de atraso, não 0,96.
 */
export function delayInDays(
  dueDate: string | Date | null | undefined,
  reference: string = todayCivilDay(),
): number | null {
  const day = toCivilDay(dueDate);
  if (!day) return null;
  const MS_PER_DAY = 86_400_000;
  const diff =
    Date.parse(`${reference}T00:00:00Z`) - Date.parse(`${day}T00:00:00Z`);
  return Math.round(diff / MS_PER_DAY);
}
