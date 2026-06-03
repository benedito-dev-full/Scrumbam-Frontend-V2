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
  LayoutTemplate,
  type LucideIcon,
} from "lucide-react";

/**
 * Catálogo de templates de Espaço (fonte única), em 2 níveis:
 *
 *   Categoria (nicho de mercado) → vários Templates → cada um cria um Espaço
 *   com uma Lista, blocos e tarefas pré-criados.
 *
 * Por enquanto é **dado fixo no front**, usado para montar a galeria (nível 1),
 * a lista de templates da categoria (nível 2) e a prévia read-only (nível 3).
 * A criação real virá de um endpoint do backend (`POST /projects/from-template`);
 * quando existir, este conteúdo migra para o catálogo do servidor sem mudar a UI.
 *
 * NÃO há status aqui de propósito — o backend resolve o status inicial (INBOX)
 * por projeto ao criar a task.
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

/** Um template concreto: cria 1 Lista com blocos e tarefas. */
export interface SpaceTemplate {
  /** Identificador estável (usado depois no endpoint do backend). */
  id: string;
  nome: string;
  descricao: string;
  /** Nome da Lista criada dentro do Espaço. */
  listName: string;
  /** Blocos da Lista (cada um com suas tarefas). */
  blocks: TemplateBlock[];
}

/** Categoria/nicho de mercado — agrupa vários templates. */
export interface TemplateCategory {
  id: string;
  nome: string;
  descricao: string;
  icon: LucideIcon;
  color: string;
  templates: SpaceTemplate[];
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: "marketing",
    nome: "Marketing",
    descricao: "Campanhas, lançamentos e eventos.",
    icon: Megaphone,
    color: "#ef4444",
    templates: [
      {
        id: "marketing-lancamento-classico",
        nome: "Lançamento clássico",
        descricao: "Lançamento em etapas: pré, evento e pós.",
        listName: "Lançamento",
        blocks: [
          {
            nome: "Pré-lançamento",
            tasks: [
              { titulo: "Aquecer audiência" },
              { titulo: "Criar landing page de captura" },
              { titulo: "Captar leads", priority: "HIGH" },
            ],
          },
          {
            nome: "Evento",
            tasks: [
              { titulo: "Realizar webinar/live" },
              { titulo: "Abrir carrinho" },
            ],
          },
          {
            nome: "Pós-lançamento",
            tasks: [
              { titulo: "Fechar carrinho" },
              { titulo: "Análise de resultados" },
            ],
          },
        ],
      },
      {
        id: "marketing-evento-presencial",
        nome: "Evento presencial",
        descricao: "Organização de um evento físico de ponta a ponta.",
        listName: "Evento",
        blocks: [
          {
            nome: "Planejamento",
            tasks: [
              { titulo: "Definir local e data" },
              { titulo: "Montar orçamento" },
              { titulo: "Lista de convidados" },
            ],
          },
          {
            nome: "Produção",
            tasks: [
              { titulo: "Material gráfico" },
              { titulo: "Logística e fornecedores" },
              { titulo: "Escalar equipe" },
            ],
          },
          {
            nome: "Dia do evento",
            tasks: [
              { titulo: "Check-in dos participantes" },
              { titulo: "Execução" },
              { titulo: "Follow-up pós-evento" },
            ],
          },
        ],
      },
      {
        id: "marketing-lancamento-explosivo",
        nome: "Lançamento explosivo",
        descricao: "Lançamento agressivo com tráfego pago.",
        listName: "Lançamento",
        blocks: [
          {
            nome: "Preparação",
            tasks: [
              { titulo: "Estruturar oferta" },
              { titulo: "Criar criativos" },
              { titulo: "Configurar campanhas" },
            ],
          },
          {
            nome: "Tráfego",
            tasks: [
              { titulo: "Subir anúncios", priority: "HIGH" },
              { titulo: "Otimizar campanhas" },
            ],
          },
          {
            nome: "Conversão",
            tasks: [
              { titulo: "Remarketing" },
              { titulo: "Fechamento e upsell" },
            ],
          },
        ],
      },
      {
        id: "marketing-campanha-padrao",
        nome: "Campanha padrão",
        descricao: "Uma campanha de marketing do início ao fim.",
        listName: "Campanhas",
        blocks: [
          {
            nome: "Planejamento",
            tasks: [
              { titulo: "Definir público-alvo" },
              { titulo: "Definir orçamento" },
              { titulo: "Montar calendário editorial" },
            ],
          },
          {
            nome: "Produção",
            tasks: [
              { titulo: "Criar peças criativas" },
              { titulo: "Redigir copy" },
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
    ],
  },
  {
    id: "vendas",
    nome: "Vendas",
    descricao: "Pipeline, prospecção e metas.",
    icon: TrendingUp,
    color: "#10b981",
    templates: [
      {
        id: "vendas-pipeline",
        nome: "Pipeline comercial",
        descricao: "Da prospecção ao fechamento.",
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
              { titulo: "Follow-up" },
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
        id: "vendas-prospeccao-ativa",
        nome: "Prospecção ativa",
        descricao: "Cadência de outbound e cold calls.",
        listName: "Prospecção",
        blocks: [
          {
            nome: "Lista",
            tasks: [
              { titulo: "Montar ICP" },
              { titulo: "Enriquecer contatos" },
            ],
          },
          {
            nome: "Cadência",
            tasks: [
              { titulo: "Disparar e-mails" },
              { titulo: "Cold calls" },
              { titulo: "Conexões no LinkedIn" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "desenvolvimento",
    nome: "Desenvolvimento",
    descricao: "Bugs, features e releases.",
    icon: Code,
    color: "#3b82f6",
    templates: [
      {
        id: "dev-engenharia",
        nome: "Time de engenharia",
        descricao: "Backlog, desenvolvimento e release.",
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
              { titulo: "Deploy" },
              { titulo: "Documentar release" },
            ],
          },
        ],
      },
      {
        id: "dev-bugfix",
        nome: "Correção de bugs",
        descricao: "Triagem e correção de defeitos.",
        listName: "Bugs",
        blocks: [
          {
            nome: "Triagem",
            tasks: [
              { titulo: "Reproduzir bug" },
              { titulo: "Priorizar severidade" },
            ],
          },
          {
            nome: "Correção",
            tasks: [
              { titulo: "Implementar fix" },
              { titulo: "Teste de regressão" },
            ],
          },
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
    templates: [
      {
        id: "financeiro-rotina",
        nome: "Rotina financeira",
        descricao: "Contas a pagar, receber e fechamento.",
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
        id: "financeiro-orcamento",
        nome: "Planejamento orçamentário",
        descricao: "Montagem e acompanhamento do orçamento.",
        listName: "Orçamento",
        blocks: [
          {
            nome: "Planejamento",
            tasks: [
              { titulo: "Levantar centros de custo" },
              { titulo: "Definir metas" },
            ],
          },
          {
            nome: "Acompanhamento",
            tasks: [
              { titulo: "Comparar previsto x realizado" },
              { titulo: "Revisar projeções" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "rh",
    nome: "Recursos Humanos",
    descricao: "Vagas, onboarding e pessoas.",
    icon: Users,
    color: "#8b5cf6",
    templates: [
      {
        id: "rh-recrutamento",
        nome: "Recrutamento & Seleção",
        descricao: "Da abertura da vaga à contratação.",
        listName: "Recrutamento",
        blocks: [
          {
            nome: "Abertura",
            tasks: [{ titulo: "Abrir vaga" }, { titulo: "Divulgar" }],
          },
          {
            nome: "Seleção",
            tasks: [
              { titulo: "Triagem de currículos" },
              { titulo: "Entrevistas" },
              { titulo: "Proposta" },
            ],
          },
        ],
      },
      {
        id: "rh-onboarding",
        nome: "Onboarding",
        descricao: "Integração de novos membros.",
        listName: "Onboarding",
        blocks: [
          {
            nome: "Pré-início",
            tasks: [
              { titulo: "Preparar acessos" },
              { titulo: "Kit de boas-vindas" },
            ],
          },
          {
            nome: "Primeira semana",
            tasks: [
              { titulo: "Treinamento inicial" },
              { titulo: "Apresentar time" },
            ],
          },
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
    templates: [
      {
        id: "juridico-contratos",
        nome: "Gestão de contratos",
        descricao: "Revisão e aprovação de contratos.",
        listName: "Contratos",
        blocks: [
          {
            nome: "Análise",
            tasks: [{ titulo: "Revisar minuta" }, { titulo: "Apontar riscos" }],
          },
          {
            nome: "Aprovação",
            tasks: [
              { titulo: "Aprovar contrato" },
              { titulo: "Colher assinaturas" },
            ],
          },
        ],
      },
      {
        id: "juridico-processos",
        nome: "Acompanhamento processual",
        descricao: "Prazos e andamentos de processos.",
        listName: "Processos",
        blocks: [
          {
            nome: "Prazos",
            tasks: [
              { titulo: "Acompanhar prazos", priority: "HIGH" },
              { titulo: "Protocolar petições" },
            ],
          },
          {
            nome: "Andamentos",
            tasks: [
              { titulo: "Registrar movimentações" },
              { titulo: "Reportar ao cliente" },
            ],
          },
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
    templates: [
      {
        id: "saude-clinica",
        nome: "Rotina de clínica",
        descricao: "Agenda, atendimento e retorno.",
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
        ],
      },
      {
        id: "saude-procedimentos",
        nome: "Gestão de procedimentos",
        descricao: "Agendamento e acompanhamento de procedimentos.",
        listName: "Procedimentos",
        blocks: [
          {
            nome: "Pré",
            tasks: [
              { titulo: "Avaliação pré-procedimento" },
              { titulo: "Agendar" },
            ],
          },
          {
            nome: "Pós",
            tasks: [
              { titulo: "Acompanhamento" },
              { titulo: "Agendar retorno" },
            ],
          },
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
    templates: [
      {
        id: "educacao-turma",
        nome: "Gestão de turma",
        descricao: "Planejamento, aulas e avaliação.",
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
            tasks: [{ titulo: "Corrigir provas" }, { titulo: "Lançar notas" }],
          },
        ],
      },
      {
        id: "educacao-curso-online",
        nome: "Curso online",
        descricao: "Produção e lançamento de um curso.",
        listName: "Curso",
        blocks: [
          {
            nome: "Produção",
            tasks: [
              { titulo: "Roteirizar módulos" },
              { titulo: "Gravar aulas" },
              { titulo: "Editar vídeos" },
            ],
          },
          {
            nome: "Publicação",
            tasks: [
              { titulo: "Subir na plataforma" },
              { titulo: "Divulgar turma" },
            ],
          },
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
    templates: [
      {
        id: "varejo-operacao",
        nome: "Operação da loja",
        descricao: "Pedidos, estoque e SAC.",
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
            tasks: [{ titulo: "Repor estoque" }, { titulo: "Inventário" }],
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
        id: "varejo-data-promo",
        nome: "Data promocional",
        descricao: "Black Friday, datas sazonais e promoções.",
        listName: "Promoção",
        blocks: [
          {
            nome: "Preparação",
            tasks: [
              { titulo: "Definir ofertas" },
              { titulo: "Reforçar estoque" },
              { titulo: "Preparar campanhas" },
            ],
          },
          {
            nome: "Execução",
            tasks: [
              { titulo: "Ativar promoções" },
              { titulo: "Monitorar vendas" },
            ],
          },
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
    templates: [
      {
        id: "logistica-entregas",
        nome: "Operação de entregas",
        descricao: "Do planejamento à confirmação.",
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
        id: "logistica-frota",
        nome: "Gestão de frota",
        descricao: "Manutenção e disponibilidade de veículos.",
        listName: "Frota",
        blocks: [
          {
            nome: "Manutenção",
            tasks: [
              { titulo: "Agendar revisões" },
              { titulo: "Controlar abastecimento" },
            ],
          },
          {
            nome: "Disponibilidade",
            tasks: [
              { titulo: "Acompanhar status da frota" },
              { titulo: "Registrar ocorrências" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "frigorifico",
    nome: "Frigorífico",
    descricao: "Produção, lotes e qualidade.",
    icon: Beef,
    color: "#b91c1c",
    templates: [
      {
        id: "frigorifico-producao",
        nome: "Linha de produção",
        descricao: "Recebimento, processamento e expedição.",
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
        id: "frigorifico-qualidade",
        nome: "Controle de qualidade",
        descricao: "Conformidade sanitária e rastreabilidade.",
        listName: "Qualidade",
        blocks: [
          {
            nome: "Inspeção",
            tasks: [
              { titulo: "Checklist sanitário" },
              { titulo: "Amostragem" },
            ],
          },
          {
            nome: "Rastreabilidade",
            tasks: [
              { titulo: "Registrar lotes" },
              { titulo: "Auditar não-conformidades" },
            ],
          },
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
    templates: [
      {
        id: "agro-safra",
        nome: "Ciclo de safra",
        descricao: "Do preparo do solo à colheita.",
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
            tasks: [{ titulo: "Plantar" }, { titulo: "Adubação" }],
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
        id: "agro-insumos",
        nome: "Gestão de insumos",
        descricao: "Compra e controle de insumos.",
        listName: "Insumos",
        blocks: [
          {
            nome: "Compra",
            tasks: [
              { titulo: "Cotar fornecedores" },
              { titulo: "Comprar insumos" },
            ],
          },
          {
            nome: "Controle",
            tasks: [
              { titulo: "Controlar estoque" },
              { titulo: "Registrar aplicações" },
            ],
          },
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
    templates: [
      {
        id: "construcao-obra",
        nome: "Gestão de obra",
        descricao: "Do planejamento à entrega.",
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
      {
        id: "construcao-reforma",
        nome: "Reforma",
        descricao: "Reforma de um ambiente.",
        listName: "Reforma",
        blocks: [
          {
            nome: "Preparação",
            tasks: [
              { titulo: "Orçar materiais" },
              { titulo: "Contratar equipe" },
            ],
          },
          {
            nome: "Execução",
            tasks: [
              { titulo: "Demolição" },
              { titulo: "Reconstrução" },
              { titulo: "Acabamento" },
            ],
          },
        ],
      },
    ],
  },
];

/** Busca uma categoria pelo id. */
export function getTemplateCategory(id: string): TemplateCategory | undefined {
  return TEMPLATE_CATEGORIES.find((c) => c.id === id);
}

/** Metadados visuais de uma categoria (nome, ícone, cor) para a galeria real. */
export interface CategoryMeta {
  nome: string;
  descricao: string;
  icon: LucideIcon;
  color: string;
}

/**
 * Resolve os metadados visuais de uma categoria do catálogo REAL de templates
 * (feature Templates — ADR-V2-061), a partir do `categoria` de `DProjectDto`.
 *
 * Reusa a paleta/ícones de {@link TEMPLATE_CATEGORIES} quando o id casa; cai
 * num default neutro para categorias desconhecidas (ou ausentes).
 */
export function getCategoryMeta(
  categoria: string | null | undefined,
): CategoryMeta {
  const found = categoria
    ? TEMPLATE_CATEGORIES.find((c) => c.id === categoria)
    : undefined;
  if (found) {
    return {
      nome: found.nome,
      descricao: found.descricao,
      icon: found.icon,
      color: found.color,
    };
  }
  return {
    nome: categoria || "Outros",
    descricao: "",
    icon: LayoutTemplate,
    color: "#6366f1",
  };
}
