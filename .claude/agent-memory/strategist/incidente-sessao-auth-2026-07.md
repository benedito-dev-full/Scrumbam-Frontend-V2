---
name: incidente-sessao-auth-2026-07
description: Incidente sistemico de sessao/auth em producao (jul/2026) — 3 causas-raiz e as decisoes tomadas no plano de correcao
metadata:
  type: project
---

Incidente de sessao/auth em PRODUCAO (Backend-V2 + Frontend-V2), diagnosticado 2026-07-13.
Plano: `Scrumban-Backend-V2/workspace/plans/plan-sessao-auth-hardening.md`

**Tres causas-raiz (nao é um bug, sao tres que se encobrem):**
1. Sintoma "app zumbi em aba nova" — token em `sessionStorage` (escopo aba) + gate de rota por cookie `scrumbam_auth=1` (escopo navegador). Queries com `enabled: !!accessToken` nao disparam → nenhum 401 → nenhum logout.
2. Sintoma "CEO perde a autoridade" — refresh de SLOT UNICO (`DUserGroup.dados.refreshTokenHash`) + rotacao estrita: 2 abas concorrentes → token antigo → tratado como REUSE ATTACK → revoke da sessao inteira. Somado a cache negativo de role com TTL 5min e `invalidateUser()` com ZERO callers.
3. Sintoma "o token parece normal" — porque esta normal. As falhas sao de contexto (`organizationId` stale → 200 com lista vazia), cache negativo, e `catch {}` no AuthCompositeGuard que transforma falha de Postgres em 401.

**Decisoes travadas (ancoradas em RFC 9700, draft-oauth-browser-based-apps, OWASP ASVS/Cheat Sheets, RFC 6750, RFC 9457):**
- Storage browser: `localStorage` AGORA (nao aumenta superficie XSS vs sessionStorage — ambos JS-readable), BFF com cookie httpOnly first-party como ALVO. Rejeitado cookie httpOnly direto do backend (hosts distintos → SameSite=None → CSRF).
- Rotacao: manter deteccao de reuse (exigencia RFC 9700), eliminar FALSO POSITIVO via idempotencia (lock Redis + cache de resultado 60s) + grace window 60s + familia/jti (revoga a familia, nao a conta).
- Multi-sessao com ZERO TABELA NOVA: **1 linha por sessao em DTabela, idClasse SESSION**. Precedente ratificado = ADR-V2-004 (API/MCP keys em DTabela). Rejeitado array em `DUserGroup.dados` (lost update no read-modify-write do Json). Migration de INDICE (`@@index([idClasse, codigo])`) e permitida — ADR-V2-001 proibe tabela, nao indice.
- Guards: falha de infra (Prisma P1001/P2024, Redis, timeout) → **503**, nunca 401 (RFC 6750: 401 = invalid_token).
- Cache de role: L1 in-process 5s + L2 Redis 300s + pub/sub de invalidacao; TTL NEGATIVO separado e curto (10s).
- Erro: restaurar campo `code` no HttpExceptionFilter (RFC 9457); 404 anti-enumeration so quando nao ha leitura, 403 quando ha leitura e nao ha escrita.

**Why:** usuarios (inclusive CEO) deslogados/bloqueados ha semanas; investigacao travava porque o token "parecia normal".
**How to apply:** F0 (observabilidade) SEMPRE antes de qualquer fix — nao ha um unico contador hoje. Deploy sem deslogar ninguem via dual-read (DTabela → fallback slot legado → migracao preguicosa em ≤7d). Teste 6.7 (replay real ainda detectado) e gate obrigatorio de toda fase — nao trocar seguranca por conveniencia.

Relacionado: [[auth-pattern-v2]] (V2 usa Bearer, nao cookie).
