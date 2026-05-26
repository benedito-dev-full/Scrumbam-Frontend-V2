"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Settings2, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  resolveNotificationTarget,
  useDeleteNotification,
  useMarkAllAsRead,
  useMarkAsRead,
  useNotifications,
  useUnreadCount,
  type NotificationFilter,
} from "@/hooks/use-notifications";
import type { NotificationDto } from "@/lib/types/api";

type TabId = NotificationFilter;

const TAB_DEFS: { id: TabId; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "unread", label: "Não lidas" },
  { id: "mentions", label: "Menções" },
  { id: "assignments", label: "Atribuições" },
];

export default function InboxPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("all");

  // Carrega "todas" uma única vez e filtra client-side para cada aba. A
  // contagem de não lidas vem do endpoint dedicado `/notifications/unread-count`
  // (já pollado pelo sino), com fallback para `all.filter(!n.read)`.
  const allQuery = useNotifications("all");
  const unreadCountQuery = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const all = useMemo(() => allQuery.data ?? [], [allQuery.data]);
  const unreadCount =
    unreadCountQuery.data?.count ?? all.filter((n) => !n.read).length;

  const counts: Record<TabId, number | undefined> = {
    all: all.length,
    unread: unreadCount,
    mentions: all.filter((n) =>
      (n.eventType ?? "").toLowerCase().includes("mention"),
    ).length,
    assignments: all.filter((n) =>
      (n.eventType ?? "").toLowerCase().includes("assign"),
    ).length,
  };

  const visible: NotificationDto[] = useMemo(() => {
    if (tab === "all") return all;
    if (tab === "unread") return all.filter((n) => !n.read);
    if (tab === "mentions")
      return all.filter((n) =>
        (n.eventType ?? "").toLowerCase().includes("mention"),
      );
    return all.filter((n) =>
      (n.eventType ?? "").toLowerCase().includes("assign"),
    );
  }, [all, tab]);

  function handleRowClick(n: NotificationDto) {
    const target = resolveNotificationTarget(n);
    if (!n.read) markAsRead.mutate(n.id);
    // Fallback consistente com o popover do sino: quando não há rota
    // representativa (target === null), permanece em /inbox.
    router.push(target ?? "/inbox");
  }

  return (
    <>
      <PageHeader
        onMarcarTodas={() => markAllAsRead.mutate()}
        marcarPending={markAllAsRead.isPending}
      />

      <div className="flex h-10 items-center gap-px border-b border-border bg-background px-4">
        {TAB_DEFS.map((t) => {
          const count = counts[t.id];
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "relative flex h-10 items-center gap-1.5 px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground",
                active &&
                  "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-t-sm after:bg-primary",
              )}
            >
              {t.label}
              {count != null && count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-px text-[10px] font-semibold leading-none",
                    active
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 py-4">
        {allQuery.isLoading ? (
          <LoadingState />
        ) : allQuery.isError ? (
          <ErrorState />
        ) : visible.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            {visible.map((n, i) => (
              <NotificacaoRow
                key={n.id}
                notificacao={n}
                isLast={i === visible.length - 1}
                onClick={() => handleRowClick(n)}
                onMarcarLida={() => markAsRead.mutate(n.id)}
                onDeletar={() => deleteNotification.mutate(n.id)}
                deletingPending={
                  deleteNotification.isPending &&
                  deleteNotification.variables === n.id
                }
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function PageHeader({
  onMarcarTodas,
  marcarPending,
}: {
  onMarcarTodas: () => void;
  marcarPending: boolean;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        <Bell className="size-4 text-muted-foreground" />
        <h1 className="text-sm font-semibold text-foreground">
          Caixa de entrada
        </h1>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="xs"
          className="gap-1.5"
          onClick={onMarcarTodas}
          disabled={marcarPending}
        >
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
  onClick,
  onMarcarLida,
  onDeletar,
  deletingPending,
}: {
  notificacao: NotificationDto;
  isLast: boolean;
  onClick: () => void;
  onMarcarLida: () => void;
  onDeletar: () => void;
  deletingPending: boolean;
}) {
  const initials = getInitials(n.title || n.message);

  return (
    <div
      className={cn(
        "group flex w-full items-start gap-3 bg-card px-4 py-3 transition-colors hover:bg-muted/40",
        !isLast && "border-b border-border",
        !n.read && "bg-primary/[0.03]",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex flex-1 items-start gap-3 text-left"
      >
        <div className="relative mt-0.5 shrink-0">
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-foreground">
            <span className="font-medium">{n.title || "Notificação"}</span>
          </p>
          <p className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">
            {n.message}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {n.eventType && <span>{n.eventType}</span>}
            {n.eventType && <span>·</span>}
            <span>{formatRelative(n.createdAt)}</span>
          </div>
        </div>
        {!n.read && (
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
        )}
      </button>

      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        {!n.read && (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Marcar como lida"
            onClick={onMarcarLida}
          >
            <Check className="size-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Excluir notificação"
          onClick={onDeletar}
          disabled={deletingPending}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
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

function LoadingState() {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed border-border p-14 text-center text-xs text-muted-foreground">
      Carregando notificações...
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed border-destructive/40 p-14 text-center text-xs text-destructive">
      Não foi possível carregar as notificações.
    </div>
  );
}

function getInitials(text: string): string {
  const cleaned = text.trim().replace(/[^a-zA-Z\s]/g, "");
  if (!cleaned) return "??";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return "agora";
  if (diffSec < 3600) return `há ${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) return `há ${Math.floor(diffSec / 3600)} h`;
  if (diffSec < 172800) return "ontem";
  const days = Math.floor(diffSec / 86400);
  if (days < 7) return `há ${days} dias`;
  return new Date(iso).toLocaleDateString("pt-BR");
}
