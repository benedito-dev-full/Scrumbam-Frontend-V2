---
name: backend-task-links-dvincula-189
description: Feature "links externos a tasks" no Scrumban-Backend-V2 — DVincula -189, módulo src/docs/, reuso do CommentTargetResolver
metadata:
  type: project
---

Feature "anexar link externo a task" no **Scrumban-Backend-V2** (NÃO o Frontend onde a sessão roda). Repo: `C:\Users\Benedito\Documents\Visual Studio Code\Scrumbam\Scrumbam-Backend-V2`.

**Why:** CEO quer colar URL de doc externo (Drive/Notion/Word) e prender à task. Link mora em `DVincula.metaDados`, ZERO tabela nova. Espelho invertido de bookmarks.

**How to apply:** ao retomar essa feature (Fase 4 controller, Fase 5 testes):
- Módulo é `DocsModule` em `src/docs/` (não `src/task-links/`). DTOs da Fase 2: `AttachLinkDto`, `TaskLinkResponseDto`, `ListTaskLinksResponseDto`, validador `IsSafeHttpUrl`, todos em `src/docs/dto/`.
- Service `src/docs/task-links.service.ts`: attach/list/detach. Molde 1:1 = `src/bookmarks/bookmarks.service.ts`.
- Mapeamento DVincula -189: `idLocEscritu`=taskId (dono=task), `idEntidade`/`idTabela`=null, `metaDados={url,title,provider}`, `excluido` soft-delete.
- Autorização: `CommentTargetResolver.resolveAndAuthorize(CommentTargetType.TASK, taskId.toString(), requesterEntidadeId, organizationId)` — agora EXPORTADO de `CommentsModule` (eu adicionei ao exports). `DocsModule` importa `CommentsModule` direto (sem forwardRef — sem ciclo).
- Dedup: findMany por (idClasse=-189, idLocEscritu=taskId) SEM filtro excluido, filtra metaDados.url em memória; ativo→409, soft-deleted→reativa.
- `detectProvider(url)` em `src/docs/utils/detect-provider.util.ts` — puro, nunca lança, retorna 'drive'|'notion'|'word'|'other'.
- Fase 4 = sub-rotas em `src/tasks/tasks.controller.ts` (`POST/GET/DELETE /tasks/:id/links`), importar DocsModule em tasks.module.

Comandos backend: `npm run build` (nest build), `npx jest <path>`, `npx eslint <files>`. -189 já no seed (classes.seed.ts linha ~194).
