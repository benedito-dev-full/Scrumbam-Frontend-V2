"use client";

import { FlaskConical } from "lucide-react";

import { BrandLoader } from "@/components/ui/brand-loader";

/**
 * Laboratório do estado de carregamento.
 *
 * Mostra o `BrandLoader` rodando (fila de ícones de setores: o da frente recua
 * para trás da pilha e o próximo avança, com pausa entre voltas). É a bancada
 * onde lapidamos a animação antes de plugá-la no refresh/troca de aba.
 */
export default function LoadingLabPage() {
  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
        <FlaskConical className="size-4 text-muted-foreground" />
        <h1 className="text-sm font-semibold text-foreground">Loading Lab</h1>
        <span className="text-[11px] text-muted-foreground">
          · bancada do estado de carregamento
        </span>
      </header>

      <div className="grid flex-1 place-items-center">
        <div className="flex flex-col items-center gap-10">
          <div className="grid h-[360px] place-items-center">
            <BrandLoader size={336} />
          </div>

          <p className="max-w-sm text-center text-[11px] leading-relaxed text-muted-foreground">
            Fila de ícones de setores: o da frente recua para trás da pilha e o
            próximo avança, em loop com pausa entre voltas. É aqui que vamos
            lapidar a animação.
          </p>
        </div>
      </div>
    </div>
  );
}
