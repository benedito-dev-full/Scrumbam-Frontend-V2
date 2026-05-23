#!/bin/bash
# validate-implementation.sh
# Stop hook para o agent Implementer
# Valida que a implementacao esta correta antes de passar para o Reviewer

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Validando implementacao..."

# ==============================================================================
# HELPER: Detectar comando de build
# ==============================================================================

detect_build_command() {
  if [ -f "Makefile" ] && grep -q '^build:' Makefile; then
    echo "make build"
  elif [ -f "package.json" ] && grep -q '"build"' package.json; then
    echo "npm run build"
  else
    echo "none"
  fi
}

BUILD_CMD=$(detect_build_command)

# ==============================================================================
# VALIDACAO 1: BUILD DEVE PASSAR (CRITICO)
# ==============================================================================

if [ "$BUILD_CMD" != "none" ]; then
  echo ""
  echo "Rodando build (CRITICO - pode levar 15-30s)..."
  echo "Comando: $BUILD_CMD"

  if ! $BUILD_CMD > /tmp/build-output.log 2>&1; then
    echo -e "${RED}ERRO: BUILD FALHOU!${NC}" >&2
    echo -e "${RED}Codigo que nao compila nao pode ser aceito!${NC}" >&2
    echo "" >&2
    echo -e "${YELLOW}Ultimas 20 linhas do erro:${NC}" >&2
    tail -20 /tmp/build-output.log >&2
    echo "" >&2
    echo -e "${YELLOW}Log completo em: /tmp/build-output.log${NC}" >&2
    exit 2
  fi

  echo -e "${GREEN}BUILD PASSOU!${NC}"
else
  echo -e "${YELLOW}AVISO: Nenhum comando de build detectado (sem package.json ou Makefile)${NC}"
fi

# ==============================================================================
# VALIDACAO 2: TypeScript - ZERO ERROS (se aplicavel)
# ==============================================================================

if [ -f "tsconfig.json" ]; then
  echo ""
  echo "Verificando TypeScript..."

  if ! npx tsc --noEmit > /tmp/typescript-output.log 2>&1; then
    echo -e "${RED}ERRO: TypeScript com ERROS!${NC}" >&2
    echo -e "${RED}TypeScript com 0 erros e obrigatorio.${NC}" >&2
    echo "" >&2
    echo -e "${YELLOW}Erros encontrados:${NC}" >&2
    cat /tmp/typescript-output.log >&2
    echo "" >&2
    exit 2
  fi

  echo -e "${GREEN}TypeScript: 0 erros${NC}"
fi

# ==============================================================================
# VALIDACAO 3: Implementation notes existem
# ==============================================================================

echo ""
echo "Verificando implementation notes..."

IMPL_DIR="workspace/implementations"

if [ ! -d "$IMPL_DIR" ]; then
  echo -e "${RED}ERRO: diretorio workspace/implementations/ nao existe!${NC}" >&2
  exit 2
fi

LATEST_IMPL=$(find "$IMPL_DIR" -name "impl-*.md" -type f -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -1)

if [ -z "$LATEST_IMPL" ]; then
  echo -e "${RED}ERRO: Implementation notes nao encontradas!${NC}" >&2
  echo -e "${YELLOW}Crie: workspace/implementations/impl-[modulo]-[descricao]-taskN.md${NC}" >&2
  exit 2
fi

IMPL_FILENAME=$(basename "$LATEST_IMPL")

if ! echo "$IMPL_FILENAME" | grep -qE '^impl-[a-z0-9]+-[a-z0-9-]+-task[0-9]+\.md$'; then
  echo -e "${RED}ERRO: Nomenclatura incorreta: $IMPL_FILENAME${NC}" >&2
  echo -e "${YELLOW}Formato: impl-[modulo]-[descricao]-taskN.md${NC}" >&2
  exit 2
fi

if echo "$IMPL_FILENAME" | grep -q '[A-Z]'; then
  echo -e "${RED}ERRO: Nomenclatura contem MAIUSCULAS: $IMPL_FILENAME${NC}" >&2
  exit 2
fi

IMPL_LINES=$(wc -l < "$LATEST_IMPL")
echo -e "${GREEN}OK${NC} Implementation notes: $IMPL_FILENAME ($IMPL_LINES linhas)"

TASK_NUM=$(echo "$IMPL_FILENAME" | grep -oE 'task[0-9]+' | grep -oE '[0-9]+' || echo "")

# ==============================================================================
# VALIDACAO 4: ESLint (se configurado)
# ==============================================================================

if [ -f ".eslintrc.json" ] || [ -f ".eslintrc.js" ] || [ -f "eslint.config.js" ] || [ -f "eslint.config.mjs" ] || grep -q '"eslint"' package.json 2>/dev/null; then
  echo ""
  echo "Rodando ESLint..."

  ESLINT_OUTPUT=$(npx eslint src/ --format json 2>/dev/null || echo "[]")

  ERROR_COUNT=$(echo "$ESLINT_OUTPUT" | jq '[.[] | .errorCount] | add // 0' 2>/dev/null || echo 0)
  WARNING_COUNT=$(echo "$ESLINT_OUTPUT" | jq '[.[] | .warningCount] | add // 0' 2>/dev/null || echo 0)

  if [ "$ERROR_COUNT" -gt 0 ]; then
    echo -e "${RED}ERRO: ESLint encontrou $ERROR_COUNT erros!${NC}" >&2
    echo -e "${YELLOW}Corrija antes de prosseguir.${NC}" >&2
    npx eslint src/ >&2 || true
    exit 2
  fi

  if [ "$WARNING_COUNT" -gt 5 ]; then
    echo -e "${YELLOW}AVISO: ESLint: $WARNING_COUNT warnings (aceitavel: 0-5)${NC}"
  else
    echo -e "${GREEN}OK${NC} ESLint: $ERROR_COUNT erros, $WARNING_COUNT warnings"
  fi
fi

# ==============================================================================
# VALIDACAO 5: Git status
# ==============================================================================

echo ""
echo "Verificando arquivos modificados..."

if git rev-parse --git-dir > /dev/null 2>&1; then
  MODIFIED_COUNT=$(git status --porcelain | grep -c '^ M' || true)
  CREATED_COUNT=$(git status --porcelain | grep -c '^??' || true)
  TOTAL_CHANGES=$((MODIFIED_COUNT + CREATED_COUNT))

  if [ "$TOTAL_CHANGES" -eq 0 ]; then
    echo -e "${YELLOW}AVISO: Nenhuma mudanca detectada no git${NC}"
    echo -e "${YELLOW}  Verifique se a implementacao foi feita.${NC}"
  fi

  echo -e "${GREEN}OK${NC} Mudancas detectadas: $MODIFIED_COUNT modificados, $CREATED_COUNT novos"
fi

# ==============================================================================
# VALIDACAO 6: Task System
# ==============================================================================

if [ -n "${TASK_NUM:-}" ]; then
  echo ""
  echo -e "${GREEN}OK${NC} Task #${TASK_NUM} - Implementacao validada"
fi

# ==============================================================================
# SUCESSO
# ==============================================================================

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}TODAS AS VALIDACOES PASSARAM!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}OK${NC} Build: PASS"
echo -e "${GREEN}OK${NC} TypeScript: 0 erros"
echo -e "${GREEN}OK${NC} Implementation notes: OK"
echo ""
echo -e "${GREEN}Implementacao aprovada para Review!${NC}"
echo ""

exit 0
