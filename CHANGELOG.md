# Changelog

Todas as mudanças notáveis do projeto são documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto adere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Fixed

- **Sessão em aba nova vira "zumbi"** (Task #996, DEV-172, Score 8.0/10)
  - **Problema:** Tokens em `sessionStorage` (escopo aba) + gate de rota por cookie `scrumbam_auth` (escopo navegador) → aba nova não disparava queries → app permanecia vazio e nunca deslogava.
  - **Solução (F2 — hotfix):** Migração one-shot `sessionStorage` → `localStorage` (escopo navegador, escopo compartilhado entre abas) + bootstrap defensivo + sincronização entre abas via BroadcastChannel.
  - **Base normativa:** draft-ietf-oauth-browser-based-apps (localStorage e sessionStorage têm identicamente a mesma exposição a XSS — distinção é de escopo, não segurança).
  - **Impacto:** Aba nova nasce com sessão válida (zero silêncio de rede); logout em uma aba desloga todas (requisito ASVS).
  - **Pendências reais:** (1) E2E `e2e/auth-new-tab.spec.ts` nunca foi executado (sem `E2E_EMAIL`/`E2E_PASSWORD` — rodar antes do deploy). (2) 503 inconsistente durante bootstrap (não distingue infra de credencial inválida — follow-up em Fase 3).

### Added

- **localStorage com migração one-shot:** Substitui sessionStorage; copia automaticamente no boot se houver sessão legada.
- **Bootstrap defensivo:** Se cookie de rota existe mas token está nulo, tenta refresh silencioso; se falhar, redirect `/login` (nunca mais estado zumbi).
- **Sincronização entre abas:** BroadcastChannel (principal) + fallback storage event (Safari antigo/WebViews).
  - Novo par de tokens propaga para todas as abas.
  - Logout em uma aba desloga **todas** as abas (requisito ASVS de terminação de sessão).
- **Tratamento de 503 no interceptor:** Infra lenta (Postgres timeout, Redis down) não desloga — backoff exponencial (1s, 2s, 4s) + retry até 3 vezes. Sessão persiste.
- **Gate `enabled: !!accessToken` em `use-space-agent-link` e `use-agents`:** Evita 401 espúrios pré-hidratação.
- **Teste E2E Playwright:** `e2e/auth-new-tab.spec.ts` — reproduz sintoma A (aba nova zumbi) e valida correção.

### Changed

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
