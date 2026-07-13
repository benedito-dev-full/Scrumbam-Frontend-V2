/**
 * Chaves de storage da sessão — fonte única.
 *
 * Isolado em módulo próprio para que `session-sync.ts` (que compara
 * `event.key` do evento `storage`) e `stores/auth.ts` (que define o `name` do
 * middleware `persist`) não fiquem acoplados nem dupliquem a string.
 */

/** Chave usada pelo middleware `persist` do Zustand para a sessão. */
export const AUTH_STORAGE_KEY = "scrumbam-auth";
