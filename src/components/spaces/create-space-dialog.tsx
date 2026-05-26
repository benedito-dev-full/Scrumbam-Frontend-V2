"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateSpace } from "@/hooks/use-projects";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CreateSpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Dados do picker ──────────────────────────────────────────────────────────

const COLOR_PALETTE = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16",
  "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
  "#6366f1", "#8b5cf6", "#a855f7", "#ec4899",
  "#f43f5e", "#64748b", "#78716c", "#0ea5e9",
];

const ICON_LIST = [
  "⚡","🚀","🎯","💡","🔥","⭐","🌟","💫",
  "🎨","🎭","🎪","🎬","🎤","🎵","🎶","🎸",
  "📱","💻","🖥️","⌨️","🖱️","🖨️","📷","📸",
  "📊","📈","📉","📋","📌","📍","🗺️","🗓️",
  "🔑","🔒","🔓","🔔","🔕","📣","📢","🔊",
  "🏆","🥇","🏅","🎖️","🏵️","🎗️","🎀","🎁",
  "🌍","🌎","🌏","🌐","🗾","🧭","🌋","🏔️",
  "🏠","🏢","🏣","🏤","🏥","🏦","🏨","🏩",
  "🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑",
  "✈️","🚀","🛸","🚁","⛵","🚢","🛳️","⚓",
  "🍕","🍔","🍟","🌮","🌯","🥗","🍜","🍣",
  "⚽","🏀","🏈","⚾","🎾","🏐","🏉","🎱",
  "🌸","🌺","🌻","🌹","🌷","🌿","🍀","🍃",
  "💎","💍","👑","🏆","🎭","🎨","🖼️","🎠",
  "🔬","🔭","🧬","⚗️","🧪","🧫","🧲","💊",
  "📚","📖","📝","✏️","🖊️","🖋️","📓","📔",
];

// ─── Switch ───────────────────────────────────────────────────────────────────

function Switch({
  checked,
  onCheckedChange,
  ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        checked ? "bg-primary" : "bg-input",
      )}
    >
      <span
        className={cn(
          "inline-block size-4 rounded-full bg-background shadow-sm transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

// ─── IconColorPicker (popover inline) ─────────────────────────────────────────

function IconColorPicker({
  color,
  icon,
  nome,
  onColorChange,
  onIconChange,
}: {
  color: string;
  icon: string;
  nome: string;
  onColorChange: (c: string) => void;
  onIconChange: (i: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"icon" | "color">("icon");
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const letter = nome.trim().charAt(0).toUpperCase() || "S";
  const display = icon || letter;

  const filtered = search.trim()
    ? ICON_LIST.filter((ic) => ic.includes(search.trim()))
    : ICON_LIST;

  // Fecha ao clicar fora
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      {/* Avatar clicável */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-md text-lg font-semibold text-white select-none",
          "transition-all hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        )}
        style={{ backgroundColor: color }}
        aria-label="Escolher ícone e cor"
      >
        {display}
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute left-0 top-13 z-50 w-[300px] rounded-lg border border-border bg-popover shadow-xl">
          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => setTab("icon")}
              className={cn(
                "flex-1 py-2.5 text-xs font-semibold transition-colors",
                tab === "icon"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Ícone
            </button>
            <button
              type="button"
              onClick={() => setTab("color")}
              className={cn(
                "flex-1 py-2.5 text-xs font-semibold transition-colors",
                tab === "color"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Cor
            </button>
          </div>

          {tab === "icon" && (
            <div className="p-3 space-y-2">
              {/* Search + botão limpar */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={cn(
                    "flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-xs",
                    "placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring",
                  )}
                />
                <button
                  type="button"
                  title="Limpar ícone"
                  onClick={() => { onIconChange(""); setSearch(""); }}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground text-xs transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Grid de ícones */}
              <div className="grid grid-cols-8 gap-0.5 max-h-[220px] overflow-y-auto pr-0.5">
                {/* Letra/inicial como primeira opção */}
                <button
                  type="button"
                  onClick={() => { onIconChange(""); setOpen(false); }}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded text-sm font-bold transition-colors",
                    "hover:bg-muted text-white",
                    !icon ? "ring-2 ring-primary" : "",
                  )}
                  style={{ backgroundColor: color }}
                  title="Usar inicial"
                >
                  {letter}
                </button>

                {filtered.map((ic, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { onIconChange(ic); setOpen(false); }}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded text-base transition-colors hover:bg-muted",
                      icon === ic && "bg-muted ring-1 ring-primary",
                    )}
                    title={ic}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === "color" && (
            <div className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground">Cor do espaço</p>
              <div className="grid grid-cols-8 gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { onColorChange(c); }}
                    className={cn(
                      "h-7 w-7 rounded-full transition-transform hover:scale-110 focus:outline-none",
                      color === c && "ring-2 ring-white ring-offset-2 ring-offset-popover scale-110",
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Cor ${c}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function CreateSpaceDialog({ open, onOpenChange }: CreateSpaceDialogProps) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [privado, setPrivado] = useState(false);
  const [color, setColor] = useState(COLOR_PALETTE[7]); // rosa padrão igual ClickUp
  const [icon, setIcon] = useState("");
  const [nomeError, setNomeError] = useState<string | null>(null);

  const { mutate, isPending } = useCreateSpace();

  useEffect(() => {
    if (!open) {
      setNome("");
      setDescricao("");
      setPrivado(false);
      setColor(COLOR_PALETTE[7]);
      setIcon("");
      setNomeError(null);
    }
  }, [open]);

  function validate(): boolean {
    const trimmed = nome.trim();
    if (!trimmed) { setNomeError("Nome é obrigatório"); return false; }
    if (trimmed.length < 3) { setNomeError("Mínimo de 3 caracteres"); return false; }
    if (trimmed.length > 255) { setNomeError("Máximo de 255 caracteres"); return false; }
    setNomeError(null);
    return true;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    mutate(
      { nome: nome.trim(), privado, color, icon: icon || undefined },
      {
        onSuccess: (created) => {
          toast.success(`Space "${created.nome}" criado`, {
            description: privado
              ? "Apenas membros convidados terão acesso."
              : "Visível para todos da organização.",
          });
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error("Erro ao criar space", { description: getApiErrorMessage(err) });
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-visible">
        {/* Cabeçalho */}
        <div className="px-7 pt-7 pb-5">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-xl font-semibold">Criar espaço</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Um espaço representa equipes, departamentos ou grupos, cada um com suas
              próprias listas, fluxos de trabalho e configurações.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-7 space-y-6">

            {/* Ícone e nome */}
            <div className="space-y-2">
              <label htmlFor="create-space-nome" className="text-sm font-medium text-foreground">
                Ícone e nome
              </label>
              <div className="flex items-center gap-3">
                <IconColorPicker
                  color={color}
                  icon={icon}
                  nome={nome}
                  onColorChange={setColor}
                  onIconChange={setIcon}
                />
                <div className="flex-1 space-y-1">
                  <Input
                    id="create-space-nome"
                    autoFocus
                    placeholder="por exemplo, marketing, engenharia, RH"
                    value={nome}
                    onChange={(e) => {
                      setNome(e.target.value);
                      if (nomeError) setNomeError(null);
                    }}
                    aria-invalid={!!nomeError}
                    className="h-10 text-sm"
                  />
                  {nomeError && <p className="text-xs text-destructive">{nomeError}</p>}
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <label htmlFor="create-space-descricao" className="text-sm font-medium text-foreground">
                Descrição<span className="ml-1 text-muted-foreground font-normal text-xs">(opcional)</span>
              </label>
              <textarea
                id="create-space-descricao"
                rows={3}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className={cn(
                  "w-full resize-none rounded-md border border-input bg-background px-3 py-2.5",
                  "text-sm text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                  "transition-colors",
                )}
              />
            </div>

            {/* Tornar privado */}
            <div className="flex items-center justify-between gap-4 border-t border-border pt-5 pb-1">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground">Tornar privado</div>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                  Somente você e membros convidados têm acesso
                </p>
              </div>
              <Switch checked={privado} onCheckedChange={setPrivado} ariaLabel="Tornar space privado" />
            </div>
          </div>

          {/* Rodapé */}
          <div className="flex items-center justify-between px-7 py-4 mt-4 border-t border-border bg-muted/40">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Usar modelos
            </button>
            <Button type="submit" disabled={isPending} className="px-6">
              {isPending ? "Criando…" : "Continuar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
