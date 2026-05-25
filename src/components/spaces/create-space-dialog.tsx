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
  /** Controla abertura do dialog. */
  open: boolean;
  /** Callback chamado ao fechar (cancelar ou após sucesso). */
  onOpenChange: (open: boolean) => void;
}

// ─── Componentes internos ─────────────────────────────────────────────────────

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

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * Dialog para criar um novo SPACE (idClasse=-350).
 *
 * Chama `POST /projects { idClasse: '-350', nome, privado }` via
 * `useCreateSpace`. Após sucesso, invalida `qk.projects.spaces` e
 * fecha o dialog automaticamente.
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 * return (
 *   <>
 *     <Button onClick={() => setOpen(true)}>Novo Space</Button>
 *     <CreateSpaceDialog open={open} onOpenChange={setOpen} />
 *   </>
 * );
 * ```
 */
export function CreateSpaceDialog({ open, onOpenChange }: CreateSpaceDialogProps) {
  const [nome, setNome] = useState("");
  const [privado, setPrivado] = useState(false);
  const [nomeError, setNomeError] = useState<string | null>(null);

  const { mutate, isPending } = useCreateSpace();

  // Resetar formulário ao abrir/fechar
  useEffect(() => {
    if (!open) {
      setNome("");
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Criar space</DialogTitle>
          <DialogDescription>
            Spaces agrupam folders e listas com identidade e permissões próprias.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Campo nome */}
          <div className="space-y-1.5">
            <label
              htmlFor="create-space-nome"
              className="text-[12px] font-medium text-foreground"
            >
              Nome do space
            </label>
            <Input
              id="create-space-nome"
              autoFocus
              placeholder="Por exemplo: Produto, Marketing, RH"
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

          {/* Toggle privado */}
          <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground">
                Space privado
              </div>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                Apenas membros convidados terão acesso.
              </p>
            </div>
            <div className="shrink-0">
              <Switch
                checked={privado}
                onCheckedChange={setPrivado}
                ariaLabel="Tornar space privado"
              />
            </div>
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Criando…" : "Criar space"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
