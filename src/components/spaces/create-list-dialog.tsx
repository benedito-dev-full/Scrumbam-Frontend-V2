"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { X, ChevronDown } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCreateList } from "@/hooks/use-projects";
import { getApiErrorMessage } from "@/lib/api";

interface CreateListDialogProps {
  parentId: string;
  parentName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateListDialog({ parentId, parentName, open, onOpenChange }: CreateListDialogProps) {
  const [nome, setNome] = useState("");
  const [privado, setPrivado] = useState(false);

  const { mutate, isPending } = useCreateList();

  useEffect(() => {
    if (!open) {
      setNome("");
      setPrivado(false);
    }
  }, [open]);

  function handleSubmit() {
    const trimmed = nome.trim();
    if (!trimmed) return;
    mutate(
      { nome: trimmed, idPai: parentId },
      {
        onSuccess: (created) => {
          toast.success(`Lista "${created.nome}" criada`);
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error("Erro ao criar lista", { description: getApiErrorMessage(err) });
        },
      },
    );
  }

  const initials = parentName
    ? parentName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "?";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-[540px] bg-[#1e1e24] border border-[#2a2a35] rounded-xl shadow-2xl">
        {/* header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-3">
          <div>
            <h2 className="text-[17px] font-semibold text-white">Criar Lista</h2>
            <p className="mt-1 text-[13px] text-[#8b8b9a]">
              Todas as listas estão localizadas em um espaço. Elas podem abrigar qualquer tipo de tarefa.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="mt-0.5 grid size-6 place-items-center rounded-md text-[#8b8b9a] hover:bg-[#2a2a35] hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 pb-2 space-y-4">
          {/* Nome */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-white">
              Nome <span className="text-[#ef4444]">*</span>
            </label>
            <input
              autoFocus
              placeholder="Por exemplo, Projeto, Lista de itens, Campanha"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              className="w-full rounded-md border border-[#6366f1] bg-[#16161c] px-3 py-2.5 text-[13px] text-white placeholder-[#52525e] outline-none focus:ring-1 focus:ring-[#6366f1]"
            />
          </div>

          {/* Espaço (localização) */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-white">Espaço (localização)</label>
            <div className="flex items-center gap-2 rounded-md border border-[#3a3a45] bg-[#16161c] px-3 py-2.5">
              <span className="grid size-5 shrink-0 place-items-center rounded-md bg-[#22c55e] text-[9px] font-bold text-white">
                {initials}
              </span>
              <span className="flex-1 text-[13px] text-white">{parentName ?? "Espaço"}</span>
              <ChevronDown className="size-4 text-[#8b8b9a]" />
            </div>
          </div>

          {/* Tornar privado */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-white">Tornar privado</p>
              <p className="text-[12px] text-[#8b8b9a]">Somente você e membros convidados têm acesso</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={privado}
              onClick={() => setPrivado((v) => !v)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${privado ? "bg-[#6366f1]" : "bg-[#3a3a45]"}`}
            >
              <span className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${privado ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </div>
        </div>

        {/* footer */}
        <div className="flex items-center justify-between border-t border-[#2a2a35] px-6 py-4">
          <button type="button" className="rounded-md border border-[#3a3a45] px-4 py-2 text-[13px] text-[#8b8b9a] hover:text-white transition-colors">
            Usar modelos
          </button>
          <button
            type="button"
            disabled={isPending || !nome.trim()}
            onClick={handleSubmit}
            className="rounded-md bg-[#3a3a45] px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#4a4a55] disabled:opacity-40"
          >
            {isPending ? "Criando…" : "Criar"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
