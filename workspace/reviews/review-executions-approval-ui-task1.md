# Review Report: Task 1 - UI de Aprovar/Rejeitar execucoes de IA

**Reviewed by:** Reviewer Agent
**Date:** 2026-11-23
**Module:** executions (drawer de task / IA)
**Gate:** nota minima 8.5 (decisao do CEO)

---

## Resultado Final (Ciclo 2 - ATUAL)

### APPROVED - Score: 9.0/10

Os 2 achados ALTOS e os 3 MEDIOS do ciclo 1 foram corrigidos e verificados no codigo. Build, tsc e eslint passam. Sem loop de refetch. Restam apenas observacoes menores.

---

## Testes Automatizados (Ciclo 2)

| Check | Status | Detalhes |
|-------|--------|----------|
| Build | PASS | next build compilou |
| TypeScript | PASS | 0 errors |
| Tests | N/A | projeto sem suite |
| ESLint | PASS | 0 errors, 0 warnings nos 7 arquivos tocados (incl. query-keys.ts) |

## Conformidade com o Plano

**Plan consultado:** workspace/plans/plan-executions-approval-ui-task1.md

| # | Item | Resultado | Detalhes |
|---|------|-----------|----------|
| CF-1 | Fases implementadas | 1/1 | card, modal, estados rejeitada/expirada, erros |
| CF-2 | Arquivos previstos | 6/6 | + query-keys.ts (extra aceitavel) |
| CF-3 | Endpoints previstos | 3/3 | GET /executions/:id, POST approve, POST reject |
| CF-4 | Desvios | 3 | fallback activeExecution; canManage como fallback de myRole; id do rejeitador sem nome |
| CF-5 | Desvios justificados | S | documentados no impl notes |

**Score de Conformidade:** 100%. **Classificacao:** perfeita.

## Verificacao dos achados do ciclo 1

- **H1 (reconciliacao do card) - RESOLVIDO.** `task-detail-drawer-ai.tsx`: sem store, `view` e derivado de `buildExecution(detail.data)` quando o detalhe carrega (fallback para `activeExecution` ate la). Quando o status real deixa de ser awaiting_approval, `isAwaiting` fica falso, o card some e aparece o estado real (processando, rejeitada com motivo, expirada). Sem useEffect de fetch. `ApprovalCard` esconde Aprovar/Rejeitar e o aviso de membro quando `expiresAt <= now` (relogio de 30s) e exibe "Aprovacao expirada".
- **H2 (400 como estado velho) - RESOLVIDO.** `useExecutionDecision`: 400 e 409 fazem refetch; so trata como estado velho (toast info + `onDecided` + retorna true) se o status real nao e mais awaiting_approval. Se ainda aguarda (400 de validacao, ex.: motivo curto) ou o refetch falha, cai em `toast.error(errorMessage(err))` com a mensagem do backend e retorna false. Nao mascara 400 de validacao.
- **M1 - RESOLVIDO.** `open={rejectOpen && !decision.forbidden}` fecha o dialog no 403.
- **M2 - RESOLVIDO.** `useExecutionDetail(id, poll)`: `poll = !execution`. Com store, `pollExecution` e o unico polling; o detalhe e buscado uma vez (so enquanto awaiting, para risco/expiracao) e `detailId` vira null quando o store sai de awaiting. Sem store, so o detalhe faz polling (5s) e para ao sair de awaiting.
- **M3 - RESOLVIDO.** `qk.executions.byId` em `src/lib/query-keys.ts`; nenhuma key local restante.

## Atencao especial: invalidar ["tasks"] dentro da queryFn - sem loop

- A key invalidada (`qk.tasks.all` = ["tasks"]) nao casa com a key da propria query (["executions", id]); invalidar tasks nao refaz o detalhe.
- Polling do detalhe so ocorre com status awaiting; a invalidacao so dispara quando o status NAO e awaiting, ou seja, quando o polling ja esta desligado (`refetchInterval` retorna false).
- Refetch de tasks pode zerar `activeExecution`, o que torna `detailId` null e desabilita a query: converge, nao oscila. Se `activeExecution` seguir presente (execucao aprovada e rodando), o detalhe nao e repolled; so refaz em remount ou foco de janela, gerando no maximo uma invalidacao por evento, sem realimentacao.
- Observacao de estilo (MINOR): efeito colateral dentro de queryFn e menos idiomatico que reagir ao dado; funciona e e idempotente.

## Code Review

### CRITICO
1. Build: OK
2. TypeScript: OK
3. ESLint: OK
4. Seguranca: OK - texto React puro, zero `dangerouslySetInnerHTML`, nenhum NEXT_PUBLIC novo. Backend segue como autoridade (403).
5. Bundle/boundary: OK - 'use client' so em folhas; unico useEffect e o relogio (com cleanup); fetch via TanStack Query/mutation.

### ALTO
6-10: OK (RHF + zod, query keys centralizadas, invalidacao correta, zero any, zero console.log).

### MEDIO
11. Imports: OK. 12. Acessibilidade: OK (label/htmlFor, aria-invalid, role=alert, foco do Dialog). Mojibake corrigido nos arquivos tocados.

## Issues Encontrados

**CRITICAL:** nenhum.
**MEDIUM:** nenhum.
**MINOR (nao bloqueantes):**
- Efeito colateral (invalidate) dentro da queryFn de `useExecutionDetail`.
- `friendlyRiskReason`: regex generico pode apagar texto com barras; mitigado pelo fallback.
- Quem nao disparou perde o estado terminal quando `activeExecution` volta a null (limitacao documentada; sem historico no front).
- Sem testes automatizados (projeto nao tem suite).

## Historico

- Ciclo 1: 8.0 de nota, decisao de pedir mudancas por estado velho do card do gestor e por tratamento incompleto do 400. Corrigido no ciclo 2.

## Decisao: APPROVED

**Justificativa:** Contrato com o backend correto, achados do ciclo 1 resolvidos sem regressao, qualidade acima do gate de 8.5.
**Proximo:** Documenter.
