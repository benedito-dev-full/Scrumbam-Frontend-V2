"use client";

import { useState } from "react";
import { ArrowLeft, LayoutTemplate } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  TEMPLATE_CATEGORIES,
  type SpaceTemplate,
  type TemplateCategory,
} from "@/lib/templates/space-templates";
import { SpaceTemplatePreviewDialog } from "./space-template-preview";

interface SpaceTemplateGalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Volta para o modal de escolha (Em branco / Template). */
  onBack?: () => void;
}

/**
 * Galeria de templates em 3 níveis:
 *
 *   1. Categorias (nichos de mercado)
 *   2. Templates daquela categoria
 *   3. Prévia read-only do template escolhido
 *
 * Lê o catálogo fixo `TEMPLATE_CATEGORIES`. Apenas um nível fica visível por
 * vez (controlado por `category`/`preview` + o mesmo `open`). A criação real
 * virá de um endpoint do backend.
 */
export function SpaceTemplateGalleryDialog({
  open,
  onOpenChange,
  onBack,
}: SpaceTemplateGalleryDialogProps) {
  const [category, setCategory] = useState<TemplateCategory | null>(null);
  const [preview, setPreview] = useState<SpaceTemplate | null>(null);

  function closeAll() {
    setPreview(null);
    setCategory(null);
    onOpenChange(false);
  }

  return (
    <>
      {/* Nível 1: categorias */}
      <Dialog open={open && !category && !preview} onOpenChange={(o) => !o && closeAll()}>
        <DialogContent className="p-0 gap-0 sm:max-w-[680px]">
          <div className="px-7 pt-7 pb-5">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                {onBack && (
                  <BackButton onClick={onBack} />
                )}
                Escolha uma categoria
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                Escolha o nicho e depois um template pronto — um espaço já com
                lista, blocos e tarefas.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid max-h-[55vh] grid-cols-1 gap-3 overflow-y-auto px-7 pb-7 sm:grid-cols-2">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                onSelect={() => setCategory(cat)}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Nível 2: templates da categoria */}
      <Dialog
        open={open && !!category && !preview}
        onOpenChange={(o) => !o && closeAll()}
      >
        <DialogContent className="p-0 gap-0 sm:max-w-[640px]">
          {category && (
            <>
              <div className="px-7 pt-7 pb-5">
                <DialogHeader className="space-y-1.5">
                  <DialogTitle className="flex items-center gap-2.5 text-xl font-semibold">
                    <BackButton onClick={() => setCategory(null)} />
                    <span
                      className="grid size-8 place-items-center rounded-lg text-white"
                      style={{ background: category.color }}
                    >
                      <category.icon className="size-[18px]" />
                    </span>
                    {category.nome}
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                    Escolha um template de {category.nome.toLowerCase()}.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="grid max-h-[55vh] grid-cols-1 gap-2.5 overflow-y-auto px-7 pb-7">
                {category.templates.map((tpl) => (
                  <TemplateRow
                    key={tpl.id}
                    template={tpl}
                    onSelect={() => setPreview(tpl)}
                  />
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Nível 3: prévia read-only */}
      <SpaceTemplatePreviewDialog
        template={preview}
        icon={category?.icon}
        color={category?.color}
        onOpenChange={(o) => {
          if (!o) closeAll();
        }}
        onBack={() => setPreview(null)}
      />
    </>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Voltar"
      onClick={onClick}
      className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
    </button>
  );
}

function CategoryCard({
  category,
  onSelect,
}: {
  category: TemplateCategory;
  onSelect: () => void;
}) {
  const Icon = category.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors",
        "hover:border-primary hover:bg-accent/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <span
        className="grid size-9 shrink-0 place-items-center rounded-lg text-white"
        style={{ background: category.color }}
      >
        <Icon className="size-[18px]" />
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {category.nome}
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {category.templates.length}
          </span>
        </span>
        <span className="text-xs leading-relaxed text-muted-foreground">
          {category.descricao}
        </span>
      </span>
    </button>
  );
}

function TemplateRow({
  template,
  onSelect,
}: {
  template: SpaceTemplate;
  onSelect: () => void;
}) {
  const totalTasks = template.blocks.reduce((s, b) => s + b.tasks.length, 0);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-border bg-card p-3.5 text-left transition-colors",
        "hover:border-primary hover:bg-accent/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
        <LayoutTemplate className="size-4" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">
          {template.nome}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {template.descricao}
        </span>
      </span>
      <span className="shrink-0 text-[11px] text-muted-foreground">
        {template.blocks.length} blocos · {totalTasks} tarefas
      </span>
    </button>
  );
}
