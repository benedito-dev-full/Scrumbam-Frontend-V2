"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

import { cn } from "@/lib/utils";

/**
 * Loader de marca — anima a partir de uma animação Lottie (.lottie / dotLottie).
 *
 * Renderiza o arquivo em `public/lottie/loader.lottie` em loop. Usado como
 * estado de carregamento (troca de aba / refresh do conteúdo). Mantém a mesma
 * API anterior (`label`), agora com `size` opcional.
 *
 * @example
 * <BrandLoader />
 * <BrandLoader size={120} label="Sincronizando…" />
 */
interface BrandLoaderProps {
  /** Texto abaixo da animação. Passe `null` para esconder. */
  label?: string | null;
  /** Lado (px) da animação. Default 168. */
  size?: number;
  className?: string;
}

export function BrandLoader({
  label = "Carregando…",
  size = 168,
  className,
}: BrandLoaderProps) {
  return (
    <div
      className={cn("flex flex-col items-center gap-3", className)}
      role="status"
      aria-live="polite"
      aria-label={label ?? "Carregando"}
    >
      <DotLottieReact
        src="/lottie/loader.lottie"
        autoplay
        loop
        style={{ width: size, height: size }}
      />
      {label && (
        <span className="text-[12px] font-medium text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  );
}
