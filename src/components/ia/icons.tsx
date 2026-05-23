/* ─── Ícones do Nexus (IA) — flor colorida igual ao Brain do ClickUp ────── */

/**
 * Logo grande do Nexus (40px+) usado no hero da página de IA.
 */
export function NexusIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* pétala topo — rosa */}
      <ellipse cx="32" cy="18" rx="8" ry="14" fill="#f472b6" transform="rotate(0 32 32)" opacity="0.95" />
      {/* pétala direita-cima — laranja */}
      <ellipse cx="32" cy="18" rx="8" ry="14" fill="#fb923c" transform="rotate(60 32 32)" opacity="0.9" />
      {/* pétala direita-baixo — amarelo */}
      <ellipse cx="32" cy="18" rx="8" ry="14" fill="#facc15" transform="rotate(120 32 32)" opacity="0.85" />
      {/* pétala baixo — verde */}
      <ellipse cx="32" cy="18" rx="8" ry="14" fill="#4ade80" transform="rotate(180 32 32)" opacity="0.9" />
      {/* pétala esquerda-baixo — azul */}
      <ellipse cx="32" cy="18" rx="8" ry="14" fill="#60a5fa" transform="rotate(240 32 32)" opacity="0.9" />
      {/* pétala esquerda-cima — violeta */}
      <ellipse cx="32" cy="18" rx="8" ry="14" fill="#a78bfa" transform="rotate(300 32 32)" opacity="0.95" />
      {/* centro branco */}
      <circle cx="32" cy="32" r="7" fill="white" opacity="0.95" />
    </svg>
  );
}

/**
 * Variante 16px do logo Nexus — usada em abas, botões e itens de menu.
 */
export function NexusMiniIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="18" rx="8" ry="14" fill="#f472b6" transform="rotate(0 32 32)" opacity="0.95" />
      <ellipse cx="32" cy="18" rx="8" ry="14" fill="#fb923c" transform="rotate(60 32 32)" opacity="0.9" />
      <ellipse cx="32" cy="18" rx="8" ry="14" fill="#facc15" transform="rotate(120 32 32)" opacity="0.85" />
      <ellipse cx="32" cy="18" rx="8" ry="14" fill="#4ade80" transform="rotate(180 32 32)" opacity="0.9" />
      <ellipse cx="32" cy="18" rx="8" ry="14" fill="#60a5fa" transform="rotate(240 32 32)" opacity="0.9" />
      <ellipse cx="32" cy="18" rx="8" ry="14" fill="#a78bfa" transform="rotate(300 32 32)" opacity="0.95" />
      <circle cx="32" cy="32" r="7" fill="white" opacity="0.95" />
    </svg>
  );
}
