import type { StatusTarefa, Tarefa } from "@/lib/types/tarefa";
import { STATUS_META } from "@/lib/types/tarefa";

const today = "2026-05-22";

export const mockTarefas: Tarefa[] = [
  // ===== Produto =====
  {
    id: "t-001",
    espacoId: "esp-produto",
    nome: "Refatorar módulo de autenticação",
    status: "em-progresso",
    responsavelId: "u1",
    dataVencimento: "2026-05-28",
    prioridade: "alta",
    subtarefas: 3,
  },
  {
    id: "t-002",
    espacoId: "esp-produto",
    nome: "Implementar SSO via Google",
    status: "em-progresso",
    responsavelId: "u2",
    dataVencimento: "2026-06-05",
    prioridade: "media",
    subtarefas: 2,
  },
  {
    id: "t-003",
    espacoId: "esp-produto",
    nome: "Migração para Postgres 16",
    status: "em-progresso",
    responsavelId: "u4",
    dataVencimento: "2026-06-12",
    prioridade: "alta",
    subtarefas: 1,
  },
  {
    id: "t-004",
    espacoId: "esp-produto",
    nome: "Spike: avaliar BullMQ vs RabbitMQ",
    status: "pendente",
    responsavelId: "u1",
    dataVencimento: null,
    prioridade: "baixa",
    subtarefas: 0,
  },
  {
    id: "t-005",
    espacoId: "esp-produto",
    nome: "Revisar contrato de API v2",
    status: "pendente",
    responsavelId: "u2",
    dataVencimento: "2026-06-01",
    prioridade: "media",
    subtarefas: 0,
  },
  {
    id: "t-006",
    espacoId: "esp-produto",
    nome: "Dashboard quebra no Safari 17",
    status: "atrasado",
    responsavelId: "u1",
    dataVencimento: "2026-05-18",
    prioridade: "urgente",
    subtarefas: 0,
  },
  {
    id: "t-007",
    espacoId: "esp-produto",
    nome: "Bloqueio: aguardando review de segurança",
    status: "bloqueado",
    responsavelId: "u2",
    dataVencimento: "2026-05-25",
    prioridade: "alta",
    subtarefas: 0,
  },
  {
    id: "t-008",
    espacoId: "esp-produto",
    nome: "Release notes do Q2",
    status: "concluido",
    responsavelId: "u2",
    dataVencimento: "2026-05-15",
    prioridade: "media",
    subtarefas: 0,
  },

  // ===== Marketing =====
  {
    id: "t-101",
    espacoId: "esp-marketing",
    nome: "Briefing campanha de junho",
    status: "em-progresso",
    responsavelId: "u3",
    dataVencimento: "2026-05-27",
    prioridade: "alta",
    subtarefas: 4,
  },
  {
    id: "t-102",
    espacoId: "esp-marketing",
    nome: "Aprovar artes do Instagram",
    status: "em-progresso",
    responsavelId: "u1",
    dataVencimento: "2026-05-24",
    prioridade: "media",
    subtarefas: 0,
  },
  {
    id: "t-103",
    espacoId: "esp-marketing",
    nome: "Conteúdo blog: case Fortalshop",
    status: "em-progresso",
    responsavelId: "u3",
    dataVencimento: "2026-06-03",
    prioridade: "media",
    subtarefas: 2,
  },
  {
    id: "t-104",
    espacoId: "esp-marketing",
    nome: "SEO da landing /precos",
    status: "pendente",
    responsavelId: "u1",
    dataVencimento: "2026-06-10",
    prioridade: "alta",
    subtarefas: 0,
  },
  {
    id: "t-105",
    espacoId: "esp-marketing",
    nome: "Webinar parceria Devari",
    status: "pendente",
    responsavelId: "u3",
    dataVencimento: "2026-06-20",
    prioridade: "media",
    subtarefas: 0,
  },
  {
    id: "t-106",
    espacoId: "esp-marketing",
    nome: "Análise pós-evento de maio",
    status: "concluido",
    responsavelId: "u3",
    dataVencimento: "2026-05-19",
    prioridade: "baixa",
    subtarefas: 0,
  },

  // ===== RH =====
  {
    id: "t-201",
    espacoId: "esp-rh",
    nome: "Onboarding do novo dev backend",
    status: "em-progresso",
    responsavelId: "u1",
    dataVencimento: "2026-05-26",
    prioridade: "alta",
    subtarefas: 3,
  },
  {
    id: "t-202",
    espacoId: "esp-rh",
    nome: "Atualizar política de férias",
    status: "em-progresso",
    responsavelId: "u1",
    dataVencimento: "2026-06-08",
    prioridade: "baixa",
    subtarefas: 0,
  },
  {
    id: "t-203",
    espacoId: "esp-rh",
    nome: "Revisar plano de carreira de QA",
    status: "pendente",
    responsavelId: "u1",
    dataVencimento: null,
    prioridade: "media",
    subtarefas: 0,
  },
  {
    id: "t-204",
    espacoId: "esp-rh",
    nome: "Pesquisa de clima Q2",
    status: "concluido",
    responsavelId: "u1",
    dataVencimento: "2026-05-10",
    prioridade: "media",
    subtarefas: 0,
  },
];

export function tarefasPorEspaco(espacoId: string): Tarefa[] {
  return mockTarefas.filter((t) => t.espacoId === espacoId);
}

export function agruparPorStatus(
  tarefas: Tarefa[],
): { status: StatusTarefa; tarefas: Tarefa[] }[] {
  const map = new Map<StatusTarefa, Tarefa[]>();
  for (const t of tarefas) {
    const arr = map.get(t.status) ?? [];
    arr.push(t);
    map.set(t.status, arr);
  }
  return Array.from(map.entries())
    .map(([status, lista]) => ({ status, tarefas: lista }))
    .sort((a, b) => STATUS_META[a.status].order - STATUS_META[b.status].order);
}

export function diasUntil(iso: string | null): number | null {
  if (!iso) return null;
  const a = new Date(iso + "T00:00:00.000Z");
  const b = new Date(today + "T00:00:00.000Z");
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}
