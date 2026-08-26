# Reviewer Agent - Memoria

## Historico de Reviews

| Task | Modulo | Score | Decisao | Data |
|------|--------|-------|---------|------|
| Task 4 — subtarefas aba Blocos (estilo Monday) | lists/groups-view | 8/10 | APROVADO | 2026-05-30 |
| Task 1 (Fase 1) — seed DClasse -189 TASK_LINK (Backend-V2) | seeds | 9.5/10 | APPROVED | 2026-06-10 |
| Task 1 (Fase 2) — DTOs + @IsSafeHttpUrl, links externos em tasks (Backend-V2) | docs/dto | 9.5/10 | APPROVED | 2026-06-10 |
| Task 1 (Fase 3) — TaskLinksService (attach/list/detach, DVincula -189) (Backend-V2) | docs/service | 9.2/10 | APPROVED | 2026-06-10 |
| subGroupBy (cruzamento) — GET /reports/delay-reasons (Backend-V2) | delay-justifications | 8.8/10 | APPROVED | 2026-07-15 |

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
| seeds (Backend-V2) | 9.5 | 1 |

## Backend-V2 — Agregação $queryRaw com cruzamento (cross-tab)

- [Padrões de review para $queryRaw GROUP BY + cruzamento pai/sub](backend-v2-raw-sql-aggregation-crosstab.md) — whitelist de coluna, N+1 em 2 dimensões, invariantes do fold (soma exata, média ponderada crua, nulls), retrocompat, gap comum de @ApiQuery.

## Tech Debt Conhecido

- `useUpdateTaskStatus` nao recebe `parentId` — invalidacao de `children` depende de chamada manual no consumer. Oportunidade de refactor futuro para consistencia com `useDeleteTask`.
- `AddSubtaskRow` poderia validar que `useCreateTask.isPending` para travar o botao "+Adicionar" enquanto a criacao esta em andamento (previne double-submit).

## Backend-V2 — Pilar 3 (Seed de Classes)

### Bons patterns observados

- **Fase-1-only discipline (gate ≥8.0, feature TASK_LINK)**: Implementer tocou
  EXCLUSIVAMENTE `prisma/seeds/classes.seed.ts` (1 entrada `esp()` nova +
  ajustes coerentes de contadores narrativos), sem antecipar service/
  controller/DTO/schema da Fase 2+. Diff de 17+/9- linhas, 100% dentro do
  escopo. Padrao a exigir em features faseadas com gate alto.
- **Anti-colisao verificavel por grep + validateHierarchy**: confirmar slot
  livre via `grep -n "\-189"` no HEAD antes da mudanca + os 12 testes de
  `prisma/seeds/__tests__/validate-hierarchy.spec.ts` (ciclo, idPai
  inexistente, sequestro CANONICAL_RESERVED, chave duplicada/positiva) cobrem
  o Pilar 3 mecanicamente. `npm run seed:classes:dry` confirma contagem
  total (45 fixas + N especificas).
- **`tsc --noEmit -p tsconfig.json` reporta erros pre-existentes em
  `*.spec.ts`** que NAO aparecem em `npm run build` (tsconfig.build.json
  exclui `**/*spec.ts`). Antes de marcar como CRITICAL, rodar `git stash` +
  `tsc --noEmit` de novo para confirmar se o erro ja existia sem o diff em
  revisao — evita falso-REJECT.

### Issue conhecida (nao-bloqueante)

- **Numeracao de ADR sobreposta em comentarios de seed**: o seed referenciou
  "ADR-V2-061" tanto para TASK_LINK (-189, nova) quanto para
  TEMPLATE_LIST/TEMPLATE_SPACE (-401/-402, ja documentado em
  `docs/decisions/ADR-V2-061-templates-via-dclasse.md`). Nao bloqueia
  (validateHierarchy nao checa unicidade de refs de ADR em comentarios), mas
  deve ser corrigido na fase em que o ADR formal de TASK_LINK for redigido
  (proximo numero livre, ex. ADR-V2-062+). Verificar `docs/decisions/` antes
  de aprovar uso de numero de ADR em comentarios narrativos.

## Backend-V2 — Validador de URL custom (`@IsSafeHttpUrl`, feature task-links Fase 2)

### Bons patterns observados

- **Allowlist via `new URL().protocol`, nao regex**: `IsSafeHttpUrlConstraint`
  faz `new URL(value.trim())` e compara `parsed.protocol` contra
  `['http:','https:']`. Determinístico contra `javascript:`, `data:`,
  `file:`, `vbscript:`, `blob:`, `mailto:`, ofuscacoes de case
  (`JavaScript:`), espaco/tab/newline antes do esquema (WHATWG `URL` normaliza
  removendo whitespace/control chars do input inteiro antes de parsear, entao
  `java\tscript:alert(1)` vira `javascript:alert(1)` e ainda cai fora da
  allowlist). URLs sem esquema (`example.com`, `//example.com`) fazem
  `new URL()` lancar -> REJECT. **Padrao a reusar** em qualquer DTO futuro que
  aceite URL gerada por usuario e renderizada como `href` no front (vetor XSS
  classico).
- **Metodologia de validacao empirica do Reviewer**: escrever um script
  `ts-node` temporario (`workspace/reviews/tmp-*.ts`, deletado apos o teste)
  que importa o DTO real e roda `validate()` do class-validator com 15-20
  payloads adversariais. Mais confiavel que ler o codigo e confiar na
  descricao do Implementer — pegou 100% de cobertura dos casos exigidos pelo
  CEO (8 esquemas perigosos + ofuscacoes) sem falso-negativo.
- **Gate >=8.0 por fase + escopo estrito DTO-only**: Implementer tocou so
  `src/docs/dto/` (4 arquivos), nao criou module/service/controller, nao
  registrou em app.module, nao tocou schema/seed. `git status --porcelain` +
  `git diff --stat HEAD -- prisma/ src/app.module.ts` (ambos vazios) sao o
  jeito rapido de confirmar.

### Observacao nao-bloqueante

- `LINK_PROVIDERS` no response DTO (`['drive','notion','word','other']`)
  difere ligeiramente do enum do plano (`drive|notion|word|null`). Verificar
  na Fase 3 (service/`detectProvider()`) que os valores retornados batem com
  este union type — escolher `'other'` OU `null` para "desconhecido", nao
  os dois.

## Backend-V2 — TaskLinksService (attach/list/detach, feature task-links Fase 3)

### Bons patterns observados

- **"Espelho invertido" de bookmarks confirmado na pratica**: dono do vinculo
  = task (`idLocEscritu=taskId`) em vez de user; alvo = URL em
  `metaDados={url,title,provider}` em vez de registro do banco. Mesma
  estrutura de dedup (findMany sem filtro `excluido` + filtro em memoria por
  campo-chave + reativacao em soft-deleted) e cursor pagination
  (`chave desc`, `take limit+1`, hasMore/nextCursor) de
  `bookmarks.service.ts`. Quando o Implementer cita "espelha bookmarks",
  vale comparar lado a lado os dois services — reduz tempo de review.
- **Autorizacao como PRIMEIRA linha de cada metodo publico (sem excecao)**:
  os 3 metodos (`attach`/`list`/`detach`) chamam
  `targetResolver.resolveAndAuthorize(...)` antes de qualquer `await` no
  Prisma. Verificar isso e suficiente para descartar vazamento de tenant —
  nao precisa rastrear branches internos.
- **Resolucao do debito da Fase 2** (`LINK_PROVIDERS` vs enum do plano):
  `detectProvider()` retorna sempre um dos 4 valores do union type
  (`drive|notion|word|other`), nunca `null`; `null` so aparece em
  `readProvider()` como fallback defensivo para `metaDados.provider`
  desconhecido/ausente em registros legados. Resolveu a observacao
  pendente da Fase 2 sem ambiguidade.
- **Path `src/docs/` mantido por coerencia com Fase 2 (DTOs ja la)**: quando
  o plano sugere um path mas a fase anterior ja criou artefatos aprovados em
  outro path, manter o path real (com justificativa no JSDoc do module) e
  preferivel a mover arquivos so por literalidade do plano. Nao penalizar.
