import { cn } from "@/lib/utils";

/**
 * Loader de marca — estado de carregamento personalizado do app.
 *
 * Será exibido na área de conteúdo ao trocar de aba ou ao dar refresh
 * (a topbar permanece). Toda a animação vive em `globals.css` (bloco
 * "Brand loader") para facilitar a iteração visual.
 *
 * @example
 * <BrandLoader />
 * <BrandLoader label="Sincronizando…" />
 */
interface BrandLoaderProps {
  /** Texto abaixo da animação. Passe `null` para esconder. */
  label?: string | null;
  className?: string;
}

export function BrandLoader({
  label = "Carregando…",
  className,
}: BrandLoaderProps) {
  return (
    <div
      className={cn("brand-loader", className)}
      role="status"
      aria-live="polite"
      aria-label={label ?? "Carregando"}
    >
      <div className="bl-tile">
        <span className="bl-shimmer" />
      </div>
      <div className="bl-track">
        <span className="bl-bar" />
      </div>
      {label && (
        <span className="text-[12px] font-medium text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  );
}
