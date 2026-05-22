import {
  isEspaco,
  type Entidade,
  type Espaco,
  type Membro,
  type VinculoEspaco,
} from "@/lib/types/entidade";

export const mockMembros: Membro[] = [
  { id: "u1", nome: "Robério", iniciais: "RB" },
  { id: "u2", nome: "Ana Costa", iniciais: "AC" },
  { id: "u3", nome: "Pedro Silva", iniciais: "PS" },
  { id: "u4", nome: "Júlia Mendes", iniciais: "JM" },
];

const now = "2026-05-22T13:00:00.000Z";

export const mockEntidades: Entidade[] = [
  // Espaços (raiz)
  {
    id: "esp-produto",
    idClasse: "espaco",
    nome: "Produto",
    idPai: null,
    criadoEm: now,
    atualizadoEm: now,
    meta: {
      iniciais: "P",
      cor: "oklch(0.66 0.19 264)",
      iconName: "rocket",
      visibilidade: "publico",
      tiposHabilitados: ["board", "backlog", "doc"],
      descricao: "Roadmap, sprints e specs do produto.",
    },
  },
  {
    id: "esp-marketing",
    idClasse: "espaco",
    nome: "Marketing",
    idPai: null,
    criadoEm: now,
    atualizadoEm: now,
    meta: {
      iniciais: "M",
      cor: "oklch(0.65 0.18 145)",
      iconName: "megaphone",
      visibilidade: "publico",
      tiposHabilitados: ["board", "backlog", "doc"],
    },
  },
  {
    id: "esp-rh",
    idClasse: "espaco",
    nome: "RH",
    idPai: null,
    criadoEm: now,
    atualizadoEm: now,
    meta: {
      iniciais: "R",
      cor: "oklch(0.68 0.18 30)",
      iconName: "users",
      visibilidade: "privado",
      tiposHabilitados: ["doc", "backlog"],
      descricao: "Privado · só membros convidados.",
    },
  },

  // Pastas em Produto
  {
    id: "pasta-sprints",
    idClasse: "pasta",
    nome: "Sprints",
    idPai: "esp-produto",
    criadoEm: now,
    atualizadoEm: now,
  },
  {
    id: "pasta-specs",
    idClasse: "pasta",
    nome: "Specs",
    idPai: "esp-produto",
    criadoEm: now,
    atualizadoEm: now,
  },

  // Items em Produto > Sprints
  {
    id: "board-q2",
    idClasse: "board",
    nome: "Sprint Q2 — semana 1",
    idPai: "pasta-sprints",
    criadoEm: now,
    atualizadoEm: now,
  },
  {
    id: "backlog-produto",
    idClasse: "backlog",
    nome: "Backlog principal",
    idPai: "pasta-sprints",
    criadoEm: now,
    atualizadoEm: now,
  },

  // Items em Produto > Specs
  {
    id: "doc-roadmap",
    idClasse: "doc",
    nome: "Roadmap 2026",
    idPai: "pasta-specs",
    criadoEm: now,
    atualizadoEm: now,
  },
  {
    id: "doc-changelog",
    idClasse: "doc",
    nome: "Changelog Q2",
    idPai: "pasta-specs",
    criadoEm: now,
    atualizadoEm: now,
  },

  // Item direto em Produto (sem pasta)
  {
    id: "doc-arquitetura",
    idClasse: "doc",
    nome: "Decisões de arquitetura",
    idPai: "esp-produto",
    criadoEm: now,
    atualizadoEm: now,
  },

  // Items em Marketing
  {
    id: "board-campanhas",
    idClasse: "board",
    nome: "Campanhas ativas",
    idPai: "esp-marketing",
    criadoEm: now,
    atualizadoEm: now,
  },
  {
    id: "doc-briefing-junho",
    idClasse: "doc",
    nome: "Briefing campanha junho",
    idPai: "esp-marketing",
    criadoEm: now,
    atualizadoEm: now,
  },

  // Items em RH
  {
    id: "doc-onboarding",
    idClasse: "doc",
    nome: "Guia de onboarding",
    idPai: "esp-rh",
    criadoEm: now,
    atualizadoEm: now,
  },
  {
    id: "backlog-rh",
    idClasse: "backlog",
    nome: "Pipeline de contratação",
    idPai: "esp-rh",
    criadoEm: now,
    atualizadoEm: now,
  },
];

export const mockVinculos: VinculoEspaco[] = [
  { espacoId: "esp-produto", membroId: "u1", role: "owner" },
  { espacoId: "esp-produto", membroId: "u2", role: "editor" },
  { espacoId: "esp-produto", membroId: "u4", role: "editor" },
  { espacoId: "esp-marketing", membroId: "u1", role: "owner" },
  { espacoId: "esp-marketing", membroId: "u3", role: "editor" },
  { espacoId: "esp-rh", membroId: "u1", role: "owner" },
];

export function filhosDe(paiId: string | null): Entidade[] {
  return mockEntidades.filter((e) => e.idPai === paiId);
}

export function espacos(): Espaco[] {
  return mockEntidades.filter(isEspaco);
}

export function entidadeById(id: string): Entidade | null {
  return mockEntidades.find((e) => e.id === id) ?? null;
}

export function membrosDoEspaco(espacoId: string): Membro[] {
  const ids = new Set(
    mockVinculos.filter((v) => v.espacoId === espacoId).map((v) => v.membroId),
  );
  return mockMembros.filter((m) => ids.has(m.id));
}
