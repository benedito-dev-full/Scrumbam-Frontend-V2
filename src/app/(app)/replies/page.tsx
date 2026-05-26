"use client";

import { useState } from "react";
import { MessageSquareReply, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TabId = "nao-lida" | "lidas";

const TABS: { id: TabId; label: string }[] = [
  { id: "nao-lida", label: "Não lida" },
  { id: "lidas", label: "Lidas" },
];

export default function RepliesPage() {
  const [tab, setTab] = useState<TabId>("nao-lida");

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
        <MessageSquareReply className="size-4 text-muted-foreground" />
        <h1 className="text-sm font-semibold text-foreground">Respostas</h1>
      </header>

      <div className="flex h-10 shrink-0 items-center gap-px border-b border-border bg-background px-4">
        {TABS.map((t) => (
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

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-10">
        {tab === "nao-lida" ? (
          <EmptyState
            title="Você já se atualizou"
            subtitle="Parece que você não tem nenhuma resposta não lida"
            actionLabel="Leia respostas antigas"
            onAction={() => setTab("lidas")}
          />
        ) : (
          <EmptyState
            title="Sem respostas anteriores"
            subtitle="Quando alguém responder você em uma conversa, ela aparece aqui"
          />
        )}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

function EmptyState({ title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <RepliesIllustration />
      <div className="space-y-1.5">
        <h2 className="text-[15px] font-medium text-foreground">{title}</h2>
        <p className="max-w-xs text-[13px] leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      </div>
      {actionLabel && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAction}
          className="rounded-md border-border bg-card text-[13px] font-normal text-foreground hover:bg-muted/60"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

/**
 * Ilustração do empty state — 3 cartões de chat empilhados com um check
 * no canto, inspirada na referência do ClickUp.
 */
function RepliesIllustration() {
  return (
    <div className="relative size-[120px]">
      <Card className="absolute left-2 top-8 -rotate-[10deg]" />
      <Card className="absolute left-6 top-3 rotate-[4deg]" />
      <Card className="absolute left-12 top-10 rotate-[14deg]" />
      <div className="absolute bottom-2 right-0 grid size-7 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-sm">
        <Check className="size-3.5" strokeWidth={2.5} />
      </div>
    </div>
  );
}

function Card({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-14 w-20 flex-col justify-between rounded-md border border-border bg-card/80 p-2 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-1">
        <div className="size-2 rounded-full bg-muted-foreground/40" />
        <div className="h-1.5 flex-1 rounded-full bg-muted-foreground/25" />
      </div>
      <div className="space-y-1">
        <div className="h-1 w-3/4 rounded-full bg-muted-foreground/25" />
        <div className="h-1 w-1/2 rounded-full bg-muted-foreground/25" />
      </div>
    </div>
  );
}
