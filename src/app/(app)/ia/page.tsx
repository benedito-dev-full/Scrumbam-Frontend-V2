"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Plus,
  MessageSquare,
  Lightbulb,
  BarChart3,
  FileText,
  Zap,
  Bot,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Mensagem = {
  id: string;
  role: "user" | "assistant";
  conteudo: string;
};

type Sugestao = {
  icon: React.ElementType;
  titulo: string;
  descricao: string;
};

const sugestoes: Sugestao[] = [
  {
    icon: BarChart3,
    titulo: "Resumo do sprint atual",
    descricao: "Veja o progresso e gargalos do Sprint Q2 Semana 1",
  },
  {
    icon: Lightbulb,
    titulo: "Sugerir prioridades",
    descricao: "Receba sugestões de priorização das tarefas pendentes",
  },
  {
    icon: FileText,
    titulo: "Gerar release notes",
    descricao: "Crie release notes a partir das tarefas concluídas",
  },
  {
    icon: Zap,
    titulo: "Planejar próximo sprint",
    descricao: "Sugira quais tarefas entram no próximo sprint",
  },
];

const respostasIA: Record<string, string> = {
  default:
    "Olá! Sou o assistente de IA do Scrumbam. Posso te ajudar a analisar o progresso dos sprints, sugerir prioridades, gerar documentação e muito mais. Como posso te ajudar?",
  resumo:
    "📊 **Sprint Q2 — Semana 1**\n\n- **Total:** 8 tarefas\n- **Concluídas:** 2 (25%)\n- **Em progresso:** 3\n- **Bloqueadas:** 1 ⚠️\n\n**Atenção:** A tarefa *Dashboard quebra no Safari 17* está atrasada e marcada como urgente. Recomendo priorizar isso antes do fim do sprint.",
  prioridades:
    "Com base no sprint atual, sugiro a seguinte priorização:\n\n1. 🔴 **Dashboard Safari 17** — urgente, já atrasado\n2. 🟠 **Bloqueio review segurança** — está bloqueando outras tarefas\n3. 🟡 **SSO Google** — dependency para o roadmap Q3\n4. 🔵 **Migração Postgres** — pode ser movida para próximo sprint",
};

function getRespostaIA(mensagem: string): string {
  const lower = mensagem.toLowerCase();
  if (lower.includes("sprint") || lower.includes("resumo") || lower.includes("progresso")) {
    return respostasIA.resumo;
  }
  if (lower.includes("prioridade") || lower.includes("priorit")) {
    return respostasIA.prioridades;
  }
  return "Entendido! Estou analisando as informações do projeto para te dar uma resposta mais precisa. Por enquanto, recomendo verificar as tarefas em atraso no espaço Produto — elas podem estar impactando a velocidade do time.";
}

export default function IAPage() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [input, setInput] = useState("");
  const [carregando, setCarregando] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  function enviarMensagem(texto: string) {
    if (!texto.trim() || carregando) return;

    const userMsg: Mensagem = {
      id: `u${Date.now()}`,
      role: "user",
      conteudo: texto.trim(),
    };
    setMensagens((prev) => [...prev, userMsg]);
    setInput("");
    setCarregando(true);

    setTimeout(() => {
      const assistantMsg: Mensagem = {
        id: `a${Date.now()}`,
        role: "assistant",
        conteudo: getRespostaIA(texto),
      };
      setMensagens((prev) => [...prev, assistantMsg]);
      setCarregando(false);
    }, 900);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem(input);
    }
  }

  const empty = mensagens.length === 0;

  return (
    <div className="flex h-full flex-col">
      <PageHeader onNova={() => setMensagens([])} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {empty ? (
              <WelcomeScreen onSugestao={(t) => enviarMensagem(t)} />
            ) : (
              <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
                {mensagens.map((m) => (
                  <MensagemBolha key={m.id} mensagem={m} />
                ))}
                {carregando && <TypingIndicator />}
                <div ref={endRef} />
              </div>
            )}
          </div>

          <div className="border-t border-border bg-background p-4">
            <div className="mx-auto max-w-2xl">
              <div className="flex items-end gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20">
                <Sparkles className="mb-0.5 size-4 shrink-0 text-primary" />
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pergunte sobre seus projetos, sprints ou tarefas..."
                  rows={1}
                  className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => enviarMensagem(input)}
                  disabled={!input.trim() || carregando}
                  className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
                >
                  <Send className="size-3.5" />
                </button>
              </div>
              <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
                IA em modo de demonstração · Respostas são simuladas
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageHeader({ onNova }: { onNova: () => void }) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <h1 className="text-sm font-semibold text-foreground">Assistente IA</h1>
        <span className="rounded-full bg-primary/15 px-2 py-px text-[10px] font-semibold text-primary">
          Beta
        </span>
      </div>
      <Button variant="ghost" size="xs" className="gap-1.5" onClick={onNova}>
        <Plus className="size-3.5" />
        Nova conversa
      </Button>
    </header>
  );
}

function Sidebar() {
  const historico = [
    "Resumo sprint Q2",
    "Priorizar tarefas marketing",
    "Release notes maio",
  ];

  return (
    <aside className="hidden w-56 shrink-0 border-r border-border bg-sidebar md:flex md:flex-col">
      <div className="p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Histórico
        </p>
      </div>
      <div className="flex-1 space-y-px px-2">
        {historico.map((h) => (
          <button
            key={h}
            type="button"
            className="flex h-7 w-full items-center gap-2 rounded px-2 text-left text-[12px] text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground"
          >
            <MessageSquare className="size-3.5 shrink-0" />
            <span className="truncate">{h}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

function WelcomeScreen({ onSugestao }: { onSugestao: (t: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 grid size-14 place-items-center rounded-2xl bg-primary/10">
        <Sparkles className="size-7 text-primary" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">
        Como posso te ajudar hoje?
      </h2>
      <p className="mt-1.5 text-center text-sm text-muted-foreground">
        Analiso seus projetos, sprints e tarefas em tempo real.
      </p>

      <div className="mt-8 grid w-full max-w-xl gap-2 sm:grid-cols-2">
        {sugestoes.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.titulo}
              type="button"
              onClick={() => onSugestao(s.titulo)}
              className="group flex items-start gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/30"
            >
              <div className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-foreground">{s.titulo}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{s.descricao}</div>
              </div>
              <ChevronRight className="mt-1 size-3.5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MensagemBolha({ mensagem: m }: { mensagem: Mensagem }) {
  const isUser = m.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      {!isUser && (
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10">
          <Bot className="size-4 text-primary" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted text-foreground rounded-tl-sm",
        )}
      >
        <p className="whitespace-pre-wrap">{m.conteudo}</p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10">
        <Bot className="size-4 text-primary" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
