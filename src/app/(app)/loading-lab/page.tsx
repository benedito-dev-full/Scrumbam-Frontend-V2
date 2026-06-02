"use client";

import { useEffect, useState } from "react";
import { FlaskConical } from "lucide-react";

import { BrandLoader } from "@/components/ui/brand-loader";

/* Duração de cada ciclo do laboratório (apenas para testes — não é o loader em si). */
const PLAY_MS = 2400;
const PAUSE_MS = 700;

/**
 * Laboratório do estado de carregamento.
 *
 * Reproduz o `BrandLoader` em ciclos infinitos (toca → pausa → repete) para
 * iterarmos a animação até ficar perfeita. Não é uma tela de produto — é a
 * bancada de testes do loader.
 */
export default function LoadingLabPage() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function schedule(show: boolean) {
      setVisible(show);
      timer = setTimeout(() => schedule(!show), show ? PLAY_MS : PAUSE_MS);
    }
    schedule(true);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
        <FlaskConical className="size-4 text-muted-foreground" />
        <h1 className="text-sm font-semibold text-foreground">Loading Lab</h1>
        <span className="text-[11px] text-muted-foreground">
          · bancada do estado de carregamento (ciclo automático)
        </span>
      </header>

      <div className="grid flex-1 place-items-center">
        <div className="flex flex-col items-center gap-10">
          {/* Altura fixa para a pausa não deslocar o layout */}
          <div className="grid h-40 place-items-center">
            {visible ? (
              <BrandLoader />
            ) : (
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground/40">
                pausa
              </span>
            )}
          </div>

          <p className="max-w-sm text-center text-[11px] leading-relaxed text-muted-foreground">
            Pré-visualização do loader em loop. Toca por {PLAY_MS / 1000}s, pausa{" "}
            {PAUSE_MS / 1000}s e repete. É aqui que vamos lapidar a animação.
          </p>
        </div>
      </div>
    </div>
  );
}
