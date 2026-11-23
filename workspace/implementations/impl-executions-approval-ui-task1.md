# Implementation Notes - Task 1

**Implemented by:** Implementer Agent
**Date:** 2026-11-23
**Module:** executions (tasks drawer / IA)
**Duration:** ~1 sessao

---

## Arquivos Criados/Modificados

- `src/hooks/use-task-execution.ts` — novos status `rejected`/`expired` (antes colapsavam em `failed`); store guarda `approval` (expiresAt, rejectedReason, rejectedBy) e `risk`; `buildExecution`/`deriveStatus` unificam mapeamento; `adoptExecution` exposto (grava no store, invalida `["tasks"]`, reinicia polling).
- `src/hooks/use-execution-approval.ts` (novo) — `useExecutionDetail` (GET /executions/:id, polling 5s enquanto awaiting), `useExecutionDecision` (POST approve/reject; 403 -> toast + esconde botoes; 409 -> toast + refetch e adota estado atual; demais -> toast), `friendlyRiskReason`, `formatExpiresIn`.
- `src/components/tasks/task-detail-drawer-ai-approval.tsx` (novo) — `ApprovalCard`: badge MEDIUM ambar / HIGH vermelho, motivo amigavel, "Expira em ...", Aprovar/Rejeitar so para gestor; membro ve "Aguardando aprovacao do gestor do projeto".
- `src/components/tasks/reject-execution-dialog.tsx` (novo) — modal RHF + zod (10-1000 chars, espelha RejectExecutionDto).
- `src/components/tasks/task-detail-drawer-ai.tsx` — usa `ApprovalCard`; texto fixo "risco ALTO" removido (usa nivel real); estados rejected/expired; prop `activeExecution`; mojibake corrigido (arquivo reescrito sem BOM).
- `src/components/tasks/task-detail-drawer.tsx` — passa `task.activeExecution` ao painel; mojibake corrigido no arquivo todo (so comentarios/strings; diff conferido).
- `workspace/plans/plan-executions-approval-ui-task1.md` — copia do escopo frontend.

## Decisoes Durante Implementacao

### Papel de gestor
- Plano previa: `project.myRole === 'MANAGER'`.
- Implementei: `useProject(projectId)` (a Lista, mesmo id usado em `/projects/:id/execute`); `myRole === 'MANAGER'`, com fallback `canManage === true` se `myRole` ausente. Backend confirma (approval-flow.service.ts ~355-380): exige vinculo MANAGER no projeto da execucao, senao 403.

### Execucao viva vem da task, nao so do store
- O store do hook e em memoria: o gestor (que normalmente nao disparou) nao teria a execucao. O painel agora usa `task.activeExecution` (id, status, riskLevel) como fallback, entao o gestor ve os botoes mesmo apos reload/outra sessao. Botao "Executar com IA" fica oculto quando ha activeExecution.

### Motivo do risco
- `risk.explanation` pode trazer regex cru. `friendlyRiskReason` remove padroes casados, literais /.../flags e marcadores `engine:*`; se sobrar < 8 chars, mostra "Padrao de risco detectado (nivel X)".

## Pontos de Atencao para Review

- `rejectedBy` e um ID (string), nao nome: a UI mostra "rejeitada pelo gestor" + motivo (plano falava "por X").
- Apos approve, `adoptExecution` inicia polling para detectar done/failed; apos reject/409 o estado terminal aparece no store (so na sessao de quem decidiu; para os demais a task destrava via `activeExecution -> null`).
- Rejeitada/expirada de outro usuario: o painel volta ao botao "Executar com IA" (sem historico, pois nao ha estado persistido no front).
- Aprovar nao envia `notes` (opcional no backend) - sem campo na UI.
- Nao implementado (opcional no plano): lista/contador de pendentes via GET /executions?status=awaiting_approval.
- Sem testes automatizados no projeto; verificacao manual nao feita contra backend real.

## Tests Adicionados/Modificados

- Nenhum (projeto sem suite configurada).

## Metrics

- Build: PASS (`npm run build`, apos `npm ci` pois node_modules estava ausente)
- TypeScript: 0 errors (`npx tsc --noEmit`)
- ESLint: 0 errors nos arquivos tocados (`npx eslint src/hooks src/components/tasks`); `npm run lint` global: 13 errors / 4 warnings pre-existentes em outros arquivos (spaces/, shell/, design-system/)
- Tests: n/a

## Desvios do Plano

- Fallback por `task.activeExecution` e `canManage` (acima).
- `rejectedBy` sem nome.

---

## Ciclo 2 (correcoes do review NEEDS_CHANGES 8.0)

### ALTO 1 - reconciliacao do card do gestor que nao disparou
- `task-detail-drawer-ai.tsx`: `useExecutionDetail` subiu para o painel. Sem store (caminho `activeExecution`), o detalhe com polling vira a fonte da verdade (`buildExecution(detail.data)`): se `approval.status !== "awaiting_approval"` o card some e aparece o estado real (aprovada -> processando, rejeitada com motivo, expirada). Sem `useEffect` de fetch.
- `useExecutionDetail` invalida `qk.tasks.all` na propria queryFn quando o status deixou de ser awaiting.
- `ApprovalCard`: esconde Aprovar/Rejeitar (e o aviso de membro) quando `expiresAt` ja passou; mostra "Aprovacao expirada".
- Limitacao: depois que a task e recarregada e `activeExecution` vira null, o estado terminal visto por quem nao disparou some (sem historico persistido no front).

### ALTO 2 - 400 como estado velho
- `useExecutionDecision`: 400 e 409 seguem o mesmo ramo: refetch, `setQueryData`, e se o status real nao e mais awaiting -> toast informativo + `onDecided` + retorna true (fecha o dialog). Se o refetch ainda mostra awaiting (400 de validacao) ou falha, cai no toast de erro com a mensagem do backend e retorna false.

### Medios
- M1: `RejectExecutionDialog` fecha quando `decision.forbidden` (`open={rejectOpen && !forbidden}`).
- M2/polling unico: `useExecutionDetail(id, poll)` so faz polling quando nao ha store (`poll = !execution`); com store, `pollExecution` e o unico polling e o detalhe e buscado uma vez (so enquanto awaiting, para risco/expiracao).
- M3: `executionKey` movido para `qk.executions.byId` em `src/lib/query-keys.ts`.
- `deriveStatus`/`buildExecution` exportados de `use-task-execution.ts`.

### Metrics Ciclo 2
- Build: PASS | TypeScript: 0 errors | ESLint (`src/hooks`, `src/components/tasks`, `query-keys.ts`): 0 errors, 0 warnings
