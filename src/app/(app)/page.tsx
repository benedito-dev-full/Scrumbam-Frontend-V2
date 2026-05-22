import {
  Clock,
  FileText,
  Star,
  Folder,
  ArrowUpRight,
  MoreHorizontal,
  ListTodo,
  Map,
  BarChart3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ViewSwitcher } from "@/components/shell/view-switcher";
import { ViewToolbar } from "@/components/shell/view-toolbar";

type RowItem = {
  title: string;
  hint: string;
  icon: LucideIcon;
};

const recents: RowItem[] = [
  { title: "Sprint Q2 — semana 1", hint: "em Produto", icon: ListTodo },
  { title: "Roadmap 2026", hint: "em Produto", icon: Map },
  { title: "Briefing campanha junho", hint: "em Marketing", icon: FileText },
  { title: "Pipeline comercial", hint: "em Vendas", icon: BarChart3 },
];

const docs: RowItem[] = [
  { title: "Runbook on-call", hint: "em Engenharia", icon: FileText },
  { title: "Changelog Q2", hint: "em Produto", icon: FileText },
  { title: "Guia de onboarding", hint: "em RH", icon: FileText },
];

const favorites: RowItem[] = [
  { title: "Website 2026", hint: "Projeto", icon: Folder },
  { title: "Onboarding novos clientes", hint: "Projeto", icon: Folder },
];

const folders = [
  { name: "Projetos", count: 12 },
  { name: "Documentos", count: 34 },
  { name: "Modelos", count: 6 },
  { name: "Arquivados", count: 2 },
];

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: LucideIcon;
  title: string;
}) {
  return (
    <header className="flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
        <Icon className="size-[15px] text-muted-foreground" />
        {title}
      </h2>
      <button
        type="button"
        aria-label="Mais ações"
        className="grid size-6 place-items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <MoreHorizontal className="size-3.5" />
      </button>
    </header>
  );
}

function RowList({ items }: { items: RowItem[] }) {
  return (
    <ul className="mt-2 space-y-px">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.title}>
            <button
              type="button"
              className="group flex h-7 w-full items-center gap-2 rounded px-1.5 text-left transition-colors hover:bg-muted/60"
            >
              <Icon className="size-[14px] shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
              <span className="flex-1 truncate text-[13px] text-foreground">
                {item.title}
              </span>
              <span className="truncate text-[11px] text-muted-foreground">
                {item.hint}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function BentoCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 text-card-foreground">
      {children}
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <ViewSwitcher defaultValue="overview" />
      <ViewToolbar />

      <div className="mx-auto w-full max-w-[1400px] space-y-4 p-4 md:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <BentoCard>
            <SectionHeader icon={Clock} title="Recentes" />
            <RowList items={recents} />
          </BentoCard>
          <BentoCard>
            <SectionHeader icon={FileText} title="Documentos" />
            <RowList items={docs} />
          </BentoCard>
          <BentoCard>
            <SectionHeader icon={Star} title="Favoritos" />
            <RowList items={favorites} />
          </BentoCard>
        </div>

        <BentoCard>
          <SectionHeader icon={Folder} title="Pastas" />
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {folders.map((folder) => (
              <button
                key={folder.name}
                type="button"
                className="group flex items-center gap-3 rounded-md border border-border bg-background p-2.5 text-left transition-colors hover:border-primary/40 hover:bg-muted/40"
              >
                <div className="grid size-8 place-items-center rounded bg-muted text-muted-foreground transition-colors group-hover:bg-primary/15 group-hover:text-primary">
                  <Folder className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-foreground">
                    {folder.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {folder.count} itens
                  </div>
                </div>
                <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </BentoCard>
      </div>
    </>
  );
}
