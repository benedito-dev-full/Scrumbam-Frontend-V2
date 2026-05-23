# Rules / Skills

Esta pasta contem os **skills** (knowledge base) injetados nos agents.

Projeto: **Scrumbam-Frontend-V2** (Next.js 16 + React 19 + TypeScript + shadcn/ui + TanStack Query + Zustand).

## Skills disponiveis

| Skill | Quem usa | Descricao | Stack |
|-------|----------|-----------|-------|
| `nextjs-frontend-patterns.md` | Strategist, Implementer, Reviewer | Padroes Next 16 + React 19 + shadcn + TanStack + Zustand + RHF/Zod | Next.js 16 + React 19 |
| `jsdoc-templates.md` | Implementer, Documenter | Templates JSDoc focados em React (componentes, hooks, stores, schemas Zod, Server Components) | TypeScript + React |
| `conventional-commits.md` | Documenter, Strategist | Padrao de commits com scopes reais do projeto (tasks, spaces, planner, docs, shell, ui, ...) | Qualquer |
| `backend-patterns.md` | (nenhum atualmente) | Padroes Node/TS — mantido apenas como **referencia** caso surja BFF/route handler com logica pesada no futuro | Node + TS |

## Como sao injetados

Os skills sao referenciados no frontmatter de cada agent (`skills: [...]`). O Claude carrega o skill APENAS quando o agent correspondente e invocado — isso economiza tokens significativamente comparado a carregar tudo no contexto principal.

## Como adicionar um skill novo

1. Crie o arquivo `.claude/rules/meu-skill.md`
2. Adicione `meu-skill` no frontmatter do(s) agent(s) que vao usar
3. O Claude carrega automaticamente quando o agent for chamado

## Como adaptar os skills

- **Convencoes especificas** do projeto (estrutura de pastas, stack, scripts): ja estao em `CLAUDE.md` na raiz — nao duplique aqui.
- **Padroes universais** (Next, React, JSDoc, commits): aqui, neste diretorio.
- Mantenha skills **curtos** — sao carregados a cada invocacao do agent.

## Status atual da adaptacao (frontend-only)

- `nextjs-frontend-patterns.md` — adaptado ao stack do projeto (Next 16, React 19, shadcn base-nova, Tailwind v4)
- `jsdoc-templates.md` — reescrito com exemplos React (componente, hook, store, schema Zod, Server Component)
- `conventional-commits.md` — scopes reais do projeto (tasks, spaces, lists, folders, sprints, planner, today, assigned, inbox, docs, forms, ia, teams, design-system, shell, ui, api, query, store, theme, ...)
- `backend-patterns.md` — preservado como referencia (projeto e cliente do Scrumban-Backend-V3; caso surja BFF, esta aqui)
