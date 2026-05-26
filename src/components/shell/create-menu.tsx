"use client";

import { ChevronRight } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { Entidade } from "@/lib/types/entidade";

/* ─── Ícones coloridos pixel-perfect ClickUp ──────────────────────────────── */

/* Lista — duas linhas com checkmark à esquerda, cor azul/roxo */
function IcList() {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      {/* check esquerdo */}
      <path d="M2 5.5 L4.5 8 L7 4" stroke="#7c6ff7" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 11.5 L4.5 14 L7 10" stroke="#7c6ff7" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      {/* linhas direita */}
      <line x1="9" y1="6" x2="16" y2="6" stroke="#7c6ff7" strokeWidth={1.6} strokeLinecap="round" />
      <line x1="9" y1="12" x2="16" y2="12" stroke="#7c6ff7" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

/* Pasta — outline cinza, sem fundo */
function IcFolder() {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <path d="M2 13.5V6a1 1 0 0 1 1-1h4l1.5 2H15a1 1 0 0 1 1 1v5.5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"
        stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Documento — quadrado azul sólido com dobra */
function IcDoc() {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <rect x="2" y="1.5" width="10" height="14" rx="1.5" fill="#3b82f6" />
      <path d="M9 1.5 L12 4.5 L9 4.5 Z" fill="#1d4ed8" />
      <line x1="4" y1="7.5"  x2="10" y2="7.5"  stroke="var(--border)" strokeWidth={1} strokeLinecap="round" />
      <line x1="4" y1="9.5"  x2="10" y2="9.5"  stroke="var(--border)" strokeWidth={1} strokeLinecap="round" />
      <line x1="4" y1="11.5" x2="7.5" y2="11.5" stroke="var(--border)" strokeWidth={1} strokeLinecap="round" />
    </svg>
  );
}

/* Painéis — quadrado com gráfico de barras roxo/verde */
function IcPaineis() {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <rect x="1.5" y="1.5" width="15" height="15" rx="2.5" fill="#7c3aed" />
      {/* barras do gráfico */}
      <rect x="3.5" y="9"  width="2.5" height="5.5" rx="0.5" fill="#a78bfa" />
      <rect x="7.5" y="6"  width="2.5" height="8.5" rx="0.5" fill="#c4b5fd" />
      <rect x="11.5" y="4" width="2.5" height="10.5" rx="0.5" fill="#ede9fe" />
    </svg>
  );
}

/* Quadro branco — círculo laranja com símbolo de infinito */
function IcWhiteboard() {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" fill="#f97316" />
      {/* símbolo de infinito simplificado */}
      <path d="M5.5 9 C5.5 7.5 6.5 6.5 7.5 6.5 C8.5 6.5 9 7.5 9 9 C9 10.5 9.5 11.5 10.5 11.5 C11.5 11.5 12.5 10.5 12.5 9 C12.5 7.5 11.5 6.5 10.5 6.5 C9.5 6.5 9 7.5 9 9 C9 10.5 8.5 11.5 7.5 11.5 C6.5 11.5 5.5 10.5 5.5 9 Z"
        stroke="#fff" strokeWidth={1.3} fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* Formulário — quadrado roxo com checkmark */
function IcForm() {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <rect x="1.5" y="1.5" width="15" height="15" rx="2.5" fill="#7c3aed" />
      <path d="M5 9.5 L7.5 12 L13 6.5" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Importações — seta entrando numa caixa, cinza */
function IcImport() {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <rect x="2" y="11" width="14" height="5" rx="1.5" stroke="#9ca3af" strokeWidth={1.4} />
      <path d="M9 2 L9 10" stroke="#9ca3af" strokeWidth={1.4} strokeLinecap="round" />
      <path d="M5.5 7 L9 10.5 L12.5 7" stroke="#9ca3af" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Modelos — grade de quadradinhos (asterisco/grid), cinza */
function IcTemplates() {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      {/* 4 linhas cruzando no centro */}
      <line x1="9" y1="2"  x2="9"  y2="16" stroke="#9ca3af" strokeWidth={1.4} strokeLinecap="round" />
      <line x1="2" y1="9"  x2="16" y2="9"  stroke="#9ca3af" strokeWidth={1.4} strokeLinecap="round" />
      <line x1="4" y1="4"  x2="14" y2="14" stroke="#9ca3af" strokeWidth={1.4} strokeLinecap="round" />
      <line x1="14" y1="4" x2="4"  y2="14" stroke="#9ca3af" strokeWidth={1.4} strokeLinecap="round" />
    </svg>
  );
}

/* ─── Item do menu ────────────────────────────────────────────────────────── */
function MenuItem({
  icon,
  label,
  desc,
  hasArrow,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  desc?: string;
  hasArrow?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex", alignItems: desc ? "flex-start" : "center",
        gap: 10, width: "100%", padding: desc ? "7px 12px" : "6px 12px",
        border: 0, background: "none", cursor: "pointer", textAlign: "left",
        borderRadius: 6,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--border)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
    >
      <div style={{ marginTop: desc ? 1 : 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)", lineHeight: 1.3 }}>{label}</p>
        {desc && <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2, lineHeight: 1.4 }}>{desc}</p>}
      </div>
      {hasArrow && <ChevronRight size={13} style={{ color: "var(--muted-foreground)", flexShrink: 0, marginTop: desc ? 2 : 0 }} />}
    </button>
  );
}

/* ─── Componente principal ────────────────────────────────────────────────── */
type CreateMenuProps = {
  parent: Entidade;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
};

export function CreateMenu({
  parent,
  children,
  align = "start",
  side = "bottom",
}: CreateMenuProps) {
  const notify = (label: string) =>
    toast.success(`Criar ${label} em "${parent.nome}"`);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={children as React.ReactElement} />
      <DropdownMenuContent
        align={align}
        side={side}
        sideOffset={6}
        className="w-72 p-1.5"
      >
        {/* label */}
        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "4px 12px 6px" }}>
          Criar
        </p>

        {/* Lista + Pasta — com descrição */}
        <MenuItem icon={<IcList />}   label="Lista"  desc="Acompanhe tarefas, projetos, pessoas e muito mais" onClick={() => notify("Lista")} />
        <MenuItem icon={<IcFolder />} label="Pasta"  desc="Agrupe listas, documentos e muito mais"           onClick={() => notify("Pasta")} />

        <DropdownMenuSeparator className="my-1" />

        {/* Documento, Painéis, Quadro branco, Formulário — sem descrição */}
        <MenuItem icon={<IcDoc />}        label="Documento"     onClick={() => notify("Documento")} />
        <MenuItem icon={<IcPaineis />}    label="Painéis"       onClick={() => notify("Painéis")} />
        <MenuItem icon={<IcWhiteboard />} label="Quadro branco" onClick={() => notify("Quadro branco")} />
        <MenuItem icon={<IcForm />}       label="Formulário"    onClick={() => notify("Formulário")} />

        <DropdownMenuSeparator className="my-1" />

        {/* Importações + Modelos */}
        <MenuItem icon={<IcImport />}    label="Importações" hasArrow onClick={() => notify("Importações")} />
        <MenuItem icon={<IcTemplates />} label="Modelos"              onClick={() => notify("Modelos")} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CreateSpaceTriggerIcon() {
  return <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>;
}
