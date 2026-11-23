# Documenter Agent - Memoria

Acumula conhecimento do Documenter ao longo das tasks do Scrumbam-Frontend-V2.

## Patterns de Documentacao

- JSDoc em portugues, identificadores em ingles. Hooks: descricao + `@param` + `@returns` + `@example` quando o uso nao for obvio.
- Componentes: JSDoc acima da funcao; props nao-obvias comentadas em linha (`/** ... */`); props triviais ficam sem comentario.
- Ao documentar, conferir primeiro se o JSDoc ja existe: na task de aprovacao (Task 1) quase tudo ja estava completo, faltou so `@returns` nos hooks.
- Comentario de bloco e comentario de funcao privada (`useNow`, `errorMessage`) sao opcionais.

## CHANGELOG (Keep a Changelog, PT-BR)

- Arquivo na raiz: `CHANGELOG.md`. Secao `## [Unreleased]` ja existe.
- Ordem das secoes no projeto: `### Fixed`, `### Added`, `### Changed`, `### Documentation`. NAO duplicar cabecalhos: se a task tem bullets de Added/Changed, mesclar nas secoes existentes.
- Formato de entrada: `- **Titulo** (Task N, Score X/10)` com sub-bullets curtos.
- Referencia ao hook: `validate-documentation.sh` so procura `## [Unreleased]` e `### (Added|Fixed|Changed|Performance)`.

## STATUS.md (workspace/STATUS.md)

- Cabecalho do projeto: `# Workflow Status - Scrumbam-Frontend-V2` (era template "Personal Agents"/[PREENCHER] ate 2026-11-23).
- Entradas de task vao no topo, logo apos `## Tasks Concluidas`.
- Hook exige `Task N` e `COMPLETE` ou `COMPLETA` no arquivo; o numero vem do nome do artefato `*-taskN.md` em `workspace/implementations|reviews|plans`.
- Titulo da secao: `## Task N - COMPLETE`, com Module, Task, Status, Date, Quality Score, Deliverables, Metrics, Issues Pendentes.

## Contrato de execucao (docs/agent-execution-contract.md)

- Secoes 5.1 a 5.3 ainda descrevem o desenho antigo (`/tasks/:id/execute`, `/tasks/:taskId/execution/:pedidoId`). Nao reescrever sem pedido: atualizar apenas a subsecao da feature mexida (ex.: 5.0 Aprovacao).

## Decisoes de Documentacao

### Batch vs Individual

- Uma task = uma entrada de CHANGELOG com bullets, e uma secao em STATUS.md.

### Commits

- `workspace/plans|implementations|reviews/*.md` estao no `.gitignore`: para commitar artefatos de uma task, usar `git add -f` apenas nos arquivos da task.
- Branch de trabalho do projeto: `feature/integracao-frontend-v2-hierarquia`. Commits locais; push so quando pedido.
- Scopes usados: `chore(agents)` para scripts de agente; `feat(tasks)` para o drawer de execucao de IA.
- Co-Authored-By segue a instrucao da task (o usuario define a linha; a do lembrete de sistema e fallback).

## Problemas Encontrados

- Validacao de score: `validate-review.sh` passou a exigir 8.5 (decisao do CEO 2026-11-23). Commit separado em `chore(agents)`.
- Lint global do projeto tem erros pre-existentes em spaces/, shell/, design-system/: nao atribuir a task atual.
- Sem suite de testes no projeto: Metrics "Tests: N/A".
