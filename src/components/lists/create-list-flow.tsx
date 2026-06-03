"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { CreateListDialog } from "@/components/spaces/create-list-dialog";
import { CreateListChooserDialog } from "./create-list-chooser";
import { ListTemplateGalleryDialog } from "./list-template-gallery";
import { useCreateListFlowStore } from "@/lib/stores/create-list-flow";
import { useTemplateMockStore } from "@/lib/stores/template-mock";
import { useCreateList } from "@/hooks/use-projects";
import { getApiErrorMessage } from "@/lib/api";
import type { SpaceTemplate } from "@/lib/templates/space-templates";

/**
 * Orquestrador único do fluxo de criação de Lista.
 *
 * Montado uma vez no shell. Lê `useCreateListFlowStore` e mostra, em sequência:
 *
 *   chooser → (em branco) CreateListDialog
 *           → (template)  ListTemplateGalleryDialog → cria + navega
 *
 * "Em branco" continua 100% real. "Com template" cria a casca real da Lista e
 * injeta blocos+tarefas em memória (`template-mock`), navegando para a Lista
 * já populada — até o backend expor `POST /projects/from-template`.
 */
export function CreateListFlow() {
  const open = useCreateListFlowStore((s) => s.open);
  const parentId = useCreateListFlowStore((s) => s.parentId);
  const parentName = useCreateListFlowStore((s) => s.parentName);
  const step = useCreateListFlowStore((s) => s.step);
  const setStep = useCreateListFlowStore((s) => s.setStep);
  const close = useCreateListFlowStore((s) => s.close);

  const router = useRouter();
  const { mutateAsync, isPending } = useCreateList();
  const registerFromTemplate = useTemplateMockStore((s) => s.registerFromTemplate);

  async function handleUseTemplate(template: SpaceTemplate) {
    if (!parentId) return;
    try {
      const created = await mutateAsync({
        nome: template.listName,
        idPai: parentId,
      });
      // Injeta blocos+tarefas do template em memória para esta Lista.
      registerFromTemplate(created.id, template);

      const totalTasks = template.blocks.reduce((s, b) => s + b.tasks.length, 0);
      toast.success(`Lista "${created.nome}" criada a partir do template`, {
        description: `${template.blocks.length} blocos e ${totalTasks} tarefas (prévia em memória).`,
      });

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
