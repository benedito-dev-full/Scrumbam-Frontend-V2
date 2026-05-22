/**
 * Espelha o modelo polimórfico DEntidade/DClasse do back V2.
 * Toda hierarquia (Espaço → Pasta → Item) é o mesmo registro com idClasse diferente.
 */

export type ClasseId = "espaco" | "pasta" | "board" | "backlog" | "doc";

export type Visibilidade = "publico" | "privado";

export type RoleEspaco = "owner" | "editor" | "viewer";

export type Membro = {
  id: string;
  nome: string;
  iniciais: string;
  cor?: string;
};

export type VinculoEspaco = {
  espacoId: string;
  membroId: string;
  role: RoleEspaco;
};

type EntidadeBase = {
  id: string;
  nome: string;
  idPai: string | null;
  criadoEm: string;
  atualizadoEm: string;
};

export type EspacoMeta = {
  iniciais: string;
  cor: string;
  /** Nome do ícone Lucide (chave do mapa em space-customization). Quando null/undefined, o chip mostra as iniciais. */
  iconName?: string | null;
  visibilidade: Visibilidade;
  tiposHabilitados: Exclude<ClasseId, "espaco" | "pasta">[];
  descricao?: string;
};

export type Espaco = EntidadeBase & {
  idClasse: "espaco";
  meta: EspacoMeta;
};

export type Pasta = EntidadeBase & {
  idClasse: "pasta";
};

export type Board = EntidadeBase & {
  idClasse: "board";
};

export type Backlog = EntidadeBase & {
  idClasse: "backlog";
};

export type Doc = EntidadeBase & {
  idClasse: "doc";
};

export type Entidade = Espaco | Pasta | Board | Backlog | Doc;

export type ItemTipo = Exclude<ClasseId, "espaco" | "pasta">;

export function isEspaco(e: Entidade): e is Espaco {
  return e.idClasse === "espaco";
}

export function isPasta(e: Entidade): e is Pasta {
  return e.idClasse === "pasta";
}

export function isItem(e: Entidade): e is Board | Backlog | Doc {
  return e.idClasse === "board" || e.idClasse === "backlog" || e.idClasse === "doc";
}
