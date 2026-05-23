#!/bin/bash
# validate-documentation.sh
# Stop hook para o agent Documenter
# Valida que a documentacao esta completa (CHANGELOG, STATUS.md, commit)

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Validando documentacao..."

# ==============================================================================
# OBTER TASK NUMBER
# ==============================================================================

TASK_NUM="${TASK_NUM:-}"

if [ -z "$TASK_NUM" ]; then
  for search_dir in workspace/implementations workspace/reviews workspace/plans; do
    if [ -d "$search_dir" ]; then
      LATEST_ARTIFACT=$(find "$search_dir" -name "*-task*.md" -type f -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -1)
      if [ -n "${LATEST_ARTIFACT:-}" ]; then
        TASK_NUM=$(basename "$LATEST_ARTIFACT" | grep -oE 'task[0-9]+' | grep -oE '[0-9]+' || echo "")
        if [ -n "$TASK_NUM" ]; then break; fi
      fi
    fi
  done
fi

if [ -z "$TASK_NUM" ]; then
  echo -e "${YELLOW}AVISO: TASK_NUM nao disponivel - validacoes parciais apenas${NC}" >&2
  TASK_NUM="UNKNOWN"
fi

echo -e "${GREEN}OK${NC} Task Number: $TASK_NUM"

# ==============================================================================
# VALIDACAO 1: STATUS.md atualizado (CRITICO!)
# ==============================================================================

echo ""
echo "Verificando STATUS.md..."

STATUS_FILE="workspace/STATUS.md"

if [ ! -f "$STATUS_FILE" ]; then
  echo -e "${RED}ERRO: Arquivo $STATUS_FILE nao encontrado!${NC}" >&2
  echo -e "${YELLOW}Crie workspace/STATUS.md${NC}" >&2
  exit 2
fi

if [ "$TASK_NUM" != "UNKNOWN" ]; then
  if ! grep -qE "Task ${TASK_NUM}" "$STATUS_FILE"; then
    echo -e "${RED}ERRO: Task $TASK_NUM NAO encontrada no STATUS.md!${NC}" >&2
    echo -e "${YELLOW}Adicione secao com ## Task ${TASK_NUM} - COMPLETE${NC}" >&2
    exit 2
  fi

  if ! grep -qE "Task ${TASK_NUM}.*COMPLETE|COMPLETA" "$STATUS_FILE"; then
    echo -e "${RED}ERRO: Task $TASK_NUM existe mas nao esta marcada como COMPLETE!${NC}" >&2
    exit 2
  fi

  echo -e "${GREEN}OK${NC} Task $TASK_NUM documentada no STATUS.md"
else
  if [ -n "$(find "$STATUS_FILE" -mmin -5 2>/dev/null)" ]; then
    echo -e "${GREEN}OK${NC} STATUS.md modificado recentemente"
  else
    echo -e "${YELLOW}AVISO: STATUS.md nao foi modificado nos ultimos 5 minutos${NC}" >&2
  fi
fi

# ==============================================================================
# VALIDACAO 2: CHANGELOG.md (se existe)
# ==============================================================================

echo ""
echo "Verificando CHANGELOG.md..."

CHANGELOG_FILE=""
for candidate in "CHANGELOG.md" "docs/CHANGELOG.md" "CHANGES.md"; do
  if [ -f "$candidate" ]; then
    CHANGELOG_FILE="$candidate"
    break
  fi
done

if [ -z "$CHANGELOG_FILE" ]; then
  echo -e "${YELLOW}INFO: CHANGELOG.md nao encontrado (opcional para projetos pessoais)${NC}"
else
  if ! grep -q "## \[Unreleased\]" "$CHANGELOG_FILE"; then
    echo -e "${YELLOW}AVISO: CHANGELOG sem secao [Unreleased]${NC}" >&2
    echo -e "${YELLOW}  Adicione: ## [Unreleased]${NC}" >&2
  else
    RECENT_CHANGELOG=$(head -50 "$CHANGELOG_FILE")
    if ! echo "$RECENT_CHANGELOG" | grep -qE "### (Added|Fixed|Changed|Performance)"; then
      echo -e "${YELLOW}AVISO: CHANGELOG [Unreleased] pode estar vazio${NC}" >&2
    else
      echo -e "${GREEN}OK${NC} CHANGELOG atualizado"
    fi
  fi
fi

# ==============================================================================
# VALIDACAO 3: Git commit (CRITICO!)
# ==============================================================================

echo ""
echo "Verificando git commit..."

if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo -e "${YELLOW}AVISO: Nao e um repositorio git — pulando validacao de commit${NC}"
else
  LAST_COMMIT=$(git log -1 --oneline 2>/dev/null || echo "")

  if [ -z "$LAST_COMMIT" ]; then
    echo -e "${RED}ERRO: Nenhum commit encontrado!${NC}" >&2
    echo -e "${YELLOW}Crie commit com Conventional Commits:${NC}" >&2
    echo "  git commit -m \"feat(modulo): descricao\"" >&2
    exit 2
  fi

  echo "Ultimo commit: $LAST_COMMIT"

  if ! echo "$LAST_COMMIT" | grep -qE '^[a-f0-9]+ (feat|fix|docs|refactor|perf|test|chore|style|ci|build)(\([a-z0-9-]+\))?:'; then
    echo -e "${YELLOW}AVISO: Commit pode nao seguir Conventional Commits${NC}" >&2
    echo -e "${YELLOW}  Formato esperado: type(scope): subject${NC}" >&2
  fi

  COMMIT_TIME=$(git log -1 --format=%ct 2>/dev/null || echo "0")
  NOW=$(date +%s)
  DIFF=$((NOW - COMMIT_TIME))
  MINUTES=$((DIFF / 60))

  if [ "$MINUTES" -gt 30 ]; then
    echo -e "${YELLOW}AVISO: Ultimo commit tem ${MINUTES} minutos (esperado: <30min)${NC}" >&2
  fi

  echo -e "${GREEN}OK${NC} Git commit existe (${MINUTES}min atras)"
fi

# ==============================================================================
# VALIDACAO 4: JSDoc em arquivos recentes
# ==============================================================================

echo ""
echo "Verificando JSDoc (amostra)..."

RECENT_TS_FILES=$(find src/ -name "*.ts" -mtime -1 -type f 2>/dev/null | head -5)

if [ -z "$RECENT_TS_FILES" ]; then
  echo -e "${YELLOW}INFO: Nenhum .ts modificado recentemente em src/${NC}"
else
  FILES_WITH_JSDOC=0
  TOTAL_FILES=0

  while IFS= read -r file; do
    TOTAL_FILES=$((TOTAL_FILES + 1))
    if grep -q '/\*\*' "$file" 2>/dev/null; then
      FILES_WITH_JSDOC=$((FILES_WITH_JSDOC + 1))
    fi
  done <<< "$RECENT_TS_FILES"

  if [ "$FILES_WITH_JSDOC" -eq 0 ] && [ "$TOTAL_FILES" -gt 0 ]; then
    echo -e "${YELLOW}AVISO: Nenhum dos $TOTAL_FILES arquivos recentes tem JSDoc!${NC}" >&2
  else
    echo -e "${GREEN}OK${NC} JSDoc presente em $FILES_WITH_JSDOC/$TOTAL_FILES arquivos recentes"
  fi
fi

# ==============================================================================
# SUCESSO
# ==============================================================================

echo ""
echo -e "${GREEN}==============================================${NC}"
echo -e "${GREEN}VALIDACOES DE DOCUMENTACAO PASSARAM!${NC}"
echo -e "${GREEN}==============================================${NC}"
echo -e "${GREEN}OK${NC} STATUS.md: Task documentada"
echo -e "${GREEN}OK${NC} Commit: Criado"
echo ""
echo -e "${GREEN}Documentacao completa! Task finalizada.${NC}"
echo ""

exit 0
