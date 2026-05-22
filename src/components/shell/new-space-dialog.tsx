"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Shield,
  ChevronDown,
  Check,
  FileBox,
  type LucideIcon,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useEntidadesStore } from "@/lib/stores/entidades";
import { useNewSpaceDialogStore } from "@/lib/stores/new-space-dialog";
import type { Espaco, VinculoEspaco } from "@/lib/types/entidade";
import { COLORS } from "@/lib/space-customization";
import { cn } from "@/lib/utils";
import { IconPickerPopover } from "./icon-picker-popover";

type PermissaoValue = "editor" | "commenter" | "viewer";

const PERMISSAO_OPTIONS: { value: PermissaoValue; label: string; desc: string }[] = [
  { value: "editor", label: "Edição total", desc: "Pode criar, editar e remover itens." },
  { value: "commenter", label: "Comentar", desc: "Pode visualizar e comentar, sem editar." },
  { value: "viewer", label: "Visualizar", desc: "Acesso somente leitura." },
];

const schema = z.object({
  nome: z.string().min(1, "Obrigatório").max(60, "Máximo 60 caracteres"),
  iniciais: z.string().min(1, "Pelo menos 1 caractere").max(2, "Máximo 2 caracteres"),
  cor: z.string().min(1),
  iconName: z.string().nullable(),
  descricao: z.string().max(200).optional().or(z.literal("")),
  permissaoPadrao: z.enum(["editor", "commenter", "viewer"]),
  privado: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES: FormValues = {
  nome: "",
  iniciais: "",
  cor: COLORS[0].value,
  iconName: null,
  descricao: "",
  permissaoPadrao: "editor",
  privado: false,
};

export function NewSpaceDialog() {
  const open = useNewSpaceDialogStore((s) => s.open);
  const setOpen = useNewSpaceDialogStore((s) => s.setOpen);
  const addEspaco = useEntidadesStore((s) => s.addEspaco);
  const addVinculos = useEntidadesStore((s) => s.addVinculos);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  const nome = form.watch("nome");

  useEffect(() => {
    if (open) return;
    form.reset(DEFAULT_VALUES);
  }, [open, form]);

  useEffect(() => {
    const auto = nome.trim().charAt(0).toUpperCase();
    form.setValue("iniciais", auto || "?", { shouldValidate: false });
  }, [nome, form]);

  const onSubmit = (data: FormValues) => {
    const now = new Date().toISOString();
    const id = `esp-${Date.now()}`;
    const espaco: Espaco = {
      id,
      idClasse: "espaco",
      nome: data.nome.trim(),
      idPai: null,
      criadoEm: now,
      atualizadoEm: now,
      meta: {
        iniciais: data.iniciais.toUpperCase(),
        cor: data.cor,
        iconName: data.iconName,
        visibilidade: data.privado ? "privado" : "publico",
        tiposHabilitados: ["board", "backlog", "doc"],
        descricao: data.descricao?.trim() || undefined,
      },
    };

    addEspaco(espaco);

    const vinculos: VinculoEspaco[] = [
      { espacoId: id, membroId: "u1", role: "owner" },
    ];
    addVinculos(vinculos);

    toast.success(`Espaço "${espaco.nome}" criado`, {
      description: data.privado
        ? "Convide membros nas configurações."
        : "Visível para todos do workspace.",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar espaço</DialogTitle>
          <DialogDescription>
            Espaços agrupam boards, backlogs e documentos com identidade,
            permissões e configurações próprias.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FieldSection label="Ícone e nome">
            <NameRow form={form} />
            <FieldError message={form.formState.errors.nome?.message} />
          </FieldSection>

          <FieldSection label="Descrição" optional>
            <textarea
              {...form.register("descricao")}
              placeholder="Para que esse espaço serve"
              rows={2}
              className="w-full resize-none rounded-md border border-input bg-input/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </FieldSection>

          <div className="space-y-1 border-t border-border pt-3">
            <Controller
              control={form.control}
              name="permissaoPadrao"
              render={({ field }) => (
                <SettingsRow
                  icon={Shield}
                  label="Permissão padrão"
                  helpText="O que membros podem fazer por padrão neste espaço."
                >
                  <PermissaoDropdown
                    value={field.value}
                    onChange={field.onChange}
                  />
                </SettingsRow>
              )}
            />
            <Controller
              control={form.control}
              name="privado"
              render={({ field }) => (
                <SettingsRow
                  label="Tornar privado"
                  helpText="Apenas membros convidados terão acesso a este espaço."
                >
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    ariaLabel="Tornar privado"
                  />
                </SettingsRow>
              )}
            />
          </div>

          <DialogFooter className="items-center sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
            >
              <FileBox className="size-3.5" />
              Usar modelos
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Continuar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NameRow({
  form,
}: {
  form: ReturnType<typeof useForm<FormValues>>;
}) {
  const cor = form.watch("cor");
  const iniciais = form.watch("iniciais");
  const iconName = form.watch("iconName");

  return (
    <div className="flex items-center gap-2">
      <IconPickerPopover
        cor={cor}
        iniciais={iniciais}
        iconName={iconName}
        onColorChange={(c) =>
          form.setValue("cor", c, { shouldValidate: true, shouldDirty: true })
        }
        onIconChange={(name) =>
          form.setValue("iconName", name, {
            shouldValidate: true,
            shouldDirty: true,
          })
        }
      />
      <Input
        {...form.register("nome")}
        autoFocus
        placeholder="Por exemplo: Produto, Marketing, RH"
        className="flex-1"
      />
    </div>
  );
}

function PermissaoDropdown({
  value,
  onChange,
}: {
  value: PermissaoValue;
  onChange: (v: PermissaoValue) => void;
}) {
  const current =
    PERMISSAO_OPTIONS.find((o) => o.value === value) ?? PERMISSAO_OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted data-popup-open:bg-muted"
          >
            {current.label}
            <ChevronDown className="size-3 text-muted-foreground" />
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          {PERMISSAO_OPTIONS.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className="items-start gap-2 py-2"
            >
              <div className="flex min-w-0 flex-col">
                <span className="text-sm font-medium text-foreground">
                  {opt.label}
                </span>
                <span className="text-[11px] leading-snug text-muted-foreground">
                  {opt.desc}
                </span>
              </div>
              {value === opt.value && (
                <Check className="ml-auto size-4 shrink-0 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Switch({
  checked,
  onCheckedChange,
  ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        checked ? "bg-primary" : "bg-input",
      )}
    >
      <span
        className={cn(
          "inline-block size-4 rounded-full bg-background shadow-sm transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

function SettingsRow({
  icon: Icon,
  label,
  helpText,
  children,
}: {
  icon?: LucideIcon;
  label: string;
  helpText?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex min-w-0 items-start gap-2">
        {Icon && (
          <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground">{label}</div>
          {helpText && (
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              {helpText}
            </p>
          )}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function FieldSection({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <label className="text-[12px] font-medium text-foreground">
          {label}
        </label>
        {optional && (
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            opcional
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[11px] text-destructive">{message}</p>;
}
