import {
  Calendar,
  FileText,
  LayoutDashboard,
  LayoutGrid,
  List,
  Target,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Loader de marca — fila circular de ícones de "setores" (estilo ClickUp).
 *
 * Os cards sobem a fila até a frente; o da frente sai lateralmente afundando e
 * dá a volta para o fim da fila. Toda a coreografia vive no CSS (`globals.css`,
 * bloco "Brand loader", keyframe `bl-queue`); aqui só posicionamos cada card na
 * fila via `animation-delay` negativo (defasagem por índice). Velocidade:
 * ajuste `--bl-duration` no CSS.
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

interface Feature {
  key: string;
  /** Cor de fundo do card (paleta dos "setores"). */
  color: string;
  Icon: LucideIcon;
}

/** Setores do produto exibidos na fila. Ordem = ordem de entrada na fila. */
const FEATURES: Feature[] = [
  { key: "list", color: "#4c6ef5", Icon: List },
  { key: "board", color: "#7c5cff", Icon: LayoutGrid },
  { key: "calendar", color: "#f59e0b", Icon: Calendar },
  { key: "docs", color: "#38bdf8", Icon: FileText },
  { key: "goals", color: "#ec4899", Icon: Target },
  { key: "dashboard", color: "#22c55e", Icon: LayoutDashboard },
];
const N = FEATURES.length;

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
      <div className="bl-stage">
        {FEATURES.map((f, i) => {
          const Icon = f.Icon;
          return (
            <div
              key={f.key}
              className="bl-card"
              style={{
                background: f.color,
                // Defasa cada card ao longo do mesmo caminho → forma a fila.
                animationDelay: `calc(var(--bl-duration) / ${N} * -${i})`,
              }}
            >
              <Icon size={28} strokeWidth={2} aria-hidden />
            </div>
          );
        })}
      </div>
      {label && (
        <span className="text-[12px] font-medium text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  );
}
