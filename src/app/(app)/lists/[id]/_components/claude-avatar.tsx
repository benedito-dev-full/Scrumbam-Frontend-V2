"use client";

import React from "react";

/**
 * Avatar SVG do agente Claude (logo estilizado) usado nas celulas de
 * responsavel quando a tarefa esta atribuida ao agente. Componente de
 * apresentacao puro — sem estado.
 *
 * @param size - Lado do quadrado em px (default 22).
 */
export function ClaudeAvatar({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <rect width="40" height="40" rx="8" fill="var(--card)" />
      <rect x="10" y="8" width="20" height="14" rx="2" fill="#d97757" />
      <rect x="13" y="12" width="5" height="5" fill="var(--card)" />
      <rect x="22" y="12" width="5" height="5" fill="var(--card)" />
      <rect x="17" y="22" width="6" height="4" fill="#d97757" />
      <rect x="10" y="26" width="20" height="8" rx="2" fill="#d97757" />
      <rect x="12" y="34" width="6" height="4" rx="1" fill="#d97757" />
      <rect x="22" y="34" width="6" height="4" rx="1" fill="#d97757" />
    </svg>
  );
}
