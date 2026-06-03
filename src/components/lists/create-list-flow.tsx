"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { CreateListDialog } from "@/components/spaces/create-list-dialog";
import { CreateListChooserDialog } from "./create-list-chooser";
import { ListTemplateGalleryDialog } from "./list-template-gallery";
import { useCreateListFlowStore } from "@/lib/stores/create-list-flow";
import { useCreateFromTemplate } from "@/hooks/use-templates";
import { getApiErrorMessage } from "@/lib/api";
import type { DProjectDto } from "@/lib/types/api";

/**
 * Orquestrador único do fluxo de criação de Lista.
 *
 * Montado uma vez no shell. Lê `useCreateListFlowStore` e mostra, em sequência:
 *
 *   chooser → (em branco) CreateListDialog
 *           → (template)  ListTemplateGalleryDialog → cria + navega
 *
 * "Em branco" cria uma Lista vazia. "Com template" clona um template real via
 * `POST /projects/:id/from-template` (blocos + tarefas), navegando para a Lista
 * já populada que o backend devolve.
 */
export function CreateListFlow() {
  const open = useCreateListFlowStore((s) => s.open);
  const parentId = useCreateListFlowStore((s) => s.parentId);
  const parentName = useCreateListFlowStore((s) => s.parentName);
  const step = useCreateListFlowStore((s) => s.step);
  const setStep = useCreateListFlowStore((s) => s.setStep);
  const close = useCreateListFlowStore((s) => s.close);

  const router = useRouter();
  const { mutateAsync: createFromTemplate, isPending } =
    useCreateFromTemplate();

  async function handleUseTemplate(template: DProjectDto) {
    if (!parentId) return;
    try {
      const created = await createFromTemplate({
        id: template.id,
        idPai: parentId,
        novoNome: template.nome,
        includeTasks: true,
      });

      toast.success(`Lista "${created.nome}" criada a partir do template`);

      close();
      router.push(`/lists/${created.id}`);
    } catch (err) {
      toast.error("Erro ao criar lista", {
        description: getApiErrorMessage(err),
      });
    }
  }

  return (
    <>
      {/* Passo 1: em branco ou template */}
      <CreateListChooserDialog
        open={open && step === "chooser"}
        onOpenChange={(o) => {
          if (!o) close();
        }}
        onChooseBlank={() => setStep("blank")}
        onChooseTemplate={() => setStep("gallery")}
      />

      {/* Passo 2a: criação em branco (fluxo real existente) */}
      <CreateListDialog
        parentId={parentId ?? ""}
        parentName={parentName}
        open={open && step === "blank"}
        onOpenChange={(o) => {
          if (!o) close();
        }}
      />

      {/* Passo 2b: galeria de templates → cria + navega.
          Montada condicionalmente: sair da galeria a desmonta e zera a
          navegação interna (categoria/prévia) para a próxima abertura. */}
      {open && step === "gallery" && (
        <ListTemplateGalleryDialog
          open
          onOpenChange={(o) => {
            if (!o) close();
          }}
          onBack={() => setStep("chooser")}
          onUse={handleUseTemplate}
          isCreating={isPending}
        />
      )}
    </>
  );
}
