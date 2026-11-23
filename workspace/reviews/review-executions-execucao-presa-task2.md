# Review Report: Task 2 - Execucao presa (F-1 / F-2 / F-3) - Frontend

**Reviewed by:** Reviewer Agent
**Date:** 2026-11-23
**Module:** executions
**Rodada atual:** Re-review (Ciclo 2). A rodada anterior esta preservada no fim do arquivo.

---

## Resultado Final (rodada atual)

### APPROVED - Score: 9.2/10

M1 resolvido: F-2 agora le `outcome.reason` (campo estruturado exposto pelo backend), sem casamento por substring.
Os 8 codigos batem 100% com `EXECUTION_FAILURE_REASONS`; mapa exaustivo tipado; fallback seguro para backend antigo.
F-1 e UI de aprovacao intactos. Ressalva: o backend (`outcome` no DTO) ainda nao esta commitado - deploy conjunto.

---

## Testes Automatizados

| Check | Status | Detalhes |
|-------|--------|----------|
| Build | PASS | `npm run build` compilado com sucesso |
| TypeScript | PASS | `npx tsc --noEmit` 0 errors |
| Tests | N/A | projeto sem suite |
| ESLint | PASS | 0 errors, 0 warnings (3 arquivos tocados) |

## Conformidade com o Plano

Plan N/A no frontend; contrato do backend como fonte. CF-1 3/3 fases, CF-2 3/3 arquivos, CF-3 1/1 endpoint,
CF-4 0 desvios, CF-5 N/A. Conformidade ~100%.

## Verificacao do Ciclo 2

- **Tipos x backend (100%):** `ExecutionFailureReason` tem os 8 codigos exatos de `EXECUTION_FAILURE_REASONS`
  (TIMEOUT_NO_CALLBACK, AGENT_RESTARTED, QUEUE_STALE, TUNNEL_UNAVAILABLE, DISPATCH_FAILED, PROJECT_BUSY_EXHAUSTED,
  DUPLICATE_TASK_EXECUTION, BACKFILL_STALE). `ExecutionOutcomeDto {reason, source: 'agent'|'system'|null}` espelha
  `toOutcome()` (reason so com source=system; ambos null sem desfecho; legado sem source vira 'agent').
- **Processor grava reason canonico:** TUNNEL_UNAVAILABLE, PROJECT_BUSY_EXHAUSTED e DUPLICATE_TASK_EXECUTION passam o
  codigo; DISPATCH_FAILED e o default; sweeper/backfill gravam os demais. Agora os 8 chegam de fato ao front.
- **Mapa exaustivo:** `Record<ExecutionFailureReason, string>` - codigo novo no union sem texto quebra o tsc.
  `Object.hasOwn` protege contra valor desconhecido em runtime (backend mais novo) -> fallback "Execucao falhou".
- **Backend antigo:** `outcome?` opcional; `data.outcome?.reason ?? current?.failureReason ?? null` -> null, painel
  mostra "Execucao falhou". Sem crash. `stderr` nunca mais usado/renderizado.
- **F-1:** inalterado; `adoptExecution` agora retorna `TaskExecution` (todas as chamadas existentes ignoram o
  retorno, compativel); toast so se nao-terminal. Polling nao duplica (abort antes de novo controller).
- **UI de aprovacao (d1136b0):** sem mudanca de fluxo; literal de `view` no drawer ganhou `failureReason: null`
  (unico outro uso de `failureReason`). Nenhuma regressao.
- **Acessibilidade/PT-BR:** textos acentuados e claros; toasts do sonner sao aria-live.

## Code Review (12 Items)

CRITICO 1-5: OK (build, tsc, eslint, sem secrets/XSS, boundary inalterado). ALTO 6-10: OK (zero any, zero console.log).
MEDIO 11-12: OK.

## Issues Encontrados

**CRITICAL / MEDIUM:** nenhum.

**MINOR**
- m1 `buildExecution`: `outcome.reason ?? current?.failureReason` preserva um motivo antigo se uma execucao falha
  pelo sistema for depois superada por callback tardio (outcome vira source=agent, reason=null) e acabar em
  falha real; o painel mostraria o motivo sistemico antigo. Caso raro; considerar usar `data.outcome ? data.outcome.reason : current...`.
- m2 Dependencia de deploy: sem o backend com `outcome` o F-2 degrada para a mensagem generica (aceitavel, documentado).
- m3 Bloco de falha sem `role="alert"` (pre-existente).

## Decisao: APPROVED

**Justificativa:** Todos os criticos e altos ok; M1 do ciclo anterior corrigido com contrato estruturado verificado
contra o codigo atual do backend; sem regressoes. Score 9.2 >= gate 8.5.
**Proximo:** Documenter (lembrar do deploy conjunto com o backend que expoe `outcome`).

---

# Historico - Rodada 1 (resultado superado)

## (rodada 1) Review Report: Task 2 - Execucao presa (F-1 / F-2 / F-3) - Frontend

**Reviewed by:** Reviewer Agent
**Date:** 2026-11-23
**Module:** executions

---

## Resultado Final

### NEEDS_CHANGES - Score: 7,5 de 10

F-1 (409 EXECUTION_IN_PROGRESS) e F-3 (JSDoc) estao corretos. F-2 (motivo amigavel) entrega so metade: o
casamento por substring em `claude.stderr` so funciona para os motivos gravados pelo sweeper/backfill
(TIMEOUT_NO_CALLBACK, AGENT_RESTARTED, QUEUE_STALE, BACKFILL_STALE). Quatro dos oito motivos mapeados nunca casam
na pratica, porque o processor grava no stderr uma MENSAGEM livre, nao o codigo do motivo. O gate e 8.5.

---

## Testes Automatizados

| Check | Status | Detalhes |
|-------|--------|----------|
| Build | PASS | `npm run build` OK |
| TypeScript | PASS | `npx tsc --noEmit` 0 errors |
| Tests | N/A | projeto sem suite |
| ESLint | PASS | 0 errors, 0 warnings nos 3 arquivos tocados |

## Conformidade com o Plano

**Plan consultado:** N/A - sem plan task2 no frontend; contrato do backend (impl task2, "Contrato para o frontend").

| # | Item | Resultado | Detalhes |
|---|------|-----------|----------|
| CF-1 | Fases implementadas | 3/3 | F-1, F-2, F-3 |
| CF-2 | Arquivos previstos | 3/3 | hook, drawer, api.ts |
| CF-3 | Endpoints previstos | 1/1 | GET /executions/:id usado na adocao |
| CF-4 | Desvios | 1 | F-2 usa so stderr (audit nao exposto) - ver issue M1 |
| CF-5 | Justificados | S (parcial) | justificativa correta, mas conclusao "funciona para canonicos" e falsa |

**Score de Conformidade:** ~90% (alta)

## Verificacao detalhada

### F-1 - 409 EXECUTION_IN_PROGRESS (OK)
- Backend (`http-exception.filter.ts`): `code` na raiz e `details` repassado via whitelist `DETAILS_PASSTHROUGH_CODES`
  ({reason, executionId, status}). Frontend le `err.response.data.code` / `details.reason` / `details.executionId`:
  formato do axios correto. `api.ts` nao reescreve o erro (interceptor so trata 401/403/503), entao o corpo chega intacto.
- Distincao do 409 de Idempotency-Key: exige `code`/`reason` E `executionId`; qualquer outro 409 retorna null e segue o
  fluxo antigo. O front nem envia Idempotency-Key hoje. OK.
- Sem polling duplicado: `adoptExecution` faz `abortRef.current?.abort()` antes de criar novo controller; se status
  terminal, nao reinicia polling. Store compartilhado por taskId, entao `ExecuteCell`/Kanban/Drawer (todos via
  `useTaskExecution`) enxergam a adocao. UI de aprovacao (d1136b0) usa `execution?.executionId`/store: um 409 com
  `status=awaiting_approval` cai no mesmo caminho e o painel de aprovar/rejeitar aparece. Sem regressao.
- Falha do GET de adocao: toast de erro claro. `void adoptExisting` dentro de `onError` nao deixa promise solta sem catch.

### F-2 - Motivos amigaveis (PROBLEMA)
Nomes das chaves batem com `EXECUTION_FAILURE_REASONS` (6 de 6) + `QUEUE_STALE`; `TUNNEL_UNAVAILABLE` NAO e motivo
canonico do backend (e codigo de erro do probe). Porem o que chega em `claude.stderr` (unico campo exposto; `audit`
nao existe no `ExecutionResponseDto`, confirmado) e:

| Motivo | stderr real gravado | Casa por substring? |
|--------|---------------------|---------------------|
| TIMEOUT_NO_CALLBACK | `TIMEOUT_NO_CALLBACK` (sweeper: detail=reason) | SIM |
| AGENT_RESTARTED | `AGENT_RESTARTED` | SIM |
| QUEUE_STALE | `QUEUE_STALE` | SIM |
| BACKFILL_STALE | `BACKFILL_STALE` (script) | SIM |
| PROJECT_BUSY_EXHAUSTED | `PROJECT_BUSY: agente recusou N tentativas (projeto ocupado)` | NAO |
| DUPLICATE_TASK_EXECUTION | `Execucao <id> da mesma task ja esta RUNNING` | NAO |
| DISPATCH_FAILED | mensagem livre (ACK timeout, HTTP etc.) | NAO |
| TUNNEL_UNAVAILABLE | `probe.error` = `ECONNREFUSED`/`TUNNEL_TIMEOUT`/errno (so casa se errno ausente) | QUASE NUNCA |

Resultado: falha por projeto ocupado, duplicata e dispatch (as mais comuns para o usuario) continua mostrando
"Execucao falhou". O impl report afirma funcionar para os "motivos canonicos" - nao verificado contra o processor.

## Code Review (12 Items)

### CRITICO
1. Build: OK. 2. TypeScript: OK. 3. ESLint: OK. 4. Seguranca: OK (texto de stderr nunca renderizado cru; so mapa fixo).
5. Bundle/client boundary: OK (hook ja era client; `axios`/`sonner` ja dependencias do projeto).

### ALTO
6-8. N/A / OK (mutation existente; invalida `["tasks"]` via adoptExecution). 9. Zero `any` (usa type assertion tipada). 10. Zero console.log.

### MEDIO
11. Imports organizados. 12. Acessibilidade: texto PT-BR correto e acentuado; toasts do sonner sao aria-live. O
bloco de falha segue sem `role="alert"` (pre-existente, nao exigido).

## Issues Encontrados

**CRITICAL:** nenhum.

**MEDIUM**
- M1 `src/hooks/use-task-execution.ts` (`FAILURE_REASON_MESSAGES` / `friendlyFailureReason`): 4 dos 8 motivos nunca
  casam (tabela acima). Correcao recomendada (uma das):
  (a) preferida: backend expor `audit.outcome.reason` (e `source`) no `ExecutionResponseDto` e o front ler esse campo
      em vez de stderr (o contrato do backend ja o anuncia como fonte); ou backend prefixar o stderr com o codigo
      (`PROJECT_BUSY_EXHAUSTED: ...`);
  (b) paliativo no front: casar tambem padroes (`PROJECT_BUSY` -> PROJECT_BUSY_EXHAUSTED, `ja esta RUNNING` ->
      DUPLICATE_TASK_EXECUTION, ECONNREFUSED/TUNNEL_TIMEOUT -> tunel indisponivel) - fragil, acopla a texto livre.
  Em qualquer caso, corrigir a afirmacao no impl report e remover/justificar `TUNNEL_UNAVAILABLE`.

**MINOR**
- m1 Toast "Retomamos o acompanhamento dela" aparece mesmo quando a execucao adotada ja esta terminal (corrida);
  aceitavel.
- m2 Match por `includes` em stderr livre de uma falha real do Claude poderia casar um codigo por acaso (improvavel).

## Decisao: NEEDS_CHANGES

**Justificativa:** F-1 e F-3 prontos para merge; F-2 nao cumpre o objetivo para os motivos mais frequentes porque
depende de um contrato (stderr == codigo) que o backend so cumpre no sweeper/backfill. Score 7.5 < gate 8.5.
**Proximo:** Implementer corrige M1 (preferencialmente com ajuste de 1 linha no backend DTO para expor
`audit.outcome.reason`, ou fallback por padroes no front) e atualiza o impl report; re-review rapido.
