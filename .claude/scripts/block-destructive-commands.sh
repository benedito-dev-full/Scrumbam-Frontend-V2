#!/bin/bash
# block-destructive-commands.sh
# PreToolUse hook que bloqueia comandos destrutivos em Bash
#
# Exit 2 = bloqueia comando (stderr volta pro Claude como erro)
# Exit 0 = permite comando

set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$COMMAND" ]; then
  exit 0
fi

# =====================================================================
# LISTA DE COMANDOS DESTRUTIVOS (BLOQUEADOS)
# =====================================================================

# 1. Next.js / build cache destrutivo
if echo "$COMMAND" | grep -iE 'rm\s+(-rf|-fr)\s+\.next' > /dev/null; then
  echo "AVISO: rm -rf .next/ apaga o build cache. Sera regerado no proximo build." >&2
  # Nao bloqueia — em Next as vezes precisa limpar cache. So avisa.
fi

# 1.1 npm/node destrutivo
if echo "$COMMAND" | grep -iE 'npm\s+publish' > /dev/null; then
  echo "BLOQUEADO: npm publish requer revisao manual." >&2
  exit 2
fi

if echo "$COMMAND" | grep -iE 'rm\s+(-rf|-fr)\s+package-lock\.json' > /dev/null; then
  echo "AVISO: deletar package-lock.json muda a resolucao de dependencias." >&2
  echo "Considere 'npm ci' para reinstalar mantendo o lock." >&2
  # Nao bloqueia — pode ser legitimo em conflito merge.
fi

# 2. .env destrutivo
if echo "$COMMAND" | grep -iE 'rm\s+.*\.env(\s|$|\.local|\.production)' > /dev/null; then
  echo "BLOQUEADO: rm em arquivo .env detectado!" >&2
  echo "Arquivos .env contem secrets — confirme manualmente antes de remover." >&2
  exit 2
fi

# 3. Filesystem destrutivo
if echo "$COMMAND" | grep -iE 'rm\s+(-rf|-fr)\s+(/|~|src/|\.claude/|workspace/|node_modules/)' > /dev/null; then
  echo "BLOQUEADO: rm -rf em diretorio critico detectado!" >&2
  echo "Deletar root, src/, .claude/ ou workspace/ nao e permitido." >&2
  exit 2
fi

if echo "$COMMAND" | grep -iE 'rm\s+(-rf|-fr)\s+\.git' > /dev/null; then
  echo "BLOQUEADO: rm -rf .git detectado! Isso apaga todo historico!" >&2
  exit 2
fi

# 4. Git destrutivo
if echo "$COMMAND" | grep -iE 'git\s+push\s+.*--force.*\b(main|master)\b' > /dev/null; then
  echo "BLOQUEADO: git push --force em main/master!" >&2
  echo "Forcar push em branch principal pode apagar commits de outros." >&2
  exit 2
fi

if echo "$COMMAND" | grep -iE 'git\s+reset\s+--hard\s+HEAD~' > /dev/null; then
  echo "AVISO: git reset --hard pode perder commits nao pushados." >&2
  echo "Considere 'git revert' para reverter seguramente." >&2
  # Nao bloqueia, apenas avisa
fi

# =====================================================================
# COMANDO PERMITIDO
# =====================================================================

exit 0
