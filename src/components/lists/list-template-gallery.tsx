"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, LayoutTemplate } from "lucide-react";

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
  TEMPLATE_CATEGORIES,
  getCategoryMeta,
  type CategoryMeta,
} from "@/lib/templates/space-templates";
import type { DProjectDto } from "@/lib/types/api";
import { ListTemplatePreviewDialog } from "./list-template-preview";

/** Chave de agrupamento para templates sem categoria (ou de categoria desconhecida). */
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
 * Galeria de templates de Lista em 3 níveis (ADR-V2-061):
 *
 *   1. Categorias — taxonomia FIXA (curada em {@link TEMPLATE_CATEGORIES}),
 *      sempre visível; o contador mostra quantos templates reais cada uma tem.
 *   2. Templates daquela categoria — conteúdo REAL do backend
 *      (`GET /projects?idClasse=-401&categoria=X`); estado vazio se não houver.
 *   3. Prévia (árvore real) + criação via `POST /projects/:id/from-template`.
 *
 * As categorias não dependem de haver templates: a vitrine mostra os nichos
 * mesmo "vazios". Só o conteúdo (templates) vem do servidor.
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
    // Agrupa os templates reais por categoria (id). `null`/desconhecida → "outros".
    const byCat = new Map<string, DProjectDto[]>();
    for (const t of templates) {
      const key = t.categoria ?? SEM_CATEGORIA;
      const arr = byCat.get(key);
      if (arr) arr.push(t);
      else byCat.set(key, [t]);
    }

    // Taxonomia FIXA sempre presente (mesmo sem templates).
    const fixed: GalleryCategory[] = TEMPLATE_CATEGORIES.map((c) => ({
      id: c.id,
      meta: {
        nome: c.nome,
        descricao: c.descricao,
        icon: c.icon,
        color: c.color,
      },
      templates: byCat.get(c.id) ?? [],
    }));

    // Templates de categoria desconhecida (ou sem categoria) → bucket "Outros",
    // anexado só quando existir algum.
    const fixedIds = new Set(TEMPLATE_CATEGORIES.map((c) => c.id));
    const orphans: DProjectDto[] = [];
    for (const [key, arr] of byCat) {
      if (!fixedIds.has(key)) orphans.push(...arr);
    }
    if (orphans.length > 0) {
      fixed.push({
        id: SEM_CATEGORIA,
        meta: getCategoryMeta(null),
        templates: orphans,
      });
    }

    return fixed;
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
      {/* Nível 1: categorias (taxonomia fixa — sempre visível) */}
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

          <div className="grid max-h-[55vh] grid-cols-1 gap-3 overflow-y-auto px-7 pb-7 sm:grid-cols-2">
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                loading={isLoading}
                onSelect={() => setCategoryId(cat.id)}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Nível 2: templates da categoria (conteúdo real; vazio se não houver) */}
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

              {category.templates.length === 0 ? (
                <div className="flex h-[160px] items-center justify-center px-7 pb-7 text-center text-sm text-muted-foreground">
                  Nenhum template nesta categoria ainda.
                </div>
              ) : (
                <div className="grid max-h-[55vh] grid-cols-1 gap-2.5 overflow-y-auto px-7 pb-7">
                  {category.templates.map((tpl) => (
                    <TemplateRow
                      key={tpl.id}
                      template={tpl}
                      onSelect={() => setPreview(tpl)}
                    />
                  ))}
                </div>
              )}
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
  loading,
  onSelect,
}: {
  category: GalleryCategory;
  loading?: boolean;
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
            {loading ? "…" : category.templates.length}
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
