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
import { useDeleteTask } from "@/hooks/use-tasks";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
import type { TaskResponseDto } from "@/lib/types/api";

// ─── DeleteTaskDialog ─────────────────────────────────────────────────────────

/**
 * Dialog de confirmação para deletar uma DTask V2 (soft delete).
 *
 * Componente reusável compartilhado entre o drawer de detalhe e o atalho de
 * lixeira no card kanban. Chama `useDeleteTask` ao confirmar e dispara toast
 * de sonner em sucesso/erro. Mensagens de erro vêm de `getApiErrorMessage`.
 *
 * @param task         - DTask alvo (precisa de `id`, `nome`, `projectId`, `idPai?`).
 * @param open         - Estado controlado de abertura do dialog.
 * @param onOpenChange - Callback do controle (chamado em close/Esc/clique fora).
 * @param onSuccess    - Callback opcional após delete bem-sucedido (ex: fechar drawer pai).
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 * <DeleteTaskDialog
 *   task={task}
 *   open={open}
 *   onOpenChange={setOpen}
 *   onSuccess={() => onCloseDrawer()}
 * />
 * ```
 */
export function DeleteTaskDialog({
  task,
  open,
  onOpenChange,
  onSuccess,
}: {
  task: Pick<TaskResponseDto, "id" | "nome" | "projectId" | "idPai">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const { mutate, isPending } = useDeleteTask();

  function handleConfirm() {
    mutate(
      {
        id: task.id,
        projectId: task.projectId,
        parentId: task.idPai ?? undefined,
      },
      {
        onSuccess: () => {
          toast.success("Task excluída");
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
          <DialogTitle>Excluir task</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir &ldquo;{task.nome}&rdquo;? A task
            será movida para lixeira (soft delete). Você pode recuperar com o
            admin.
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
