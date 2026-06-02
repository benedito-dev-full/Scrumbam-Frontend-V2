"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  SPACE_TEMPLATES,
  type SpaceTemplate,
} from "@/lib/templates/space-templates";
import { SpaceTemplatePreviewDialog } from "./space-template-preview";

interface SpaceTemplateGalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Volta para o modal de escolha (Em branco / Template). */
  onBack?: () => void;
}

/**
 * Galeria de templates de Espaço (categorias de mercado).
 *
 * Lê o catálogo fixo `SPACE_TEMPLATES`. Selecionar um card abre a prévia
 * read-only (`SpaceTemplatePreviewDialog`) — a criação real virá de um endpoint
 * do backend. Enquanto a prévia está aberta, a galeria fica oculta (mesmo
 * estado `open`), e "voltar" na prévia traz a galeria de novo.
 */
export function SpaceTemplateGalleryDialog({
  open,
  onOpenChange,
  onBack,
}: SpaceTemplateGalleryDialogProps) {
  const [preview, setPreview] = useState<SpaceTemplate | null>(null);

  return (
    <>
      <Dialog open={open && !preview} onOpenChange={onOpenChange}>
        <DialogContent className="p-0 gap-0 sm:max-w-[680px]">
          <div className="px-7 pt-7 pb-5">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                {onBack && (
                  <button
                    type="button"
                    aria-label="Voltar"
                    onClick={onBack}
                    className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <ArrowLeft className="size-4" />
                  </button>
                )}
                Escolha um template
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                Cada template cria um espaço já com uma lista, blocos e tarefas
                pré-criados.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid max-h-[55vh] grid-cols-1 gap-3 overflow-y-auto px-7 pb-7 sm:grid-cols-2">
            {SPACE_TEMPLATES.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={() => setPreview(template)}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <SpaceTemplatePreviewDialog
        template={preview}
        onOpenChange={(o) => {
          if (!o) setPreview(null);
        }}
        onBack={() => setPreview(null)}
      />
    </>
  );
}

function TemplateCard({
  template,
  onSelect,
}: {
  template: SpaceTemplate;
  onSelect: () => void;
}) {
  const Icon = template.icon;
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
        style={{ background: template.color }}
      >
        <Icon className="size-[18px]" />
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-sm font-semibold text-foreground">
          {template.nome}
        </span>
        <span className="text-xs leading-relaxed text-muted-foreground">
          {template.descricao}
        </span>
      </span>
    </button>
  );
}
