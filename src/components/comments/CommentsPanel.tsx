// ─── UI ───────────────────────────────────────────────────────────────────────
import { Separator } from "@/components/ui/separator";

// ─── Componentes ──────────────────────────────────────────────────────────────
import { CommentBox } from "./CommentBox";
import { CommentList } from "./CommentList";

// ─── Utils ────────────────────────────────────────────────────────────────────
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
import type { CommentTargetType } from "@/lib/types/comment";

interface CommentsPanelProps {
  targetType: CommentTargetType;
  targetId: string;
  /** Permite ao consumidor ajustar espaçamento/largura externa do painel. */
  className?: string;
}

/**
 * Composição completa do módulo de comentários — caixa de entrada no topo,
 * separador e lista paginada abaixo.
 *
 * Server-friendly: não mantém estado próprio nem efeitos. Os filhos
 * (`CommentBox` e `CommentList`) são Client Components, mas o painel em si
 * pode ser renderizado em árvores Server.
 */
export function CommentsPanel({
  targetType,
  targetId,
  className,
}: CommentsPanelProps) {
  return (
    <section
      aria-label="Comentários"
      className={cn("flex flex-col gap-4", className)}
    >
      <CommentBox targetType={targetType} targetId={targetId} />
      <Separator />
      <CommentList targetType={targetType} targetId={targetId} />
    </section>
  );
}
