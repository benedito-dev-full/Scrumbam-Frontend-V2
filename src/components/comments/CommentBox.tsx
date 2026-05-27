"use client";

// ─── Externos ─────────────────────────────────────────────────────────────────
import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ─── UI ───────────────────────────────────────────────────────────────────────
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// ─── Hooks ────────────────────────────────────────────────────────────────────
import { useCreateComment } from "@/hooks/use-comments";

// ─── Types ────────────────────────────────────────────────────────────────────
import type { CommentTargetType } from "@/lib/types/comment";

// ─── Schema ───────────────────────────────────────────────────────────────────

const commentSchema = z.object({
  texto: z
    .string()
    .trim()
    .min(1, "Comentário não pode estar vazio")
    .max(10000, "Comentário muito longo (máx. 10000 caracteres)"),
});

type CommentFormValues = z.infer<typeof commentSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface CommentBoxProps {
  targetType: CommentTargetType;
  targetId: string;
  /** Callback opcional disparado após persistência bem-sucedida. */
  onCommented?: () => void;
}

/**
 * Caixa de criação de comentário — Textarea + botão "Comentar".
 *
 * Usa RHF + zod para validação local; o feedback de erro de rede vem do
 * hook {@link useCreateComment} via toast (não duplica aqui). Atalho
 * `Ctrl/Cmd+Enter` envia o formulário enquanto o foco está na textarea.
 *
 * Após sucesso: reset do form + foco devolvido à textarea (via `setFocus`
 * do RHF, sem precisar manter ref local) + callback `onCommented` opcional.
 */
export function CommentBox({
  targetType,
  targetId,
  onCommented,
}: CommentBoxProps) {
  const { mutateAsync, isPending } = useCreateComment(targetType, targetId);

  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors },
  } = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: { texto: "" },
  });

  // useId() garante IDs únicos por instância — evita colisão se o
  // CommentsPanel for renderizado mais de uma vez na mesma página.
  const reactId = useId();
  const textareaId = `${reactId}-textarea`;
  const errorMessage = errors.texto?.message;
  const errorId = errorMessage ? `${reactId}-error` : undefined;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await mutateAsync({ texto: values.texto.trim() });
      reset({ texto: "" });
      // Devolve foco à textarea para emendar outro comentário sem clicar.
      setFocus("texto");
      onCommented?.();
    } catch {
      // Erro já é tratado (toast) pelo hook — não precisamos duplicar.
    }
  });

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void onSubmit();
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-2" noValidate>
      <label htmlFor={textareaId} className="sr-only">
        Escrever comentário
      </label>

      <Textarea
        {...register("texto")}
        id={textareaId}
        placeholder="Escrever comentário…"
        disabled={isPending}
        onKeyDown={handleKeyDown}
        aria-invalid={errorMessage ? true : undefined}
        aria-describedby={errorId}
        // min-h-[6rem] = altura inicial confortável (~4 linhas). Não usamos
        // `rows={4}` porque o `field-sizing-content` do shadcn Textarea
        // sobrescreve esse atributo, o que gera confusão futura.
        className="min-h-[6rem] resize-none"
      />

      <div className="flex items-center justify-between gap-2">
        {errorMessage ? (
          <p id={errorId} className="text-xs text-destructive">
            {errorMessage}
          </p>
        ) : (
          <span className="text-xs text-muted-foreground">
            Ctrl/⌘ + Enter para enviar
          </span>
        )}

        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Enviando…" : "Comentar"}
        </Button>
      </div>
    </form>
  );
}
