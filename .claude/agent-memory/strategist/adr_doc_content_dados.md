---
name: adr-doc-content-dados
description: Conteúdo markdown de Doc vive em DProject.dados.content (string dentro do campo Json). Decisão de 2026-05-27.
metadata:
  type: project
---

Documentos ricos são `DProject` com `idClasse=-353 (DOC)`. O conteúdo markdown
é armazenado em `DProject.dados.content` (string dentro do campo Json polimórfico).

- Zero alteração de schema Prisma (ADR-V2-001 preservado)
- Já indicado no comentário do seed: `esp(-353, 'DOC', 'Documento rico (conteudo em dados.content)', -51)`
- Ao fazer update de conteúdo: sempre merge explícito do campo `dados`:
  ```typescript
  const dadosNovos = { ...dadosExistentes, content: dto.conteudo };
  ```
  NUNCA sobrescrever `dados` inteiro — perda de `slug`, `createdBy`, `color`, etc.

Endpoints: POST/PATCH/GET /docs (DocsModule separado, delega ao ProjectsService).

**Why:** Nova coluna ou tabela violaria ADR-V2-001. Campo dados.content já previsto no seed comentário.

**How to apply:** Ao planejar armazenamento de conteúdo rico em entidades DProject, usar dados.content antes de propor mudança de schema.
