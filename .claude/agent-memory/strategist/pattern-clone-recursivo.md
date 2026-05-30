---
name: pattern-clone-recursivo
description: Pattern de clonagem recursiva de sub-arvore DProject+DTask em $transaction com remapeamento de idPai e batch insert
metadata:
  type: project
---

**Pattern:** Clonar sub-arvore Space→Folder→List + DTasks em `$transaction` Prisma:

1. Criar entidade raiz destino
2. Para cada filho: criar DProject filho com idPai=novoId, guardar mapa oldId→newId
3. Para cada LIST: rodar `seedBootstrap.seedProject()` ANTES de inserir tasks
4. Fazer lookup de idStatus/idPriority por codigo (1 query batch, nao N+1)
5. Usar `createMany` para DTasks (1 query por lista, suporta 300+ tasks)
6. Emitir DEvento auditoria APOS commit

**Por que:** Respeita ADR-V2-001 (zero tabela), aproveita infraestrutura existente
de SeedBootstrapService. A ordem (seed ANTES de tasks) e critica: tasks precisam
dos idStatus/idPriority das DTabelas recem-criadas.

**Risco principal:** `$transaction` timeout com 300 tasks. Mitigacao: createMany
batch (1 query/lista) e nao loop individual.

**Referencia:** plan-spaces-sistema-templates-task1.md, Fase 4
