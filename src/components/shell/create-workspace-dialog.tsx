"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateWorkspaceDialogStore } from "@/lib/stores/create-workspace-dialog";
import { useCreateOrganization } from "@/hooks/use-organizations";
import { useSwitchOrg } from "@/hooks/use-auth";

const schema = z.object({
  nome: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(255, "Máximo 255 caracteres"),
  descricao: z.string().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES: FormValues = { nome: "", descricao: "" };

/**
 * Modal de criação de uma nova workspace (organização).
 *
 * Montado globalmente no `app-shell` e aberto pelo `WorkspaceSwitcher`.
 * Ao confirmar: cria a org (`POST /organizations`) e já entra nela via
 * `useSwitchOrg`, redirecionando para a Home.
 */
export function CreateWorkspaceDialog() {
  const router = useRouter();
  const open = useCreateWorkspaceDialogStore((s) => s.open);
  const setOpen = useCreateWorkspaceDialogStore((s) => s.setOpen);
  const close = useCreateWorkspaceDialogStore((s) => s.close);

  const createOrg = useCreateOrganization();
  const switchOrg = useSwitchOrg();
  const pending = createOrg.isPending || switchOrg.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) return;
    form.reset(DEFAULT_VALUES);
  }, [open, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      const org = await createOrg.mutateAsync({
        nome: data.nome.trim(),
        description: data.descricao?.trim() || undefined,
      });
      close();
      // Entra na workspace recém-criada e vai para a Home.
      switchOrg.mutate(org.id, { onSuccess: () => router.push("/") });
    } catch {
      // Erro já exibido via toast no hook; mantém o modal aberto para retry.
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (pending ? null : setOpen(v))}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Espaço de trabalho</DialogTitle>
          <DialogDescription>
            Uma workspace é o nível mais alto — agrupa seus espaços, times e
            membros. Você entra como administrador.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <label
              htmlFor="ws-nome"
              className="text-[12px] font-medium text-foreground"
            >
              Nome
            </label>
            <Input
              id="ws-nome"
              {...form.register("nome")}
              autoFocus
              placeholder="Por exemplo: Minha Empresa"
            />
            {form.formState.errors.nome?.message && (
              <p className="text-[11px] text-destructive">
                {form.formState.errors.nome.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="ws-descricao"
                className="text-[12px] font-medium text-foreground"
              >
                Descrição
              </label>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                opcional
              </span>
            </div>
            <textarea
              id="ws-descricao"
              {...form.register("descricao")}
              placeholder="Para que essa workspace serve"
              rows={2}
              className="w-full resize-none rounded-md border border-input bg-input/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            {form.formState.errors.descricao?.message && (
              <p className="text-[11px] text-destructive">
                {form.formState.errors.descricao.message}
              </p>
            )}
          </div>

          <DialogFooter className="items-center sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => close()}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Criando…" : "Criar workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
