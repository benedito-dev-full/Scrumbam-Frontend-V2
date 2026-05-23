# Conventional Commits — Scrumbam-Frontend-V2

Padrao internacional de commits adaptado para este projeto frontend.
Referencia oficial: https://www.conventionalcommits.org/

---

## FORMATO OBRIGATORIO

```
<type>(<scope>): <subject>

<body>

<footer>
```

---

## 1. TYPE (Obrigatorio)

| Type | Uso | Exemplo |
|------|-----|---------|
| `feat` | Nova funcionalidade | `feat(planner): adiciona drag para reordenar` |
| `fix` | Correcao de bug | `fix(tasks): corrige scroll do board no Safari` |
| `docs` | Apenas documentacao | `docs(readme): documenta scripts npm` |
| `refactor` | Refatoracao sem mudanca de comportamento | `refactor(shell): extrai sidebar para componente` |
| `perf` | Melhoria de performance | `perf(lists): dinamiza import do heavy chart` |
| `test` | Adicionar/corrigir testes | `test(forms): cobre validacao zod de CreateTask` |
| `chore` | Build, configs, dependencies | `chore(deps): atualiza next para 16.2.7` |
| `style` | Formatacao (sem mudanca logica) | `style(ui): aplica prettier em components/ui` |
| `ci` | Mudancas em CI/CD | `ci: adiciona workflow de preview Vercel` |
| `build` | Mudancas no sistema de build | `build: migra para tailwind v4` |

> Escolha o type CORRETO — afeta CHANGELOG automatico e versionamento.

---

## 2. SCOPE (Obrigatorio)

Use o **modulo/feature real** do projeto. Lista de scopes validos:

### Features / rotas (`src/app/(app)/*`)
- `tasks` — board done/in-progress/pending
- `spaces` — espacos (`/spaces/[id]`)
- `lists` — listas dentro de spaces (`/lists/[id]`)
- `folders` — pastas (`/folders/[id]`)
- `sprints` — gestao de sprints
- `planner` — planejamento visual
- `today` — visao "hoje"
- `assigned` — tarefas atribuidas
- `inbox` — caixa de entrada
- `docs` — documentacao colaborativa (`/docs/[id]`)
- `forms` — formularios customizaveis
- `ia` — features de IA (Nexus)
- `teams` — gestao de times
- `design-system` — showcase visual

### Infra / cross-cutting
- `shell` — layout global (sidebar, topbar, layouts)
- `ui` — componentes shadcn (`components/ui`)
- `api` — `lib/api.ts`, interceptors axios
- `query` — TanStack Query (provider, keys, hooks compartilhados)
- `store` — Zustand stores em `lib/stores`
- `theme` — temas / dark mode / next-themes
- `types` — tipos compartilhados em `lib/types`
- `mocks` — `lib/mocks`
- `auth` — fluxo de autenticacao (quando existir)
- `deps` — dependencias (`chore(deps)`)
- `config` — configuracao (next.config, tsconfig, eslint, tailwind)

**Se afeta multiplos modulos:** use o principal ou `core`.

---

## 3. SUBJECT (Obrigatorio)

Descricao breve **em portugues** do que foi feito.

**Regras:**
- Maximo 72 caracteres
- Primeira letra minuscula
- Sem ponto final
- Imperativo (`adiciona`, nao `adicionado`/`adicionando`)
- Claro e objetivo

```
CORRETO:  feat(planner): adiciona drag para reordenar tasks
ERRADO:   feat(planner): Adicionado drag.            # maiuscula + ponto + passado
ERRADO:   feat(planner): adicionando drag            # gerundio
ERRADO:   feat: drag                                 # sem scope, vago
```

---

## 4. BODY (Recomendado em commits importantes)

Descricao detalhada. Uma linha por ponto com `-`:

```
feat(planner): adiciona drag para reordenar tasks

- Planner:
  * DndContext com closestCenter + verticalListSortingStrategy
  * SortableTask wrapper sobre TaskCard
  * Persistencia otimista local + mutate no backend

- API:
  * Nova mutation useReorderTasks
  * Invalida qk.tasks.bySpace ao sucesso
  * Rollback automatico em erro (TanStack Query)

- Tests:
  * Build: PASS
  * TypeScript: 0 errors
  * ESLint: 0 errors

- Documentation:
  * JSDoc em useReorderTasks e SortableTask
  * CHANGELOG atualizado
```

---

## 5. FOOTER (Opcional)

Referencias, breaking changes:

```
Closes #123
Refs #456

BREAKING CHANGE: API de useTasks agora retorna { tasks, meta } em vez de Task[]

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## EXEMPLOS COMPLETOS

### Feature — nova rota

```
feat(docs): adiciona pagina /docs/[id] com editor markdown

- Docs:
  * src/app/(app)/docs/[id]/page.tsx (Server Component)
  * fetch com revalidate 60s + tag `doc:{id}`
  * Editor lazy-loaded via dynamic() — reduz bundle inicial em ~180kb

- UI:
  * Toolbar de formatacao com shadcn Button + DropdownMenu
  * Sidebar de outline (h1/h2/h3) sticky

- State:
  * RHF para auto-save (debounce 1.5s)
  * Mutation useUpdateDoc invalida qk.docs.byId

- Tests:
  * Build: PASS, TypeScript: 0 errors, ESLint: 0 errors

Closes #87
```

### Bug Fix

```
fix(tasks): corrige board nao atualizar apos mover task

- Problema:
  * Drop em outra coluna mudava UI mas nao refetchava
  * Mutation chamava api.patch mas nao invalidava queryKey

- Solucao:
  * onSuccess agora invalida qk.tasks.bySpace(spaceId)
  * Adicionado optimistic update via setQueryData
  * Rollback em onError

- Tests:
  * Cenario do bug coberto manualmente
  * Build: PASS

Fixes #142
```

### Refactor

```
refactor(shell): extrai sidebar em componente reusavel

- Antes: layout.tsx tinha 320 linhas com JSX da sidebar inline
- Depois: Sidebar exportado de components/shell/sidebar.tsx (180 linhas)
- layout.tsx agora tem 140 linhas, so orquestracao

- Bonus:
  * Sidebar agora aceita prop `variant` ('full' | 'compact')
  * design-system mostra ambas as variantes

- Tests:
  * Build: PASS, TypeScript: 0 errors
  * Sem mudanca visual (regression check manual)
```

### Performance

```
perf(planner): dinamiza chart de burndown

- Antes: recharts entrava no bundle inicial do /planner (~140kb)
- Depois: dynamic() com Skeleton de fallback

- Benchmark:
  * /planner First Load JS: 480kb -> 340kb
  * LCP em 3G: 4.2s -> 2.8s

- Tests:
  * Build: PASS
  * Chart renderiza identico apos suspense resolve
```

### Breaking change

```
feat(api)!: padroniza retorno paginado de listagens

- Todas as listagens agora retornam { items, nextCursor }
- Afeta: useTasks, useDocs, useSpaces, useLists

- Migration:
  * Substituir data.map por data.items.map
  * Substituir data.length por data.items.length

BREAKING CHANGE: useTasks retorna { items, nextCursor } em vez de Task[]

Closes #67
```

---

## COMMITS RUINS (Evitar)

```
# Muito vago
fix: bug

# Sem scope
feat: novo card

# Subject em ingles
feat(tasks): add drag

# Gerundio
feat(planner): adicionando drag

# Body vazio em commit importante
feat(docs): editor markdown
# (sem explicar o que, como, tests, etc.)

# Multiplas mudancas nao relacionadas
feat(planner): drag + fix tasks board + refactor sidebar
# (quebrar em 3 commits)
```

---

## DICA: COMMIT ATOMICO

Cada commit deve ser **uma mudanca logica**. Se voce tem que escrever "e" no subject, provavelmente sao 2 commits.

- Correto: 3 commits pequenos (`feat: X`, `fix: Y`, `refactor: Z`)
- Errado: 1 commit gigante mixando tudo
