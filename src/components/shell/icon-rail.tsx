"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useInviteDialogStore } from "@/lib/stores/invite-dialog";

/* ─── Ícones SVG custom — pixel-perfect ClickUp ──────────────────────────── */

/* Início — ativo: círculo gradiente com casinha branca / inativo: só casinha */
function IcHome({ active }: { active?: boolean }) {
  if (active) {
    return (
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #3b5bdb 0%, #4c6ef5 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg
          width={15}
          height={15}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 12L12 3l9 9v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9z" />
          <path d="M9 21V12h6v9" />
        </svg>
      </div>
    );
  }
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12L12 3l9 9v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

/* Planejador — calendário com número do dia */
function IcPlanner() {
  const day = new Date().getDate();
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <text
        x="12"
        y="19"
        textAnchor="middle"
        fontSize="7"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
        fontFamily="system-ui, sans-serif"
      >
        {day}
      </text>
    </svg>
  );
}

/* IA — colmeia: 7 hexágonos (1 centro + 6 ao redor) */
function IcAI() {
  /* hexágono flat-top centrado em (cx, cy) com "raio" r */
  const hex = (cx: number, cy: number, r: number) => {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 180) * (60 * i - 30);
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    }).join(" ");
    return (
      <polygon
        key={`${cx}-${cy}`}
        points={pts}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      />
    );
  };

  const R = 4.2; /* raio do hexágono */
  const D = 7.5; /* distância centro→centro */
  const cx = 12,
    cy = 12;
  const neighbors = [
    [cx, cy - D],
    [cx + D * Math.cos(Math.PI / 6), cy - D * 0.5],
    [cx + D * Math.cos(Math.PI / 6), cy + D * 0.5],
    [cx, cy + D],
    [cx - D * Math.cos(Math.PI / 6), cy + D * 0.5],
    [cx - D * Math.cos(Math.PI / 6), cy - D * 0.5],
  ] as [number, number][];

  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      {hex(cx, cy, R)}
      {neighbors.map(([x, y]) => hex(x, y, R))}
    </svg>
  );
}

/* Equipes — duas silhuetas de pessoas */
function IcTeams() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="7" r="3" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M21 21v-2a4 4 0 0 0-3-3.85" />
    </svg>
  );
}

/* Documentos — documento com dobra no canto superior direito */
function IcDocs() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

/* Formulário — quadrado com checkmark dentro, igual ClickUp */
function IcForm() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 12l3 3 5-5" />
    </svg>
  );
}

/* Convidar — silhueta com + */
function IcInvite() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4" />
      <path d="M19 15v6M16 18h6" />
    </svg>
  );
}

/* Configurações — engrenagem (gear) */
function IcSettings() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

/* ─── Definição dos itens do rail ─────────────────────────────────────────── */
type RailItem = {
  href?: string;
  label: string;
  renderIcon: (active: boolean) => React.ReactNode;
  onClick?: () => void;
};

const mainNav: RailItem[] = [
  { href: "/", label: "Início", renderIcon: (a) => <IcHome active={a} /> },
  { href: "/planner", label: "Planejador", renderIcon: () => <IcPlanner /> },
  { href: "/ia", label: "IA", renderIcon: () => <IcAI /> },
  { href: "/teams", label: "Equipes", renderIcon: () => <IcTeams /> },
  { href: "/docs", label: "Documen...", renderIcon: () => <IcDocs /> },
  { href: "/forms", label: "Formulário", renderIcon: () => <IcForm /> },
];

/* ─── Botão do rail ───────────────────────────────────────────────────────── */
function RailButton({ item, active }: { item: RailItem; active?: boolean }) {
  const baseStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    width: 56,
    height: "calc(var(--row-h) + 14px)",
    borderRadius: 10,
    border: 0,
    background: active
      ? "radial-gradient(ellipse 70% 80% at 50% 35%, color-mix(in oklab, var(--primary) 28%, transparent) 0%, color-mix(in oklab, var(--primary) 14%, transparent) 45%, transparent 72%)"
      : "none",
    cursor: "pointer",
    color: active ? "var(--foreground)" : "var(--muted-foreground)",
    transition: "background .15s, color .15s",
    textDecoration: "none",
    flexShrink: 0,
    position: "relative",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 500,
    lineHeight: 1,
    color: active ? "var(--foreground)" : "var(--muted-foreground)",
    maxWidth: 52,
    textAlign: "center",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const onEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (!active) {
      e.currentTarget.style.background = "var(--accent)";
      e.currentTarget.style.color = "var(--foreground)";
    }
  };
  const onLeave = (e: React.MouseEvent<HTMLElement>) => {
    if (!active) {
      e.currentTarget.style.background = "none";
      e.currentTarget.style.color = "var(--muted-foreground)";
    }
  };

  const content = (
    <>
      {item.renderIcon(!!active)}
      <span style={labelStyle}>{item.label}</span>
    </>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        aria-label={item.label}
        style={baseStyle}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        {content}
      </Link>
    );
  }
  // Botão sem href — onClick pode ser undefined (noop quando já ativo)
  return (
    <button
      type="button"
      aria-label={item.label}
      onClick={item.onClick ?? (() => {})}
      style={baseStyle}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {content}
    </button>
  );
}

/* ─── Rail principal ──────────────────────────────────────────────────────── */
export function IconRail() {
  const pathname = usePathname();
  const router = useRouter();
  const openInvite = useInviteDialogStore((s) => s.openDialog);

  // Início fica ativo em qualquer rota que não pertença aos outros itens
  const otherHrefs = mainNav
    .slice(1)
    .map((i) => i.href)
    .filter(Boolean) as string[];
  const isHomeActive = !otherHrefs.some((href) => pathname.startsWith(href));

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === "/") return isHomeActive;
    return pathname.startsWith(href);
  };

  // Para Início: não navega se já está "em casa" (qualquer rota não listada)
  const homeItem: RailItem = {
    ...mainNav[0],
    onClick: isHomeActive ? undefined : () => router.push("/"),
    href: isHomeActive ? undefined : "/",
  };

  const navItems = [homeItem, ...mainNav.slice(1)];

  return (
    <nav
      aria-label="Navegação principal"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        width: 60,
        flexShrink: 0,
        height: "100%",
        background: "var(--background)",
        borderRight: "1px solid var(--border)",
        padding: "6px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        {navItems.map((item, i) => (
          <RailButton
            key={item.label}
            item={item}
            active={i === 0 ? isHomeActive : isActive(item.href)}
          />
        ))}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <RailButton
          item={{
            label: "Convidar",
            renderIcon: () => <IcInvite />,
            onClick: openInvite,
          }}
        />
        <RailButton
          item={{
            href: "/settings",
            label: "Configura...",
            renderIcon: () => <IcSettings />,
          }}
          active={isActive("/settings")}
        />
      </div>
    </nav>
  );
}
