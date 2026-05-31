---
name: frontend-blocks-view
description: Como a aba Blocos do frontend (GroupsView) consome o backend — modos, tipos do protótipo, e lacunas de colunas customizáveis
metadata:
  type: project
---

A aba Blocos do Scrumbam-Frontend-V2 é `view="blocks"` em
`src/app/(app)/lists/[id]/page.tsx` → `<GroupsView projectId={id} />` em
`src/components/lists/groups-view.tsx` (~3392 linhas).

**Why:** Integração de "Colunas Customizáveis" (backend Fases 1-7 prontas,
ADR-V2-055: schema mora em `DProject.tableFields` por LISTA). Plano em fases:
`workspace/plans/plan-blocks-colunas-customizaveis-task5.md`.

**How to apply:** ao planejar features dessa aba, lembrar:
- 2 modos: `BackendGroupsView` (real, com projectId — USAR) e `PrototypeGroupsView`
  (localStorage, design-system — a remover).
- Tipos do contrato (`ColumnDef/ColumnType/ColumnOption/ColumnConfig/FieldValue/
  TaskModel/GroupModel/GroupsBoard` + `COLUMN_TYPE_LABEL`) vivem HOJE em
  `src/lib/prototype/groups-store.ts` mas devem migrar para
  `src/lib/types/table-fields.ts` (não apagar — são contrato espelhado do backend).
  Importadores: `groups-view.tsx` (l.39-50) e `groups-from-tasks.ts` (l.23-29).
- `buildGroupsBoard` (`src/lib/mappers/groups-from-tasks.ts:188`) hoje ignora
  `tableFields` e retorna `BACKEND_COLUMNS` fixo (l.103). `DProjectDto`
  (`src/lib/types/api.ts:106`) NÃO tem `tableFields` (confirmado 2026-05-31).
- Contrato backend: key regex `^f_[a-z0-9]{2,}$` (prefixo f_); builtins NÃO seguem
  o regex (são virtuais, nunca enviados em tableFields). PATCH /projects/:id reescreve
  o schema inteiro (risco de concorrência). PUT /tasks/:id faz merge por chave em
  dados.fields. Relacionado: [[colunas-custom-escopo-por-lista]].
