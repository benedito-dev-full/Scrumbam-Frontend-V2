"use client";

import { use } from "react";
import { useState, useRef, useEffect } from "react";
import {
  Hash,
  Users,
  ListTodo,
  FileText,
  Video,
  Send,
  Plus,
  Smile,
  AtSign,
  Paperclip,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Labels por slug ──────────────────────────────────────────────────────────

const CHANNEL_LABELS: Record<string, string> = {
  geral: "Geral",
  welcome: "Welcome",
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = ["Canal", "Lista", "Quadro", "Calendário"] as const;
type Tab = (typeof TABS)[number];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChannelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const label = CHANNEL_LABELS[slug] ?? slug;

  const [tab, setTab] = useState<Tab>("Canal");
  const [message, setMessage] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [message]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <Hash className="size-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <button type="button" className="rounded p-1 hover:bg-muted">
            <Users className="size-4" />
          </button>
        </div>
      </header>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex h-9 shrink-0 items-center gap-px border-b border-border px-4">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "relative flex h-9 items-center gap-1.5 px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground",
              tab === t &&
                "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-t-sm after:bg-primary",
            )}
          >
            {t === "Lista" && <ListTodo className="size-3.5" />}
            {t === "Quadro" && (
              <span className="grid size-3.5 place-items-center rounded-sm bg-blue-500 text-[9px] font-bold text-white">
                Q
              </span>
            )}
            {t === "Calendário" && (
              <span className="grid size-3.5 place-items-center rounded-sm bg-orange-500 text-[9px] font-bold text-white">
                C
              </span>
            )}
            {t}
          </button>
        ))}
        <button
          type="button"
          className="flex items-center gap-1 px-3 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <Plus className="size-3" />
          Visualização
        </button>
      </div>

      {/* ── Conteúdo principal ─────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {tab === "Canal" ? (
          <>
            {/* banner superior */}
            {!dismissed && (
              <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2 text-[13px] text-muted-foreground">
                <span>
                  Favorite tarefas, adicione{" "}
                  <span className="text-primary">anotações e muito mais</span>
                </span>
                <button
                  type="button"
                  onClick={() => setDismissed(true)}
                  className="text-muted-foreground/60 hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            )}

            {/* empty state centralizado */}
            <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
              <div className="flex flex-col items-center gap-2 text-center">
                <h2 className="text-lg font-semibold text-foreground">
                  Chat in #{label}
                </h2>
                <p className="max-w-sm text-[13px] text-muted-foreground">
                  Colabore de forma integrada em tarefas e conversas. Comece a
                  conversar com sua equipe ou conecte tarefas para ficar em dia
                  com seu trabalho.
                </p>
              </div>

              {/* ações primárias */}
              <div className="flex w-full max-w-md flex-col gap-2">
                <button
                  type="button"
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <Plus className="size-4" />
                  Adicionar pessoas
                </button>
                <button
                  type="button"
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <span className="text-base">⚡</span>
                  Importar do Slack
                </button>
              </div>

              {/* cards de recursos */}
              <div className="flex w-full max-w-md flex-col gap-2">
                <ActionCard
                  icon={<ListTodo className="size-5 text-white" />}
                  iconBg="bg-violet-700"
                  title="Track Tasks"
                  description="Manage tasks, bugs, people, and more"
                />
                <ActionCard
                  icon={<FileText className="size-5 text-white" />}
                  iconBg="bg-blue-600"
                  title="Add Doc"
                  description="Take notes or create detailed documents"
                />
                <ActionCard
                  icon={<Video className="size-5 text-white" />}
                  iconBg="bg-emerald-600"
                  title="Start SyncUp"
                  description="Jump on a voice call or video call"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-[13px] text-muted-foreground">
            Visualização "{tab}" em breve.
          </div>
        )}
      </div>

      {/* ── Input de mensagem ──────────────────────────────────────────────── */}
      {tab === "Canal" && (
        <div className="shrink-0 border-t border-border bg-background p-3">
          {/* hint */}
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
            <span className="text-base">🔥</span>
            <span>
              Send a message para{" "}
              <span className="text-primary">#{label}</span> para iniciar a
              conversa.
            </span>
            <button
              type="button"
              className="ml-auto text-muted-foreground/60 hover:text-foreground"
            >
              Descartar
            </button>
          </div>

          {/* textarea */}
          <div className="rounded-xl border border-border bg-muted/20 px-3 py-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Escreva para ${label}, pressione a barra de espaço para usar a IA ou "/" para usar comandos`}
              className="w-full resize-none bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  setMessage("");
                }
              }}
            />

            {/* toolbar inferior */}
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1 text-muted-foreground">
                <ToolbarBtn icon={<Plus className="size-3.5" />} />
                <ToolbarBtn icon={<Smile className="size-3.5" />} />
                <ToolbarBtn icon={<AtSign className="size-3.5" />} />
                <ToolbarBtn icon={<Paperclip className="size-3.5" />} />
              </div>
              <button
                type="button"
                disabled={!message.trim()}
                onClick={() => setMessage("")}
                className={cn(
                  "grid size-7 place-items-center rounded-lg transition-colors",
                  message.trim()
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground/40",
                )}
              >
                <Send className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function ActionCard({
  icon,
  iconBg,
  title,
  description,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 text-left transition-colors hover:bg-muted/40"
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-lg",
          iconBg,
        )}
      >
        {icon}
      </span>
      <span className="flex flex-col">
        <span className="text-[13px] font-semibold text-foreground">{title}</span>
        <span className="text-[12px] text-muted-foreground">{description}</span>
      </span>
    </button>
  );
}

function ToolbarBtn({ icon }: { icon: React.ReactNode }) {
  return (
    <button
      type="button"
      className="grid size-6 place-items-center rounded transition-colors hover:bg-muted hover:text-foreground"
    >
      {icon}
    </button>
  );
}
