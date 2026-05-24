# Implementer Agent - Memoria

## Stack e Build

- Build: `npm run build` (Next.js 16, Turbopack) — deve sempre passar antes de concluir task
- Lint: `npm run lint` — 5 erros pre-existentes em shell/ e design-system/ (nao sao meus)
- TypeScript check via build (nao ha script tsc separado no package.json)
- Zod versao 4 (`zod@^4.4.3`) — API identica a v3 para uso basico
- RHF versao 7 (`react-hook-form@^7.76.0`) com `@hookform/resolvers@^5.4.0`
- date-fns versao 4 (`date-fns@^4.2.1`) — importar `ptBR` de `date-fns/locale`

## Estrutura de Modulos

- Hooks customizados: `src/hooks/` (use-auth.ts, use-agents.ts)
- Tipos compartilhados: `src/lib/types/api.ts`
- Query keys: `src/lib/query-keys.ts` — helper `qk` para todas as features
- Stores Zustand: `src/lib/stores/`
- Componentes por feature: `src/components/[feature]/`
- Paginas: `src/app/(app)/[feature]/page.tsx`

## Patterns Criticos do Projeto

- Imports organizados: externos → UI/components → hooks/lib → types → constants
- `'use client'` apenas em folhas interativas — paginas ficam Server Component por padrao
- TanStack Query para todo fetch client-side — nunca useEffect para fetch
- Mutations SEMPRE invalidam queryKeys afetadas
- Estilo via inline `style={}` (projeto nao usa Tailwind no codigo custom — so shadcn/ui usa classes)
- Toasts via `sonner` (import `toast` de `sonner`)
- API client: `src/lib/api.ts` — instancia axios com `baseURL: NEXT_PUBLIC_API_URL`

## Anti-Patterns Conhecidos

- RHF `register()` retorna `onBlur` — colocar `onBlur` inline ANTES de `{...register()}` causa erro TS "specified more than once". Solucao: extrair e combinar: `const { onBlur: rhfBlur, ...rest } = register('field')` e no handler chamar `void rhfBlur(e)`. Alternativa mais limpa: usar `useController` do RHF.
- TypeScript inside `{tab === 'X' && ...}` blocks: TypeScript infere tab como literal 'X', entao comparacoes `tab === 'Y'` dentro do bloco causam erro "types have no overlap". Usar valores hardcoded ou mover a logica para fora do bloco condicional.
- Container pai com `overflow: hidden` + `justifyContent: center` corta conteudo dinamico (listas longas). Usar `overflowY: auto` para scrollable ou ajustar justifyContent por contexto.

## Codepaths Descobertos

- `src/lib/query-keys.ts` — `qk` factory, adicionar chaves de novos modulos aqui
- `src/lib/api.ts` — cliente axios, usar para todas chamadas backend
- `src/lib/stores/auth.ts` — store Zustand de autenticacao
- `src/hooks/use-agents.ts` — hooks mock para agentes VPS (pronto para trocar por API real)
- `src/hooks/use-space-agent-link.ts` — hooks TanStack Query para vinculo Espaco+Agente VPS
- `src/lib/mock/space-agent-link.ts` — mock store localStorage para vinculos Espaco+Agente
- `src/components/spaces/space-agent-section.tsx` — secao de automacao no overview do Espaco
- `src/components/spaces/provision-modal.tsx` — modal 2 passos para vincular agente ao Espaco
- `localStorage` key `scrumban_agents_mock` — dados mock dos agentes VPS
- `localStorage` key `scrumban_space_agent_links` — vinculos Espaco+Agente (array SpaceAgentLink[])
- `localStorage` key `scrumban_vps_wizard_draft` — draft do wizard de conexao VPS (TTL 30min)

## Gotchas

- RHF watch() gera warning `react-hooks/incompatible-library` do React Compiler — comportamento esperado no projeto, ja existe em new-space-dialog.tsx. Nao e bloqueante.
- ESLint 5 erros pre-existentes: design-system/page.tsx (useEffect setMounted), shell/icon-picker-popover.tsx e shell/space-chip.tsx (components created during render), shell/invite-dialog.tsx (setState in effect). Nao alterar sem instrucao especifica.
- Next.js 16 params em rotas dinamicas sao `Promise<{ id: string }>` — sempre `await params` antes de usar. Excecao: page.tsx de spaces/[id] usa `use(params)` (hook React, nao await).
- `crypto.randomUUID()` disponivel no browser moderno — usado no mock de agentes para gerar IDs.
- react-hooks/set-state-in-effect: chamar setState diretamente no body de useEffect e erro de lint (React Compiler). Solucao para reset-ao-abrir-modal: envolver em `setTimeout(fn, 0)` + return clearTimeout.
