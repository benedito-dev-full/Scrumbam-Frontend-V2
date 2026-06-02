---
name: adr-comment-devento
description: Comentários em task usam DEvento -507 (TASK_COMMENT), não tabela nova. Decisão de 2026-05-27.
metadata:
  type: project
---

Comentários textuais de usuário em tasks usam a tabela `DEvento` com nova DClasse `-507 TASK_COMMENT`.

- `DEvento.identificadorExterno` = taskId (referência à task alvo)
- `DEvento.idEntidade` = autor (DEntidade)
- `DEvento.descricao` = texto do comentário (Text, suporta markdown longo)
- Cursor pagination por `chave DESC`
- Soft-delete via `DEvento.excluido = true`

**Why:** Nova tabela violaria ADR-V2-001 (hook enforce-canonical-tables.sh). JSON nested em DTask.dados não é paginável. DEvento é o padrão estabelecido para audit trail polimórfico.

**How to apply:** Ao planejar features de comentário/nota em qualquer entidade do Scrumban-V2, usar DEvento polimórfico com nova DClasse semântica antes de propor nova tabela.
