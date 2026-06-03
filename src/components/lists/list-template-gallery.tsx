"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, LayoutTemplate, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useListTemplates } from "@/hooks/use-templates";
import {
  getCategoryMeta,
  type CategoryMeta,
} from "@/lib/templates/space-templates";
import type { DProjectDto } from "@/lib/types/api";
import { ListTemplatePreviewDialog } from "./list-template-preview";

/** Chave de agrupamento para templates sem categoria. */
const SEM_CATEGORIA = "outros";

interface GalleryCategory {
  id: string;
  meta: CategoryMeta;
  templates: DProjectDto[];
}

interface ListTemplateGalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Volta para o chooser (Em branco / Template). */
  onBack?: () => void;
  /** Cria a Lista a partir do template escolhido. */
  onUse: (template: DProjectDto) => void;
  /** true enquanto a criação está em andamento (trava o botão da prévia). */
  isCreating?: boolean;
}

/**
 * Galeria de templates de Lista em 3 níveis (catálogo REAL — ADR-V2-061):
 *
 *   1. Categorias (agrupadas por `dados.categoria` dos templates reais)
 *   2. Templates daquela categoria
 *   3. Prévia (árvore real) + criação via `POST /projects/:id/from-template`
 *
 * Fonte: `GET /projects?idClasse=-401` (templates da org + globais de
 * plataforma). Enquanto não houver templates cadastrados, mostra estado vazio.
 */
export function ListTemplateGalleryDialog({
  open,
  onOpenChange,
  onBack,
  onUse,
  isCreating,
}: ListTemplateGalleryDialogProps) {
  const { data: templates = [], isLoading } = useListTemplates();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [preview, setPreview] = useState<DProjectDto | null>(null);

  const categories = useMemo<GalleryCategory[]>(() => {
    const byCat = new Map<string, DProjectDto[]>();
    for (const t of templates) {
      const key = t.categoria ?? SEM_CATEGORIA;
      const arr = byCat.get(key) ?? [];
      arr.push(t);
      byCat.set(key, arr);
    }
    return Array.from(byCat.entries())
      .map(([id, tpls]) => ({
        id,
        meta: getCategoryMeta(id === SEM_CATEGORIA ? null : id),
        templates: tpls,
      }))
      .sort((a, b) => a.meta.nome.localeCompare(b.meta.nome, "pt-BR"));
  }, [templates]);

  const category = categories.find((c) => c.id === categoryId) ?? null;

  function closeAll() {
    setPreview(null);
    setCategoryId(null);
    onOpenChange(false);
  }

  const previewMeta = preview ? getCategoryMeta(preview.categoria) : undefined;

  return (
    <>
      {/* Nível 1: categorias */}
      <Dialog
        open={open && !category && !preview}
        onOpenChange={(o) => !o && closeAll()}
      >
        <DialogContent className="p-0 gap-0 sm:max-w-[680px]">
          <div className="px-7 pt-7 pb-5">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                {onBack && <BackButton onClick={onBack} />}
                Escolha uma categoria
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                Escolha o nicho e depois um template pronto — uma lista já com
                blocos e tarefas.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="min-h-[200px] px-7 pb-7">
            {isLoading ? (
              <CenteredHint>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Carregando templates…
              </CenteredHint>
            ) : categories.length === 0 ? (
              <CenteredHint>Nenhum template disponível ainda.</CenteredHint>
            ) : (
              <div className="grid max-h-[55vh] grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2">
                {categories.map((cat) => (
                  <CategoryCard
                    key={cat.id}
                    category={cat}
                    onSelect={() => setCategoryId(cat.id)}
                  />
                ))}
              </div>
            )}
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
                    <BackButton onClick={() => setCategoryId(null)} />
                    <span
                      className="grid size-8 place-items-center rounded-lg text-white"
                      style={{ background: category.meta.color }}
                    >
                      <category.meta.icon className="size-[18px]" />
                    </span>
                    {category.meta.nome}
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                    Escolha um template de {category.meta.nome.toLowerCase()}.
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

      {/* Nível 3: prévia + criação */}
      <ListTemplatePreviewDialog
        template={preview}
        icon={previewMeta?.icon}
        color={previewMeta?.color}
        onOpenChange={(o) => {
          if (!o) closeAll();
        }}
        onBack={() => setPreview(null)}
        onUse={onUse}
        isCreating={isCreating}
      />
    </>
  );
}

function CenteredHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[160px] items-center justify-center text-center text-sm text-muted-foreground">
      {children}
    </div>
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
  category: GalleryCategory;
  onSelect: () => void;
}) {
  const Icon = category.meta.icon;
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
        style={{ background: category.meta.color }}
      >
        <Icon className="size-[18px]" />
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {category.meta.nome}
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {category.templates.length}
          </span>
        </span>
        {category.meta.descricao && (
          <span className="text-xs leading-relaxed text-muted-foreground">
            {category.meta.descricao}
          </span>
        )}
      </span>
    </button>
  );
}

function TemplateRow({
  template,
  onSelect,
}: {
  template: DProjectDto;
  onSelect: () => void;
}) {
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
        {template.description && (
          <span className="truncate text-xs text-muted-foreground">
            {template.description}
          </span>
        )}
      </span>
    </button>
  );
}
