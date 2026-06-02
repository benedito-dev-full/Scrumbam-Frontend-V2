"use client";

import { FileText, LayoutTemplate } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CreateSpaceChooserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Usuário escolheu criar um espaço vazio → abre o modal de "Criar espaço". */
  onChooseBlank: () => void;
  /** Usuário escolheu partir de um template → abre a galeria de templates. */
  onChooseTemplate: () => void;
}

/**
 * Primeiro passo da criação de um Espaço: pergunta se o usuário quer começar
 * em branco ou a partir de um template.
 *
 * Substitui a abertura direta do `CreateSpaceDialog` no "+" da sidebar.
 * "Em branco" delega ao modal existente; "A partir de um template" abre a
 * galeria (`SpaceTemplateGalleryDialog`).
 */
export function CreateSpaceChooserDialog({
  open,
  onOpenChange,
  onChooseBlank,
  onChooseTemplate,
}: CreateSpaceChooserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 sm:max-w-[560px]">
        <div className="px-7 pt-7 pb-5">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-xl font-semibold">Criar espaço</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Comece do zero ou use um template pronto — um espaço que já vem com
              uma lista, blocos e tarefas pré-criados.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid grid-cols-1 gap-3 px-7 pb-7 sm:grid-cols-2">
          <ChoiceCard
            icon={<FileText className="size-5" />}
            title="Em branco"
            description="Um espaço vazio para organizar do seu jeito."
            onClick={onChooseBlank}
          />
          <ChoiceCard
            icon={<LayoutTemplate className="size-5" />}
            title="A partir de um template"
            description="Já vem com lista, blocos e tarefas prontos."
            onClick={onChooseTemplate}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ChoiceCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-5 text-left transition-colors",
        "hover:border-primary hover:bg-accent/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
        {icon}
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}
