"use client";

import { ArrowLeft, LayoutTemplate, Loader2, type LucideIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { SpaceTemplate } from "@/lib/templates/space-templates";

interface ListTemplatePreviewDialogProps {
  /** Template a pré-visualizar; null fecha o dialog. */
  template: SpaceTemplate | null;
  /** Ícone da categoria (exibido no cabeçalho). */
  icon?: LucideIcon;
  /** Cor da categoria (hex) para o chip do ícone. */
  color?: string;
  onOpenChange: (open: boolean) => void;
  /** Volta para a lista de templates da categoria. */
  onBack: () => void;
  /** Cria a Lista a partir deste template (mock em memória, ver template-mock). */
  onUse: (template: SpaceTemplate) => void;
  /** true enquanto a criação está em andamento. */
  isCreating?: boolean;
}

/**
 * Prévia de um template de Lista, com criação ativa.
 *
 * Mostra exatamente o que o template criará — Lista → blocos com tarefas — e o
 * botão "Usar este template" dispara `onUse`. Diferente da prévia de Espaço
 * (que tem o botão desabilitado "em breve"), aqui a criação funciona via mock
 * em memória até o endpoint do backend existir.
 */
export function ListTemplatePreviewDialog({
  template,
  icon,
  color,
  onOpenChange,
  onBack,
  onUse,
  isCreating,
}: ListTemplatePreviewDialogProps) {
  if (!template) return null;

  const Icon = icon ?? LayoutTemplate;
  const totalTasks = template.blocks.reduce((sum, b) => sum + b.tasks.length, 0);

  return (
    <Dialog open={!!template} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 sm:max-w-[600px]">
        <div className="px-7 pt-7 pb-4">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="flex items-center gap-2.5 text-xl font-semibold">
              <button
                type="button"
                aria-label="Voltar"
                onClick={onBack}
                className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
              </button>
              <span
                className="grid size-8 place-items-center rounded-lg text-white"
                style={{ background: color ?? "#6366f1" }}
              >
                <Icon className="size-[18px]" />
              </span>
              {template.nome}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Prévia do que será criado: 1 lista, {template.blocks.length}{" "}
              {template.blocks.length === 1 ? "bloco" : "blocos"} e {totalTasks}{" "}
              {totalTasks === 1 ? "tarefa" : "tarefas"}.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-7 pb-2">
          {/* Lista */}
          <div className="mb-3 flex items-center gap-2 text-[13px] font-medium text-foreground">
            <span className="text-muted-foreground">Lista:</span>
            <span className="rounded-md bg-accent px-2 py-0.5">
              {template.listName}
            </span>
          </div>

          {/* Blocos → tarefas */}
          <div className="space-y-3">
            {template.blocks.map((block) => (
              <div
                key={block.nome}
                className="rounded-lg border border-border bg-card/50"
              >
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <span className="text-[13px] font-semibold text-foreground">
                    {block.nome}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {block.tasks.length}{" "}
                    {block.tasks.length === 1 ? "tarefa" : "tarefas"}
                  </span>
                </div>
                <ul className="divide-y divide-border/60">
                  {block.tasks.map((task) => (
                    <li
                      key={task.titulo}
                      className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-foreground/85"
                    >
                      <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                      <span className="flex-1 truncate">{task.titulo}</span>
                      {task.priority && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                          {task.priority}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé: criação ativa (mock em memória até o endpoint do backend) */}
        <div className="flex items-center justify-between border-t border-border px-7 py-4">
          <button
            type="button"
            onClick={onBack}
            className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Voltar
          </button>
          <Button
            type="button"
            onClick={() => onUse(template)}
            disabled={isCreating}
            className="px-5"
          >
            {isCreating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Criando…
              </>
            ) : (
              "Usar este template"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
