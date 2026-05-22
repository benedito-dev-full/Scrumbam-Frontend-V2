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
  dotClass: string;
  textClass: string;
  bgClass: string;
  order: number;
};

/** Ordem de exibição dos grupos: progressão natural de Kanban. */
export const STATUS_META: Record<StatusTarefa, StatusMeta> = {
  "em-progresso": {
    label: "Em progresso",
    dotClass: "bg-primary",
    textClass: "text-primary",
    bgClass: "bg-primary/12",
    order: 1,
  },
  pendente: {
    label: "Pendente",
    dotClass: "bg-muted-foreground/60",
    textClass: "text-muted-foreground",
    bgClass: "bg-muted",
    order: 2,
  },
  bloqueado: {
    label: "Bloqueado",
    dotClass: "bg-red-500",
    textClass: "text-red-400",
    bgClass: "bg-red-500/12",
    order: 3,
  },
  atrasado: {
    label: "Atrasado",
    dotClass: "bg-amber-500",
    textClass: "text-amber-400",
    bgClass: "bg-amber-500/12",
    order: 4,
  },
  concluido: {
    label: "Concluído",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-400",
    bgClass: "bg-emerald-500/12",
    order: 5,
  },
};

export type PrioridadeMeta = {
  label: string;
  flagClass: string;
};

export const PRIORIDADE_META: Record<Prioridade, PrioridadeMeta> = {
  urgente: { label: "Urgente", flagClass: "text-red-500" },
  alta: { label: "Alta", flagClass: "text-amber-500" },
  media: { label: "Média", flagClass: "text-sky-500" },
  baixa: { label: "Baixa", flagClass: "text-muted-foreground" },
};
