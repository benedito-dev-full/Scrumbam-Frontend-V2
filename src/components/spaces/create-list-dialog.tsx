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
import { useCreateList } from "@/hooks/use-projects";
import { getApiErrorMessage } from "@/lib/api";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CreateListDialogProps {
  /** ID do pai (SPACE ou FOLDER) onde a list será criada. */
  parentId: string;
  /** Controla abertura do dialog. */
  open: boolean;
  /** Callback chamado ao fechar (cancelar ou após sucesso). */
  onOpenChange: (open: boolean) => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * Dialog para criar uma nova LIST (idClasse=-352) dentro de um FOLDER ou SPACE.
 *
 * Chama `POST /projects { idClasse: '-352', nome, idPai: parentId }` via
 * `useCreateList`. Após sucesso, invalida `qk.projects.lists(parentId)` e
 * fecha o dialog automaticamente.
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 * return (
 *   <>
 *     <Button onClick={() => setOpen(true)}>Nova Lista</Button>
 *     <CreateListDialog parentId={folder.id} open={open} onOpenChange={setOpen} />
 *   </>
 * );
 * ```
 */
export function CreateListDialog({
  parentId,
  open,
  onOpenChange,
}: CreateListDialogProps) {
  const [nome, setNome] = useState("");
  const [nomeError, setNomeError] = useState<string | null>(null);

  const { mutate, isPending } = useCreateList();

  // Resetar formulário ao abrir/fechar
  useEffect(() => {
    if (!open) {
      setNome("");
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
      { nome: nome.trim(), idPai: parentId },
      {
        onSuccess: (created) => {
          toast.success(`Lista "${created.nome}" criada`);
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error("Erro ao criar lista", {
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
          <DialogTitle>Criar lista</DialogTitle>
          <DialogDescription>
            Listas agrupam tarefas com workflow e sprint próprios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Campo nome */}
          <div className="space-y-1.5">
            <label
              htmlFor="create-list-nome"
              className="text-[12px] font-medium text-foreground"
            >
              Nome da lista
            </label>
            <Input
              id="create-list-nome"
              autoFocus
              placeholder="Por exemplo: Backlog, To Do, Em andamento"
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

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Criando…" : "Criar lista"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
