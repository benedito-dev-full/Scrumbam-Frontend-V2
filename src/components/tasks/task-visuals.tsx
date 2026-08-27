/**
 * Vocabulario visual compartilhado das tarefas (prioridade e responsavel).
 *
 * Nasceu dentro de `kanban-board.tsx` e foi extraido quando a Lista precisou do
 * mesmo vocabulario. Ate entao o Quadro dizia prioridade com glifo + palavra e a
 * Lista dizia com uma bandeira IGUAL nas quatro prioridades (so a cor mudava);
 * o avatar era colorido por pessoa no Quadro e cinza para todos na Lista.
 * Mesmo produto, duas linguagens.
 *
 * Qualquer superficie nova que mostre prioridade ou responsavel deve consumir
 * daqui em vez de reinventar.
 */

import {
  SignalHigh,
  SignalMedium,
  SignalLow,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import { priorityToLabel } from "@/lib/mappers/task-status.mapper";

// ─── Prioridade ───────────────────────────────────────────────────────────────

/**
 * Glifo e cor de cada prioridade.
 *
 * Cor sozinha nao e decodificavel: laranja e ambar sao indistinguiveis num
 * ponto pequeno, ninguem sabe o que significam sem legenda, e daltonicos nao
 * veem diferenca nenhuma. Jira usa chevrons, Linear usa barras de sinal — a
 * informacao esta na FORMA, e a cor so reforca. URGENT usa um simbolo de alerta
 * porque e categorico, nao "mais um nivel" da escala.
 */
export const PRIORITY_GLYPH: Record<
  string,
  { Icon: LucideIcon; color: string }
> = {
  URGENT: { Icon: TriangleAlert, color: "#ef4444" },
  HIGH: { Icon: SignalHigh, color: "#f97316" },
  MEDIUM: { Icon: SignalMedium, color: "#f59e0b" },
  LOW: { Icon: SignalLow, color: "#8b8b8b" },
};

/**
 * Cor da prioridade dentro deste vocabulario.
 *
 * @param priority - Valor bruto do backend ('LOW' | 'MEDIUM' | 'HIGH' | 'URGENT').
 * @returns Cor hexadecimal; cinza quando desconhecida.
 */
export function priorityGlyphColor(priority?: string): string {
  return (priority && PRIORITY_GLYPH[priority]?.color) || "#8b8b8b";
}

/**
 * Glifo de prioridade — apenas o icone, sem rotulo.
 *
 * Componente (e nao um icone escolhido dentro do render de quem chama) para
 * nao violar a regra de "nao criar componente durante o render", que reseta
 * estado a cada renderizacao.
 *
 * @param priority - Valor bruto do backend.
 * @param size - Aresta do icone em px.
 * @param className - Classes extras (usado pelo Quadro, que e Tailwind).
 */
export function PriorityGlyph({
  priority,
  size = 12,
  className,
}: {
  priority?: string;
  size?: number;
  className?: string;
}) {
  const Icon = (priority && PRIORITY_GLYPH[priority]?.Icon) || SignalLow;
  return (
    <Icon
      size={size}
      className={className}
      color={priorityGlyphColor(priority)}
      aria-label={`Prioridade: ${priorityToLabel(priority)}`}
    />
  );
}

// ─── Responsavel ──────────────────────────────────────────────────────────────

/** Paleta dos avatares — indice derivado do nome, entao a cor e estavel. */
const AVATAR_COLORS = [
  "#e0567a",
  "#d97706",
  "#0d9488",
  "#2563eb",
  "#7c3aed",
  "#c026d3",
  "#0891b2",
  "#65a30d",
];

/**
 * Iniciais do nome para o avatar (no maximo 2 letras).
 *
 * @param nome - Nome completo do responsável.
 * @returns Iniciais em maiúsculas (ex: 'Rizar Bastos' -> 'RB').
 */
export function buildInitials(nome: string): string {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

/**
 * Cor estavel do avatar a partir do nome.
 *
 * Iniciais cinzas em circulo cinza sao indistinguiveis entre si — "EF", "CR" e
 * "RC" viram a mesma mancha. Com cor deterministica, cada pessoa ganha uma
 * identidade visual que se aprende em poucos minutos de uso.
 *
 * @param nome - Nome completo do responsável.
 * @returns Cor hexadecimal da paleta.
 */
export function avatarColor(nome: string): string {
  let hash = 0;
  for (let i = 0; i < nome.length; i++)
    hash = (hash * 31 + nome.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
