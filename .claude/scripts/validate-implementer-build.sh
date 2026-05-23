#!/bin/bash
# validate-implementer-build.sh
# SubagentStop hook para o Implementer
# Double-check: garante que o build passa ANTES de retornar ao Orchestrator

set -euo pipefail

cat > /dev/null 2>&1 || true

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo "Double-check: validando build do Implementer..." >&2

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

# =====================================================================
# VALIDACAO 1: Build DEVE passar
# =====================================================================
if [ "$BUILD_CMD" != "none" ]; then
  if ! $BUILD_CMD > /tmp/subagent-build-check.log 2>&1; then
    echo -e "${RED}BUILD FALHOU no double-check!${NC}" >&2
    echo "Implementer NAO pode retornar com build quebrado." >&2
    echo "Comando: $BUILD_CMD" >&2
    echo "Ultimas 10 linhas:" >&2
    tail -10 /tmp/subagent-build-check.log >&2

    ERRMSG=$(tail -5 /tmp/subagent-build-check.log | tr '\n' ' ' | sed 's/"/\\"/g')
    cat <<EOF
{
  "decision": "block",
  "reason": "BUILD FALHOU no double-check ($BUILD_CMD). Implementer precisa corrigir o build antes de retornar. Erro: ${ERRMSG}"
}
EOF
    exit 0
  fi

  echo -e "${GREEN}Double-check: BUILD OK ($BUILD_CMD)${NC}" >&2
fi

# =====================================================================
# VALIDACAO 2: Implementation notes existem
# =====================================================================
IMPL_DIR="workspace/implementations"
LATEST_IMPL=""
if [ -d "$IMPL_DIR" ]; then
  LATEST_IMPL=$(find "$IMPL_DIR" -name "impl-*.md" -type f -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -1 || true)
fi

if [ -z "${LATEST_IMPL:-}" ]; then
  cat <<EOF
{
  "decision": "block",
  "reason": "Implementation notes nao encontradas em workspace/implementations/. Implementer precisa criar impl-[modulo]-[desc]-taskN.md antes de retornar."
}
EOF
  exit 0
fi

echo -e "${GREEN}Double-check: Implementation notes OK${NC}" >&2
echo -e "${GREEN}Double-check COMPLETO: Implementer pode retornar.${NC}" >&2
exit 0
