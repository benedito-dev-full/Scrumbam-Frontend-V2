"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import { UserRound } from "lucide-react";

// ─── Internos ─────────────────────────────────────────────────────────────────
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatSince } from "@/lib/format-since";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
import type { TakeoverDialogProps } from "@/hooks/use-work-collision-guard";

// ─── TakeoverConfirmDialog ────────────────────────────────────────────────────

/**
 * Diálogo de confirmação "alguém já está trabalhando nesta task" — task #795.
 *
 * Guard de cortesia do HUMANO na interface. Aparece SOMENTE quando uma ação
 * (mover→EXECUTING ou reatribuir responsável) colide com uma `activeWorkSession`
 * de OUTRO usuário (predicado em `useWorkCollisionGuard`). "Cancelar" aborta sem
 * mutação; "Assumir mesmo assim" prossegue com a ação original.
 *
 * Espelha o padrão visual do `DeleteTaskDialog` (mesmo `@/components/ui/dialog`
 * shadcn), com paleta âmbar consistente com o `WorkSessionBadge`. Reusa
 * `formatSince` para o "há X" idêntico ao badge.
 *
 * As props `open`/`session`/`onCancel`/`onConfirm` vêm de `dialogProps` do hook
 * `useWorkCollisionGuard` — basta espalhar `{...dialogProps}` e escolher o
 * `actionLabel`.
 *
 * @param open         - Estado de abertura (do hook).
 * @param session      - Sessão de trabalho em colisão (do hook); `null` fecha.
 * @param onCancel     - Aborta a ação pendente (do hook).
 * @param onConfirm    - Prossegue com a ação original (do hook).
 * @param actionLabel  - Verbo contextual do botão de confirmação ("assumir" |
 *                       "mover"). Default "assumir".
 *
 * @example
 * ```tsx
 * const { run, dialogProps } = useWorkCollisionGuard();
 * <TakeoverConfirmDialog {...dialogProps} actionLabel="mover" />
 * ```
 */
export function TakeoverConfirmDialog({
  open,
  session,
  onCancel,
  onConfirm,
  actionLabel = "assumir",
}: TakeoverDialogProps & { actionLabel?: "assumir" | "mover" }) {
  const who = session?.agentName ?? "Outro usuário";
  const since = session ? formatSince(session.startedAt) : "";
  const confirmText =
    actionLabel === "mover" ? "Mover mesmo assim" : "Assumir mesmo assim";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-1 flex size-10 items-center justify-center rounded-xl bg-amber-500/10">
            <UserRound className="size-5 text-amber-400" />
          </div>
          <DialogTitle>Alguém já está trabalhando nesta task</DialogTitle>
          <DialogDescription>
            {who} está em trabalho{since ? ` ${since}` : ""}. Deseja{" "}
            {actionLabel} mesmo assim?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border bg-background px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-[13px] font-semibold text-amber-400 transition-colors hover:bg-amber-500/20",
            )}
          >
            <UserRound className="size-3.5" />
            {confirmText}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
