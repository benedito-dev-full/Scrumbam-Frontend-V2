"use client";

import { useRouter } from "next/navigation";
import { Bell, Check } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  resolveNotificationTarget,
  useMarkAllAsRead,
  useMarkAsRead,
  useNotifications,
  useUnreadCount,
} from "@/hooks/use-notifications";
import type { NotificationDto } from "@/lib/types/api";

/* ─── Popover do sino — padrão Linear/ClickUp/GitHub ───────────────────────
 * Mostra as 5 últimas notificações não lidas + link "Ver todas".
 * Badge vermelho sobreposto ao ícone do sino quando há não lidas.
 * Click numa linha → navega para target + marca como lida em paralelo.
 */

const MAX_PREVIEW = 5;

export function NotificationsPopover() {
  const router = useRouter();
  const unreadCountQuery = useUnreadCount();
  const notificationsQuery = useNotifications("unread");
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const unreadCount = unreadCountQuery.data?.count ?? 0;
  const preview = (notificationsQuery.data ?? []).slice(0, MAX_PREVIEW);
  const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  function handleClickItem(n: NotificationDto) {
    const target = resolveNotificationTarget(n);
    if (!n.read) markAsRead.mutate(n.id);
    router.push(target ?? "/inbox");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={
              unreadCount > 0
                ? `Notificações (${unreadCount} não lidas)`
                : "Notificações"
            }
            style={{
              position: "relative",
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
              background: "none",
              border: 0,
              cursor: "pointer",
              color: "var(--muted-foreground)",
              transition: "background .12s, color .12s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--accent)";
              e.currentTarget.style.color = "var(--foreground)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.color = "var(--muted-foreground)";
            }}
          >
            <Bell size={15} strokeWidth={1.6} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  right: 3,
                  minWidth: 14,
                  height: 14,
                  padding: "0 4px",
                  borderRadius: 7,
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 700,
                  lineHeight: "14px",
                  textAlign: "center",
                  boxShadow: "0 0 0 2px var(--card)",
                  pointerEvents: "none",
                }}
              >
                {badgeLabel}
              </span>
            )}
          </button>
        }
      />
      <DropdownMenuContent align="end" sideOffset={6} className="w-96 p-0">
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 12px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--foreground)",
            }}
          >
            <Bell size={14} strokeWidth={1.8} />
            <span>Notificações</span>
            {unreadCount > 0 && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  background: "var(--primary)",
                  color: "var(--primary-foreground, #fff)",
                  borderRadius: 999,
                  padding: "1px 6px",
                  marginLeft: 2,
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: "none",
                border: 0,
                color: "var(--muted-foreground)",
                fontSize: 11,
                cursor: markAllAsRead.isPending ? "default" : "pointer",
                padding: "2px 6px",
                borderRadius: 4,
                opacity: markAllAsRead.isPending ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!markAllAsRead.isPending)
                  e.currentTarget.style.color = "var(--foreground)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--muted-foreground)";
              }}
            >
              <Check size={12} strokeWidth={2} />
              Marcar todas
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ maxHeight: 380, overflowY: "auto" }}>
          {notificationsQuery.isLoading ? (
            <PopoverState label="Carregando..." />
          ) : preview.length === 0 ? (
            <PopoverEmpty />
          ) : (
            preview.map((n, i) => (
              <NotificationRow
                key={n.id}
                notification={n}
                isLast={i === preview.length - 1}
                onClick={() => handleClickItem(n)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "8px 12px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <button
            type="button"
            onClick={() => router.push("/inbox")}
            style={{
              background: "none",
              border: 0,
              color: "var(--primary)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: 4,
            }}
          >
            Ver todas
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─── Linha do popover ─────────────────────────────────────────────────────── */
function NotificationRow({
  notification: n,
  isLast,
  onClick,
}: {
  notification: NotificationDto;
  isLast: boolean;
  onClick: () => void;
}) {
  const initials = getInitials(n.title || n.message);

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "10px 12px",
        background: n.read
          ? "transparent"
          : "color-mix(in oklab, var(--primary) 4%, transparent)",
        border: 0,
        borderBottom: isLast ? "0" : "1px solid var(--border)",
        cursor: "pointer",
        textAlign: "left",
        transition: "background .12s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background =
          "color-mix(in oklab, var(--accent) 70%, transparent)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = n.read
          ? "transparent"
          : "color-mix(in oklab, var(--primary) 4%, transparent)";
      }}
    >
      <Avatar size="sm">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: "var(--foreground)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {n.title || "Notificação"}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: "var(--muted-foreground)",
            marginTop: 2,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {n.message}
        </div>
        <div
          style={{
            fontSize: 10.5,
            color: "var(--muted-foreground)",
            marginTop: 4,
            opacity: 0.8,
          }}
        >
          {formatRelative(n.createdAt)}
        </div>
      </div>
      {!n.read && (
        <span
          style={{
            marginTop: 6,
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "var(--primary)",
            flexShrink: 0,
          }}
        />
      )}
    </button>
  );
}

/* ─── Estados auxiliares ──────────────────────────────────────────────────── */
function PopoverEmpty() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        padding: "32px 16px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "var(--muted)",
          display: "grid",
          placeItems: "center",
          color: "var(--muted-foreground)",
        }}
      >
        <Bell size={16} strokeWidth={1.8} />
      </div>
      <div
        style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}
      >
        Tudo em dia
      </div>
      <div style={{ fontSize: 11.5, color: "var(--muted-foreground)" }}>
        Nenhuma notificação não lida.
      </div>
    </div>
  );
}

function PopoverState({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: "24px 12px",
        textAlign: "center",
        fontSize: 12,
        color: "var(--muted-foreground)",
      }}
    >
      {label}
    </div>
  );
}

/* ─── Utils ───────────────────────────────────────────────────────────────── */
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
