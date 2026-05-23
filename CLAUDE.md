@AGENTS.md

# CLAUDE.md — Scrumbam-Frontend-V2

## IDIOMA
Responder em **portugues brasileiro**. Codigo em ingles (nomes, identifiers); comentarios/JSDoc em portugues.

## CONTEXTO
Frontend do Scrumban — ferramenta de gestao de tarefas/sprints inspirada em ClickUp/Asana. Cliente do backend Scrumban-Backend-V3. Foco em UX rica (DnD, planner, sprints, docs, IA).

## STACK
- **Framework:** Next.js **16.2.6** (App Router) — **breaking changes**, sempre consultar `node_modules/next/dist/docs/` antes de assumir API
- **UI lib:** React **19.2** + TypeScript 5 (strict)
- **Estilizacao:** Tailwind CSS **v4** (CSS variables, `@theme`), shadcn/ui (style `base-nova`, RSC habilitado, base color neutral)
- **Componentes:** @base-ui/react, lucide-react (icons), framer-motion, recharts, cmdk, sonner
- **Estado server:** TanStack Query 5 (+ devtools)
- **Estado UI:** Zustand 5
- **Forms:** React Hook Form 7 + Zod 4 (via @hookform/resolvers)
- **HTTP:** axios 1
- **DnD:** @dnd-kit (core, sortable, utilities)
- **Datas:** date-fns 4
- **Temas:** next-themes
- **Lint:** ESLint 9 + eslint-config-next

## ESTRUTURA

```
src/
  app/                      # Next App Router
    layout.tsx              # root
    providers.tsx           # QueryClient, Theme
    globals.css             # tailwind tokens
    (app)/                  # route group autenticado
      layout.tsx
      assigned/             # tarefas atribuidas
      docs/[id]/            # docs
      folders/[id]/
      forms/
      ia/                   # IA features
      inbox/
      lists/[id]/
      planner/
      spaces/[id]/
      sprints/
      tasks/                # done/in-progress/pending
      teams/
      today/
    design-system/          # showcase visual
  components/
    shell/                  # layout (sidebar, topbar, etc.)
    ui/                     # shadcn components (gerados via CLI)
  lib/
    mocks/                  # dados mock (dev)
    stores/                 # zustand stores
    types/                  # types/interfaces
    space-customization.ts
    utils.ts                # cn(), etc.
```

**Path alias:** `@/*` -> `./src/*`

## MODULOS (rotas/features principais)

- `tasks` — quadro de tarefas (kanban, lista) com done/in-progress/pending
- `spaces` — espacos de trabalho (Space e o agrupador alto)
- `lists` — listas dentro de spaces
- `folders` — pastas dentro de spaces
- `sprints` — gestao de sprints
- `planner` — planejamento visual
- `today` / `assigned` / `inbox` — visoes pessoais
- `docs` — documentacao colaborativa
- `forms` — formularios customizaveis
- `ia` — features de IA
- `teams` — gestao de times
- `shell` — layout global (sidebar, topbar)
- `ui` — biblioteca shadcn

## PADROES CRITICOS

### Next 16 / RSC
- **Server Components por padrao.** `'use client'` SO em folhas que precisam de state/effects/event handlers.
- `params` em rotas dinamicas e `Promise` em Next 16 — verificar docs.
- Mover `'use client'` para a folha interativa; pais ficam Server.

### Data fetching
- **Client:** TanStack Query (com queryKeys em helper consistente). NUNCA `useEffect` para fetch.
- **Server:** `fetch()` com `next: { revalidate, tags }` quando precisar de cache.
- **Mutations:** sempre invalidar queryKeys afetadas (`queryClient.invalidateQueries`).

### Forms
- React Hook Form + Zod (`@hookform/resolvers/zod`).
- Schemas em `lib/schemas/` ou junto do componente quando local.

### State
- Server data -> TanStack Query
- UI global (modal, sidebar, theme) -> Zustand
- Form local -> RHF
- UI 1 componente -> `useState`
- URL state (filtros, pagina) -> `useSearchParams`

### shadcn / UI
- Adicionar componentes via `npx shadcn@latest add <name>` (vai pra `components/ui/`).
- Compor com `cn()` (em `lib/utils.ts`) e `class-variance-authority`.
- Style: `base-nova` (definido em `components.json`).
- Icons: `lucide-react`.
- Toasts: `sonner`.

### Tailwind v4
- Tokens em `globals.css` via `@theme`.
- NAO usar `@apply` em excesso — prefira composicao no JSX com `cn()`.

### Acessibilidade
- `<button>` para acoes, nunca `<div onClick>`.
- Labels associados a inputs.
- `aria-label` em icon-only buttons.
- Foco visivel sempre.

### Performance
- `next/image` SEMPRE para imagens.
- `next/link` SEMPRE para navegacao interna.
- `dynamic()` para componentes pesados (charts, editores).
- `<Suspense>` + `loading.tsx` em rotas async.

### Seguranca
- **Nunca** colocar secret em `NEXT_PUBLIC_*` — vai pro bundle.
- API URLs publicas em `NEXT_PUBLIC_API_URL`; tokens via cookie httpOnly (backend).
- Sanitizar input antes de usar `dangerouslySetInnerHTML`.

### Type safety
- Strict TS, zero `any` injustificado (use `unknown` + type guard).
- Tipos derivados de schemas Zod (`z.infer<typeof schema>`).
- Props sempre tipadas (interface ou type).

### Imports
1. Externos (`react`, `next`, `@tanstack/...`, `axios`)
2. UI/components (`@/components/ui`, `@/components/shell`)
3. Hooks/lib (`@/lib/...`, `@/hooks/...`)
4. Types/schemas
5. Constants

## SCRIPTS

```bash
npm run dev      # next dev
npm run build    # next build (usado pelo hook de validacao)
npm run start    # next start (prod)
npm run lint     # eslint
```

## TESTES

Projeto **ainda nao tem** suite de testes configurada. Se adicionar (vitest/jest + testing-library), atualizar:
- Reviewer T-3 (rodar testes)
- Hook `validate-implementation.sh`
- Este CLAUDE.md

## API BACKEND

Cliente axios em `lib/api.ts` (criar se nao existir) apontando para `NEXT_PUBLIC_API_URL`. Backend e o `Scrumban-Backend-V3` (NestJS + Prisma) — quando integrar, ler os contratos de DTOs do backend.
