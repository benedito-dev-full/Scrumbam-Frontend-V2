import {
  Megaphone,
  TrendingUp,
  Code,
  Landmark,
  Users,
  Scale,
  Stethoscope,
  GraduationCap,
  ShoppingBag,
  Truck,
  Beef,
  Sprout,
  HardHat,
  type LucideIcon,
} from "lucide-react";

/**
 * Catálogo de templates de Espaço (fonte única).
 *
 * Cada template descreve um Espaço que já nasce com uma Lista, e nessa Lista
 * blocos com tarefas pré-criadas. Por enquanto é **dado fixo no front**, usado
 * para (1) montar a galeria e (2) a prévia read-only. A criação real virá de um
 * endpoint do backend (`POST /projects/from-template`); quando existir, este
 * conteúdo migra para o catálogo do servidor sem mudar a UI.
 *
 * NÃO há prioridade/status aqui de propósito — o backend resolve o status
 * inicial (INBOX) por projeto ao criar a task.
 */

export type TemplatePriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

/** Tarefa pré-criada de um template. */
export interface TemplateTask {
  titulo: string;
  priority?: TemplatePriority;
}

/** Bloco (agrupador) de um template, com suas tarefas. */
export interface TemplateBlock {
  nome: string;
  tasks: TemplateTask[];
}

/** Definição completa de um template de Espaço. */
export interface SpaceTemplate {
  /** Identificador estável (usado depois no endpoint do backend). */
  id: string;
  /** Nome exibido na galeria. */
  nome: string;
  /** Descrição curta na galeria. */
  descricao: string;
  /** Ícone do card. */
  icon: LucideIcon;
  /** Cor do card (hex). */
  color: string;
  /** Nome da Lista criada dentro do Espaço. */
  listName: string;
  /** Blocos da Lista (cada um com suas tarefas). */
  blocks: TemplateBlock[];
}

export const SPACE_TEMPLATES: SpaceTemplate[] = [
  {
    id: "marketing",
    nome: "Marketing",
    descricao: "Campanhas, conteúdo e calendário editorial.",
    icon: Megaphone,
    color: "#ef4444",
    listName: "Campanhas",
    blocks: [
      {
        nome: "Planejamento",
        tasks: [
          { titulo: "Definir público-alvo" },
          { titulo: "Definir orçamento da campanha" },
          { titulo: "Montar calendário editorial", priority: "HIGH" },
        ],
      },
      {
        nome: "Produção",
        tasks: [
          { titulo: "Criar peças criativas" },
          { titulo: "Redigir copy dos anúncios" },
          { titulo: "Aprovar materiais" },
        ],
      },
      {
        nome: "Veiculação & Análise",
        tasks: [
          { titulo: "Agendar publicações" },
          { titulo: "Monitorar métricas" },
          { titulo: "Relatório de resultados" },
        ],
      },
    ],
  },
  {
    id: "vendas",
    nome: "Vendas",
    descricao: "Pipeline, leads e metas comerciais.",
    icon: TrendingUp,
    color: "#10b981",
    listName: "Pipeline",
    blocks: [
      {
        nome: "Prospecção",
        tasks: [
          { titulo: "Levantar lista de leads" },
          { titulo: "Qualificar leads" },
        ],
      },
      {
        nome: "Negociação",
        tasks: [
          { titulo: "Enviar proposta", priority: "HIGH" },
          { titulo: "Follow-up com o cliente" },
          { titulo: "Negociar condições" },
        ],
      },
      {
        nome: "Fechamento",
        tasks: [
          { titulo: "Assinar contrato" },
          { titulo: "Onboarding do cliente" },
        ],
      },
    ],
  },
  {
    id: "desenvolvimento",
    nome: "Desenvolvimento",
    descricao: "Bugs, features e releases de engenharia.",
    icon: Code,
    color: "#3b82f6",
    listName: "Engenharia",
    blocks: [
      {
        nome: "Backlog",
        tasks: [
          { titulo: "Levantar requisitos" },
          { titulo: "Refinar histórias" },
        ],
      },
      {
        nome: "Em desenvolvimento",
        tasks: [
          { titulo: "Implementar feature" },
          { titulo: "Code review" },
          { titulo: "Corrigir bugs", priority: "URGENT" },
        ],
      },
      {
        nome: "Release",
        tasks: [
          { titulo: "Testes de QA" },
          { titulo: "Deploy em produção" },
          { titulo: "Documentar release" },
        ],
      },
    ],
  },
  {
    id: "financeiro",
    nome: "Financeiro",
    descricao: "Contas, fluxo de caixa e fechamento.",
    icon: Landmark,
    color: "#22c55e",
    listName: "Financeiro",
    blocks: [
      {
        nome: "Contas a pagar",
        tasks: [
          { titulo: "Lançar despesas" },
          { titulo: "Aprovar pagamentos" },
        ],
      },
      {
        nome: "Contas a receber",
        tasks: [
          { titulo: "Emitir faturas" },
          { titulo: "Cobrar inadimplentes" },
        ],
      },
      {
        nome: "Fechamento",
        tasks: [
          { titulo: "Conciliação bancária" },
          { titulo: "DRE mensal", priority: "HIGH" },
        ],
      },
    ],
  },
  {
    id: "rh",
    nome: "Recursos Humanos",
    descricao: "Vagas, onboarding e gestão de pessoas.",
    icon: Users,
    color: "#8b5cf6",
    listName: "Pessoas",
    blocks: [
      {
        nome: "Recrutamento",
        tasks: [
          { titulo: "Abrir vaga" },
          { titulo: "Triagem de currículos" },
          { titulo: "Entrevistas" },
        ],
      },
      {
        nome: "Onboarding",
        tasks: [
          { titulo: "Preparar acessos" },
          { titulo: "Treinamento inicial" },
        ],
      },
      {
        nome: "Gestão",
        tasks: [
          { titulo: "Avaliação de desempenho" },
          { titulo: "Plano de carreira" },
        ],
      },
    ],
  },
  {
    id: "juridico",
    nome: "Jurídico",
    descricao: "Contratos, processos e prazos.",
    icon: Scale,
    color: "#64748b",
    listName: "Jurídico",
    blocks: [
      {
        nome: "Contratos",
        tasks: [
          { titulo: "Revisar minuta" },
          { titulo: "Aprovar contrato" },
        ],
      },
      {
        nome: "Processos",
        tasks: [
          { titulo: "Acompanhar prazos", priority: "HIGH" },
          { titulo: "Protocolar petições" },
        ],
      },
      {
        nome: "Compliance",
        tasks: [
          { titulo: "Auditoria interna" },
          { titulo: "Atualizar políticas" },
        ],
      },
    ],
  },
  {
    id: "saude",
    nome: "Saúde",
    descricao: "Pacientes, agenda e procedimentos.",
    icon: Stethoscope,
    color: "#ec4899",
    listName: "Atendimento",
    blocks: [
      {
        nome: "Agenda",
        tasks: [
          { titulo: "Marcar consultas" },
          { titulo: "Confirmar pacientes" },
        ],
      },
      {
        nome: "Atendimento",
        tasks: [
          { titulo: "Triagem" },
          { titulo: "Registrar prontuário" },
          { titulo: "Prescrição" },
        ],
      },
      {
        nome: "Pós-atendimento",
        tasks: [
          { titulo: "Encaminhamentos" },
          { titulo: "Agendar retorno" },
        ],
      },
    ],
  },
  {
    id: "educacao",
    nome: "Educação",
    descricao: "Turmas, conteúdo e avaliações.",
    icon: GraduationCap,
    color: "#6366f1",
    listName: "Turmas",
    blocks: [
      {
        nome: "Planejamento",
        tasks: [
          { titulo: "Montar plano de aula" },
          { titulo: "Preparar material" },
        ],
      },
      {
        nome: "Aulas",
        tasks: [
          { titulo: "Ministrar aula" },
          { titulo: "Aplicar atividade" },
        ],
      },
      {
        nome: "Avaliação",
        tasks: [
          { titulo: "Corrigir provas" },
          { titulo: "Lançar notas" },
        ],
      },
    ],
  },
  {
    id: "varejo",
    nome: "Varejo / E-commerce",
    descricao: "Pedidos, estoque e atendimento.",
    icon: ShoppingBag,
    color: "#f59e0b",
    listName: "Operação",
    blocks: [
      {
        nome: "Pedidos",
        tasks: [
          { titulo: "Processar pedidos" },
          { titulo: "Emitir nota fiscal" },
        ],
      },
      {
        nome: "Estoque",
        tasks: [
          { titulo: "Repor estoque" },
          { titulo: "Inventário" },
        ],
      },
      {
        nome: "Atendimento",
        tasks: [
          { titulo: "Responder SAC" },
          { titulo: "Trocas e devoluções" },
        ],
      },
    ],
  },
  {
    id: "logistica",
    nome: "Logística",
    descricao: "Entregas, rotas e frota.",
    icon: Truck,
    color: "#0ea5e9",
    listName: "Operações",
    blocks: [
      {
        nome: "Planejamento",
        tasks: [
          { titulo: "Roteirizar entregas" },
          { titulo: "Alocar frota" },
        ],
      },
      {
        nome: "Execução",
        tasks: [
          { titulo: "Carregar veículos" },
          { titulo: "Acompanhar entregas" },
        ],
      },
      {
        nome: "Pós-entrega",
        tasks: [
          { titulo: "Confirmar recebimento" },
          { titulo: "Tratar ocorrências" },
        ],
      },
    ],
  },
  {
    id: "frigorifico",
    nome: "Frigorífico",
    descricao: "Produção, lotes e controle de qualidade.",
    icon: Beef,
    color: "#b91c1c",
    listName: "Produção",
    blocks: [
      {
        nome: "Recebimento",
        tasks: [
          { titulo: "Receber lote" },
          { titulo: "Inspeção sanitária", priority: "HIGH" },
        ],
      },
      {
        nome: "Processamento",
        tasks: [
          { titulo: "Desossa" },
          { titulo: "Embalagem" },
          { titulo: "Controle de qualidade" },
        ],
      },
      {
        nome: "Expedição",
        tasks: [
          { titulo: "Armazenar em câmara fria" },
          { titulo: "Expedir pedidos" },
        ],
      },
    ],
  },
  {
    id: "agronegocio",
    nome: "Agronegócio",
    descricao: "Safras, talhões e insumos.",
    icon: Sprout,
    color: "#84cc16",
    listName: "Safra",
    blocks: [
      {
        nome: "Preparo",
        tasks: [
          { titulo: "Análise de solo" },
          { titulo: "Preparo do talhão" },
        ],
      },
      {
        nome: "Plantio",
        tasks: [
          { titulo: "Plantar" },
          { titulo: "Adubação" },
        ],
      },
      {
        nome: "Colheita",
        tasks: [
          { titulo: "Colher" },
          { titulo: "Armazenar produção" },
          { titulo: "Vender produção" },
        ],
      },
    ],
  },
  {
    id: "construcao",
    nome: "Construção",
    descricao: "Obras, etapas e medições.",
    icon: HardHat,
    color: "#d97706",
    listName: "Obra",
    blocks: [
      {
        nome: "Planejamento",
        tasks: [
          { titulo: "Projeto executivo" },
          { titulo: "Orçamento" },
          { titulo: "Licenças e alvarás" },
        ],
      },
      {
        nome: "Execução",
        tasks: [
          { titulo: "Fundação" },
          { titulo: "Estrutura" },
          { titulo: "Acabamento" },
        ],
      },
      {
        nome: "Entrega",
        tasks: [
          { titulo: "Vistoria" },
          { titulo: "Medição final" },
          { titulo: "Entrega da obra" },
        ],
      },
    ],
  },
];

/** Busca um template pelo id. */
export function getSpaceTemplate(id: string): SpaceTemplate | undefined {
  return SPACE_TEMPLATES.find((t) => t.id === id);
}
