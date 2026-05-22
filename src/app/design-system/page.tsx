"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, ListChecks, Inbox, Folder, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type PaletteVariant = {
  primary: string;
  primaryFg: string;
  subtleBg: string;
  subtleFg: string;
  ringStrong: string;
};

type Palette = {
  id: string;
  name: string;
  vibe: string;
  light: PaletteVariant;
  dark: PaletteVariant;
};

const palettes: Palette[] = [
  {
    id: "indigo",
    name: "Indigo",
    vibe: "Calmo, profissional. Harmoniza com neutros frios. Choice mais conservadora.",
    light: {
      primary: "oklch(0.51 0.20 264)",
      primaryFg: "oklch(0.985 0 0)",
      subtleBg: "oklch(0.51 0.20 264 / 0.10)",
      subtleFg: "oklch(0.45 0.20 264)",
      ringStrong: "oklch(0.51 0.20 264 / 0.35)",
    },
    dark: {
      primary: "oklch(0.66 0.19 264)",
      primaryFg: "oklch(0.145 0 0)",
      subtleBg: "oklch(0.66 0.19 264 / 0.16)",
      subtleFg: "oklch(0.80 0.16 264)",
      ringStrong: "oklch(0.66 0.19 264 / 0.40)",
    },
  },
  {
    id: "violet",
    name: "Violet",
    vibe: "Clássico SaaS. Equilíbrio entre energia e seriedade. Versátil.",
    light: {
      primary: "oklch(0.53 0.22 286)",
      primaryFg: "oklch(0.985 0 0)",
      subtleBg: "oklch(0.53 0.22 286 / 0.10)",
      subtleFg: "oklch(0.47 0.22 286)",
      ringStrong: "oklch(0.53 0.22 286 / 0.35)",
    },
    dark: {
      primary: "oklch(0.68 0.20 286)",
      primaryFg: "oklch(0.145 0 0)",
      subtleBg: "oklch(0.68 0.20 286 / 0.16)",
      subtleFg: "oklch(0.82 0.17 286)",
      ringStrong: "oklch(0.68 0.20 286 / 0.40)",
    },
  },
  {
    id: "magenta",
    name: "Magenta",
    vibe: "Warm, distintiva, mais expressiva. Mais memorável visualmente.",
    light: {
      primary: "oklch(0.54 0.24 322)",
      primaryFg: "oklch(0.985 0 0)",
      subtleBg: "oklch(0.54 0.24 322 / 0.10)",
      subtleFg: "oklch(0.48 0.24 322)",
      ringStrong: "oklch(0.54 0.24 322 / 0.35)",
    },
    dark: {
      primary: "oklch(0.69 0.22 322)",
      primaryFg: "oklch(0.145 0 0)",
      subtleBg: "oklch(0.69 0.22 322 / 0.16)",
      subtleFg: "oklch(0.83 0.18 322)",
      ringStrong: "oklch(0.69 0.22 322 / 0.40)",
    },
  },
];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <Button variant="outline" size="icon" aria-hidden className="opacity-0" />;
  }

  const isDark = resolvedTheme === "dark";
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Alternar tema"
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

function PaletteCard({ palette }: { palette: Palette }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const v = mounted && resolvedTheme === "dark" ? palette.dark : palette.light;

  return (
    <div className="rounded-xl border bg-card text-card-foreground p-6 flex flex-col gap-6">
      <header>
        <h3 className="text-lg font-semibold tracking-tight">{palette.name}</h3>
        <p className="text-sm text-muted-foreground mt-1 leading-snug">{palette.vibe}</p>
      </header>

      <div className="space-y-2">
        <div className="h-20 rounded-lg" style={{ background: v.primary }} />
        <p className="text-[11px] font-mono text-muted-foreground break-all">{v.primary}</p>
      </div>

      <Section label="CTA primário">
        <button
          className="h-8 px-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 active:translate-y-px"
          style={{ background: v.primary, color: v.primaryFg }}
        >
          Criar tarefa
        </button>
      </Section>

      <Section label="Item ativo (sidebar)">
        <div
          className="h-8 px-2.5 rounded-md inline-flex items-center gap-2 text-sm font-medium w-fit"
          style={{ background: v.subtleBg, color: v.subtleFg }}
        >
          <Folder className="size-4" />
          Marketing
          <ChevronRight className="size-3.5 ml-1 opacity-60" />
        </div>
      </Section>

      <Section label="Link / texto accent">
        <a
          href="#"
          className="text-sm font-medium hover:underline underline-offset-2"
          style={{ color: v.subtleFg }}
        >
          Ver todas as tarefas
        </a>
      </Section>

      <Section label="Badge">
        <div className="flex gap-2 flex-wrap">
          <span
            className="inline-flex h-5 items-center gap-1 px-2 rounded-full text-[11px] font-medium"
            style={{ background: v.subtleBg, color: v.subtleFg }}
          >
            <ListChecks className="size-3" />
            12 abertas
          </span>
          <span
            className="inline-flex h-5 items-center px-2 rounded-full text-[11px] font-medium"
            style={{ background: v.primary, color: v.primaryFg }}
          >
            Novo
          </span>
        </div>
      </Section>

      <Section label="Focus / ring">
        <button
          className="h-8 px-3 rounded-lg text-sm font-medium border bg-background text-foreground transition-shadow"
          style={{ boxShadow: `0 0 0 3px ${v.ringStrong}` }}
        >
          <Inbox className="size-3.5 inline-block mr-1.5 -mt-px" />
          Botão com foco
        </button>
      </Section>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </p>
      {children}
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <main className="min-h-screen w-full p-8 md:p-12">
      <div className="max-w-7xl mx-auto space-y-10">
        <header className="flex items-start justify-between gap-6">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Design System · Task #2
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">Proposta de accent</h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Três direções dentro da família &quot;SaaS de gestão&quot;. Todas com valores
              próprios em OKLCH, mesmo nível de saturação e luminância calibrados pra dar
              bom contraste em light e dark. Compare nos dois modos e me diga qual segue.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {palettes.map((p) => (
            <PaletteCard key={p.id} palette={p} />
          ))}
        </div>

        <footer className="text-xs text-muted-foreground border-t pt-6">
          <p>
            Os valores subtle (background de item ativo / badge / link) usam o accent
            em opacidade baixa pra não competir com o conteúdo. O <code>primary</code>{" "}
            cheio fica reservado pra CTAs e indicadores fortes.
          </p>
        </footer>
      </div>
    </main>
  );
}
