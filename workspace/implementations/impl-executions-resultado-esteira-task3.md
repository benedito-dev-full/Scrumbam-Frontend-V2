# Implementation: Resultado da esteira na UI de execução de IA (task 3 frontend)

**Data:** 2026-11-24 | **Contrato:** backend `impl-executions-fluxo-agentes-vps-task3.md` (seção "Contrato para o frontend"), conferido contra `execution-response.dto.ts` e `execution-lifecycle.const.ts` (08d1446).

## Arquivos
- `src/lib/types/api.ts`: `ExecutionFailureReason` +5 códigos; novos tipos opcionais `ExecutionPullRequestDto`, `ExecutionGitDto`, `ExecutionPipelineDto` (+ decision/stage).
- `src/hooks/use-task-execution.ts`: `TaskExecution` ganha `pullRequest/git/pipeline`; mapa exaustivo de mensagens PT-BR com os 5 novos; `pollIntervalFor` (3s, 15s após 10 min desde `startedAt`=createdAt); m1 aplicado (`data.outcome ? data.outcome.reason : current?.failureReason`).
- `src/components/tasks/task-detail-drawer-ai.tsx`: `PipelineResult` (link "Ver PR #N" https-only, `target=_blank` + `rel="noopener noreferrer"`, badge "Rascunho", decisão, nota, branch, summary texto puro recolhível); aparece em sucesso e em falha (PR rascunho P3); `role="alert"` no bloco de falha (m3); "em execução há Xh" + aviso "pode levar algumas horas" quando `pipeline.required`.

## Resultados reais
- `npm run build`: compilou com sucesso. `npx tsc --noEmit`: sem erros. ESLint nos 3 arquivos: sem avisos.
- Não há script de testes no package.json; sem testes automatizados; sem teste visual no browser.

## Desvios / decisões
- `deriveStatus`: com `finishedAt` e `outcome.reason` presente, status vira `failed` mesmo com exitCode 0 (necessário para os motivos da esteira com `source='agent'`; PR rascunho/NOT_APPROVED pode não ter exitCode != 0). Não alterei o polling único nem adoção/aprovação.
- Polling mede o tempo desde `startedAt` (createdAt da execução), então uma execução adotada depois já nasce no ritmo de 15s.
- Textos dos motivos: PIPELINE_NOT_INSTALLED conforme pedido; os demais ajustados levemente em relação à sugestão do backend.
- Sem commit/push.

## Pendências
- Validar visualmente com payload real (PR rascunho, summary longo) quando a esteira estiver na VPS.
- Premissa não confirmada no backend: `pipeline.required` já vem no GET durante RUNNING (o contrato diz "exigências" no envelope).
