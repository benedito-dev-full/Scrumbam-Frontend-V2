"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

// ─── SpaceAvatar ──────────────────────────────────────────────────────────────

function SpaceAvatar({ nome }: { nome: string }) {
  const letter = nome.trim().charAt(0).toUpperCase() || "S";
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-semibold text-muted-foreground select-none">
      {letter}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function CreateSpaceDialog({ open, onOpenChange }: CreateSpaceDialogProps) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [privado, setPrivado] = useState(false);
  const [nomeError, setNomeError] = useState<string | null>(null);

  const { mutate, isPending } = useCreateSpace();

  useEffect(() => {
    if (!open) {
      setNome("");
      setDescricao("");
      setPrivado(false);
      setNomeError(null);
    }
  }, [open]);

  function validate(): boolean {
    const trimmed = nome.trim();
    if (!trimmed) {
      setNomeError("Nome é obrigatório");
      return false;
    }
    if (trimmed.length < 3) {
      setNomeError("Mínimo de 3 caracteres");
      return false;
    }
    if (trimmed.length > 255) {
      setNomeError("Máximo de 255 caracteres");
      return false;
    }
    setNomeError(null);
    return true;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    mutate(
      { nome: nome.trim(), privado },
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
          toast.error("Erro ao criar space", {
            description: getApiErrorMessage(err),
          });
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar espaço</DialogTitle>
          <DialogDescription>
            Um espaço representa equipes, departamentos ou grupos, cada um com suas
            próprias listas, fluxos de trabalho e configurações.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Ícone e nome */}
          <div className="space-y-1.5">
            <label
              htmlFor="create-space-nome"
              className="text-[12px] font-medium text-foreground"
            >
              Ícone e nome
            </label>
            <div className="flex items-center gap-2">
              <SpaceAvatar nome={nome} />
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
                />
                {nomeError && (
                  <p className="text-[11px] text-destructive">{nomeError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label
              htmlFor="create-space-descricao"
              className="text-[12px] font-medium text-foreground"
            >
              Descrição<span className="ml-1 text-muted-foreground font-normal">(opcional)</span>
            </label>
            <textarea
              id="create-space-descricao"
              rows={2}
              placeholder=""
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className={cn(
                "w-full resize-none rounded-md border border-input bg-background px-3 py-2",
                "text-sm text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                "transition-colors",
              )}
            />
          </div>

          {/* Tornar privado */}
          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground">Tornar privado</div>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                Somente você e membros convidados têm acesso
              </p>
            </div>
            <Switch
              checked={privado}
              onCheckedChange={setPrivado}
              ariaLabel="Tornar space privado"
            />
          </div>

          {/* Rodapé */}
          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => {}}
            >
              Usar modelos
            </button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Criando…" : "Continuar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
