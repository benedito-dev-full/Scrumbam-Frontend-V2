"use client";

import { Search, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { WorkspaceSwitcher } from "@/components/shell/workspace-switcher";
import { ScrumbanLogo } from "@/components/shell/scrumban-logo";
import { NotificationsPopover } from "@/components/shell/notifications-popover";
import { useCommandPaletteStore } from "@/lib/stores/command-palette";
import { useContentLoadingStore } from "@/lib/stores/content-loading";
import { useLogout } from "@/hooks/use-auth";
import { useAuthStore } from "@/lib/stores/auth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/* ─── Topbar global — idêntica ao ClickUp ─────────────────────────────────
 * bg: #1a1a1a  (levemente mais claro que o fundo #0d0d0f)
 * altura: 38px compacto
 * esquerda: logo F + "Fortalshop" + chevron + ícone calendário
 * centro: search bar com Pesquisar + Ctrl K + ícone sparkles colorido
 * direita: refresh, notif, avatar com iniciais
 */

export function AppTopbar() {
  const openCommandPalette = useCommandPaletteStore((s) => s.setOpen);
  const queryClient = useQueryClient();
  const showLoading = useContentLoadingStore((s) => s.show);
  const hideLoading = useContentLoadingStore((s) => s.hide);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Atualiza todo o conteúdo abaixo da topbar sem recarregar a página:
   * invalida o cache do TanStack Query (refaz o fetch das queries ativas —
   * sidebar, listas, board, etc.) e exibe o loader sobre a área de conteúdo.
   * A topbar permanece intacta.
   */
  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    showLoading();
    try {
      // `invalidateQueries()` sem filtro marca tudo como stale e refaz as
      // queries ativas. O delay mínimo garante feedback visual do loader.
      await Promise.all([
        queryClient.invalidateQueries(),
        new Promise((resolve) => setTimeout(resolve, 500)),
      ]);
      toast.success("Conteúdo atualizado");
    } finally {
      setRefreshing(false);
      hideLoading();
    }
  }

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        height: 40,
        flexShrink: 0,
        background: "var(--card)",
        borderBottom: "1px solid var(--border)",
        padding: "0 10px 0 8px",
        gap: 8,
        position: "relative",
        zIndex: 10,
      }}
    >
      {/* ── Esquerda: logo do produto + workspace switcher ── */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
      >
        <Link
          href="/"
          aria-label="Início — Scrumban"
          style={{
            display: "grid",
            placeItems: "center",
            width: 30,
            height: 30,
            borderRadius: 6,
            flexShrink: 0,
          }}
        >
          <ScrumbanLogo size={22} />
        </Link>
        <WorkspaceSwitcher />
      </div>

      {/* ── Centro: barra de pesquisa ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          padding: "0 40px",
        }}
      >
        <button
          type="button"
          onClick={() => openCommandPalette(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            maxWidth: 480,
            height: 28,
            background: "var(--background)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "0 10px",
            cursor: "pointer",
            color: "var(--muted-foreground)",
            fontSize: 13,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--background)";
          }}
        >
          <Search
            size={14}
            strokeWidth={1.8}
            style={{ color: "var(--muted-foreground)", flexShrink: 0 }}
          />
          <span
            style={{
              flex: 1,
              textAlign: "left",
              color: "var(--muted-foreground)",
            }}
          >
            Pesquisar
          </span>
          {/* shortcut Ctrl K */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 2,
              fontSize: 11,
              color: "var(--muted-foreground)",
              opacity: 0.7,
              fontFamily: "monospace",
              flexShrink: 0,
            }}
          >
            Ctrl K
          </span>
          {/* ícone sparkles colorido (igual ao ClickUp — roxo/colorido) */}
          <span style={{ marginLeft: 4, flexShrink: 0 }}>
            <SparklesColorIcon />
          </span>
        </button>
      </div>

      {/* ── Direita: ícones de ação + avatar ── */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}
      >
        <TopbarIconBtn
          aria-label="Atualizar conteúdo"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            size={15}
            strokeWidth={1.6}
            className={refreshing ? "animate-spin" : undefined}
            style={{ color: "var(--muted-foreground)" }}
          />
        </TopbarIconBtn>
        <NotificationsPopover />

        {/* avatar do usuário */}
        <UserMenu />
      </div>
    </header>
  );
}

/* ─── Menu do usuário ─────────────────────────────────────────────────────── */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Rótulo e cor do badge de papel na organização, exibido no menu do usuário.
 * Espelha o `orgRole` do JWT (ADMIN/MEMBER/VIEWER). `null` quando ausente
 * (ex: usuário órfão sem org) — nesse caso não renderizamos o badge.
 */
function orgRoleBadge(
  role: "ADMIN" | "MEMBER" | "VIEWER" | undefined,
): { label: string; className: string } | null {
  switch (role) {
    case "ADMIN":
      return { label: "Admin", className: "bg-amber-500/15 text-amber-400" };
    case "MEMBER":
      return { label: "Membro", className: "bg-blue-500/15 text-blue-400" };
    case "VIEWER":
      return { label: "Visualizador", className: "bg-zinc-500/15 text-zinc-400" };
    default:
      return null;
  }
}

function UserMenu() {
  const router = useRouter();
  const logout = useLogout();
  const user = useAuthStore((s) => s.user);

  const name = user?.name ?? "?";
  const email = user?.email ?? "";
  const initials = getInitials(name);
  const roleBadge = orgRoleBadge(user?.orgRole);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Menu do usuário"
            style={{
              background: "none",
              border: 0,
              padding: 2,
              borderRadius: "50%",
              cursor: "pointer",
            }}
          />
        }
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "0.3px",
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-foreground">
                {name}
              </span>
              {roleBadge && (
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                    roleBadge.className,
                  )}
                >
                  {roleBadge.label}
                </span>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground">{email}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-[13px]"
            onClick={() => router.push("/profile")}
          >
            Perfil
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-[13px]"
            onClick={() => router.push("/settings")}
          >
            Configurações
          </DropdownMenuItem>
          <DropdownMenuItem className="text-[13px]">
            Atalhos de teclado
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="text-[13px]"
            onClick={() => logout.mutate()}
          >
            Sair
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─── Botão ícone da topbar ───────────────────────────────────────────────── */
function TopbarIconBtn({
  children,
  "aria-label": ariaLabel,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  "aria-label": string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 30,
        height: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 6,
        background: "none",
        border: 0,
        cursor: disabled ? "default" : "pointer",
        color: "var(--muted-foreground)",
        transition: "background .12s, color .12s",
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = "var(--accent)";
        e.currentTarget.style.color = "var(--foreground)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "none";
        e.currentTarget.style.color = "var(--muted-foreground)";
      }}
    >
      {children}
    </button>
  );
}

/* ─── Ícone sparkles colorido (degradê roxo → rosa — igual ao ClickUp) ──── */
function SparklesColorIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c5cff" />
          <stop offset="50%" stopColor="#e040fb" />
          <stop offset="100%" stopColor="#ff6b6b" />
        </linearGradient>
      </defs>
      <path
        d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
        stroke="url(#spark-grad)"
        strokeWidth={1.8}
        fill="none"
      />
      <path d="M20 3v4M22 5h-4" stroke="url(#spark-grad)" strokeWidth={1.8} />
      <path d="M4 17v2M5 18H3" stroke="url(#spark-grad)" strokeWidth={1.8} />
    </svg>
  );
}
