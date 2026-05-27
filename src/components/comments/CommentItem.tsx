// ─── Externos ─────────────────────────────────────────────────────────────────
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── UI ───────────────────────────────────────────────────────────────────────
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// ─── Utils ────────────────────────────────────────────────────────────────────
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
import type { Comment } from "@/lib/types/comment";

interface CommentItemProps {
  comment: Comment;
}

/**
 * Extrai até 2 iniciais a partir do nome completo (primeira letra de cada
 * palavra significativa). Retorna `"?"` quando o nome está vazio.
 */
function buildInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";

  const parts = trimmed.split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase());

  return letters.join("") || "?";
}

/**
 * Item individual de comentário — renderizado dentro de {@link CommentList}.
 *
 * Server Component (sem estado nem efeitos). O texto preserva quebras de
 * linha via `whitespace-pre-wrap`; HTML cru não é renderizado.
 *
 * Quando o `id` começa com `temp-`, o item está em flight (optimistic update
 * do {@link useCreateComment}) e recebe `opacity-60` para indicar persistência
 * pendente.
 */
export function CommentItem({ comment }: CommentItemProps) {
  const isPending = comment.id.startsWith("temp-");
  const initials = buildInitials(comment.autorNome);
  const relativeTime = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <article
      className={cn("flex gap-3 transition-opacity", isPending && "opacity-60")}
    >
      {isPending && <span className="sr-only">Enviando comentário</span>}
      <Avatar size="sm" className="mt-0.5">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <header className="flex items-baseline gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {comment.autorNome}
          </span>
          <time
            dateTime={comment.createdAt}
            className="text-xs text-muted-foreground"
          >
            {relativeTime}
          </time>
        </header>

        <p className="mt-0.5 text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground">
          {comment.texto}
        </p>
      </div>
    </article>
  );
}
