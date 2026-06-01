"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

// ─── Internos ─────────────────────────────────────────────────────────────────
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteBlock } from "@/hooks/use-tasks";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

// ─── DeleteBlockDialog ────────────────────────────────────────────────────────

/**
 * Dialog de confirmação para excluir um Bloco (DTask idClasse=-200) da view Blocos.
 *
 * Chama `useDeleteBlock` ao confirmar (DELETE /tasks/:id, soft delete). O cascade
 * do backend opera em `idPai`, não em `dados.idBloco` — portanto as tarefas do
 * bloco NÃO são excluídas: elas passam a aparecer no grupo "Sem bloco" (o mapper
 * `buildGroupsBoard` trata idBloco órfão como "Sem bloco").
 *
 * @param block        - Bloco alvo (precisa de `id`, `nome`, `projectId`).
 * @param taskCount    - Quantidade de tarefas raiz no bloco (para a mensagem).
 * @param open         - Estado controlado de abertura do dialog.
 * @param onOpenChange - Callback do controle (close/Esc/clique fora).
 * @param onSuccess    - Callback opcional após exclusão bem-sucedida.
 *
 * @example
 * ```tsx
 * <DeleteBlockDialog
 *   block={{ id: blockId, nome: "Bloco 0", projectId: listId }}
 *   taskCount={3}
 *   open={open}
 *   onOpenChange={setOpen}
 * />
 * ```
 */
export function DeleteBlockDialog({
  block,
  taskCount,
  open,
  onOpenChange,
  onSuccess,
}: {
  block: { id: string; nome: string; projectId: string };
  taskCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const { mutate, isPending } = useDeleteBlock();

  function handleConfirm() {
    mutate(
      { id: block.id, projectId: block.projectId },
      {
        onSuccess: () => {
          toast.success("Bloco excluído");
          onOpenChange(false);
          onSuccess?.();
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error));
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-1 flex size-10 items-center justify-center rounded-xl bg-red-500/10">
            <Trash2 className="size-5 text-red-400" />
          </div>
          <DialogTitle>Excluir bloco</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir o bloco &ldquo;{block.nome}&rdquo;?{" "}
            {taskCount > 0
              ? `As ${taskCount} ${
                  taskCount === 1 ? "tarefa" : "tarefas"
                } deste bloco não serão excluídas — elas voltam para "Sem bloco".`
              : "O bloco está vazio."}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="rounded-lg border border-border bg-background px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-[13px] font-semibold text-red-400 transition-colors hover:bg-red-500/20",
              "disabled:opacity-60 disabled:cursor-not-allowed",
            )}
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            Excluir
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
