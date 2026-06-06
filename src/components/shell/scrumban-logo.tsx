/**
 * Logo do Scrumban para uso DENTRO do app (login, topbar/sidebar).
 *
 * Versão "3 colunas" (ritmo alta-baixa-média, ancoradas no topo) em gradiente
 * ciano — mais limpa em tamanhos maiores e horizontais. O favicon da aba usa
 * uma marca diferente (o "S" de 6 blocos, em `src/app/icon.svg`).
 *
 * Fonte única de verdade da logo do app — use `<ScrumbanLogo />` em qualquer
 * lugar. O `id` do gradiente é único por instância (useId) para evitar colisão
 * quando a logo aparece mais de uma vez na mesma página.
 *
 * @example
 * <ScrumbanLogo size={28} />
 * <ScrumbanLogo size={48} title="Scrumban" />
 */

import { useId } from "react";

export function ScrumbanLogo({
  size = 24,
  title = "Scrumban",
  className,
}: {
  /** Lado do quadrado em px (a logo é 1:1). */
  size?: number;
  /** Texto acessível do SVG. */
  title?: string;
  className?: string;
}) {
  const gid = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-label={title}
      className={className}
    >
      <defs>
        <linearGradient
          id={gid}
          x1="0"
          y1="0"
          x2="24"
          y2="24"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
      </defs>
      <rect x="4.5" y="4" width="4.2" height="17" rx="2.1" fill={`url(#${gid})`} />
      <rect
        x="9.9"
        y="4"
        width="4.2"
        height="8"
        rx="2.1"
        fill={`url(#${gid})`}
        opacity="0.88"
      />
      <rect
        x="15.3"
        y="4"
        width="4.2"
        height="12.5"
        rx="2.1"
        fill={`url(#${gid})`}
        opacity="0.94"
      />
    </svg>
  );
}
