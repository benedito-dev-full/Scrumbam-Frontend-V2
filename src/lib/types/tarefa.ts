export type StatusTarefa =
  | "em-progresso"
  | "pendente"
  | "concluido"
  | "atrasado"
  | "bloqueado";

export type Prioridade = "baixa" | "media" | "alta" | "urgente";

export type Tarefa = {
  id: string;
  espacoId: string;
  nome: string;
  status: StatusTarefa;
  responsavelId: string | null;
  dataVencimento: string | null;
  prioridade: Prioridade | null;
  subtarefas: number;
};

export type StatusMeta = {
  label: string;
  /** classe Tailwind para o dot pequeno */
  dotClass: string;
  /** cor CSS literal para o border do círculo clicável nas linhas */
  dotColor: string;
  /** texto do pill (header de grupo + inline) */
  pillText: string;
  /** fundo do pill (header de grupo + inline) */
  pillBg: string;
  /** classes legadas usadas fora da lista (hoje, tarefas, etc.) */
  textClass: string;
  bgClass: string;
  order: number;
};

/**
 * Cores exatamente como o ClickUp:
 * em-progresso → roxo/violeta
 * pendente     → cinza
 * bloqueado    → vermelho
 * atrasado     → âmbar/laranja
 * concluido    → verde
 */
export const STATUS_META: Record<StatusTarefa, StatusMeta> = {
  "em-progresso": {
    label: "Em progresso",
    dotClass: "bg-violet-400",
    dotColor: "#a78bfa",
    pillText: "text-violet-200",
    pillBg: "bg-violet-500/25",
    textClass: "text-violet-300",
    bgClass: "bg-violet-500/20",
    order: 1,
  },
  pendente: {
    label: "Pendente",
    dotClass: "bg-zinc-400",
    dotColor: "#a1a1aa",
    pillText: "text-zinc-300",
    pillBg: "bg-zinc-500/20",
    textClass: "text-zinc-400",
    bgClass: "bg-zinc-500/15",
    order: 2,
  },
  bloqueado: {
    label: "Bloqueado",
    dotClass: "bg-red-500",
    dotColor: "#ef4444",
    pillText: "text-red-200",
    pillBg: "bg-red-500/25",
    textClass: "text-red-400",
    bgClass: "bg-red-500/20",
    order: 3,
  },
  atrasado: {
    label: "Atrasado",
    dotClass: "bg-amber-400",
    dotColor: "#fbbf24",
    pillText: "text-amber-200",
    pillBg: "bg-amber-500/25",
    textClass: "text-amber-400",
    bgClass: "bg-amber-500/20",
    order: 4,
  },
  concluido: {
    label: "Concluído",
    dotClass: "bg-emerald-500",
    dotColor: "#10b981",
    pillText: "text-emerald-200",
    pillBg: "bg-emerald-500/25",
    textClass: "text-emerald-400",
    bgClass: "bg-emerald-500/20",
    order: 5,
  },
};

export type PrioridadeMeta = {
  label: string;
  flagClass: string;
};

export const PRIORIDADE_META: Record<Prioridade, PrioridadeMeta> = {
  urgente: { label: "Urgente", flagClass: "text-red-500" },
  alta:    { label: "Alta",    flagClass: "text-amber-500" },
  media:   { label: "Média",   flagClass: "text-sky-400" },
  baixa:   { label: "Baixa",   flagClass: "text-muted-foreground" },
};
