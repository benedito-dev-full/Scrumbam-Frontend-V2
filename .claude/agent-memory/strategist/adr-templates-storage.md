---
name: adr-templates-storage
description: Decisao arquitetural sobre storage dos templates — DProject idClasse=-528 + dados.isTemplate, sem tabela nova
metadata:
  type: project
---

**Decisao:** Templates de espaco (sistema de templates do Scrumban) sao armazenados
como DProject com `idClasse=-528 TEMPLATE_SPACE` + campo `dados.isTemplate=true` +
`dados.templateCategory=string`. ZERO tabela nova (ADR-V2-001 respeitado).

**Por que:** DProject tem infraestrutura polomorfica completa (idPai, dados Json,
hierarquia Space→Folder→List). `idClasse=-528` permite INDEX eficiente no banco
sem full-scan por campo Json. Templates tem `idEstab=null` (globais, nao pertencem
a nenhuma org).

**Como aplicar:** Qualquer futura feature relacionada a templates deve usar este
padrao — nao criar tabela nova. Clonagem e operacao estrutural (Prisma direto
em `$transaction`), nao usa DPedido engine.

**Alternativas descartadas:**
- Tudo em `dados` sem DClasse: full-scan em Json, risco de vazamento de tenant
- JSON/seed no repo: inviavel para manutencao operacional, exige deploy para editar
- DTabela como catalogo: JSON blob gigante, perde capacidade de navegacao relacional

**Vinculado a:** plan-spaces-sistema-templates-task1.md (2026-05-29)
