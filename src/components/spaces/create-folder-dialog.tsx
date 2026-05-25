"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { X, Circle } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCreateFolder } from "@/hooks/use-projects";
import { getApiErrorMessage } from "@/lib/api";

interface CreateFolderDialogProps {
  spaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateFolderDialog({ spaceId, open, onOpenChange }: CreateFolderDialogProps) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [privado, setPrivado] = useState(false);

  const { mutate, isPending } = useCreateFolder();

  useEffect(() => {
    if (!open) {
      setNome("");
      setDescricao("");
      setPrivado(false);
    }
  }, [open]);

  function handleSubmit() {
    const trimmed = nome.trim();
    if (!trimmed) return;
    mutate(
      { nome: trimmed, idPai: spaceId },
      {
        onSuccess: (created) => {
          toast.success(`Pasta "${created.nome}" criada`);
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error("Erro ao criar pasta", { description: getApiErrorMessage(err) });
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-[540px] bg-[#1e1e24] border border-[#2a2a35] rounded-xl shadow-2xl">
        {/* header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-3">
          <div>
            <h2 className="text-[17px] font-semibold text-white">Criar Pasta</h2>
            <p className="mt-1 text-[13px] text-[#8b8b9a]">
              Use pastas para organizar suas listas, documentos e muito mais.
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
            <label className="text-[13px] font-medium text-white">Nome</label>
            <div className="relative">
              <input
                autoFocus
                placeholder="Por exemplo, Projeto, cliente, equipe"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                className="w-full rounded-md border border-[#3a3a45] bg-[#16161c] px-3 py-2.5 pr-8 text-[13px] text-white placeholder-[#52525e] outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]"
              />
              <Circle className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-[#52525e]" />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-white">Descrição</label>
            <input
              placeholder="Conte um pouco sobre sua pasta pra gente (opcional)"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full rounded-md border border-[#3a3a45] bg-[#16161c] px-3 py-2.5 text-[13px] text-white placeholder-[#52525e] outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]"
            />
          </div>

          {/* Configurações */}
          <div>
            <p className="mb-2 text-[13px] font-medium text-white">Configurações</p>
            <div className="rounded-md border border-[#2a2a35] bg-[#16161c] px-4 py-3 flex items-center gap-3">
              <div className="grid size-8 shrink-0 place-items-center rounded-full border border-[#3a3a45] text-[#8b8b9a]">
                <Circle className="size-4" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium text-white">Status</p>
                <p className="text-[12px] text-[#8b8b9a]">Usar status de Espaço</p>
              </div>
              <div className="flex items-center gap-2 text-[#8b8b9a]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
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
          <button type="button" className="text-[13px] text-[#8b8b9a] hover:text-white transition-colors">
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
