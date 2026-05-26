# ANALYSE.md — `src/components/`

> Pesquisa solicitada na Task #49: listar e resumir o que cada arquivo de
> `src/components/` faz, observando coerência com o stack documentado em
> `CLAUDE.md` (Next 16 + React 19 + shadcn/ui + Tailwind v4 + TanStack
> Query + Zustand + RHF/Zod). Apenas análise — nenhum código foi alterado.
>
> Escopo: a Task #49 pediu "arquivos `.ts` em `src/components/`". O único
> arquivo estritamente `.ts` é `lists/config.ts`; os demais são `.tsx`.
> Como uma análise restrita a 1 arquivo seria de baixa utilidade,
> ampliei o escopo para **todos os arquivos TypeScript (`.ts` + `.tsx`)**
> da pasta — 45 arquivos, ~11.200 linhas. A distinção entre os dois é
> notada por arquivo.

---

## 1. Inventário por pasta

### 1.1 `components/ui/` — primitivos shadcn (10 arquivos, ~1.135 linhas)

Camada gerada/derivada do shadcn CLI (`style: base-nova`,
`components.json`). Todos os componentes envolvem primitivos do
`@base-ui/react` (Anthropic-style headless) ou `cmdk`. Marcados com
`data-slot=...` para targeting via Tailwind v4.

| Arquivo | Linhas | Conteúdo |
|---|---:|---|
| `button.tsx` | 58 | `Button` com `cva` — variantes `default/outline/secondary/ghost/destructive/link` e sizes `default/xs/sm/lg/icon/icon-xs/icon-sm/icon-lg`. Exporta também `buttonVariants` para reuso. (`button.tsx:6-41`) |
| `input.tsx` | 20 | Wrapper fino de `@base-ui/react/input` com tokens do tema. |
| `textarea.tsx` | 18 | `<textarea>` nativo estilizado — única primitiva que **não** usa `@base-ui/react` (ver `textarea.tsx:5-15`). |
| `separator.tsx` | 25 | `Separator` (horizontal/vertical). |
| `avatar.tsx` | 109 | `Avatar` + `AvatarImage`/`AvatarFallback`/`AvatarBadge`/`AvatarGroup`/`AvatarGroupCount`. Tamanho via `data-size` (`avatar.tsx:8-25`). |
| `tooltip.tsx` | 66 | `Tooltip` + `Provider`/`Trigger`/`Content` com portal e arrow. |
| `scroll-area.tsx` | 55 | `ScrollArea` + `ScrollBar` horizontal/vertical. |
| `dialog.tsx` | 160 | `Dialog` completo (Root/Trigger/Portal/Close/Overlay/Content/Header/Footer/Title/Description). `DialogContent` renderiza botão de fechar `XIcon` opcional. |
| `command.tsx` | 196 | `Command*` em cima de `cmdk` + composto com `Dialog` (`CommandDialog`). Search bar via `InputGroup` (`command.tsx:69-89`). |
| `dropdown-menu.tsx` | 268 | Família completa (`DropdownMenu` + Trigger/Content/Sub/Label/Item/CheckboxItem/RadioGroup/RadioItem/Separator/Shortcut). Suporta `variant=destructive` em itens (`dropdown-menu.tsx:76-97`). |
| `input-group.tsx` | 158 | Composição reusável (`InputGroup`/`InputGroupAddon`/`InputGroupButton`/`InputGroupText`/`InputGroupInput`/`InputGroupTextarea`). Variantes `align: inline-start/end/block-start/end` via `cva`. |

**Padrão consistente.** Toda primitiva usa `cn()` de `@/lib/utils` e
adere ao contrato `data-slot=…` que o Tailwind v4 lê em selectors
estilo `in-data-[slot=...]`.

---

### 1.2 `components/shell/` — layout global (22 arquivos, ~3.787 linhas)

Pasta mais densa do projeto. Contém o chrome do app (rail, topbar,
sidebar, dialogs globais), navegação por rota, atalhos de teclado e
painéis de página específicos.

| Arquivo | Linhas | Resumo |
|---|---:|---|
| `app-shell.tsx` | 34 | Layout raiz. Compõe `AppTopbar`, `IconRail`, `WorkspacePanel`, `<main>`, `CommandPalette`, `ShortcutsHelpDialog`, `NewSpaceDialog`, `InviteDialog`, `KeyboardShortcuts`. (`app-shell.tsx:14-33`) |
| `app-topbar.tsx` | 249 | Topbar 40px de altura com `WorkspaceSwitcher` à esquerda, botão de search (abre command palette via `useCommandPaletteStore.setOpen`, `app-topbar.tsx:29-30`) ao centro, `UserMenu` à direita. Toda estilização **inline `style={...}`**. |
| `icon-rail.tsx` | 284 | Rail vertical de 60px à esquerda. 8 ícones SVG inline custom (`IcHome`, `IcPlanner`, `IcAI`, `IcTeams`, `IcDocs`, `IcForm`, `IcInvite`, `IcUpgrade`). Active state via `usePathname()`. Botão "Convidar" chama `useInviteDialogStore.openDialog` (`icon-rail.tsx:252,279`). |
| `workspace-panel.tsx` | 392 | Sidebar de 260px adjacente ao rail. **Routing-aware**: renderiza `PlannerPanel`, `FormsPanel`, `DocsPanel` ou nulo (`/ia`, `/teams`, `/docs/:id`) conforme `pathname` (`workspace-panel.tsx:301-335`). Caso padrão: lista "Início" + seções Favoritos/Canais + `SpaceTree`. |
| `space-tree.tsx` | 303 | Árvore recursiva de espaços/pastas/boards/backlogs/docs. Lê `useEspacos`/`useFilhosDe` do store de entidades. Suporta indent guide vertical (`space-tree.tsx:236-253`). Botão "+" abre `CreateMenu`. |
| `space-chip.tsx` | 52 | Chip retangular do espaço (cor + iniciais ou ícone customizado via `getIconByName`). Tamanhos `xs/sm/md/lg`. **Server Component** (sem `'use client'`). |
| `create-menu.tsx` | 204 | Dropdown "Criar Lista/Pasta/Documento/Painéis/Quadro/Form/…" com ícones SVG coloridos pixel-perfect-ClickUp. Ações disparam `toast.success(...)` — ainda não plugado em mutations (`create-menu.tsx:163-165`). |
| `command-palette.tsx` | 220 | ⌘K palette com 3 grupos (Páginas/Ações/Ajuda). Integra `next-themes` para toggle dark/light (`command-palette.tsx:142-147`). Várias ações TODO (`a:new-task`, `a:invite`, `a:settings`, `h:shortcuts`) ainda vazias (`command-palette.tsx:118-167`). |
| `keyboard-shortcuts.tsx` | 88 | Listener global de teclado. Chord `g+h/i/t/s` para navegação, `⌘K`/`⌘/` para palette/help. Skipa quando foco está em input/textarea/contenteditable (`keyboard-shortcuts.tsx:17-26`). Componente retorna `null` (efeito-only). |
| `shortcuts-help-dialog.tsx` | 93 | Dialog que lista atalhos. Lê `useShortcutsHelpStore`. |
| `workspace-switcher.tsx` | 182 | Botão "F Fortalshop ▾" da topbar com dropdown rico (cabeçalho/Configurações/Pessoas/Gerenciar/Workspaces). **Inteiramente estilizado com `style` inline** — cerca de 30 valores `#xxxxx` hardcoded. |
| `tasks-view.tsx` | 266 | Listagem de tarefas em formato tabela (grid CSS `COL_GRID = "grid-cols-[minmax(0,1fr)_140px_140px_110px_110px_28px]"`). **Reimplementa um `TaskRow` local** (`tasks-view.tsx:157-246`) ao invés de reusar `components/lists/task-row.tsx`. Filtros `Todas/Em andamento/Pendentes/Concluídas` via segmentos de URL. |
| `planner-panel.tsx` | 148 | Painel lateral exibido em `/planner*` — Prioridades / Reunião com / Atribuídas a mim / Hoje e atrasadas / Lista de pendências. Estados ainda mock. |
| `docs-panel.tsx` | 204 | Painel lateral exibido em `/docs` (mas não em `/docs/:id`, ver `workspace-panel.tsx:325`). Nav items (Todos/Meus/Compartilhado/Privado/Atas/Arquivado) + Favoritos vazio + Páginas recentes + Wikis populares vazia. |
| `forms-panel.tsx` | 149 | Painel lateral de `/forms*`. Mantém active state local — **não** sincroniza com URL (`forms-panel.tsx:43`). |
| `entity-page.tsx` | 141 | Biblioteca de **utilitários compartilhados** entre `/spaces/[id]` e `/folders/[id]`: ícones (`IcList`, `IcFolder`, `IcDoc`, `IcCaret`, `IcMenu`, `IcVoice`), `TopBtn`, `ListRow`, `AddListRow`. |
| `view-switcher.tsx` | 109 | Tabs Visão geral/Lista/Quadro/Calendário/Timeline/Tabela. Suporta modo controlado E autônomo (`view-switcher.tsx:54-72`) — bem documentado. |
| `view-toolbar.tsx` | 70 | Toolbar de filtros + auto-refresh indicator + botão Atualizar/Personalizar/Adicionar. |
| `invite-dialog.tsx` | 262 | Diálogo de convite (fora do `Dialog` do shadcn — implementa overlay/portal manualmente). Estados: email + dropdown de cargo (Membro/Membro limitado/Convidado/Administrador). |
| `new-space-dialog.tsx` | 390 | Diálogo de criar espaço — único arquivo do shell com `react-hook-form + zod + zodResolver` (`new-space-dialog.tsx:48-58,76-79`). Auto-gera iniciais a partir do nome (`new-space-dialog.tsx:88-91`). Persiste via `useEntidadesStore.addEspaco`. |
| `icon-picker-popover.tsx` | 279 | Popover de seleção de ícone/cor para espaço, sobre `@base-ui/react/popover`. Lê `COLORS` e `ICONS` de `@/lib/space-customization`. |

---

### 1.3 `components/tasks/` — modais e board de tarefas (3 arquivos, ~2.174 linhas)

| Arquivo | Linhas | Resumo |
|---|---:|---|
| `kanban-board.tsx` | 381 | Quadro Kanban com 5 colunas fixas (`COLUMN_ORDER`, `kanban-board.tsx:32-38`). DnD via **@dnd-kit** — `DndContext` + `SortableContext` + `useDroppable` em cada coluna (para receber drops em coluna vazia, `kanban-board.tsx:155`). Update otimista via `useTasksStore.updateTask` (`kanban-board.tsx:96-97`). Card "fantasma" no `DragOverlay`. |
| `task-sheet.tsx` | 879 | Side-sheet lateral (560px) com transição custom `transform: translateX`. Edição inline de nome, status, prioridade, responsável, data, descrição, subtarefas e comentários. Dropdowns implementados **manualmente** (`StatusSelect`, `PrioridadeSelect`, `ResponsavelSelect`) em vez de usar o `DropdownMenu` do shadcn (`task-sheet.tsx:113-194`). Estado completamente local + propaga via `useTasksStore.updateTask`. |
| `create-task-modal.tsx` | 914 | Modal complexo com 5 abas (tarefa/documento/lembrete/quadro/painéis). Usa `createPortal` para escapar do `overflow:hidden` do modal pai (`create-task-modal.tsx:30-53`). Resolve hierarquia espaço/pasta/lista no JSX (`create-task-modal.tsx:89-99`). |

---

### 1.4 `components/ia/` — agentes VPS (4 arquivos, ~1.558 linhas)

A área mais "moderna" do código — usa TanStack Query, RHF+Zod e
hooks dedicados.

| Arquivo | Linhas | Resumo |
|---|---:|---|
| `icons.tsx` | 42 | `NexusIcon` e `NexusMiniIcon` — logo do assistente (flor de 6 pétalas coloridas em SVG). |
| `agents-tab.tsx` | 356 | Aba "Agentes" de `/ia`. 3 estados: loading → skeleton, vazio → `EmptyState`, com agentes → `AgentsList`. Modal `VpsWizard` controlado por estado local. Lê `useAgents()` (TanStack Query, `agents-tab.tsx:331`). |
| `agent-card.tsx` | 289 | Card individual de agente. `STATUS_CONFIG` mapeia 4 status (`online/offline/pending_install/never_connected`) para visual (`agent-card.tsx:28-57`). Botão "Executar" só ativo se `status === 'online'` (`agent-card.tsx:86`). Delete via `useDeleteAgent()` mutation. Heartbeat formatado com `date-fns/locale/ptBR`. |
| `vps-wizard.tsx` | 871 | Wizard de 4 passos para conectar VPS — schemas Zod por step (`vps-wizard.tsx:22-32`), draft em `localStorage` com TTL de 30min (`vps-wizard.tsx:18-19, 222-238`), polling simulado via `useSimulateAgentOnline` (`vps-wizard.tsx:202-210`). |

---

### 1.5 `components/lists/` — visualização de tarefas em tabela (3 arquivos, ~688 linhas)

| Arquivo | Linhas | Resumo |
|---|---:|---|
| `config.ts` | 40 | **Único arquivo `.ts` puro de `components/`.** Exporta `STATUS_CONFIG`/`PRIO_CONFIG`/`GROUP_PILL_STYLE`/`INLINE_PILL_STYLE` — fonte única de verdade de cores/labels/ícones de status e prioridade. Importado por `kanban-board.tsx`, `task-sheet.tsx`, `task-row.tsx`, `create-task-modal.tsx`. |
| `icons.tsx` | 173 | Coleção de ~20 ícones SVG custom (`IcProgress`, `IcPending`, `IcBlocked`, `IcLate`, `IcDone`, `IcGitFork`, `IcFilter`, `IcCheck`, `IcUser`, `IcSearch`, `IcPlus`, `IcCaret*`, `IcUserPlus`, `IcCalPlus`, `IcFlag`, `IcChat`, `IcLayers`, `IcColumns`, `IcList`). |
| `task-row.tsx` | 475 | Linha da tabela do board. Implementa dropdowns inline próprios (`CellDropdown` portado, `task-row.tsx:17-58`). Flash verde de 600ms após save (`task-row.tsx:115-121`). Toda célula editável é "âncora" para o dropdown — pattern incomum mas funcional. |

---

### 1.6 `components/spaces/` — vínculo espaço↔agente VPS (3 arquivos, ~1.528 linhas)

| Arquivo | Linhas | Resumo |
|---|---:|---|
| `provision-modal.tsx` | 648 | Modal 2-step (selecionar agente → configurar repo). Step 2 valida com Zod (`provision-modal.tsx:35-41`). Auto-sugere `remotePath` em kebab-case do nome do espaço (`provision-modal.tsx:46-53`). |
| `space-agent-section.tsx` | 377 | Bloco do overview do espaço — exibe estado vazio (CTA vincular) ou vinculado (info + reconfigurar/desvincular). Lê `useAgents` + `useSpaceAgentLink`. |
| `agent-popover.tsx` | 503 | Popover acionado pelo botão "Agentes" da topbar do espaço. **Reimplementa** a UI de `space-agent-section.tsx` em formato compacto — duplicação grande (ver Recomendação 3). |

---

## 2. Observações cross-cutting

### 2.1 Duas escolas de estilização convivendo

`CLAUDE.md` define Tailwind v4 + tokens em `globals.css` via `@theme`
como padrão. Isso é respeitado em:

- Toda `components/ui/`
- `space-chip.tsx`, `space-tree.tsx`, `workspace-panel.tsx` (em
  parte), `tasks-view.tsx`, `view-switcher.tsx`, `view-toolbar.tsx`,
  `shortcuts-help-dialog.tsx`, `new-space-dialog.tsx`,
  `icon-picker-popover.tsx`

Mas há ~15 arquivos que estilizam quase 100% via `style={{ ... }}`
inline com cores hex hardcoded (`#1a1a1a`, `#7a7a85`, `#22d3ee`, …):

- `app-topbar.tsx` (`#1a1a1a`, `#7a7a85`, `#252528`, … ~30 valores)
- `workspace-switcher.tsx` (idem, ~25 valores)
- `icon-rail.tsx`, `create-menu.tsx`, `docs-panel.tsx`,
  `forms-panel.tsx`, `planner-panel.tsx`, `entity-page.tsx`,
  `invite-dialog.tsx`
- Toda `components/ia/*` (`agents-tab.tsx`, `agent-card.tsx`,
  `vps-wizard.tsx`)
- Toda `components/tasks/*`
- `components/lists/task-row.tsx`
- Toda `components/spaces/*`

Consequência: trocar tema/dark/light fica impossível sem refactor.
`next-themes` está configurado (`command-palette.tsx:5,45`) mas o
toggle só afeta a metade da árvore que usa Tailwind tokens.

### 2.2 Duplicação de ícones SVG

Há literalmente **dezenas** de componentes `IcFolder`/`IcDoc`/`IcPlus`/
`IcCheck`/`IcChevDown` re-declarados em cada arquivo:

- `IcFolder` aparece em `space-tree.tsx`, `create-menu.tsx`,
  `entity-page.tsx`, `workspace-panel.tsx`, `space-tree.tsx`
- `IcPlus` aparece em `lists/icons.tsx`, `task-sheet.tsx`,
  `entity-page.tsx`, e inline em vários outros
- `IcDoc` aparece em `space-tree.tsx`, `create-menu.tsx`,
  `entity-page.tsx`, `workspace-panel.tsx`, `docs-panel.tsx` (2x:
  `IcDocFilled` e `IcDocOutline`)

`lucide-react` está nas dependências (e usado bastante: `Plus`,
`ChevronDown`, `Search`, `X`, etc.) — então o motivo da duplicação
parece ser "queremos ícones pixel-perfect-ClickUp", não falta de lib.
Mesmo assim, dá pra centralizar.

### 2.3 Dropdowns "manuais" coexistindo com `DropdownMenu` do shadcn

O `DropdownMenu` do shadcn (`components/ui/dropdown-menu.tsx`) já é
usado em `workspace-switcher.tsx`, `app-topbar.tsx`,
`new-space-dialog.tsx`, `create-menu.tsx`. Mas convivem três outras
implementações de dropdown:

- `CellDropdown` em `task-row.tsx:17-58` (portal manual)
- `DropdownPortal` em `create-task-modal.tsx:30-53` (idem)
- `StatusSelect`/`PrioridadeSelect`/`ResponsavelSelect` inline em
  `task-sheet.tsx:113-394` (overlay + posição absoluta)
- Dropdown de cargo em `invite-dialog.tsx:179-233`

Cada um reimplementa: click-outside, escape-to-close, posicionamento
e flash de seleção. Bugs sutis (z-index, scroll, foco) tendem a se
multiplicar.

### 2.4 Mocks acoplados nas folhas

Vários componentes leem `mockTarefas`, `mockMembros`, `mockEntidades`
diretamente:

- `tasks-view.tsx:18-19,34-44`
- `kanban-board.tsx:25,290`
- `task-sheet.tsx:6,289-297`
- `task-row.tsx:10,131`
- `create-task-modal.tsx:20,21`

Migrar para TanStack Query depois exigirá tocar em cada um. Hoje o
único arquivo que segue o padrão "client → hook → query" do
`CLAUDE.md` é a família `ia/` (via `useAgents`/`useCreateAgent`/etc.).

### 2.5 Server Components

`'use client'` está em quase tudo (esperado pela natureza interativa
das pastas tasks/ia/spaces). Os poucos arquivos sem `'use client'` —
e portanto Server Components viáveis — são:

- `app-shell.tsx` (compõe filhos clientes; pode ficar Server)
- `space-chip.tsx`
- `lists/config.ts`, `lists/icons.tsx`, `ia/icons.tsx`
- `ui/button.tsx`, `ui/input.tsx`, `ui/textarea.tsx`

A maior parte dos arquivos `shell/` poderia ser dividida em casca
Server + folha interativa Client, conforme o padrão recomendado em
`.claude/rules/nextjs-frontend-patterns.md` §1.

### 2.6 Conformidade com `CLAUDE.md`

| Diretriz | Aderência |
|---|---|
| `'use client'` só em folhas | Parcial — quase tudo é client |
| TanStack Query em vez de `useEffect` para fetch | ✅ em `ia/` e `spaces/`; ❌ resto lê mocks |
| Forms com RHF + Zod | ✅ `new-space-dialog.tsx`, `vps-wizard.tsx`, `provision-modal.tsx`; ❌ formulários ad-hoc em `invite-dialog.tsx` e `task-sheet.tsx` |
| Zustand para UI global | ✅ `command-palette`, `invite-dialog`, `new-space-dialog`, `shortcuts-help` |
| `cn()` + Tailwind v4 tokens | ✅ parcial — ver §2.1 |
| `<button>` para ações, nunca `<div onClick>` | ✅ na maioria; alguns `role="button"` em `<span>` (`task-sheet.tsx:622-635`, `kanban-board.tsx:319-329`) — aceitável com `tabIndex` + keyboard handler |
| `next/link` em vez de `<a>` | ✅ consistente |
| Zero `any` | ✅ não encontrei `any` injustificado |

---

## 3. Recomendações concretas

### Recomendação 1 — Eliminar `style={{...}}` inline pesado, migrar paleta para tokens CSS

**Alvo prioritário** (mais "barulho", maior ROI de manutenibilidade):
`shell/app-topbar.tsx`, `shell/workspace-switcher.tsx`,
`shell/icon-rail.tsx`, `shell/workspace-panel.tsx` (parcial),
`shell/docs-panel.tsx`, `shell/forms-panel.tsx`,
`shell/planner-panel.tsx`, `shell/invite-dialog.tsx`,
`shell/create-menu.tsx`, e toda `tasks/`, `ia/` e `spaces/`.

Passos:

1. Promover cores hardcoded recorrentes (`#1a1a1a`, `#0d0d0f`,
   `#7a7a85`, `#7c5cff`, `#22d3ee`, `#3b82f6`, etc.) para CSS vars em
   `globals.css` via `@theme` (Tailwind v4).
2. Substituir `style={{ background: '#1a1a1a' }}` por
   `className="bg-surface-1"` (ou nome semântico equivalente).
3. Re-validar contraste e dark/light.

Isso é pré-requisito para o tema do `command-palette.tsx:142-147`
funcionar de verdade.

### Recomendação 2 — Consolidar ícones em uma única fonte

Criar `components/icons/index.tsx` exportando os SVGs custom hoje
duplicados (`IcFolder`, `IcDoc`, `IcPlus`, `IcCheck`, `IcChev*`,
`IcCal*`, status icons de `lists/icons.tsx`). Ou — preferível —
fazer um audit de cada SVG custom contra `lucide-react` e remover os
que são duplicatas dispensáveis. Os realmente "pixel-perfect-ClickUp"
ficam, mas em um único lugar.

Ganho esperado: ~400 linhas de SVG inline desaparecem e
deduplica-se a representação visual de status/prioridade
(`STATUS_CONFIG` em `lists/config.ts` vs. cores reinventadas em
`tasks-view.tsx`, `kanban-board.tsx`, `task-sheet.tsx`).

### Recomendação 3 — Unificar dropdowns sobre `components/ui/dropdown-menu.tsx`

Refatorar:

- `task-sheet.tsx:113-394` (`StatusSelect`, `PrioridadeSelect`,
  `ResponsavelSelect`)
- `task-row.tsx:17-88` (`CellDropdown`, `DropItem`)
- `create-task-modal.tsx:30-53` (`DropdownPortal`)
- `invite-dialog.tsx:179-233` (dropdown de cargo)

para usar `DropdownMenu` + `DropdownMenuItem` + `DropdownMenuRadioGroup`
do shadcn. Remove ~200 linhas duplicadas e elimina bugs sutis de
click-outside/escape/posicionamento que cada implementação tem que
acertar sozinha.

Bônus: aproveitar a oportunidade para extrair `<TaskRow>` único de
`lists/task-row.tsx` e usar dele em `shell/tasks-view.tsx:157-246`
em vez de manter duas implementações.

---

## 4. Sumário

- **45 arquivos**, ~11.200 linhas. Pasta mais densa: `shell/`
  (22 arquivos / ~3.787 linhas).
- Stack documentado em `CLAUDE.md` é seguido pela camada `ui/` e pela
  família `ia/`; o resto mistura padrões (especialmente shell/ e
  tasks/, que estilizam quase tudo via `style={{...}}` inline).
- `lists/config.ts` é a única fonte de verdade compartilhada de
  status/prioridade e está bem desenhada — boa âncora para padronizar
  a parte visual do board.
- Os 3 maiores arquivos (`create-task-modal.tsx` 914,
  `task-sheet.tsx` 879, `vps-wizard.tsx` 871) são candidatos
  naturais a fatorar em sub-componentes menores quando houver tempo.
