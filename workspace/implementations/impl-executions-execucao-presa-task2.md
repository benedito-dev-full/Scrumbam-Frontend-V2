# Implementation Notes - Task 2 (execucao presa, par do backend task2)

**Implemented by:** Implementer Agent | **Date:** 2026-11-23 | **Module:** executions

## Arquivos Modificados
- `src/hooks/use-task-execution.ts` — F-1: `onError` do `executeMutation` detecta 409 com `code=EXECUTION_IN_PROGRESS` (ou `details.reason=execution_in_progress`), faz `GET /executions/{details.executionId}`, chama `adoptExecution` (retoma polling) e mostra toast informativo. 409 sem esse code (Idempotency-Key) segue fluxo antigo. F-2: `claude.stderr` mapeado em `TaskExecution.failureReason`; `friendlyFailureReason()` traduz motivos canonicos (TIMEOUT_NO_CALLBACK, AGENT_RESTARTED, PROJECT_BUSY_EXHAUSTED, DUPLICATE_TASK_EXECUTION, DISPATCH_FAILED, TUNNEL_UNAVAILABLE, QUEUE_STALE, BACKFILL_STALE).
- `src/components/tasks/task-detail-drawer-ai.tsx` — painel de falha mostra motivo amigavel (fallback "Execucao falhou"); literal de `TaskExecution` ganhou `failureReason: null`.
- `src/lib/types/api.ts` — F-3: JSDoc de `ActiveExecutionDto.status` corrigido.

## Decisoes / Desvios
- F-2: o DTO de resposta so expoe `claude.stderr` (nao `audit.outcome.reason`); uso stderr com match por substring. stderr livre (falha real do Claude) nao casa e cai em "Execucao falhou".
- `movedBy`: nao e exibido em nenhum lugar do frontend (grep vazio) — nada a tratar.
- Sem commit/push. Sem testes automatizados no projeto; 409 real nao exercitado contra backend.

## Metrics
- `npm run build`: PASS | `npx tsc --noEmit`: 0 erros | `npx eslint src/hooks src/components/tasks src/lib/types`: 0 erros/warnings

---

## Ciclo 2 (correcoes do review NEEDS_CHANGES 7.5)

- **M1 (F-2):** removido o casamento por substring em `claude.stderr` (a afirmacao do Ciclo 1 de que "funciona para canonicos" estava errada: so valia para sweeper/backfill). Agora o motivo vem de `outcome.reason` (backend expoe `outcome: { reason, source }`; `reason` so com `source='system'`).
  - `src/lib/types/api.ts`: novos `ExecutionFailureReason` (union dos 8 codigos exatos) e `ExecutionOutcomeDto`.
  - `src/hooks/use-task-execution.ts`: `ExecutionResponseDto.outcome?` (opcional p/ backends antigos); `TaskExecution.failureReason: ExecutionFailureReason | null` derivado de `outcome.reason`; `FAILURE_REASON_MESSAGES: Record<ExecutionFailureReason, string>` exaustivo (TS acusa codigo novo sem texto); `friendlyFailureReason` retorna `null` para ausente/desconhecido, e o painel cai em "Execucao falhou". `stderr` removido do tipo.
  - `TUNNEL_UNAVAILABLE` mantido: agora e um dos 8 codigos canonicos confirmados em `execution-lifecycle.const.ts`.
- **m1:** `adoptExecution` agora retorna o `TaskExecution`; o toast "Ja existe uma execucao em andamento / Retomamos..." so aparece se a execucao adotada nao for terminal.
- **m2:** resolvido (sem match por substring).
- Metrics: `npm run build` PASS | `npx tsc --noEmit` 0 erros | `npx eslint src/hooks src/components/tasks src/lib/types` 0 problemas. Sem commit.
