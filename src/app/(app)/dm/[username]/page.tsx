"use client";

import { use } from "react";
import { useState, useRef, useEffect } from "react";
import {
  Send,
  Plus,
  Smile,
  AtSign,
  Paperclip,
  Phone,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DirectMessagePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const displayName = decodeURIComponent(username);
  const isMe = true; // página "você mesmo" — sempre verdadeiro para /dm/me

  const [message, setMessage] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [message]);

  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
            {initials}
          </span>
          <span className="text-sm font-semibold text-foreground">
            {displayName}
          </span>
          {isMe && (
            <span className="text-xs text-muted-foreground">— Você</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <button type="button" className="rounded p-1.5 hover:bg-muted">
            <Phone className="size-4" />
          </button>
          <button type="button" className="rounded p-1.5 hover:bg-muted">
            <Video className="size-4" />
          </button>
        </div>
      </header>

      {/* ── Conteúdo ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {!dismissed && (
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2 text-[13px] text-muted-foreground">
            <span>
              Esta é sua área pessoal —{" "}
              <span className="text-primary">salve notas e rascunhos</span>
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

        {/* empty state */}
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
          <div className="grid size-16 place-items-center rounded-full bg-indigo-600 text-2xl font-bold text-white">
            {initials}
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-lg font-semibold text-foreground">
              {displayName}
              {isMe && (
                <span className="ml-1.5 text-base font-normal text-muted-foreground">
                  — Você
                </span>
              )}
            </h2>
            <p className="max-w-sm text-[13px] text-muted-foreground">
              {isMe
                ? "Use este espaço para guardar rascunhos, anotações e links importantes só para você."
                : `Início da sua conversa privada com ${displayName}.`}
            </p>
          </div>

          <div className="flex w-full max-w-md flex-col gap-2">
            <button
              type="button"
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Plus className="size-4" />
              {isMe ? "Adicionar anotação" : "Agendar reunião"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Input de mensagem ──────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-border bg-background p-3">
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
          <span className="text-base">📝</span>
          <span>
            {isMe
              ? "Escreva uma nota para si mesmo"
              : `Envie uma mensagem para ${displayName}`}
          </span>
          <button
            type="button"
            className="ml-auto text-muted-foreground/60 hover:text-foreground"
            onClick={() => setDismissed(true)}
          >
            Descartar
          </button>
        </div>

        <div className="rounded-xl border border-border bg-muted/20 px-3 py-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              isMe
                ? "Escreva uma nota, pressione a barra de espaço para usar a IA ou "/" para usar comandos"
                : `Escreva para ${displayName}, pressione a barra de espaço para usar a IA ou "/" para usar comandos`
            }
            className="w-full resize-none bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                setMessage("");
              }
            }}
          />

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
    </div>
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
