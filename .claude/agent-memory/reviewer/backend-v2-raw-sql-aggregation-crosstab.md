---
name: backend-v2-raw-sql-aggregation-crosstab
description: Reviewer checklist/patterns for $queryRaw GROUP BY aggregation endpoints in Backend-V2, validated on the subGroupBy (cross-tab) extension of GET /reports/delay-reasons
metadata:
  type: project
---

Contexto: Backend-V2 tem pelo menos um endpoint de agregação via `$queryRaw`
com `GROUP BY` dinâmico (`DelayReasonsService`, `GET /reports/delay-reasons`,
ADR-V2-070). Em 2026-07-15 revisei a extensão `subGroupBy` (cruzamento
pai×sub) desse endpoint — score 8.8/10, APPROVED.

**Padrão de segurança validado (reusar em qualquer endpoint futuro com
`$queryRaw` + coluna de agrupamento dinâmica):**
- Coluna de `GROUP BY` NUNCA vem de string do cliente — vem de um
  `Record<EnumDoDTO, Prisma.Sql>` estático (whitelist), indexado pelo valor
  já validado por `@IsIn` no DTO. Dupla barreira: `@IsIn` + `ValidationPipe`
  global com `whitelist`/transform ativo em `src/main.ts`.
- Todos os filtros (userId, projectId, datas, etc.) via bind params
  (`Prisma.sql\`col = ${valor}\``), nunca concatenação de string.
- Verificar SEMPRE se existe uma segunda query cruzada (`GROUP BY colA,
  colB`) reaproveitando a MESMA whitelist da query simples — assim uma
  extensão de "cruzamento"/"cross-tab" não precisa de nova validação de
  segurança, só de um segundo `IsIn` reaproveitando a mesma constante do
  enum (não duplicar o array de valores aceitos).

**Padrão de N+1 em agregações com 2 dimensões:**
- 1 única `$queryRaw` com `GROUP BY colA, colB` para o cruzamento (não 1
  query por grupo pai).
- Resolução de rótulos: no máximo 2 `findMany` (1 por dimensão), em
  paralelo via `Promise.all` — nunca um `findMany` dentro de um loop pelos
  grupos pai.
- Índice: antes de pedir uma migration nova para o cruzamento, checar se o
  índice parcial de expressão já existente cobre TODAS as colunas
  envolvidas (a combinação 2-a-2 das dimensões). Se o índice já foi
  desenhado para servir os 3 group-by's individuais (motivo/usuário/
  projeto), ele tende a já cobrir qualquer par delas — não exigir migration
  nova só porque a query ficou "mais larga".

**Padrão de fold em JS (agregação pai→sub) — verificar sempre:**
1. `count` do pai = soma EXATA dos `sub[].count` — só é garantido se o
   filtro de linhas válidas exigir AMBAS as chaves (pai E sub) resolvidas
   antes de entrar no fold. Se só uma linha do lado é null, ela deve ser
   descartada do fold inteiro (não some no pai sem aparecer em nenhum sub).
   **Gap de teste comum:** times raramente escrevem um teste unitário para
   esse caso de chave parcialmente null — vale sinalizar como MINOR mesmo
   quando não é um bug real hoje.
2. `avgDelayDays`/média do pai = média PONDERADA usando o valor CRU de cada
   sub (não o já arredondado por um normalizador tipo `Math.round(x*10)/10`)
   — conferir que o código não usa o campo já formatado como peso.
3. Nulls: subs com métrica nula devem ser ignorados TANTO no numerador
   QUANTO no denominador da média ponderada (não tratar null como zero).
4. Ressalva teórica a sempre verificar (raramente é bug real, mas notar):
   o peso da média ponderada costuma ser `COUNT(*)` do bucket, não um
   `COUNT(coluna-não-nula)`. Isso só diverge da verdadeira média SQL se um
   MESMO bucket (par de chaves) tiver linhas com e sem a métrica. Antes de
   marcar como bug, checar o código de ESCRITA do evento/registro de
   origem — se a métrica é sempre gravada como número obrigatório (não
   opcional) no momento da criação, o cenário é inalcançável na prática.

**Retrocompatibilidade em extensão opcional de endpoint existente:**
- Confirmar por teste explícito que o campo novo do response é `null`
  quando o parâmetro novo não é passado, E que a sub-estrutura nova
  (`sub[]`) está literalmente AUSENTE do objeto (não `undefined` dentro de
  um objeto que a exibe) — usar `not.toHaveProperty('sub')`, não só
  `toBeUndefined()`.
- Rodar a suíte de testes PRÉ-EXISTENTE inteira (não só os testes novos) —
  é o jeito mais barato de provar que um refactor interno (extrair um
  helper tipo `buildFilters()`) não mudou o SQL gerado no caminho antigo.

**Gap recorrente de Swagger em controllers deste módulo:**
- Este módulo (`delay-justifications`) documenta cada query param via
  `@ApiQuery` manual no controller (não confia só no `@ApiPropertyOptional`
  do DTO). Ao adicionar um campo opcional novo no DTO, é fácil esquecer de
  adicionar o `@ApiQuery` correspondente no controller — Swagger UI não
  mostra o campo mesmo estando funcionalmente validado. Checar sempre que
  a lista de `@ApiQuery` no controller bate 1:1 com os campos do DTO.

Ver também [[templates_feature]] para outro caso de "resolver debito de
fase anterior sem ambiguidade" (mesmo princípio de review, dominio
diferente).
