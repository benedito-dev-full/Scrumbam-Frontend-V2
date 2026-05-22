import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import {
  mockEntidades,
  mockVinculos,
} from "@/lib/mocks/entidades";
import type {
  Entidade,
  Espaco,
  VinculoEspaco,
} from "@/lib/types/entidade";
import { isEspaco } from "@/lib/types/entidade";

type EntidadesState = {
  entidades: Entidade[];
  vinculos: VinculoEspaco[];
  addEspaco: (espaco: Espaco) => void;
  addVinculos: (vinculos: VinculoEspaco[]) => void;
};

export const useEntidadesStore = create<EntidadesState>((set) => ({
  entidades: mockEntidades,
  vinculos: mockVinculos,
  addEspaco: (espaco) =>
    set((s) => ({ entidades: [...s.entidades, espaco] })),
  addVinculos: (novosVinculos) =>
    set((s) => ({ vinculos: [...s.vinculos, ...novosVinculos] })),
}));

/** Helpers reativos para usar dentro de componentes client */
export function useEspacos(): Espaco[] {
  return useEntidadesStore(
    useShallow((s) => s.entidades.filter(isEspaco)),
  );
}

export function useFilhosDe(paiId: string | null): Entidade[] {
  return useEntidadesStore(
    useShallow((s) => s.entidades.filter((e) => e.idPai === paiId)),
  );
}
