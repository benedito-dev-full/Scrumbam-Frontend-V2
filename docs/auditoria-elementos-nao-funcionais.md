# Auditoria — Elementos Não-Funcionais do Frontend

> **Objetivo:** mapear TODO elemento clicável/interativo no frontend que NÃO faz nada útil quando o usuário interage. Cada item será **R**emovido ou **I**mplementado para deixar o app 100% jogável.
>
> **Legenda:** `[ ]` pendente · `[x]` resolvido · **R** = Remover · **I** = Implementar
>
> **Data inicial:** 2026-05-27
> **Branch:** `feature/integracao-frontend-v2-hierarquia`
> **Total de elementos mapeados:** 58+

---

## ÍNDICE

1. [Shell global](#shell-global) — afeta todas as telas
2. [/assigned](#assigned-minhas-tarefas)
3. [/lists/[id]](#listsid)
4. [/teams/[id]](#teamsid)
5. [/profile](#profile)
6. [/sprints](#sprints)
7. [/ia](#ia-nexus)
8. [/forms](#forms)
9. [/channels/[slug]](#channelsslug-chat)
10. [/dm/[username]](#dmusername)
11. [/planner](#planner)
12. [Create Task Modal](#create-task-modal-global)
13. [/settings](#settings)
14. [/profile/change-password](#profilechange-password)
15. [Resumo / Placar](#resumo-final)

---

## Shell global

Elementos do shell (sidebar, topbar, command palette, workspace switcher) — aparecem em **todas as telas**.

### Command Palette (`Cmd+K`)
Arquivo: `src/components/shell/command-palette.tsx`

- [ ] **I** — "Criar tarefa" (linha ~130) → `onSelect: run(() => {})` handler vazio. **Alta prioridade** (é Cmd+K). Abrir o modal de criação de task existente.
- [ ] **R** — "Atalhos de teclado" (linha ~174) → handler vazio. Remover ou implementar dialog simples.

### Workspace Switcher (menu do logo)
Arquivo: `src/components/shell/workspace-switcher.tsx`

- [x] **R** — Item "Aplicativos" → removido (2026-05-27)
- [x] **R** — Item "Modelos" → removido (2026-05-27)
- [x] **R** — Item "Campos personalizados" → removido (2026-05-27)
- [x] **R** — Item "Automações" → removido (2026-05-27)

> **Decisão aplicada:** seção "Gerenciar" inteira removida do dropdown.

---

## /assigned (Minhas Tarefas)

Arquivo: `src/app/(app)/assigned/page.tsx`

- [ ] **R** — Botão "Gerenciar cartões" (linha ~238) → sem onClick, só hover CSS
- [ ] **R** — Ícone Settings da topbar/agenda (linha ~262) → sem onClick
- [ ] **I/R** — Aba "calendário" (linha ~89) → muda state mas `TabsContent` vazio. Implementar view de calendário OU remover aba.
- [ ] **R** — Filtro "Por prioridade" (linha ~78) → select sem onChange real

---

## /lists/[id]

Arquivo: `src/app/(app)/lists/[id]/page.tsx` + `_components/kanban-board.tsx`

- [ ] **ignorar** — TaskCard no `DragOverlay` com `onClick={() => {}}` (linha ~165 do kanban-board) → intencional do dnd-kit, não é bug
- [ ] **revisar** — TODO comentado na linha ~3400 sobre derivar expandido do subtarefasMode sem useEffect (perf, não bloqueia)

---

## /teams/[id]

Arquivo: `src/app/(app)/teams/[id]/page.tsx`

- [ ] **I** — Aba "Visão Geral" (linha ~1000) → mostra "em breve". Implementar painel com estatísticas básicas do time.
- [ ] **I** — Aba "Membros" → mostra "em breve". **Endpoint já existe** (`GET /teams/{id}/members`), só plugar o componente.
- [ ] **R** — Aba "Análises" → mostra "em breve". Remover até ter backend de métricas.

---

## /profile

Arquivo: `src/app/(app)/profile/page.tsx`

- [ ] **R** — Seção "Atividade recente" inteira (linhas ~266-298) → mock hardcoded `MOCK_ATIVIDADE`. Remover até o backend ter `/auth/me/activity`. (Comentário no código já indica "Fase 3 futura".)

---

## /sprints

Arquivo: `src/app/(app)/sprints/page.tsx`

- [ ] **I** — Botão `MoreHorizontal` em cada SprintCard (linhas ~247-254) → só faz `stopPropagation`, sem menu. Implementar DropdownMenu com: Editar, Duplicar, Arquivar, Deletar.
- [ ] **dep. backend** — Botão "Nova Sprint", editar, deletar → mexem em mockSprints local. Toda página depende de endpoint `/sprints` ser criado no backend.

---

## /ia (Nexus)

Arquivo: `src/app/(app)/ia/page.tsx`

- [ ] **R** — Botão `+` anexar (linhas ~323-332) → sem onClick. Remover ou implementar upload.
- [ ] **R** — Botão `Globe` buscar na web (linhas ~340-349) → sem onClick. Remover ou implementar web search.
- [ ] **R** — Quick Action card "Summarize Recent" (linhas ~422-441) → sem onClick
- [ ] **R** — Quick Action card "Create Task" → sem onClick
- [ ] **R** — Quick Action card 3 → sem onClick
- [ ] **R** — Quick Action card 4 → sem onClick
- [ ] **R** — "Mostrar mais" no Model Dropdown (linhas ~201-212) → sem onClick

> **Decisão estratégica:** se manter Quick Actions, definir 2-3 que façam sentido (ex: "Resumir tarefas atrasadas do meu time", "Criar tarefa a partir de descrição"). Senão, remover todos.

---

## /forms

Arquivo: `src/app/(app)/forms/page.tsx`

- [ ] **I/R** — Botão "Novo formulário" (linha ~156) → sem onClick, só dropdown visual
- [ ] **R** — Card de modelo "Recebimento" (linhas ~170-191) → sem onClick
- [ ] **R** — Card de modelo "Feedback" → sem onClick
- [ ] **R** — Card de modelo "Pedido" → sem onClick
- [ ] **I/R** — Botão "Classificar" (linhas ~196-207) → sem onClick
- [ ] **I/R** — Ícone Download por linha de form (linha ~113) → sem onClick
- [ ] **I/R** — `MoreHorizontal` por linha de form (linha ~124) → sem onClick

> **Decisão estratégica:** Forms é épico próprio. Se não for prioridade agora, **esconder rota** até backend existir.

---

## /channels/[slug] (chat)

Arquivo: `src/app/(app)/channels/[slug]/page.tsx`

- [ ] **R** — Abas além de "Canal" (linha ~182) → mostram "Visualização {tab} em breve"
- [ ] **R** — ToolbarBtn `Plus` (linha ~226) → sem onClick
- [ ] **R** — ToolbarBtn `Smile` (linha ~227) → sem onClick
- [ ] **R** — ToolbarBtn `AtSign` (linha ~228) → sem onClick
- [ ] **R** — ToolbarBtn `Paperclip` (linha ~229) → sem onClick
- [ ] **R** — Botão "Descartar" do hint banner (linha ~202) → sem onClick
- [ ] **R** — ActionCard "Track Tasks" (linhas ~159-177) → sem onClick
- [ ] **R** — ActionCard "Add Doc" → sem onClick
- [ ] **R** — ActionCard "Start SyncUp" → sem onClick

> **Decisão estratégica:** Chat virou casca. Se manter no produto, vira épico próprio. Senão, **esconder rota** até ter backend de mensagens.

---

## /dm/[username]

Arquivo: `src/app/(app)/dm/[username]/page.tsx`

- [ ] **R** — Botão `Phone` chamada (linha ~59) → sem onClick
- [ ] **R** — Botão `Video` (linha ~62) → sem onClick
- [ ] **R** — Botão "Adicionar anotação" (linha ~114) → sem onClick
- [ ] **R** — Botão "Agendar reunião" → sem onClick
- [ ] **R** — ToolbarBtn `Plus` (linha ~160) → sem onClick
- [ ] **R** — ToolbarBtn `Smile` (linha ~161) → sem onClick
- [ ] **R** — ToolbarBtn `AtSign` (linha ~162) → sem onClick
- [ ] **R** — ToolbarBtn `Paperclip` (linha ~163) → sem onClick
- [x] — Botão "Descartar" do hint banner (linha ~132) → **JÁ FUNCIONA** (`setDismissed(true)`)

---

## /planner

Arquivo: `src/app/(app)/planner/_components/create-event-modal.tsx`

- [ ] **I** — Botão "Criar evento" (linha ~327) → **SEM onClick — BUG VISÍVEL**. É o submit do modal! Implementar ou desabilitar até ter endpoint `/events`.
- [ ] **R** — Card "Integrações futuras" (linhas ~293-306) → Google Calendar e Zoom com badge "Em breve". Remover.

> **Toda a tela `/planner`** ainda depende do backend expor endpoint `/events` para sair de 100% mock.

---

## Create Task Modal (global)

Arquivo: `src/components/tasks/create-task-modal.tsx`

- [ ] **R** — Botão "Tabela" (linha ~551) → sem onClick
- [ ] **R** — Botão "Coluna" (linha ~555) → sem onClick
- [ ] **R** — Botão "Lista" (linha ~560) → sem onClick
- [ ] **R** — Botão footer `attachments` (linha ~585) → sem onClick
- [ ] **R** — Botão footer `bell` (linha ~595) → sem onClick
- [ ] **R** — Aba "lembrete" (linhas ~566-573) → "Em breve"
- [ ] **R** — Aba "quadro" → "Em breve"
- [ ] **R** — Aba "paineis" → "Em breve"

> **Decisão:** simplificar modal. Manter só o form essencial (título, descrição, assignee, due date, prioridade, lista).

---

## /settings

Arquivo: `src/app/(app)/settings/page.tsx`

- [ ] **I** — Página completa precisa ser construída. Atualmente quase vazia.
- [ ] **I** — Seção "Notificações" (linha ~168) → texto "A entrega seletiva por canal será ligada em breve". Toggles funcionam localmente, mas não persistem.

---

## /profile/change-password

Arquivo: `src/app/(app)/profile/change-password/page.tsx`

- [ ] **I** — Página inteira. Implementar form + endpoint `POST /auth/change-password`.

---

## Outras rotas-esqueleto (sem conteúdo significativo)

- [ ] **R/I** — `/mentions` — UI sem dados. Remover do menu ou implementar.
- [ ] **R/I** — `/replies` — UI sem dados. Remover do menu ou implementar.
- [ ] **manter** — `/design-system` — showcase de componentes, é dev-only. Manter.

---

## Padrões / TODOs no código

- [ ] `lists/[id]/page.tsx` ~linha 3400 — TODO refatorar expansão de subtarefas sem useEffect (perf)
- [ ] `hooks/use-auth.ts` ~linha 120 — TODO limpar TODO o cache no switch-org (não só invalidar)
- [ ] `hooks/use-task-execution.ts` ~linha 45 — doc-only (ADR-V2-049)

---

## RESUMO FINAL

### Contagem por categoria

| Categoria | Total |
|---|---|
| Botões sem `onClick` | ~40 |
| Placeholders "Em breve" | ~8 |
| Handlers vazios `() => {}` | ~10 |
| Menu items decorativos | ~4 |
| **TOTAL** | **~58+** |

### Telas mais problemáticas

| # | Tela | Itens mortos | Veredito |
|---|---|---|---|
| 1 | `/channels/[slug]` | 9 | 🗑️ Quase tudo decorativo |
| 2 | `/dm/[username]` | 8 | 🗑️ Mesma situação, virou casca |
| 3 | Create Task Modal | 7 | 🗑️ Ruído ao redor do form principal |
| 4 | `/ia` | 7 | 🗑️ Quick Actions todas falsas |
| 5 | `/forms` | 7 | 🗑️ UI elaborada sem botão real |
| 6 | Workspace Switcher | 4 | 🗑️ "Gerenciar" inteiro decorativo |
| 7 | `/planner` modal | 2 | ⚠️ "Criar evento" sem onClick (bug) |
| 8 | `/teams/[id]` | 3 | ⚠️ Membros já tem endpoint |
| 9 | `/sprints` | 2 | ⚠️ Menu de ações nos cards |
| 10 | `/assigned` | 4 | ⚠️ Botões topbar mortos |
| 11 | Command Palette | 2 | ⚠️ Criar tarefa não funciona (alta prio) |

---

## PLANO DE EXECUÇÃO RECOMENDADO

### Fase 1 — LIMPEZA (1-2 horas, sem dependência de backend)

Remover de cara, sem dó:
- [ ] 4 itens "Gerenciar" do workspace switcher
- [ ] 4 Quick Actions do `/ia`
- [ ] 8 ToolbarBtn de chat (entre `/dm` e `/channels`)
- [ ] Cards "Integrações futuras" e ActionCards decorativos
- [ ] 3 abas "em breve" do create-task
- [ ] Abas "em breve" do `/channels`
- [ ] Phone/Video/Adicionar anotação/Agendar reunião do DM
- [ ] "Mostrar mais" do modelo IA
- [ ] Card "Atividade recente" do `/profile`
- [ ] Card "Integrações futuras" do planner modal

**Resultado:** ~30 elementos removidos. UI mais limpa.

### Fase 2 — IMPLEMENTAR (sem dependência de backend novo)

- [ ] Command Palette → "Criar tarefa" abre modal existente
- [ ] Modal planner → botão "Criar evento" (desabilitar enquanto backend `/events` não existir, OU implementar persistência local)
- [ ] Aba "Membros" do `/teams/[id]` (endpoint já existe!)
- [ ] Atalhos de teclado dialog
- [ ] Menu de ações (`MoreHorizontal`) do Sprint card

### Fase 3 — DECISÕES ESTRATÉGICAS

- [ ] Chat (`/channels`, `/dm`): mantém? Vira épico ou esconde rota.
- [ ] Forms: idem. UI bonita, zero função.
- [ ] IA Quick Actions: definir 2-3 que façam sentido.
- [ ] Settings completo
- [ ] Change password

### Fase 4 — DEPENDÊNCIAS DE BACKEND

- [ ] `/planner` ← endpoint `/events`
- [ ] `/sprints` ← endpoint `/sprints`
- [ ] `/docs` ← já dá pra usar `idClasse=-353` (ganho rápido!)
- [ ] `/forms` ← endpoint `/forms` + `/forms/{id}/submissions`
- [ ] `/channels`, `/dm` ← endpoint de mensagens
- [ ] `/profile` atividade ← endpoint `/auth/me/activity`

---

## CHANGELOG

- **2026-05-27** — documento criado a partir da auditoria inicial. 58+ elementos mapeados.
- **2026-05-27** — Fase 1 / Shell global: removidos 4 itens "Gerenciar" (Aplicativos, Modelos, Campos personalizados, Automações) do Workspace Switcher.
