#!/bin/bash
# session-setup.sh
# SessionStart hook — verifica pre-requisitos ao iniciar a sessao
#
# Stdout e adicionado como contexto para o Claude
# Exit 0 = sucesso (stdout vira contexto)

set -euo pipefail

ERRORS=0
WARNINGS=0
CONTEXT=""

# =====================================================================
# CHECK 1: Node.js instalado
# =====================================================================
if ! command -v node &>/dev/null; then
  CONTEXT+="ERROR: Node.js nao encontrado. Instale antes de continuar.\n"
  ERRORS=$((ERRORS + 1))
else
  NODE_VERSION=$(node --version)
  CONTEXT+="Node.js: $NODE_VERSION\n"
fi

# =====================================================================
# CHECK 2: package.json (projeto Node)
# =====================================================================
if [ -f "package.json" ]; then
  CONTEXT+="package.json: OK\n"

  # Check 2.1: node_modules
  if [ ! -d "node_modules" ]; then
    CONTEXT+="WARNING: node_modules nao encontrado. Rode 'npm install'.\n"
    WARNINGS=$((WARNINGS + 1))
  else
    CONTEXT+="node_modules: OK\n"
  fi
else
  CONTEXT+="INFO: Sem package.json (nao e projeto Node ou raiz diferente).\n"
fi

# =====================================================================
# CHECK 3: Next.js detectado
# =====================================================================
if [ -f "package.json" ] && grep -q '"next"' package.json 2>/dev/null; then
  NEXT_VERSION=$(node -e "console.log(require('./package.json').dependencies.next || '')" 2>/dev/null)
  CONTEXT+="Next.js: $NEXT_VERSION (App Router + RSC)\n"

  # .next/ cache
  if [ -d ".next" ]; then
    CONTEXT+=".next/: OK (build cache presente)\n"
  fi

  # AGENTS.md warning sobre breaking changes
  if [ -f "AGENTS.md" ]; then
    CONTEXT+="AGENTS.md presente — Next 16 tem breaking changes; consulte node_modules/next/dist/docs/\n"
  fi
fi

# =====================================================================
# CHECK 3.1: jq (dependency dos hooks)
# =====================================================================
if ! command -v jq &>/dev/null; then
  CONTEXT+="WARNING: jq nao encontrado. Hooks dependem dele — instale com 'sudo apt install jq'.\n"
  WARNINGS=$((WARNINGS + 1))
fi

# =====================================================================
# CHECK 4: .env (se .env.example existe)
# =====================================================================
if [ -f ".env.example" ]; then
  if [ ! -f ".env" ]; then
    CONTEXT+="WARNING: .env.example existe mas .env nao. Copie e configure.\n"
    WARNINGS=$((WARNINGS + 1))
  else
    CONTEXT+=".env: OK\n"
  fi
fi

# =====================================================================
# CHECK 5: Git branch
# =====================================================================
BRANCH=$(git branch --show-current 2>/dev/null || echo "(sem git)")
CONTEXT+="Git branch: $BRANCH\n"

# =====================================================================
# CHECK 6: Arquivos modificados
# =====================================================================
if git rev-parse --git-dir > /dev/null 2>&1; then
  MODIFIED=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
  CONTEXT+="Arquivos modificados: $MODIFIED\n"
fi

# =====================================================================
# CHECK 7: workspace/ para multi-agent
# =====================================================================
if [ ! -d "workspace" ]; then
  CONTEXT+="WARNING: workspace/ nao existe. Agents multi-agent precisam dele.\n"
  CONTEXT+="  Crie: mkdir -p workspace/{plans,implementations,reviews}\n"
  WARNINGS=$((WARNINGS + 1))
else
  CONTEXT+="workspace/: OK\n"
fi

# =====================================================================
# CHECK 8: CLAUDE.md existe (recomendado)
# =====================================================================
if [ ! -f "CLAUDE.md" ]; then
  CONTEXT+="INFO: CLAUDE.md nao existe. Recomendado criar para padroes do projeto.\n"
fi

# =====================================================================
# OUTPUT
# =====================================================================
echo "=== Personal Agents Session Setup ==="
echo -e "$CONTEXT"

if [ "$ERRORS" -gt 0 ]; then
  echo "RESULTADO: $ERRORS erros, $WARNINGS warnings"
  echo "Corrija erros antes de comecar."
else
  echo "RESULTADO: Ambiente OK ($WARNINGS warnings)"
fi

exit 0
