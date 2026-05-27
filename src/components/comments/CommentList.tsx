"use client";

// ─── UI ───────────────────────────────────────────────────────────────────────
import { Button } from "@/components/ui/button";

// ─── Hooks ────────────────────────────────────────────────────────────────────
import { DEFAULT_PAGE_SIZE, useComments } from "@/hooks/use-comments";

// ─── Componentes ──────────────────────────────────────────────────────────────
import { CommentItem } from "./CommentItem";

// ─── Types ────────────────────────────────────────────────────────────────────
import type { CommentTargetType } from "@/lib/types/comment";

interface CommentListProps {
  targetType: CommentTargetType;
  targetId: string;
  pageSize?: number;
}

/**
 * Esqueleto visual exibido durante o primeiro fetch.
 *
 * Não usamos o componente `Skeleton` da shadcn (ainda não instalado no projeto)
 * — preferimos um placeholder em Tailwind com `animate-pulse` no token `muted`.
 */
function CommentSkeleton() {
  return (
    <div className="flex gap-3" aria-hidden="true">
      <div className="size-6 shrink-0 animate-pulse rounded-full bg-muted" />
      <div className="flex-1 space-y-2 py-0.5">
        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

/**
 * Lista paginada (cursor DESC) de comentários do alvo informado.
 *
 * Estados tratados (na ordem):
 * 1. `isLoading` → render de placeholders.
 * 2. `isError`   → mensagem + botão "Tentar novamente" (chama `refetch()`).
 * 3. vazio       → empty state amigável.
 * 4. sucesso     → lista de {@link CommentItem} + botão "Carregar mais"
 *                  enquanto `hasMore`.
 */
export function CommentList({
  targetType,
  targetId,
  pageSize = DEFAULT_PAGE_SIZE,
}: CommentListProps) {
  const {
    comments,
    hasMore,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useComments(targetType, targetId, pageSize);

  // ── Loading inicial ─────────────────────────────────────────────────────────
  if (isLoading) {
    // Limita a 5 skeletons (mais discreto que ocupar a tela inteira com 20
    // placeholders), mas respeita `pageSize` quando o consumidor pede menos
    // — ex.: pageSize=3 renderiza 3 skeletons, pageSize=20 renderiza 5.
    const skeletonCount = Math.min(pageSize, 5);
    return (
      <div
        className="space-y-4"
        role="status"
        aria-live="polite"
        aria-label="Carregando comentários"
      >
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <CommentSkeleton key={index} />
        ))}
      </div>
    );
  }

  // ── Erro ────────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
      >
        <p>
          Não foi possível carregar os comentários
          {error?.message ? `: ${error.message}` : "."}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  // ── Vazio ───────────────────────────────────────────────────────────────────
  if (comments.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
        Nenhum comentário ainda. Seja o primeiro a comentar.
      </p>
    );
  }

  // ── Sucesso ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <ul
        role="feed"
        aria-busy={isFetchingNextPage || undefined}
        className="space-y-4"
      >
        {comments.map((comment) => (
          <li key={comment.id}>
            <CommentItem comment={comment} />
          </li>
        ))}
      </ul>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
          >
            {isFetchingNextPage ? "Carregando…" : "Carregar mais"}
          </Button>
        </div>
      )}
    </div>
  );
}
