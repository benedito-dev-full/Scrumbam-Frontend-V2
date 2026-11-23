"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

/** Espelha `RejectExecutionDto` do backend (10–1000 caracteres). */
const rejectSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Descreva o motivo com pelo menos 10 caracteres")
    .max(1000, "O motivo pode ter no máximo 1000 caracteres"),
});

type RejectInput = z.infer<typeof rejectSchema>;

interface RejectExecutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Envia a rejeição; retorna true quando concluída (fecha o modal). */
  onSubmit: (reason: string) => Promise<boolean>;
  isPending: boolean;
}

/**
 * Modal que pede o motivo da rejeição de uma execução de IA.
 * Validação zod no client; o backend revalida.
 */
export function RejectExecutionDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: RejectExecutionDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectInput>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: "" },
  });

  function handleOpenChange(next: boolean) {
    if (isPending) return;
    if (!next) reset();
    onOpenChange(next);
  }

  const submit = handleSubmit(async ({ reason }) => {
    const ok = await onSubmit(reason);
    if (ok) {
      reset();
      onOpenChange(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Rejeitar execução</DialogTitle>
            <DialogDescription>
              Explique por que esta execução não deve rodar. O motivo fica
              registrado no histórico.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-1.5">
            <label
              htmlFor="reject-execution-reason"
              className="text-[12px] font-medium"
            >
              Motivo da rejeição
            </label>
            <Textarea
              id="reject-execution-reason"
              rows={4}
              maxLength={1000}
              aria-invalid={!!errors.reason}
              aria-describedby={
                errors.reason ? "reject-execution-reason-error" : undefined
              }
              {...register("reason")}
            />
            {errors.reason && (
              <p
                id="reject-execution-reason-error"
                role="alert"
                className="text-[12px] text-destructive"
              >
                {errors.reason.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
              className="rounded-lg border border-border px-3 py-2 text-[13px] font-medium transition-colors hover:bg-muted disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-60"
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              Rejeitar execução
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
