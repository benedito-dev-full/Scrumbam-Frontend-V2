#!/bin/bash
# validate-plan.sh
# Stop hook para o agent Strategist
# Valida que o plano foi criado corretamente antes de retornar ao Orchestrator

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Validando plano do Strategist..."

# ==============================================================================
# VALIDACAO 1: Plano existe em workspace/plans/
# ==============================================================================

PLAN_DIR="workspace/plans"

if [ ! -d "$PLAN_DIR" ]; then
  echo -e "${RED}ERRO: diretorio workspace/plans/ nao existe!${NC}" >&2
  echo -e "${YELLOW}Crie com: mkdir -p workspace/plans/${NC}" >&2
  exit 2
fi

LATEST_PLAN=$(find "$PLAN_DIR" -name "plan-*.md" -type f -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -1)

if [ -z "$LATEST_PLAN" ]; then
  echo -e "${RED}ERRO: Nenhum plan-*.md encontrado em workspace/plans/${NC}" >&2
  echo -e "${YELLOW}Strategist deve criar: plan-[modulo]-[descricao]-taskN.md${NC}" >&2
  exit 2
fi

echo -e "${GREEN}OK${NC} Plano encontrado: $(basename "$LATEST_PLAN")"

TASK_NUM=$(basename "$LATEST_PLAN" | grep -oE 'task[0-9]+' | grep -oE '[0-9]+' || echo "")

# ==============================================================================
# VALIDACAO 2: Nomenclatura correta
# ==============================================================================

FILENAME=$(basename "$LATEST_PLAN")

if ! echo "$FILENAME" | grep -qE '^plan-[a-z0-9]+-[a-z0-9-]+-task[0-9]+\.md$'; then
  echo -e "${RED}ERRO: Nomenclatura incorreta: $FILENAME${NC}" >&2
  echo -e "${YELLOW}Formato esperado: plan-[modulo]-[descricao]-taskN.md${NC}" >&2
  echo -e "${YELLOW}Exemplos corretos:${NC}" >&2
  echo "  - plan-auth-refresh-tokens-task1.md" >&2
  echo "  - plan-payments-stripe-integration-task5.md" >&2
  echo -e "${YELLOW}Proibido: MAIUSCULAS, espacos, acentos${NC}" >&2
  exit 2
fi

if echo "$FILENAME" | grep -q '[A-Z]'; then
  echo -e "${RED}ERRO: Nomenclatura contem MAIUSCULAS: $FILENAME${NC}" >&2
  echo -e "${YELLOW}Use apenas lowercase${NC}" >&2
  exit 2
fi

if echo "$FILENAME" | grep -q ' '; then
  echo -e "${RED}ERRO: Nomenclatura contem ESPACOS: $FILENAME${NC}" >&2
  echo -e "${YELLOW}Use hifens${NC}" >&2
  exit 2
fi

echo -e "${GREEN}OK${NC} Nomenclatura correta: $FILENAME"

# ==============================================================================
# VALIDACAO 3: Tamanho minimo (plano substantivo)
# ==============================================================================

MIN_LINES=50
LINE_COUNT=$(wc -l < "$LATEST_PLAN")

if [ "$LINE_COUNT" -lt "$MIN_LINES" ]; then
  echo -e "${RED}ERRO: Plano muito curto: $LINE_COUNT linhas (minimo: $MIN_LINES)${NC}" >&2
  echo -e "${YELLOW}Plano deve incluir:${NC}" >&2
  echo "  - Analise do problema" >&2
  echo "  - Minimo 2 alternativas (pros/contras)" >&2
  echo "  - Recomendacao justificada" >&2
  echo "  - Fases de implementacao" >&2
  echo "  - Riscos identificados e mitigacoes" >&2
  echo "  - Estimativa de tempo" >&2
  exit 2
fi

if [ "$LINE_COUNT" -lt 100 ]; then
  echo -e "${YELLOW}AVISO: Plano relativamente curto: $LINE_COUNT linhas${NC}" >&2
fi

echo -e "${GREEN}OK${NC} Tamanho adequado: $LINE_COUNT linhas"

# ==============================================================================
# VALIDACAO 4: Secoes minimas (warnings, nao bloqueia)
# ==============================================================================

CONTENT=$(cat "$LATEST_PLAN")

if ! echo "$CONTENT" | grep -qi "alternativa\|option\|approach\|opcao"; then
  echo -e "${YELLOW}AVISO: Plano pode nao conter analise de alternativas${NC}" >&2
fi

if ! echo "$CONTENT" | grep -qi "risco\|risk"; then
  echo -e "${YELLOW}AVISO: Plano pode nao conter analise de riscos${NC}" >&2
fi

if ! echo "$CONTENT" | grep -qi "fase\|phase\|step\|etapa"; then
  echo -e "${YELLOW}AVISO: Plano pode nao conter fases de implementacao${NC}" >&2
fi

if ! echo "$CONTENT" | grep -qi "estimativa\|estimate\|tempo\|time"; then
  echo -e "${YELLOW}AVISO: Plano pode nao conter estimativa de tempo${NC}" >&2
fi

# ==============================================================================
# VALIDACAO 5: Task System Update
# ==============================================================================

if [ -n "${TASK_NUM:-}" ]; then
  echo -e "${GREEN}OK${NC} Task #${TASK_NUM} - Plano validado"
fi

# ==============================================================================
# SUCESSO
# ==============================================================================

echo ""
echo -e "${GREEN}Todas as validacoes do plano passaram!${NC}"
echo -e "${GREEN}OK${NC} Arquivo: $FILENAME"
echo -e "${GREEN}OK${NC} Linhas: $LINE_COUNT"
echo ""

exit 0
