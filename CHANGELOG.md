# Changelog

Todas as mudanças notáveis do projeto são documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto adere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Fixed

- **Execução presa: 409 `EXECUTION_IN_PROGRESS` agora retoma o acompanhamento** (Task 2, Score 9.2/10)
  - Ao disparar uma execução com outra já em andamento na task, o front consulta a execução existente e volta a acompanhá-la, em vez de mostrar erro genérico.
  - Requer deploy conjunto com o backend (ADR-V2-082).
- **Sessão em aba nova vira "zumbi"** (Task #996, DEV-172, Score 8.0/10)
  - **Problema:** Tokens em `sessionStorage` (escopo aba) + gate de rota por cookie `scrumbam_auth` (escopo navegador) → aba nova não disparava queries → app permanecia vazio e nunca deslogava.
  - **Solução (F2 — hotfix):** Migração one-shot `sessionStorage` → `localStorage` (escopo navegador, escopo compartilhado entre abas) + bootstrap defensivo + sincronização entre abas via BroadcastChannel.
  - **Base normativa:** draft-ietf-oauth-browser-based-apps (localStorage e sessionStorage têm identicamente a mesma exposição a XSS — distinção é de escopo, não segurança).
  - **Impacto:** Aba nova nasce com sessão válida (zero silêncio de rede); logout em uma aba desloga todas (requisito ASVS).
  - **Pendências reais:** (1) E2E `e2e/auth-new-tab.spec.ts` nunca foi executado (sem `E2E_EMAIL`/`E2E_PASSWORD` — rodar antes do deploy). (2) 503 inconsistente durante bootstrap (não distingue infra de credencial inválida — follow-up em Fase 3).

### Added

- **Motivo amigável da falha de execução** (Task 2, Score 9.2/10)
  - Falhas marcadas pelo sistema mostram texto em PT-BR a partir de `outcome.reason` (8 motivos canônicos); ausente ou desconhecido cai em "Execução falhou".
  - Tipos `ExecutionFailureReason` e `ExecutionOutcomeDto` em `lib/types/api.ts`. Requer deploy conjunto com o backend (ADR-V2-082).

- **UI de Aprovar/Rejeitar execuções de IA** (Task 1, Score 9.0/10)
  - Card "Aguardando aprovação" no drawer da task: nível de risco (médio/alto), motivo amigável e prazo de expiração.
  - Gestor do projeto (`myRole === 'MANAGER'`) vê Aprovar e Rejeitar; demais membros veem só o aviso.
  - Rejeição exige motivo (10–1000 caracteres) em modal com validação zod.
  - Endpoints: `POST /executions/:id/approve` e `POST /executions/:id/reject`, com `GET /executions/:id` para o detalhe.
  - Estados `rejected` (motivo e autor exibidos) e `expired` (aviso de expiração) tratados na UI.
  - Erros: 403 esconde os botões; 400/409 fazem refetch e mostram o estado real.

- **localStorage com migração one-shot:** Substitui sessionStorage; copia automaticamente no boot se houver sessão legada.
- **Bootstrap defensivo:** Se cookie de rota existe mas token está nulo, tenta refresh silencioso; se falhar, redirect `/login` (nunca mais estado zumbi).
- **Sincronização entre abas:** BroadcastChannel (principal) + fallback storage event (Safari antigo/WebViews).
  - Novo par de tokens propaga para todas as abas.
  - Logout em uma aba desloga **todas** as abas (requisito ASVS de terminação de sessão).
- **Tratamento de 503 no interceptor:** Infra lenta (Postgres timeout, Redis down) não desloga — backoff exponencial (1s, 2s, 4s) + retry até 3 vezes. Sessão persiste.
- **Gate `enabled: !!accessToken` em `use-space-agent-link` e `use-agents`:** Evita 401 espúrios pré-hidratação.
- **Teste E2E Playwright:** `e2e/auth-new-tab.spec.ts` — reproduz sintoma A (aba nova zumbi) e valida correção.

### Changed

- `use-task-execution.ts`: `rejected` e `expired` deixam de colapsar em `failed`; mapeamento de status unificado em `buildExecution`/`deriveStatus`.
- `task-detail-drawer.tsx` e `task-detail-drawer-ai.tsx`: painel recebe `activeExecution` da task (gestor vê a aprovação mesmo sem ter disparado a execução); texto fixo de risco removido.
- `query-keys.ts`: chave `qk.executions.byId` centralizada.
- `src/lib/stores/auth.ts`: `setTokens()` agora propaga novo par via BroadcastChannel (sincronização entre abas).
- `src/lib/api.ts`: Interceptor reescrito — `code`-aware (distingue `TOKEN_EXPIRED` de `SESSION_REVOKED` de `AUTH_BACKEND_UNAVAILABLE`), 503 com retry/backoff, guard `refreshToken` nulo.
- `src/app/providers.tsx`: Boot com migração + bootstrap defensivo + `initSessionSync()`.
- `src/components/shell/app-topbar.tsx`: Avatar lê `useMe()` (fonte única, nunca mais `?`).

### Documentation

- **ADR-V2-075** — Migração de armazenamento de sessão no browser: decisão, alternativas (rejeitadas), consequências, timeline. Fase 2 (localStorage, hotfix) + Fase 5 (BFF with httpOnly, alvo).

---

## [Versionamento]

As mudanças de versão seguem Semantic Versioning após a Fase 2 estabilizar em produção.

---

**Nota:** A Fase 2 é um hotfix (não é release formal). O score de 8.0/10 do Reviewer reflete a qualidade da implementação e a identificação honesta das duas pendências reais (E2E não executado, 503 inconsistente durante bootstrap). Ambas precisam de atenção antes de deploy em produção.
