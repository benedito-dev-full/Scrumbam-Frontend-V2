"use client";

import { useState } from "react";
import {
  FileText,
  Plus,
  Search,
  MoreHorizontal,
  Star,
  Clock,
  Lock,
  Globe,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpaceChip } from "@/components/shell/space-chip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { mockEntidades } from "@/lib/mocks/entidades";
import { isEspaco } from "@/lib/types/entidade";

type TabId = "todos" | "recentes" | "favoritos" | "meus";

const tabs: { id: TabId; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "recentes", label: "Recentes" },
  { id: "favoritos", label: "Favoritos" },
  { id: "meus", label: "Criados por mim" },
];

type Doc = {
  id: string;
  titulo: string;
  espacoId: string;
  autor: string;
  autorIniciais: string;
  editadoEm: string;
  favorito: boolean;
  privado: boolean;
  tags: string[];
};

const mockDocs: Doc[] = [
  {
    id: "doc-roadmap",
    titulo: "Roadmap 2026",
    espacoId: "esp-produto",
    autor: "Robério",
    autorIniciais: "RB",
    editadoEm: "hoje",
    favorito: true,
    privado: false,
    tags: ["estratégia", "produto"],
  },
  {
    id: "doc-changelog",
    titulo: "Changelog Q2",
    espacoId: "esp-produto",
    autor: "Ana Costa",
    autorIniciais: "AC",
    editadoEm: "ontem",
    favorito: false,
    privado: false,
    tags: ["releases"],
  },
  {
    id: "doc-arquitetura",
    titulo: "Decisões de arquitetura",
    espacoId: "esp-produto",
    autor: "Ana Costa",
    autorIniciais: "AC",
    editadoEm: "há 3 dias",
    favorito: true,
    privado: false,
    tags: ["engenharia", "arquitetura"],
  },
  {
    id: "doc-briefing-junho",
    titulo: "Briefing campanha junho",
    espacoId: "esp-marketing",
    autor: "Pedro Silva",
    autorIniciais: "PS",
    editadoEm: "há 2 dias",
    favorito: false,
    privado: false,
    tags: ["marketing", "campanha"],
  },
  {
    id: "doc-onboarding",
    titulo: "Guia de onboarding",
    espacoId: "esp-rh",
    autor: "Robério",
    autorIniciais: "RB",
    editadoEm: "há 1 semana",
    favorito: false,
    privado: true,
    tags: ["rh", "onboarding"],
  },
  {
    id: "doc-runbook",
    titulo: "Runbook on-call",
    espacoId: "esp-produto",
    autor: "Júlia Mendes",
    autorIniciais: "JM",
    editadoEm: "há 1 semana",
    favorito: false,
    privado: false,
    tags: ["engenharia", "operações"],
  },
];

function getEspaco(id: string) {
  return mockEntidades.find((e) => isEspaco(e) && e.id === id) ?? null;
}

export default function DocsPage() {
  const [tab, setTab] = useState<TabId>("todos");
  const [busca, setBusca] = useState("");

  const filtradosPorTab = mockDocs.filter((d) => {
    if (tab === "recentes") return ["hoje", "ontem", "há 2 dias", "há 3 dias"].includes(d.editadoEm);
    if (tab === "favoritos") return d.favorito;
    if (tab === "meus") return d.autorIniciais === "RB";
    return true;
  });

  const docs = busca
    ? filtradosPorTab.filter((d) =>
        d.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        d.tags.some((t) => t.includes(busca.toLowerCase())),
      )
    : filtradosPorTab;

  return (
    <>
      <PageHeader busca={busca} onBusca={setBusca} />

      <div className="flex h-10 items-center gap-px border-b border-border bg-background px-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "relative flex h-10 items-center gap-1.5 px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground",
              tab === t.id &&
                "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-t-sm after:bg-primary",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-5">
        {docs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="grid grid-cols-[minmax(0,1fr)_140px_140px_120px_40px] items-center bg-muted/30 px-4 text-[11px] uppercase tracking-wider text-muted-foreground">
              <div className="py-2.5">Título</div>
              <div className="py-2.5">Espaço</div>
              <div className="py-2.5">Autor</div>
              <div className="py-2.5">Editado</div>
              <div />
            </div>
            {docs.map((doc, i) => (
              <DocRow key={doc.id} doc={doc} isLast={i === docs.length - 1} />
            ))}
          </div>
        )}

        <button
          type="button"
          className="mt-4 inline-flex h-8 items-center gap-2 rounded-md border border-dashed border-border px-3 text-[13px] text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground"
        >
          <Plus className="size-3.5" />
          Novo documento
        </button>
      </div>
    </>
  );
}

function PageHeader({
  busca,
  onBusca,
}: {
  busca: string;
  onBusca: (v: string) => void;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        <BookOpen className="size-4 text-muted-foreground" />
        <h1 className="text-sm font-semibold text-foreground">Documentos</h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar documento..."
            value={busca}
            onChange={(e) => onBusca(e.target.value)}
            className="h-7 w-52 rounded-md border border-border bg-muted/40 pl-8 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-3.5" />
          Novo doc
        </Button>
      </div>
    </header>
  );
}

function DocRow({ doc, isLast }: { doc: Doc; isLast: boolean }) {
  const espaco = getEspaco(doc.espacoId);

  return (
    <button
      type="button"
      className={cn(
        "group grid w-full grid-cols-[minmax(0,1fr)_140px_140px_120px_40px] items-center bg-card px-4 text-left transition-colors hover:bg-muted/30",
        !isLast && "border-b border-border",
      )}
    >
      <div className="flex h-12 items-center gap-2.5 min-w-0">
        <FileText className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate text-[13px] font-medium text-foreground">{doc.titulo}</span>
        {doc.privado ? (
          <Lock className="size-3 shrink-0 text-muted-foreground/60" />
        ) : (
          <Globe className="size-3 shrink-0 text-muted-foreground/30 opacity-0 group-hover:opacity-100" />
        )}
        {doc.favorito && (
          <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" />
        )}
      </div>

      <div className="flex h-12 items-center gap-2">
        {espaco && isEspaco(espaco) && (
          <>
            <SpaceChip
              iniciais={espaco.meta.iniciais}
              cor={espaco.meta.cor}
              iconName={espaco.meta.iconName}
              size="xs"
            />
            <span className="text-[12px] text-muted-foreground">{espaco.nome}</span>
          </>
        )}
      </div>

      <div className="flex h-12 items-center gap-2">
        <Avatar size="sm">
          <AvatarFallback>{doc.autorIniciais}</AvatarFallback>
        </Avatar>
        <span className="text-[12px] text-muted-foreground">{doc.autor}</span>
      </div>

      <div className="flex h-12 items-center gap-1 text-[12px] text-muted-foreground">
        <Clock className="size-3" />
        {doc.editadoEm}
      </div>

      <div className="grid h-12 place-items-center">
        <button
          type="button"
          aria-label="Mais ações"
          onClick={(e) => e.stopPropagation()}
          className="grid size-6 place-items-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
        >
          <MoreHorizontal className="size-3.5" />
        </button>
      </div>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-14 text-center">
      <div className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
        <FileText className="size-5" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-foreground">Nenhum documento encontrado</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Crie um documento para começar.
        </p>
      </div>
      <Button size="sm" className="mt-1 gap-1.5">
        <Plus className="size-3.5" />
        Novo documento
      </Button>
    </div>
  );
}
