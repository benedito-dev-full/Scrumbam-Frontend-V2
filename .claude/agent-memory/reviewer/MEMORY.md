# Reviewer Agent - Memoria

## Historico de Reviews

| Task | Modulo | Score | Decisao | Data |
|------|--------|-------|---------|------|
| Task 4 — subtarefas aba Blocos (estilo Monday) | lists/groups-view | 8/10 | APROVADO | 2026-05-30 |

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

## Tech Debt Conhecido

- `useUpdateTaskStatus` nao recebe `parentId` — invalidacao de `children` depende de chamada manual no consumer. Oportunidade de refactor futuro para consistencia com `useDeleteTask`.
- `AddSubtaskRow` poderia validar que `useCreateTask.isPending` para travar o botao "+Adicionar" enquanto a criacao esta em andamento (previne double-submit).
