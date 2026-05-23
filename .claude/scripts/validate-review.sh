#!/bin/bash
# validate-review.sh
# Stop hook para o agent Reviewer
# Valida que a review esta completa e tem uma decisao clara

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Validando review do Reviewer..."

# ==============================================================================
# VALIDACAO 1: Review existe em workspace/reviews/
# ==============================================================================

REVIEW_DIR="workspace/reviews"

if [ ! -d "$REVIEW_DIR" ]; then
  echo -e "${RED}ERRO: diretorio workspace/reviews/ nao existe!${NC}" >&2
  exit 2
fi

LATEST_REVIEW=$(find "$REVIEW_DIR" -name "review-*.md" -type f -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -1)

if [ -z "$LATEST_REVIEW" ]; then
  echo -e "${RED}ERRO: Review nao encontrada em workspace/reviews/${NC}" >&2
  echo -e "${YELLOW}Crie: workspace/reviews/review-[modulo]-[descricao]-taskN.md${NC}" >&2
  exit 2
fi

REVIEW_FILENAME=$(basename "$LATEST_REVIEW")
echo -e "${GREEN}OK${NC} Review encontrada: $REVIEW_FILENAME"

# ==============================================================================
# VALIDACAO 2: Nomenclatura
# ==============================================================================

if ! echo "$REVIEW_FILENAME" | grep -qE '^review-[a-z0-9]+-[a-z0-9-]+-task[0-9]+\.md$'; then
  echo -e "${RED}ERRO: Nomenclatura incorreta: $REVIEW_FILENAME${NC}" >&2
  echo -e "${YELLOW}Formato: review-[modulo]-[descricao]-taskN.md${NC}" >&2
  exit 2
fi

if echo "$REVIEW_FILENAME" | grep -q '[A-Z]'; then
  echo -e "${RED}ERRO: Nomenclatura contem MAIUSCULAS${NC}" >&2
  exit 2
fi

echo -e "${GREEN}OK${NC} Nomenclatura: OK"

TASK_NUM=$(echo "$REVIEW_FILENAME" | grep -oE 'task[0-9]+' | grep -oE '[0-9]+' || echo "")

# ==============================================================================
# VALIDACAO 3: Score numerico presente (X/10)
# ==============================================================================

REVIEW_CONTENT=$(cat "$LATEST_REVIEW")

SCORE=$(echo "$REVIEW_CONTENT" | grep -oE '[0-9]+\.?[0-9]*/10' | head -1 || echo "")

if [ -z "$SCORE" ]; then
  echo -e "${RED}ERRO: Score numerico nao encontrado!${NC}" >&2
  echo -e "${YELLOW}Review deve incluir score no formato: X/10 ou X.X/10${NC}" >&2
  exit 2
fi

SCORE_VALUE=$(echo "$SCORE" | grep -oE '^[0-9]+\.?[0-9]*' || echo "0")
echo -e "${GREEN}OK${NC} Score encontrado: $SCORE"

if (( $(echo "$SCORE_VALUE < 0" | bc -l) )) || (( $(echo "$SCORE_VALUE > 10" | bc -l) )); then
  echo -e "${RED}ERRO: Score fora do range: $SCORE_VALUE (esperado: 0-10)${NC}" >&2
  exit 2
fi

if (( $(echo "$SCORE_VALUE < 7.0" | bc -l) )); then
  echo -e "${YELLOW}AVISO: Score abaixo do minimo: $SCORE_VALUE (minimo: 7.0)${NC}" >&2
fi

# ==============================================================================
# VALIDACAO 4: Decisao clara
# ==============================================================================

echo ""
echo "Verificando decisao do Reviewer..."

DECISION=""

if echo "$REVIEW_CONTENT" | grep -qi "APPROVED"; then
  DECISION="APPROVED"
elif echo "$REVIEW_CONTENT" | grep -qi "REJECTED"; then
  DECISION="REJECTED"
elif echo "$REVIEW_CONTENT" | grep -qi "NEEDS.CHANGE\|NEEDS_CHANGE"; then
  DECISION="NEEDS_CHANGES"
fi

if [ -z "$DECISION" ]; then
  echo -e "${RED}ERRO: Decisao nao encontrada!${NC}" >&2
  echo -e "${YELLOW}Review deve conter uma de:${NC}" >&2
  echo "  - APPROVED" >&2
  echo "  - REJECTED" >&2
  echo "  - NEEDS_CHANGES" >&2
  exit 2
fi

echo -e "${GREEN}OK${NC} Decisao: $DECISION"

# ==============================================================================
# VALIDACAO 5: Score vs Decisao consistente
# ==============================================================================

if [ "$DECISION" = "REJECTED" ] && (( $(echo "$SCORE_VALUE >= 7.0" | bc -l) )); then
  echo -e "${YELLOW}AVISO: Inconsistencia: REJECTED com score $SCORE_VALUE >= 7.0${NC}" >&2
fi

if [ "$DECISION" = "APPROVED" ] && (( $(echo "$SCORE_VALUE < 7.0" | bc -l) )); then
  echo -e "${RED}ERRO: Inconsistencia: APPROVED com score $SCORE_VALUE < 7.0${NC}" >&2
  echo -e "${RED}Nao pode aprovar com score abaixo de 7.0!${NC}" >&2
  exit 2
fi

# ==============================================================================
# VALIDACAO 6: Conformidade com plano (se plan existe)
# ==============================================================================

PLAN_DIR="workspace/plans"

if [ -d "$PLAN_DIR" ] && [ -n "${TASK_NUM:-}" ]; then
  MATCHING_PLAN=$(find "$PLAN_DIR" -name "plan-*-task${TASK_NUM}.md" -type f 2>/dev/null | head -1)

  if [ -n "$MATCHING_PLAN" ]; then
    echo "Plan encontrado para task ${TASK_NUM}: $(basename "$MATCHING_PLAN")"

    if ! echo "$REVIEW_CONTENT" | grep -qi "conformidade\|conformance\|CF-1\|CF-2"; then
      echo -e "${YELLOW}AVISO: Plan existe mas review nao tem secao 'Conformidade com o Plano'${NC}" >&2
    else
      echo -e "${GREEN}OK${NC} Secao de conformidade encontrada na review"
    fi
  fi
fi

# ==============================================================================
# VALIDACAO 7: Tamanho minimo
# ==============================================================================

REVIEW_LINES=$(wc -l < "$LATEST_REVIEW")

if [ "$REVIEW_LINES" -lt 30 ]; then
  echo -e "${YELLOW}AVISO: Review curta: $REVIEW_LINES linhas${NC}" >&2
fi

# ==============================================================================
# SUCESSO
# ==============================================================================

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}VALIDACOES DA REVIEW PASSARAM!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}OK${NC} Arquivo: $REVIEW_FILENAME"
echo -e "${GREEN}OK${NC} Score: $SCORE"
echo -e "${GREEN}OK${NC} Decisao: $DECISION"
echo ""

if [ "$DECISION" = "APPROVED" ]; then
  echo -e "${GREEN}Review aprovada! Prossiga para o Documenter.${NC}"
elif [ "$DECISION" = "REJECTED" ]; then
  echo -e "${YELLOW}Review rejeitada. Volte ao Implementer com feedback.${NC}"
else
  echo -e "${YELLOW}Mudancas necessarias. Volte ao Implementer.${NC}"
fi

echo ""
exit 0
