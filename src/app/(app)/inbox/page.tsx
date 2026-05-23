"use client";

import { useState } from "react";
import {
  Bell,
  AtSign,
  GitPullRequest,
  CheckCircle2,
  MessageSquare,
  GitFork,
  Star,
  UserPlus,
  Settings2,
  Check,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TabId = "todas" | "nao-lidas" | "mencoes" | "atribuicoes";

const tabs: { id: TabId; label: string; count?: number }[] = [
  { id: "todas", label: "Todas", count: 8 },
  { id: "nao-lidas", label: "Não lidas", count: 3 },
  { id: "mencoes", label: "Menções", count: 2 },
  { id: "atribuicoes", label: "Atribuições" },
];

type NotificacaoTipo =
  | "comentario"
  | "mencao"
  | "atribuicao"
  | "status"
  | "convite"
  | "aprovacao";

type Notificacao = {
  id: string;
  tipo: NotificacaoTipo;
  lida: boolean;
  autor: { nome: string; iniciais: string };
  mensagem: string;
  alvo: string;
  espaco: string;
  tempo: string;
};

const mockNotificacoes: Notificacao[] = [
  {
    id: "n1",
    tipo: "mencao",
    lida: false,
    autor: { nome: "Ana Costa", iniciais: "AC" },
    mensagem: "mencionou você em",
    alvo: "Refatorar módulo de autenticação",
    espaco: "Produto",
    tempo: "há 5 min",
  },
  {
    id: "n2",
    tipo: "comentario",
    lida: false,
    autor: { nome: "Pedro Silva", iniciais: "PS" },
    mensagem: "comentou em",
    alvo: "Briefing campanha de junho",
    espaco: "Marketing",
    tempo: "há 23 min",
  },
  {
    id: "n3",
    tipo: "atribuicao",
    lida: false,
    autor: { nome: "Júlia Mendes", iniciais: "JM" },
    mensagem: "atribuiu a você",
    alvo: "Migração para Postgres 16",
    espaco: "Produto",
    tempo: "há 1h",
  },
  {
    id: "n4",
    tipo: "status",
    lida: true,
    autor: { nome: "Ana Costa", iniciais: "AC" },
    mensagem: "marcou como concluído",
    alvo: "Release notes do Q2",
    espaco: "Produto",
    tempo: "há 2h",
  },
  {
    id: "n5",
    tipo: "comentario",
    lida: true,
    autor: { nome: "Pedro Silva", iniciais: "PS" },
    mensagem: "comentou em",
    alvo: "SEO da landing /precos",
    espaco: "Marketing",
    tempo: "há 3h",
  },
  {
    id: "n6",
    tipo: "mencao",
    lida: true,
    autor: { nome: "Júlia Mendes", iniciais: "JM" },
    mensagem: "mencionou você em",
    alvo: "Onboarding do novo dev backend",
    espaco: "RH",
    tempo: "ontem",
  },
  {
    id: "n7",
    tipo: "aprovacao",
    lida: true,
    autor: { nome: "Ana Costa", iniciais: "AC" },
    mensagem: "aprovou sua solicitação em",
    alvo: "Roadmap 2026",
    espaco: "Produto",
    tempo: "ontem",
  },
  {
    id: "n8",
    tipo: "convite",
    lida: true,
    autor: { nome: "Robério", iniciais: "RB" },
    mensagem: "convidou você para o espaço",
    alvo: "Marketing",
    espaco: "Marketing",
    tempo: "há 2 dias",
  },
];

const tipoIcon: Record<NotificacaoTipo, React.ElementType> = {
  comentario: MessageSquare,
  mencao: AtSign,
  atribuicao: GitFork,
  status: CheckCircle2,
  convite: UserPlus,
  aprovacao: GitPullRequest,
};

const tipoColor: Record<NotificacaoTipo, string> = {
  comentario: "bg-sky-500/15 text-sky-400",
  mencao: "bg-violet-500/15 text-violet-400",
  atribuicao: "bg-primary/15 text-primary",
  status: "bg-emerald-500/15 text-emerald-400",
  convite: "bg-amber-500/15 text-amber-400",
  aprovacao: "bg-emerald-500/15 text-emerald-400",
};

export default function InboxPage() {
  const [tab, setTab] = useState<TabId>("todas");
  const [notificacoes, setNotificacoes] = useState(mockNotificacoes);

  const filtradas = notificacoes.filter((n) => {
    if (tab === "nao-lidas") return !n.lida;
    if (tab === "mencoes") return n.tipo === "mencao";
    if (tab === "atribuicoes") return n.tipo === "atribuicao";
    return true;
  });

  function marcarLida(id: string) {
    setNotificacoes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n)),
    );
  }

  function marcarTodasLidas() {
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
  }

  return (
    <>
      <PageHeader onMarcarTodas={marcarTodasLidas} />

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
            {t.count != null && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-px text-[10px] font-semibold leading-none",
                  tab === t.id
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 py-4">
        {filtradas.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            {filtradas.map((n, i) => (
              <NotificacaoRow
                key={n.id}
                notificacao={n}
                isLast={i === filtradas.length - 1}
                onMarcarLida={() => marcarLida(n.id)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function PageHeader({ onMarcarTodas }: { onMarcarTodas: () => void }) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        <Bell className="size-4 text-muted-foreground" />
        <h1 className="text-sm font-semibold text-foreground">Caixa de entrada</h1>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="xs" className="gap-1.5" onClick={onMarcarTodas}>
          <Check className="size-3.5" />
          Marcar tudo como lido
        </Button>
        <Button variant="ghost" size="icon-xs">
          <Settings2 className="size-3.5" />
        </Button>
      </div>
    </header>
  );
}

function NotificacaoRow({
  notificacao: n,
  isLast,
  onMarcarLida,
}: {
  notificacao: Notificacao;
  isLast: boolean;
  onMarcarLida: () => void;
}) {
  const TipoIcon = tipoIcon[n.tipo];
  const colorClass = tipoColor[n.tipo];

  return (
    <button
      type="button"
      onClick={onMarcarLida}
      className={cn(
        "group flex w-full items-start gap-3 bg-card px-4 py-3 text-left transition-colors hover:bg-muted/40",
        !isLast && "border-b border-border",
        !n.lida && "bg-primary/[0.03]",
      )}
    >
      <div className="relative mt-0.5 shrink-0">
        <Avatar>
          <AvatarFallback>{n.autor.iniciais}</AvatarFallback>
        </Avatar>
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full",
            colorClass,
          )}
        >
          <TipoIcon className="size-2.5" strokeWidth={2} />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-foreground">
          <span className="font-medium">{n.autor.nome}</span>{" "}
          <span className="text-muted-foreground">{n.mensagem}</span>{" "}
          <span className="font-medium">{n.alvo}</span>
        </p>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Star className="size-3" />
          <span>{n.espaco}</span>
          <span>·</span>
          <span>{n.tempo}</span>
        </div>
      </div>

      {!n.lida && (
        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
      )}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-14 text-center">
      <div className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
        <Bell className="size-5" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-foreground">Tudo em dia</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Nenhuma notificação nesta categoria.
        </p>
      </div>
    </div>
  );
}
