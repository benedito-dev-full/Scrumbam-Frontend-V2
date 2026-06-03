"use client";

import { useMemo } from "react";
import {
  ArrowLeft,
  LayoutTemplate,
  Loader2,
  type LucideIcon,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBlocks, useTasksByProject } from "@/hooks/use-tasks";
import type { DProjectDto, TaskResponseDto } from "@/lib/types/api";

interface ListTemplatePreviewDialogProps {
  /** Template (DProject -401) a pré-visualizar; null fecha o dialog. */
  template: DProjectDto | null;
  /** Ícone da categoria (exibido no cabeçalho). */
  icon?: LucideIcon;
  /** Cor da categoria (hex) para o chip do ícone. */
  color?: string;
  onOpenChange: (open: boolean) => void;
  /** Volta para a lista de templates da categoria. */
  onBack: () => void;
  /** Cria a Lista a partir deste template (POST /projects/:id/from-template). */
  onUse: (template: DProjectDto) => void;
  /** true enquanto a criação está em andamento. */
  isCreating?: boolean;
}

/**
 * Prévia de um template de Lista (catálogo real — ADR-V2-061), com criação ativa.
 *
 * Busca a árvore REAL do template (blocos -200 + tarefas -154) via os hooks
 * `useBlocks`/`useTasksByProject` apontados para a chave do template, e mostra
 * o que será clonado. "Usar este template" dispara `onUse`, que chama
 * `POST /projects/:id/from-template`.
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
  const templateId = template?.id ?? null;
  const { data: blocks = [], isLoading: blocksLoading } = useBlocks(templateId);
  const { data: tasks = [], isLoading: tasksLoading } =
    useTasksByProject(templateId);

  const tasksByBlock = useMemo(() => {
    const map = new Map<string, TaskResponseDto[]>();
    for (const t of tasks) {
      const idBloco = (t.dados as { idBloco?: string } | null)?.idBloco;
      if (!idBloco) continue;
      const arr = map.get(idBloco) ?? [];
      arr.push(t);
      map.set(idBloco, arr);
    }
    return map;
  }, [tasks]);

  if (!template) return null;

  const Icon = icon ?? LayoutTemplate;
  const loading = blocksLoading || tasksLoading;

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
              {loading
                ? "Carregando a prévia do template…"
                : `Prévia do que será criado: ${blocks.length} ${
                    blocks.length === 1 ? "bloco" : "blocos"
                  } e ${tasks.length} ${
                    tasks.length === 1 ? "tarefa" : "tarefas"
                  }.`}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="max-h-[55vh] min-h-[120px] overflow-y-auto px-7 pb-2">
          {loading ? (
            <div className="flex h-[120px] items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Carregando…
            </div>
          ) : blocks.length === 0 ? (
            <div className="flex h-[120px] items-center justify-center text-center text-sm text-muted-foreground">
              Este template ainda não tem blocos.
            </div>
          ) : (
            <div className="space-y-3">
              {blocks.map((block) => {
                const blockTasks = tasksByBlock.get(block.id) ?? [];
                return (
                  <div
                    key={block.id}
                    className="rounded-lg border border-border bg-card/50"
                  >
                    <div className="flex items-center justify-between border-b border-border px-3 py-2">
                      <span className="text-[13px] font-semibold text-foreground">
                        {block.nome}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {blockTasks.length}{" "}
                        {blockTasks.length === 1 ? "tarefa" : "tarefas"}
                      </span>
                    </div>
                    <ul className="divide-y divide-border/60">
                      {blockTasks.map((task) => (
                        <li
                          key={task.id}
                          className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-foreground/85"
                        >
                          <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                          <span className="flex-1 truncate">{task.nome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
