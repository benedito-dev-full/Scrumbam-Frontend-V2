"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { X, ChevronDown, Check } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCreateList, useSpaces } from "@/hooks/use-projects";
import { getApiErrorMessage } from "@/lib/api";
import type { DProjectDto } from "@/lib/types/api";

interface CreateListDialogProps {
  parentId: string;
  parentName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COLORS = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#14b8a6"];

function chipColor(id: string) {
  const idx = parseInt(id, 10) % COLORS.length;
  return COLORS[isNaN(idx) ? 0 : idx];
}

function SpaceChip({ space }: { space: DProjectDto }) {
  const initials = space.nome.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  return (
    <span
      className="grid size-5 shrink-0 place-items-center rounded-md text-[9px] font-bold text-white"
      style={{ background: chipColor(space.id) }}
    >
      {initials}
    </span>
  );
}

export function CreateListDialog({ parentId, parentName, open, onOpenChange }: CreateListDialogProps) {
  const [nome, setNome] = useState("");
  const [privado, setPrivado] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(parentId);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { mutate, isPending } = useCreateList();
  const { data: spaces } = useSpaces();

  const selectedSpace = spaces?.find((s) => s.id === selectedId);
  const displayName = selectedSpace?.nome ?? parentName ?? "Espaço";
  const displayId = selectedSpace?.id ?? parentId;

  useEffect(() => {
    if (!open) {
      setNome("");
      setPrivado(false);
      setDropdownOpen(false);
      setSelectedId(parentId);
    }
  }, [open, parentId]);

  // fecha dropdown ao clicar fora
  useEffect(() => {
    if (!dropdownOpen) return;
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  function handleSubmit() {
    const trimmed = nome.trim();
    if (!trimmed) return;
    mutate(
      { nome: trimmed, idPai: selectedId },
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 w-[600px] max-w-[600px] bg-[#1e1e24] border border-[#2a2a35] rounded-xl shadow-2xl">
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

          {/* Espaço (localização) — dropdown funcional */}
          <div className="space-y-1.5" ref={dropdownRef}>
            <label className="text-[13px] font-medium text-white">Espaço (localização)</label>
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex w-full items-center gap-2 rounded-md border border-[#3a3a45] bg-[#16161c] px-3 py-2.5 text-left transition-colors hover:border-[#6366f1]"
            >
              {selectedSpace && <SpaceChip space={selectedSpace} />}
              <span className="flex-1 text-[13px] text-white truncate">{displayName}</span>
              <ChevronDown className={`size-4 text-[#8b8b9a] transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <div className="mt-1 max-h-[180px] overflow-y-auto rounded-md border border-[#3a3a45] bg-[#16161c] py-1 shadow-xl">
                {spaces?.length === 0 && (
                  <p className="px-3 py-2 text-[13px] text-[#8b8b9a]">Nenhum espaço encontrado</p>
                )}
                {spaces?.map((space) => (
                  <button
                    key={space.id}
                    type="button"
                    onClick={() => { setSelectedId(space.id); setDropdownOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-white hover:bg-[#2a2a35]"
                  >
                    <SpaceChip space={space} />
                    <span className="flex-1 truncate">{space.nome}</span>
                    {space.id === selectedId && <Check className="size-3.5 text-[#6366f1]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tornar privado */}
          <div className="flex items-center justify-between py-1">
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
