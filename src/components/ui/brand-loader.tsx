"use client";

import { useEffect, useRef, useState } from "react";
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
 * Loader de marca — fila de ícones de "setores" do app (estilo ClickUp).
 *
 * O card da frente recua para trás da pilha enquanto o próximo avança, num
 * loop contínuo com uma pausa entre ciclos (não troca "no seco"). A coreografia
 * é dirigida por um índice ativo: cada card é posicionado pela sua distância
 * relativa do ativo (`rel`), e o CSS (`globals.css`, bloco "Brand loader")
 * anima a transição entre as posições.
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

/** Setores do produto exibidos na fila. Ordem = ordem de exibição. */
const FEATURES: Feature[] = [
  { key: "list", color: "#4c6ef5", Icon: List },
  { key: "board", color: "#7c5cff", Icon: LayoutGrid },
  { key: "calendar", color: "#f59e0b", Icon: Calendar },
  { key: "docs", color: "#38bdf8", Icon: FileText },
  { key: "goals", color: "#ec4899", Icon: Target },
  { key: "dashboard", color: "#22c55e", Icon: LayoutDashboard },
];
const N = FEATURES.length;

/** Tempo que cada ícone fica na frente, e pausa extra ao reiniciar o ciclo. */
const STEP_MS = 1000;
const PAUSE_MS = 650;

/**
 * Posição de um card pela distância relativa do ativo:
 * `rel = 0` → frente; valores maiores → mais ao fundo da pilha (descendo,
 * menores e mais apagados). A partir de `rel > 3` o card fica invisível atrás
 * (é onde o ex-frente "se esconde" ao recuar).
 */
function cardStyle(rel: number): React.CSSProperties {
  const depth = Math.min(rel, 4);
  return {
    transform: `translateY(${depth * 8}px) scale(${1 - depth * 0.09})`,
    opacity: rel === 0 ? 1 : rel <= 3 ? Math.max(0, 0.55 - (rel - 1) * 0.2) : 0,
    zIndex: N - rel,
  };
}

export function BrandLoader({
  label = "Carregando…",
  className,
}: BrandLoaderProps) {
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) return;

    let timer: ReturnType<typeof setTimeout>;
    function step() {
      const next = (activeRef.current + 1) % N;
      activeRef.current = next;
      setActive(next);
      // Pausa extra ao completar uma volta (next === 0) = pausa entre ciclos.
      timer = setTimeout(step, next === 0 ? STEP_MS + PAUSE_MS : STEP_MS);
    }
    timer = setTimeout(step, STEP_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn("brand-loader", className)}
      role="status"
      aria-live="polite"
      aria-label={label ?? "Carregando"}
    >
      <div className="bl-stage">
        {FEATURES.map((f, i) => {
          const rel = (i - active + N) % N;
          const Icon = f.Icon;
          return (
            <div
              key={f.key}
              className="bl-card"
              style={{ ...cardStyle(rel), background: f.color }}
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
