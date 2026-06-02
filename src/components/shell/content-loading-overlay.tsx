"use client";

import { BrandLoader } from "@/components/ui/brand-loader";
import { useContentLoadingStore } from "@/lib/stores/content-loading";

/**
 * Overlay de carregamento da área de conteúdo (tudo abaixo da topbar).
 *
 * Deve ser montado dentro de um container `relative` que englobe rail +
 * sidebar + conteúdo. Aparece com um fade-in curto (feedback imediato) e some
 * na hora que o carregamento termina, revelando o conteúdo já pronto.
 */
export function ContentLoadingOverlay() {
  const visible = useContentLoadingStore((s) => s.visible);
  if (!visible) return null;

  return (
    <div className="bl-overlay absolute inset-0 z-30 grid place-items-center bg-background">
      <BrandLoader size={200} />
    </div>
  );
}
