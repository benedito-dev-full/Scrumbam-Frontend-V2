# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **TaskSheet**: Descrição da task agora persiste ao sair do campo (fix do bug onde `onBlur` só resetava borda e não salvava)
  - Task #793 (DEV-122)
  - Problema: textarea de descrição nunca chamava `updateTask.mutate` no blur
  - Solução: Adicionado `confirmarDescricao()` que valida mudança e persiste via PATCH `/tasks/:id`
  - Mesmo padrão de persistência otimista usado por título, prioridade e dueDate

---

## [1.0.0] - 2026-05-30

### Added
- Subtarefas expansíveis na aba Blocos (Task #4)
- Lazy fetch de subtarefas
- Edição inline de status/responsável/data em subtarefas
- Criação de subtarefas via "+ Adicionar subelemento"
