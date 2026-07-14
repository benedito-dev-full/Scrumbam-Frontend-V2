---
name: adr-vinculo-doc-task
description: Anexar LINK externo (URL) a uma task via DVincula -189 TASK_LINK. URL+title em metaDados, dono=task. Espelha bookmarks. SEM doc-stub/DTabela -353.
metadata:
  type: project
---

Feature "Anexar links externos a tarefas" (plan-entidades-vincular-doc-task-task1.md, REVISADO 2026-06-10 pós-esclarecimento do CEO).

**Escopo REAL (CEO travou):** colar a URL de um doc que vive FORA (Drive/Notion/Word) e prendê-la a uma task — "favorito/atalho da tarefa". CEO NAO quer produzir/editar documentos no sistema.

Modelo canônico (Strategist, pendente ADR-V2-061 + ratificação CEO):
- Vínculo = `DVincula idClasse=-189` (recomendado `TASK_LINK`; nome anterior `TASK_DOC_LINK` também serve). idPai -37. Slots -189/-190 livres (último: -188 SPACE_PRIVATE_MEMBER).
- Colunas: `idLocEscritu`=taskId (DONO=task, chave Scrumban em FK NoAction, igual bookmarks), `idEntidade`=null, `idTabela`=null, `metaDados={url,title,provider?}`, `excluido` soft-delete.
- **O link inteiro mora em metaDados** — NÃO há registro de "documento" no banco. Some com a task. Mesma URL em N tasks = N registros (sem compartilhamento/catálogo).
- Espelho EXATO de `src/bookmarks/bookmarks.service.ts` (-187), só que dono=task (não user) e alvo=URL string (não chave Scrumban) — sem `assertTargetExists` de banco.
- Endpoints: sub-rota `/tasks/:id/links` (recomendado; `/docs` alternativo) no TasksController (Pilar 2). POST `{url,title}`, GET, DELETE. Insert ÚNICO em DVincula (sem $transaction). Autorização via reuso `comment-target.resolver.ts` resolveAndAuthorize(TASK, ADR-V2-042). Dedup por url + reativação espelham bookmarks.

**DESCARTADO (premissa errada do plano anterior):** doc-stub, DTabela -353, dados.content, criação de DOC em transação, e a "Parte 2 / sessão de documentos (editor/CRUD)". NÃO existe Parte 2 — backend + bloco no front FECHAM a feature.

**Why:** CEO esclareceu que é só link colado, não gestão de documentos. Materializar DTabela criaria catálogo/órfãos que ele não quer.
**How to apply:** ZERO tabela nova, ZERO Engine (estrutural→Prisma direto), validação de URL (http/https, sem javascript:/data:) é ESSÊNCIA. provider detection = helper puro COULD HAVE. Front = fase separada, design intocável, review ≥8, aval visual CEO (hook use-task-links + lib/api.ts + bloco UI clicável target=_blank).
