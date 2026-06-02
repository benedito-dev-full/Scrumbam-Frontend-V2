"use client";

import {
  ArrowLeft,
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
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface SpaceTemplateGalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Volta para o modal de escolha (Em branco / Template). */
  onBack?: () => void;
}

/**
 * Definição de um template de Espaço.
 *
 * Por enquanto só carrega metadados de exibição na galeria. O conteúdo real
 * (lista + blocos + tasks pré-criados) e o mecanismo de criação serão
 * definidos num passo posterior — ver `onSelect` (hoje "em breve").
 */
interface SpaceTemplate {
  id: string;
  nome: string;
  descricao: string;
  icon: LucideIcon;
  color: string;
}

// Categorias de mercado/segmento. A lista definitiva, quais ficam ativas e o
// conteúdo de cada template (lista + blocos + tasks) entram quando o mecanismo
// de criação for decidido.
const TEMPLATES: SpaceTemplate[] = [
  {
    id: "marketing",
    nome: "Marketing",
    descricao: "Campanhas, conteúdo e calendário editorial.",
    icon: Megaphone,
    color: "#ef4444",
  },
  {
    id: "vendas",
    nome: "Vendas",
    descricao: "Pipeline, leads e metas comerciais.",
    icon: TrendingUp,
    color: "#10b981",
  },
  {
    id: "desenvolvimento",
    nome: "Desenvolvimento",
    descricao: "Bugs, features e releases de engenharia.",
    icon: Code,
    color: "#3b82f6",
  },
  {
    id: "financeiro",
    nome: "Financeiro",
    descricao: "Contas, fluxo de caixa e fechamento.",
    icon: Landmark,
    color: "#22c55e",
  },
  {
    id: "rh",
    nome: "Recursos Humanos",
    descricao: "Vagas, onboarding e gestão de pessoas.",
    icon: Users,
    color: "#8b5cf6",
  },
  {
    id: "juridico",
    nome: "Jurídico",
    descricao: "Contratos, processos e prazos.",
    icon: Scale,
    color: "#64748b",
  },
  {
    id: "saude",
    nome: "Saúde",
    descricao: "Pacientes, agenda e procedimentos.",
    icon: Stethoscope,
    color: "#ec4899",
  },
  {
    id: "educacao",
    nome: "Educação",
    descricao: "Turmas, conteúdo e avaliações.",
    icon: GraduationCap,
    color: "#6366f1",
  },
  {
    id: "varejo",
    nome: "Varejo / E-commerce",
    descricao: "Pedidos, estoque e atendimento.",
    icon: ShoppingBag,
    color: "#f59e0b",
  },
  {
    id: "logistica",
    nome: "Logística",
    descricao: "Entregas, rotas e frota.",
    icon: Truck,
    color: "#0ea5e9",
  },
  {
    id: "frigorifico",
    nome: "Frigorífico",
    descricao: "Produção, lotes e controle de qualidade.",
    icon: Beef,
    color: "#b91c1c",
  },
  {
    id: "agronegocio",
    nome: "Agronegócio",
    descricao: "Safras, talhões e insumos.",
    icon: Sprout,
    color: "#84cc16",
  },
  {
    id: "construcao",
    nome: "Construção",
    descricao: "Obras, etapas e medições.",
    icon: HardHat,
    color: "#d97706",
  },
];

/**
 * Galeria de templates de Espaço.
 *
 * Mostra os templates disponíveis em cards. A criação real a partir de um
 * template ainda não está implementada (pendente da definição do mecanismo);
 * por isso a seleção exibe um aviso "em breve".
 */
export function SpaceTemplateGalleryDialog({
  open,
  onOpenChange,
  onBack,
}: SpaceTemplateGalleryDialogProps) {
  function handleSelect(template: SpaceTemplate) {
    toast("Em breve", {
      description: `A criação a partir do template "${template.nome}" estará disponível em breve.`,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 sm:max-w-[680px]">
        <div className="px-7 pt-7 pb-5">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
              {onBack && (
                <button
                  type="button"
                  aria-label="Voltar"
                  onClick={onBack}
                  className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <ArrowLeft className="size-4" />
                </button>
              )}
              Escolha um template
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Cada template cria um espaço já com uma lista, blocos e tarefas
              pré-criados.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid max-h-[55vh] grid-cols-1 gap-3 overflow-y-auto px-7 pb-7 sm:grid-cols-2">
          {TEMPLATES.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={() => handleSelect(template)}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TemplateCard({
  template,
  onSelect,
}: {
  template: SpaceTemplate;
  onSelect: () => void;
}) {
  const Icon = template.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors",
        "hover:border-primary hover:bg-accent/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <span
        className="grid size-9 shrink-0 place-items-center rounded-lg text-white"
        style={{ background: template.color }}
      >
        <Icon className="size-[18px]" />
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-sm font-semibold text-foreground">
          {template.nome}
        </span>
        <span className="text-xs leading-relaxed text-muted-foreground">
          {template.descricao}
        </span>
      </span>
      <span className="absolute right-3 top-3 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
        Em breve
      </span>
    </button>
  );
}
