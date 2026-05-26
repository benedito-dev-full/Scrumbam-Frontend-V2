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

/**
 * Popover do sino de notificações do topbar.
 *
 * Comportamento:
 * - **Badge:** Exibe contagem (capped 99+) de não lidas, atualizado a cada 30s.
 * - **Preview:** Mostra 5 últimas notificações não lidas; vazio mostra estado "Tudo em dia".
 * - **Click:** Marca como lida + navega para destino (task/project/fallback /inbox).
 * - **Marcar todas:** Botão no header (visível se há não lidas); toast de confirmação.
 * - **Link "Ver todas":** Navega para `/inbox` (lista 4 tabs completa).
 *
 * Polling: `useUnreadCount()` refetch a cada 30s (mantém badge sincronizado mesmo em background).
 *
 * @example
 * ```tsx
 * // No topbar:
 * <NotificationsPopover />
 * ```
 */
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
              transition: "background .12s, color .12s, box-shadow .12s",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--accent)";
              e.currentTarget.style.color = "var(--foreground)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.color = "var(--muted-foreground)";
            }}
            onFocus={(e) => {
              // A11y: anel visível apenas quando navegando via teclado.
              if (e.currentTarget.matches(":focus-visible")) {
                e.currentTarget.style.boxShadow = "0 0 0 2px var(--primary)";
              }
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "none";
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

/**
 * Linha renderizada no popover para cada notificação.
 *
 * Exibe avatar com iniciais, título, mensagem (2 linhas truncadas),
 * timestamp relativo, e bolinha indicadora se não lida.
 *
 * @param notification - NotificationDto com id, title, message, eventType, createdAt, read, etc.
 * @param isLast - Se é última linha (omite divider border).
 * @param onClick - Handler disparado ao clicar (navegação + mark-as-read ocorrem no caller).
 */
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

/**
 * Estado vazio do popover (nenhuma notificação não lida).
 * Exibe sino cinzento + mensagem "Tudo em dia".
 */
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

/**
 * Estado genérico do popover (ex.: carregando).
 * @param label - Mensagem a exibir (ex.: "Carregando...").
 */
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

/**
 * Extrai 2 iniciais de um nome para exibição no avatar.
 *
 * Regras:
 * - Remove caracteres não-alfabéticos.
 * - 1 palavra → primeiras 2 letras.
 * - 2+ palavras → primeira letra da primeira + última palavra.
 * - Sem caracteres válidos → retorna `??`.
 *
 * @param text - Nome completo (ex.: "João Silva").
 * @returns 2 iniciais em MAIÚSCULAS (ex.: "JS").
 *
 * @example
 * ```ts
 * getInitials("João Silva") // "JS"
 * getInitials("Pedro") // "PE"
 * getInitials("@@@") // "??"
 * ```
 */
function getInitials(text: string): string {
  const cleaned = text.trim().replace(/[^a-zA-Z\s]/g, "");
  if (!cleaned) return "??";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Formata timestamp ISO para representação relativa em português.
 *
 * Retorna:
 * - "agora" se < 1 min
 * - "há X min" se < 1 h
 * - "há X h" se < 24 h
 * - "ontem" se < 48 h
 * - "há X dias" se < 7 dias
 * - Data completa em pt-BR caso contrário
 *
 * @param iso - Timestamp ISO (ex.: "2026-05-26T14:30:00Z").
 * @returns String formatada (ex.: "há 5 min").
 */
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
