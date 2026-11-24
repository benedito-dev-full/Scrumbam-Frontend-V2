# Review Report: Task 3 - Resultado da esteira na UI de execucao de IA (Frontend)

**Reviewed by:** Reviewer Agent
**Date:** 2026-11-24
**Module:** executions

---

## Resultado Final

### APPROVED - Score: 9.0/10

Tipos batem com o DTO real do backend (08d1446), o desvio em `deriveStatus` e correto e nao converte sucesso
legitimo em falha, `pipeline.required` de fato chega durante RUNNING, link e summary sao seguros e o polling
nao duplica. Sem issues CRITICAL/MEDIUM; apenas refinamentos MINOR.

---

## Testes Automatizados

| Check | Status | Detalhes |
|-------|--------|----------|
| Build | PASS | `npm run build` compilado com sucesso |
| TypeScript | PASS | `npx tsc --noEmit` 0 errors |
| Tests | N/A | projeto sem suite |
| ESLint | PASS | 0 errors, 0 warnings (3 arquivos tocados) |

## Conformidade com o Plano

Plan N/A no frontend; contrato do backend ("CONTRATO PARA O FRONTEND") + codigo real como fonte.
CF-1 todos os itens do contrato cobertos (PR, rascunho, decisao/nota, 5 motivos, duracoes/polling, "ha Xh");
CF-2 3/3 arquivos; CF-3 N/A; CF-4 1 desvio documentado (deriveStatus), ACEITAVEL; CF-5 S. Conformidade ~100%.

## Verificacao detalhada

### Tipos x DTO real (OK)
- `ExecutionFailureReason`: 13 codigos = `EXECUTION_FAILURE_REASONS` (8 antigos + PIPELINE_NOT_INSTALLED,
  PIPELINE_PRECONDITION_FAILED, PIPELINE_CONTRACT_MISSING, PIPELINE_NOT_APPROVED, PR_NOT_CREATED). Mapa de
  mensagens segue `Record<...>` exaustivo (os 13 presentes).
- `ExecutionPullRequestDto` / `ExecutionGitDto` / `ExecutionPipelineDto` / stage: nomes, opcionalidade e
  nullable conferem com `PullRequestDto`, `GitResultDto`, `ExecutionPipelineDto` e `toPipeline()` (required/prRequired
  obrigatorios; mode, decision, reviewScore, summary, subagents, contractValid, prOpenedBy, reason nullable).
  Campos nao usados pela UI (headBefore, commitMessage, filesChanged, rolledBackAt, rollbackRef) foram omitidos de
  proposito - subconjunto valido. `outcome.source='agent'` com reason: documentado.

### deriveStatus (correto)
`finishedAt` + `outcome.reason` => `failed`. Casos:
- Sucesso legitimo: backend devolve `{reason:null, source:'agent'}` (reason so quando a politica da esteira rebaixou,
  ou system) => cai no exitCode => `done`. Nao ha transformacao indevida.
- Falha de sistema (sweeper/dispatch): exitCode=-1 e reason => failed (inalterado).
- Rebaixamento da esteira (PIPELINE_NOT_APPROVED / PR_NOT_CREATED, exitCode 0): agora `failed` - e o objetivo.
- Backend antigo (sem `outcome`): `data.outcome?.reason` undefined => regra antiga por exitCode. Sem regressao.
- Callback tardio que supera falha sistemica (reason=null, source=agent): `failureReason` limpa (m1 da rodada anterior
  aplicado: `data.outcome ? data.outcome.reason : current...`) e o status volta a seguir o exitCode.
- Precedencia: approval rejected/expired/awaiting continuam antes; sem mudanca no fluxo de aprovacao.

### pipeline.required durante RUNNING (confirmado no backend)
`executions.service.ts` grava `dados.pipeline = {required:true, prRequired, taskType, contractVersion}` na CRIACAO
(`buildPipelineEnvelope`), e `toPipeline` serializa qualquer `dados.pipeline`. Logo `required` ja vem em GET/POST
enquanto RUNNING/QUEUED (decision/summary ainda null). O aviso "pode levar algumas horas" funciona. A pendencia
declarada pelo Implementer fica resolvida.

### Seguranca (OK)
- Link: `safeHttpsUrl` exige prefixo `https://` e `new URL().protocol==='https:'`; `target=_blank` +
  `rel="noopener noreferrer"`. Bloqueia `javascript:`/`http:`/`data:`.
- Zero `dangerouslySetInnerHTML`; `summary` e branch renderizados como texto React (`whitespace-pre-wrap break-words`),
  recolhivel por `line-clamp-4`. Backend ja limita summary a 2000 chars e whitelista campos.
- Mensagens de falha vem de mapa fixo (nunca stderr cru).

### Polling 3s -> 15s (OK)
`pollIntervalFor(startedAt, now)` le o `startedAt` do store a cada ciclo; uma unica instancia de loop por
adoptExecution (aborta o controller anterior antes). Adocao (F-1) e aprovacao (d1136b0) reutilizam o mesmo caminho,
inalterados; o sleep de 15s de um loop abortado termina sem fazer request (checagem de `signal.aborted` apos a espera).
Sem polling duplicado.

### Acessibilidade / PT-BR (OK)
`role="alert"` no bloco de falha (resolve o m3 anterior), `aria-expanded` no "Mostrar mais/menos", link com texto
descritivo ("Ver PR #N"), icones decorativos, textos PT-BR acentuados.

## Code Review (12 Items)

CRITICO 1-5: OK (build, tsc, eslint; sem secrets/XSS; 'use client' ja era folha; sem fetch via useEffect - o
`useEffect` novo e so o timer de 30s do ElapsedLabel, com cleanup). ALTO 6-10: OK (zero any, zero console.log).
MEDIO 11-12: OK, com a ressalva m3.

## Issues Encontrados

**CRITICAL / MEDIUM:** nenhum.

**MINOR**
- m1 `ElapsedLabel` conta desde `createdAt`, entao rotula "em execucao ha Xh" mesmo enquanto a execucao esta QUEUED
  (ate ~6h de espera por projeto ocupado) ou apos longa espera de aprovacao. Considerar "iniciada ha Xh".
- m2 Polling lento mede desde a criacao: apos uma aprovacao tardia (>10 min) o store ja nasce em 15s, atrasando
  ate 15s a transicao para running/done. Aceitavel; opcionalmente resetar o referencial na aprovacao.
- m3 `task-detail-drawer-ai.tsx` cresceu (~430 linhas, acima do guia de componentes < 150): `PipelineResult`,
  `PipelineSummary`, `ElapsedLabel` poderiam ir para um arquivo proprio.
- m4 Endurecimento opcional: restringir o host do link a github.com (hoje qualquer https; o URL vem do `gh` verificado
  pelo agente, risco baixo). Rotulo "Reviewer:" tambem aparece para decisoes NO_CHANGES/ABORTED (texto pouco preciso).
- m5 (pre-existente, fora do escopo) Erros 422 do POST /execute (agent offline, tunel, preflight) continuam sem
  feedback visual - a mutation so trata o 409.

## Decisao: APPROVED

**Justificativa:** Contrato do backend atendido integralmente e verificado contra o codigo real; logica de status
correta e retrocompativel; seguranca do link/summary adequada; sem regressoes em adocao/aprovacao. Score 9.0 >= 8.5.
**Proximo:** Documenter (deploy na ordem backend -> frontend -> agente; validar visualmente com payload real de PR
rascunho/summary longo quando a esteira estiver na VPS).
