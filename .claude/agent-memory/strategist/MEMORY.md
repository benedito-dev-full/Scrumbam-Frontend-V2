# Strategist Agent - Memoria

## Projeto

Scrumban — ferramenta de gestao de tarefas/sprints (ClickUp/Asana-like).
Frontend: Next.js 16 + React 19 + TanStack Query + shadcn (Scrumbam-Frontend-V2).
Backend: NestJS + Prisma + PostgreSQL (Scrumban-Backend-V2), arquitetura polomorfica Devari-Core.
ADR-V2-001: zero tabela nova (17 tabelas canonicas fixas no schema Prisma).
Hierarquia: Workspace → Space (-350) → Folder (-351) → List (-352) → Tasks (DTask).

## Decisoes Arquiteturais

- [ADR Templates Storage](adr-templates-storage.md) — Templates como DProject idClasse=-528, dados.isTemplate=true, dados.templateCategory string. Zero tabela nova. Templates com idEstab=null (globais). (2026-05-29)

## Patterns que Funcionaram

- [Clone Recursivo com $transaction](pattern-clone-recursivo.md) — Pattern de clonagem Space→Folder→List+Tasks em $transaction: seedBootstrap ANTES de tasks, lookup status/priority por codigo, createMany batch. (2026-05-29)

## Riscos Materializados

- [Incidente sessao/auth (jul/2026)](incidente-sessao-auth-2026-07.md) — 3 causas-raiz em producao: sessionStorage vs cookie de rota, refresh slot-unico com rotacao estrita (falso positivo de reuse), catch{} que vira 401. Decisoes + plano de correcao.

## Frontend

- [Aba Blocos / GroupsView](frontend-blocks-view.md) — modos Backend vs Prototype, tipos do contrato em groups-store (migrar p/ table-fields.ts), lacunas de colunas custom. Plano: plan-blocks-colunas-customizaveis-task5.md

## Bounded Contexts

- `projects/` — CRUD de DProject (Space/Folder/List), seed de statuses/sprint, validacao hierarquica
- `templates/` (a criar) — listagem e clonagem de templates; depende de projects/ para SeedBootstrapService
- `tasks/` — CRUD de DTask, vinculada a DProject (idProject)
