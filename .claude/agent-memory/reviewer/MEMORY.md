# Reviewer Agent - Memoria

## Historico de Reviews

| Task | Modulo | Score | Decisao | Data |
|------|--------|-------|---------|------|
| Task 4 — subtarefas aba Blocos (estilo Monday) | lists/groups-view | 8/10 | APROVADO | 2026-05-30 |
| FASE 0 — Observabilidade (incidente sessão/auth, cross-repo backend+frontend) | auth/observability | 9/10 | APROVADO | 2026-07-13 |

## Patterns de Qualidade

### Bons patterns observados

- **Invalidacao de children explícita no `onSuccess` local**: `SubtaskTaskRow` chama `queryClient.invalidateQueries({ queryKey: qk.tasks.children(parentId) })` apos cada mutation de edicao/status, alem das invalidacoes ja feitas pelo hook base. Padrao correto para hierarquia.
- **childCountMap calculado sobre TODAS as tasks antes do filtro de raizes**: `buildGroupsBoard` em `groups-from-tasks.ts` calcula o mapa de contagem sobre o array completo e so entao filtra `rootTasks = tasks.filter(t => !t.idPai)`. Ordem critica para evitar contador zerado.
- **Sub-tabela como `<table>` independente dentro de `<td colSpan>`**: Nao interfere no `tableLayout: fixed` do pai nem no pool de scrollers (`groups-scroller`).
- **Campos novos opcionais no `TaskModel`**: `idPai?` e `childCount?` nao quebram o modo prototipo nem o SEED do localStorage.
- **Lazy fetch correto**: `useSubtasks(parentId, expanded)` com `enabled=expanded` — nenhuma query dispara na montagem do board, so ao clicar no caret.
- **Zero `any`, zero `console.log`** nos 3 arquivos modificados.

### Anti-patterns recorrentes

- **Index como key em skeleton list**: `Array.from({ length: 3 }).map((_, i) => <tr key={i}>` — aceitavel em skeleton estatico (nao reordena), mas violacao formal do padrao. Nao causou bug aqui.

## Issues por Modulo

### lists/groups-view

- **MEDIUM (nao-bloqueante)**: Skeleton usa `key={i}` (index). Para lista estatica de 3 itens nao causa bug, mas viola o padrao de "keys estaveis nao-index".
- **MEDIUM (nao-bloqueante)**: `useUpdateTaskStatus` nao aceita `parentId` na sua assinatura — a invalidacao de `qk.tasks.children` e feita manualmente no `onSuccess` local do `SubtaskTaskRow`. Funciona, mas e inconsistente com `useDeleteTask` (que recebe `parentId` no DTO). Considerar unificar na proxima iteracao.
- **MINOR**: `AddSubtaskRow` usa `onSettled` (nao `onSuccess`) para limpar estado — correto (limpa tambem em caso de erro), mas nao invalida `qk.tasks.children` explicitamente. Funciona porque `useCreateTask` ja invalida `children(idPai)` quando `idPai` e passado.

## Scores Historicos

| Modulo | Media de Score | Tasks avaliadas |
|--------|---------------|-----------------|
| lists | 8.0 | 1 |

### auth/observability (Scrumban-Backend-V2, cross-repo com Frontend-V2)

- **Bom pattern — instrumentação "zero-behavior-change" verificável**: para reviews de deploys de observabilidade pura (sem migration, "risco zero" no plano), a técnica mais confiável foi `git stash` + rodar a mesma suite de testes/tsc antes e depois do diff, comparando a contagem exata de falhas. Provou que 2 suites falhando (`projects.service.spec.ts` 8/94, `tasks.service.spec.ts` state machine V3) eram pré-existentes e não regressões — sem isso, teria sido fácil confundir ruído com regressão.
- **Bom pattern — `@Optional() metrics?: MetricsService` em TODO call-site**: nenhuma classe (guard/service/controller) quebra se `MetricsService` não for injetado; toda chamada é `this.metrics?.increment(...)`. Padrão a exigir sempre que observabilidade for injetada em código de caminho crítico (auth, guards).
- **Bom pattern — telemetria síncrona, nunca `await`ada no caminho principal**: `MetricsService.increment()` não é `async`, tem `try/catch` interno que nunca propaga. Isso elimina a classe inteira de bug "telemetria travou o request".
- **Bom pattern — contador condicional só no caminho frio**: `ProjectsService.observeOrgContext()` faz 1 query extra (`dVincula.findFirst`) mas SÓ quando a lista já ia retornar vazia — não é N+1 porque não roda no caminho quente com resultados. Vale reconhecer esse padrão em vez de marcar automaticamente "query extra = N+1".
- **Checklist específico p/ reviews de "beacon público" (endpoint `@Public()` de telemetria)**: sempre verificar (1) payload whitelist (`forbidNonWhitelisted`), (2) rate limit por IP com teto de memória (proteção contra tracking-map unbounded), (3) resposta não vaza oráculo (sempre 204 mesmo quando descartado), (4) `X-Forwarded-For` sem `trust proxy` é spoofável mas aceitável se não há dado sensível em jogo — não bloqueia por si só.

## Tech Debt Conhecido

- `useUpdateTaskStatus` nao recebe `parentId` — invalidacao de `children` depende de chamada manual no consumer. Oportunidade de refactor futuro para consistencia com `useDeleteTask`.
- `AddSubtaskRow` poderia validar que `useCreateTask.isPending` para travar o botao "+Adicionar" enquanto a criacao esta em andamento (previne double-submit).
