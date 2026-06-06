/**
 * Logo oficial do Scrumban.
 *
 * Renderiza o PNG da marca (`public/scrumban-logo.png`, recortado sem margens)
 * via next/image. Fonte única de verdade da marca no app — use
 * `<ScrumbanLogo />` em qualquer lugar (topbar, login, etc.).
 *
 * A imagem é ~207x221 (proporção ~0.94); `size` define o lado do quadrado de
 * contêiner e a logo é encaixada com `object-contain`, preservando a proporção.
 *
 * @example
 * <ScrumbanLogo size={28} />
 * <ScrumbanLogo size={48} title="Scrumban" />
 */

import Image from "next/image";

export function ScrumbanLogo({
  size = 24,
  title = "Scrumban",
  className,
}: {
  /** Lado do quadrado de contêiner em px. */
  size?: number;
  /** Texto alternativo da imagem. */
  title?: string;
  className?: string;
}) {
  return (
    <Image
      src="/scrumban-logo.png"
      alt={title}
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain", width: size, height: size }}
      priority
    />
  );
}
