"use client";

import { useEffect, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

import { cn } from "@/lib/utils";

/**
 * Loader de marca — animação Lottie (.lottie) em loop + mensagem rotativa.
 *
 * Renderiza `public/lottie/loader.lottie` e, abaixo, uma frase que alterna
 * automaticamente entre `messages` (fade na troca) — para deixar claro ao
 * usuário que algo está carregando, já que nem todo mundo lê a animação.
 *
 * @example
 * <BrandLoader />
 * <BrandLoader size={120} messages={["Carregando…"]} />
 * <BrandLoader messages={null} />   // sem texto
 */
interface BrandLoaderProps {
  /**
   * Frases que alternam abaixo da animação. `undefined` usa o conjunto padrão;
   * `null` ou `[]` esconde o texto. Com 1 frase, fica fixa (sem rotação).
   */
  messages?: string[] | null;
  /** Intervalo (ms) entre as trocas de frase. Default 2800. */
  intervalMs?: number;
  /** Lado (px) da animação. Default 168. */
  size?: number;
  className?: string;
}

/** Frases padrão — mistura de claras e algumas mais leves/divertidas. */
const DEFAULT_MESSAGES = [
  "Carregando…",
  "Organizando tudo pra você…",
  "Buscando seus dados…",
  "Juntando as peças…",
  "Vasculhando o perímetro…",
  "Preparando o ambiente…",
  "Quase lá…",
];

export function BrandLoader({
  messages,
  intervalMs = 2800,
  size = 168,
  className,
}: BrandLoaderProps) {
  const phrases = messages === undefined ? DEFAULT_MESSAGES : (messages ?? []);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (phrases.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % phrases.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [phrases.length, intervalMs]);

  const current = phrases[index % phrases.length] ?? phrases[0];

  return (
    <div
      className={cn("flex flex-col items-center gap-3", className)}
      role="status"
      aria-live="polite"
      aria-label={current ?? "Carregando"}
    >
      <DotLottieReact
        src="/lottie/loader.lottie"
        autoplay
        loop
        style={{ width: size, height: size }}
      />
      {phrases.length > 0 && (
        <span
          key={index}
          className="bl-msg text-[12px] font-medium text-muted-foreground"
        >
          {current}
        </span>
      )}
    </div>
  );
}
