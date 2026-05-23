"use client";

import { useState } from "react";
import {
  ChevronDown,
  CalendarDays,
  Search,
  RefreshCw,
  Bell,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useCommandPaletteStore } from "@/lib/stores/command-palette";

/* ─── Topbar global — idêntica ao ClickUp ─────────────────────────────────
 * bg: #1a1a1a  (levemente mais claro que o fundo #0d0d0f)
 * altura: 38px compacto
 * esquerda: logo F + "Fortalshop" + chevron + ícone calendário
 * centro: search bar com Pesquisar + Ctrl K + ícone sparkles colorido
 * direita: refresh, notif, avatar com iniciais
 */

export function AppTopbar() {
  const openCommandPalette = useCommandPaletteStore((s) => s.setOpen);

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        height: 40,
        flexShrink: 0,
        background: "#1a1a1a",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "0 10px 0 8px",
        gap: 8,
        position: "relative",
        zIndex: 10,
      }}
    >
      {/* ── Esquerda: workspace switcher + calendário ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
        <WorkspaceSwitcher />
        <TopbarIconBtn aria-label="Calendário">
          <CalendarDays size={16} strokeWidth={1.6} style={{ color: "#7a7a85" }} />
        </TopbarIconBtn>
      </div>

      {/* ── Centro: barra de pesquisa ── */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "0 40px" }}>
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
            background: "#0d0d0f",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 8,
            padding: "0 10px",
            cursor: "pointer",
            color: "#7a7a85",
            fontSize: 13,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#34343d";
            e.currentTarget.style.background = "#121216";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
            e.currentTarget.style.background = "#0d0d0f";
          }}
        >
          <Search size={14} strokeWidth={1.8} style={{ color: "#5a5a64", flexShrink: 0 }} />
          <span style={{ flex: 1, textAlign: "left", color: "#7a7a85" }}>Pesquisar</span>
          {/* shortcut Ctrl K */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 2,
              fontSize: 11,
              color: "#5a5a64",
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
      <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
        <TopbarIconBtn aria-label="Sincronizar">
          <RefreshCw size={15} strokeWidth={1.6} style={{ color: "#7a7a85" }} />
        </TopbarIconBtn>
        <TopbarIconBtn aria-label="Notificações">
          <Bell size={15} strokeWidth={1.6} style={{ color: "#7a7a85" }} />
        </TopbarIconBtn>

        {/* avatar do usuário */}
        <UserMenu />
      </div>
    </header>
  );
}

/* ─── Workspace switcher ──────────────────────────────────────────────────── */
function WorkspaceSwitcher() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 30,
              padding: "0 6px",
              borderRadius: 6,
              background: "none",
              border: 0,
              cursor: "pointer",
              color: "#e6e6ea",
            }}
          />
        }
      >
        {/* logo "F" colorido — igual ao ClickUp */}
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 5,
            background: "linear-gradient(135deg, #7c5cff 0%, #e040fb 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
            letterSpacing: "-0.5px",
          }}
        >
          F
        </div>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#e6e6ea",
            letterSpacing: "-0.1px",
          }}
        >
          Fortalshop
        </span>
        <ChevronDown
          size={13}
          strokeWidth={2}
          style={{ color: "#7a7a85", flexShrink: 0 }}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={4} className="w-[220px]">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Workspace
          </DropdownMenuLabel>
          <DropdownMenuItem className="gap-2">
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                background: "linear-gradient(135deg,#7c5cff,#e040fb)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              F
            </div>
            <span className="flex-1 text-[13px]">Fortalshop</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              atual
            </span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-[13px]">
            + Criar workspace
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─── Menu do usuário ─────────────────────────────────────────────────────── */
function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Menu do usuário"
            style={{ background: "none", border: 0, padding: 2, borderRadius: "50%", cursor: "pointer" }}
          />
        }
      >
        {/* avatar igual ao ClickUp: iniciais "BR" com fundo gradiente */}
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
          RB
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="text-[13px] font-semibold text-foreground">Robério</div>
            <div className="text-[11px] text-muted-foreground">roberio@fortalshop.com</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-[13px]">Perfil</DropdownMenuItem>
          <DropdownMenuItem className="text-[13px]">Configurações</DropdownMenuItem>
          <DropdownMenuItem className="text-[13px]">Atalhos de teclado</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" className="text-[13px]">Sair</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─── Botão ícone da topbar ───────────────────────────────────────────────── */
function TopbarIconBtn({
  children,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  "aria-label": string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      style={{
        width: 30,
        height: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 6,
        background: "none",
        border: 0,
        cursor: "pointer",
        color: "#7a7a85",
        transition: "background .12s, color .12s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#1e1e20";
        e.currentTarget.style.color = "#e6e6ea";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "none";
        e.currentTarget.style.color = "#7a7a85";
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
      <path
        d="M20 3v4M22 5h-4"
        stroke="url(#spark-grad)"
        strokeWidth={1.8}
      />
      <path
        d="M4 17v2M5 18H3"
        stroke="url(#spark-grad)"
        strokeWidth={1.8}
      />
    </svg>
  );
}
