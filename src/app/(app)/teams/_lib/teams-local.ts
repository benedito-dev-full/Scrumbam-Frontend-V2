/**
 * Tipos e helpers locais (localStorage) para a pagina de Times.
 * Sem JSX — pode ser importado por Server e Client components.
 */

/* ══════════════════════════════════════════════════════════════════
   TIPOS
══════════════════════════════════════════════════════════════════ */

export interface TeamLocal {
  id: string;
  nome: string;
  memberCount: number;
  color: string;
  icon?: string;
  criadoEm: string;
  /** Papel do usuario logado no time (do TeamResponseDto.myCargo). */
  myCargo?: "LEAD" | "MEMBER" | null;
}

export interface CreateTeamPayloadLocal {
  nome: string;
  color: string;
  icon: string;
}

export interface PersonMock {
  id: string;
  nome: string;
  online: boolean;
}

export type SidebarView = "equipes" | "pessoas";

export type MembrosFilter = "1" | "2-5" | "6-20" | "20+";
export type MembershipFilter = "mine";
export type CriadoFilter = "today" | "week" | "month" | "year";
export type SortBy =
  | "nome-asc"
  | "nome-desc"
  | "criado-desc"
  | "criado-asc"
  | "members-desc"
  | "members-asc";

export type PeopleFilter = "status" | "equipe" | "tipo" | "gerente" | "classificar";

/* ══════════════════════════════════════════════════════════════════
   OPCOES DE FILTRO
══════════════════════════════════════════════════════════════════ */

export const MEMBROS_OPTIONS: { id: MembrosFilter; label: string }[] = [
  { id: "1", label: "Apenas 1 membro" },
  { id: "2-5", label: "2 a 5 membros" },
  { id: "6-20", label: "6 a 20 membros" },
  { id: "20+", label: "Mais de 20 membros" },
];

export const MEMBERSHIP_OPTIONS: { id: MembershipFilter; label: string }[] = [
  { id: "mine", label: "Sou membro" },
];

export const CRIADO_OPTIONS: { id: CriadoFilter; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "week", label: "Últimos 7 dias" },
  { id: "month", label: "Últimos 30 dias" },
  { id: "year", label: "Último ano" },
];

export const SORT_OPTIONS: { id: SortBy; label: string }[] = [
  { id: "nome-asc", label: "Nome (A → Z)" },
  { id: "nome-desc", label: "Nome (Z → A)" },
  { id: "criado-desc", label: "Mais recente primeiro" },
  { id: "criado-asc", label: "Mais antiga primeiro" },
  { id: "members-desc", label: "Mais membros primeiro" },
  { id: "members-asc", label: "Menos membros primeiro" },
];

/* ══════════════════════════════════════════════════════════════════
   HELPERS localStorage
══════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = "scrumban_teams_proto";

export function loadTeams(): TeamLocal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTeams(teams: TeamLocal[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
}

export function randomColor(): string {
  const palette = [
    "#e74c3c",
    "#e67e22",
    "#f1c40f",
    "#2ecc71",
    "#1abc9c",
    "#3498db",
    "#9b59b6",
    "#e91e63",
  ];
  return palette[Math.floor(Math.random() * palette.length)];
}

/* ══════════════════════════════════════════════════════════════════
   MATCHERS DE FILTRO
══════════════════════════════════════════════════════════════════ */

export function matchMembros(count: number, f: MembrosFilter): boolean {
  if (f === "1") return count <= 1;
  if (f === "2-5") return count >= 2 && count <= 5;
  if (f === "6-20") return count >= 6 && count <= 20;
  return count > 20;
}

export function matchCriado(criadoEm: string, f: CriadoFilter): boolean {
  const d = new Date(criadoEm).getTime();
  if (isNaN(d)) return false;
  const now = Date.now();
  const days =
    f === "today" ? 1 : f === "week" ? 7 : f === "month" ? 30 : 365;
  return now - d <= days * 24 * 60 * 60 * 1000;
}
