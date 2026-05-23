"use client";

import React, { use, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Star,
  Share2,
  Bot,
  Sparkles,
} from "lucide-react";

import { ViewSwitcher } from "@/components/shell/view-switcher";
import { SpaceChip } from "@/components/shell/space-chip";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEntidadesStore } from "@/lib/stores/entidades";
import { mockMembros } from "@/lib/mocks/entidades";
import {
  agruparPorStatus,
  diasUntil,
  tarefasPorEspaco,
} from "@/lib/mocks/tarefas";
import {
  type Prioridade,
  type StatusTarefa,
  type Tarefa,
} from "@/lib/types/tarefa";
import { isEspaco } from "@/lib/types/entidade";
import { cn } from "@/lib/utils";

/* ─── Ícones SVG customizados (idênticos ao HTML de referência) ─────────── */

function IcProgress({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" opacity="0.4" />
      <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3.2" fill="currentColor" />
    </svg>
  );
}

function IcPending({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2.6" />
    </svg>
  );
}

function IcBlocked({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" />
      <path d="M8 12h8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function IcLate({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" />
      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcDone({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcGitFork({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="18" r="2" /><circle cx="6" cy="6" r="2" /><circle cx="18" cy="6" r="2" />
      <path d="M6 8v2a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4V8" /><path d="M12 12v4" />
    </svg>
  );
}

function IcFilter({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5h18l-7 8v6l-4-2v-4L3 5z" />
    </svg>
  );
}

function IcCheck({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </svg>
  );
}

function IcUser({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}

function IcSearch({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function IcSettings({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.2.6.8 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}

function IcPlus({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IcCaret({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IcCaretR({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function IcUserPlus({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="8" r="4" /><path d="M2 21c1.3-3.5 4-5.5 8-5.5" /><path d="M18 14v6M15 17h6" />
    </svg>
  );
}

function IcCalPlus({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4M12 14v4M10 16h4" />
    </svg>
  );
}

function IcFlag({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 21V4" /><path d="M5 4h13l-2 4 2 4H5" />
    </svg>
  );
}

function IcChat({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.8A8 8 0 1 1 21 12z" />
    </svg>
  );
}

function IcLayers({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 2 8l10 5 10-5-10-5z" /><path d="M2 16l10 5 10-5" /><path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function IcColumns({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16M15 4v16" />
    </svg>
  );
}

/* ─── Metadados de status (alinhados com o HTML de referência) ───────────── */
type StatusConfig = {
  label: string;
  iconColor: string;
  pillClass: string;
  Icon: (p: { size?: number }) => React.ReactElement;
  order: number;
};

const STATUS_CONFIG: Record<StatusTarefa, StatusConfig> = {
  "em-progresso": {
    label: "EM PROGRESSO",
    iconColor: "#7c5cff",
    pillClass: "pill-progress",
    Icon: IcProgress,
    order: 1,
  },
  pendente: {
    label: "PENDENTE",
    iconColor: "#8a8a93",
    pillClass: "pill-pending",
    Icon: IcPending,
    order: 2,
  },
  bloqueado: {
    label: "BLOQUEADO",
    iconColor: "#ef4444",
    pillClass: "pill-blocked",
    Icon: IcBlocked,
    order: 3,
  },
  atrasado: {
    label: "ATRASADO",
    iconColor: "#f59e0b",
    pillClass: "pill-late",
    Icon: IcLate,
    order: 4,
  },
  concluido: {
    label: "CONCLUÍDO",
    iconColor: "#10b981",
    pillClass: "pill-done",
    Icon: IcDone,
    order: 5,
  },
};

const PRIO_CONFIG: Record<
  NonNullable<Prioridade>,
  { label: string; color: string }
> = {
  urgente: { label: "Urgente", color: "#ef4444" },
  alta:    { label: "Alta",    color: "#f59e0b" },
  media:   { label: "Média",   color: "#60a5fa" },
  baixa:   { label: "Baixa",   color: "#71717a" },
};

/* ─── Página ─────────────────────────────────────────────────────────────── */
export default function SpacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const entidade = useEntidadesStore(
    (s) => s.entidades.find((e) => e.id === id) ?? null,
  );

  if (!entidade || !isEspaco(entidade)) {
    return (
      <div className="grid h-full place-items-center p-8 text-sm" style={{ color: "#7a7a85" }}>
        Espaço não encontrado.
      </div>
    );
  }

  const tarefas = tarefasPorEspaco(id);
  const grupos = agruparPorStatus(tarefas).sort(
    (a, b) => STATUS_CONFIG[a.status].order - STATUS_CONFIG[b.status].order,
  );

  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ background: "#0f0f12" }}>
      {/* Page header */}
      <PageHeader
        nome={entidade.nome}
        iniciais={entidade.meta.iniciais}
        cor={entidade.meta.cor}
        iconName={entidade.meta.iconName}
      />

      {/* View tabs */}
      <ViewSwitcher defaultValue="list" />

      {/* Toolbar */}
      <Toolbar tarefasCount={tarefas.length} />

      {/* Conteúdo scrollável */}
      <div
        className="flex-1 overflow-y-auto overflow-x-auto"
        style={{ background: "#0f0f12" }}
      >
        <div style={{ minWidth: 860, padding: "0 22px 60px" }}>
          {grupos.length === 0 ? (
            <EmptyState />
          ) : (
            grupos.map((g) => (
              <GroupBlock key={g.status} status={g.status} tarefas={g.tarefas} />
            ))
          )}
          {/* novo status */}
          <button
            type="button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              color: "#5a5a64",
              padding: "14px 4px 0 4px",
              fontSize: 13,
              cursor: "pointer",
              background: "none",
              border: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#e6e6ea")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#5a5a64")}
          >
            <IcPlus size={13} />
            Novo status
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page header ─────────────────────────────────────────────────────────── */
function PageHeader({
  nome,
  iniciais,
  cor,
  iconName,
}: {
  nome: string;
  iniciais: string;
  cor: string;
  iconName?: string | null;
}) {
  return (
    <header
      className="flex h-11 shrink-0 items-center justify-between gap-4 px-5"
      style={{ borderBottom: "1px solid #26262d", background: "#0f0f12" }}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <SpaceChip iniciais={iniciais} cor={cor} iconName={iconName} size="sm" />
        <h1 className="truncate text-sm font-semibold" style={{ color: "#e6e6ea" }}>
          {nome}
        </h1>
        <button
          type="button"
          aria-label="Mudar espaço"
          style={{
            display: "grid",
            width: 20,
            height: 20,
            placeItems: "center",
            borderRadius: 4,
            color: "#7a7a85",
            background: "none",
            border: 0,
          }}
        >
          <IcCaret size={12} />
        </button>
        <button
          type="button"
          aria-label="Favoritar"
          style={{
            display: "grid",
            width: 24,
            height: 24,
            placeItems: "center",
            borderRadius: 4,
            color: "#7a7a85",
            background: "none",
            border: 0,
          }}
        >
          <Star className="size-3.5" />
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <TbBtn icon={<Bot className="size-3.5" />} label="Agentes" />
        <TbBtn icon={<Sparkles className="size-3.5" />} label="Pergunte à IA" />
        <div style={{ width: 1, height: 16, background: "#26262d", margin: "0 4px" }} />
        <TbBtn icon={<Share2 className="size-3.5" />} label="Compartilhar" bordered />
      </div>
    </header>
  );
}

function TbBtn({
  icon,
  label,
  bordered,
}: {
  icon: React.ReactNode;
  label: string;
  bordered?: boolean;
}) {
  return (
    <button
      type="button"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 28,
        padding: "0 10px",
        borderRadius: 6,
        border: bordered ? "1px solid #2a2a32" : "none",
        background: bordered ? "#1c1c22" : "none",
        color: "#b6b6bf",
        fontSize: 13,
        cursor: "pointer",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#e6e6ea")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "#b6b6bf")}
    >
      {icon}
      {label}
    </button>
  );
}

/* ─── Toolbar ────────────────────────────────────────────────────────────── */
function Toolbar({ tarefasCount }: { tarefasCount: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "0 22px",
        height: 44,
        borderBottom: "1px solid #26262d",
        background: "#0f0f12",
        flexShrink: 0,
      }}
    >
      {/* esquerda — tabs com estilo do HTML de referência */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <TabBtn active icon={<IcLayers size={14} />} label="Grupo: Status" />
        <TabBtn icon={<IcGitFork size={14} />} label="Subtarefas" />
        <TabBtn icon={<IcColumns size={14} />} label="Colunas" />
      </div>
      {/* direita */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <SmallBtn icon={<IcFilter size={13} />} label="Filtro" />
        <SmallBtn icon={<IcCheck size={13} />} label="Fechado" />
        <SmallBtn icon={<IcUser size={13} />} label="Responsável" />
        <button
          type="button"
          style={{
            width: 28,
            height: 28,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 6,
            color: "#b6b6bf",
            background: "none",
            border: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#17171c"; e.currentTarget.style.color = "#e6e6ea"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#b6b6bf"; }}
        >
          <IcSearch size={15} />
        </button>
        <span style={{ color: "#7a7a85", fontSize: 12, padding: "0 4px" }}>
          {tarefasCount} tarefas
        </span>
        {/* split button Add Tarefa */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "stretch",
            height: 28,
            border: "1px solid #2a2a32",
            background: "#1c1c22",
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <button
            type="button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "0 12px",
              fontSize: 13,
              color: "#e6e6ea",
              background: "none",
              border: 0,
              cursor: "pointer",
            }}
          >
            Add Tarefa
          </button>
          <div style={{ width: 1, background: "#2a2a32" }} />
          <button
            type="button"
            style={{
              width: 26,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#b6b6bf",
              background: "none",
              border: 0,
              cursor: "pointer",
            }}
          >
            <IcCaret size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

function TabBtn({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 28,
        padding: "0 10px",
        borderRadius: 6,
        background: active ? "rgba(124,92,255,0.16)" : "none",
        border: 0,
        color: active ? "#cfc1ff" : "#b6b6bf",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        if (!active) { e.currentTarget.style.background = "#17171c"; e.currentTarget.style.color = "#e6e6ea"; }
      }}
      onMouseLeave={(e) => {
        if (!active) { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#b6b6bf"; }
      }}
    >
      {icon} {label}
    </button>
  );
}

function SmallBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 28,
        padding: "0 10px",
        border: "1px solid #2a2a32",
        background: "#1c1c22",
        borderRadius: 6,
        color: "#b6b6bf",
        fontSize: 13,
        cursor: "pointer",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = "#e6e6ea"; e.currentTarget.style.borderColor = "#34343d"; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = "#b6b6bf"; e.currentTarget.style.borderColor = "#2a2a32"; }}
    >
      {icon} {label}
    </button>
  );
}

/* ─── Grupo de status ─────────────────────────────────────────────────────── */
function GroupBlock({
  status,
  tarefas,
}: {
  status: StatusTarefa;
  tarefas: Tarefa[];
}) {
  const [open, setOpen] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const cfg = STATUS_CONFIG[status];
  const StatusIcon = cfg.Icon;

  function toggleRow(id: string) {
    setExpandedRows((s) => ({ ...s, [id]: !s[id] }));
  }

  return (
    <div style={{ marginBottom: 8, marginTop: 16 }}>
      {/* cabeçalho do grupo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 0 8px",
        }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            width: 18,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#7a7a85",
            background: "none",
            border: 0,
            cursor: "pointer",
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform .15s",
          }}
        >
          <IcCaret size={12} />
        </button>

        {/* pill do grupo */}
        <GroupPill status={status} />

        <span style={{ color: "#7a7a85", fontSize: 12, marginLeft: 2 }}>
          {tarefas.length}
        </span>
      </div>

      {open && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            <col style={{ width: "auto" }} />
            <col style={{ width: 170 }} />
            <col style={{ width: 200 }} />
            <col style={{ width: 130 }} />
            <col style={{ width: 200 }} />
            <col style={{ width: 48 }} />
            <col style={{ width: 36 }} />
          </colgroup>
          <thead>
            <HeadRow />
          </thead>
          <tbody>
            {tarefas.map((t) => (
              <TaskRow
                key={t.id}
                tarefa={t}
                status={status}
                expanded={!!expandedRows[t.id]}
                onToggle={() => toggleRow(t.id)}
              />
            ))}
            <AddRow />
          </tbody>
        </table>
      )}
    </div>
  );
}

/* pill do grupo — cores exatas do HTML de referência */
const GROUP_PILL_STYLE: Record<StatusTarefa, { bg: string; color: string }> = {
  "em-progresso": { bg: "#7c5cff",   color: "#fff" },
  pendente:       { bg: "#2a2a31",   color: "#d4d4dc" },
  bloqueado:      { bg: "#3d1212",   color: "#fca5a5" },
  atrasado:       { bg: "#3a2800",   color: "#fcd34d" },
  concluido:      { bg: "#0d2e1e",   color: "#6ee7b7" },
};

function GroupPill({ status }: { status: StatusTarefa }) {
  const cfg = STATUS_CONFIG[status];
  const style = GROUP_PILL_STYLE[status];
  const StatusIcon = cfg.Icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 9px",
        borderRadius: 5,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: ".7px",
        textTransform: "uppercase",
        background: style.bg,
        color: style.color,
      }}
    >
      <StatusIcon size={11} />
      {cfg.label}
    </span>
  );
}

/* ─── Header de colunas ───────────────────────────────────────────────────── */
function HeadRow() {
  const thStyle: React.CSSProperties = {
    fontWeight: 500,
    color: "#7a7a85",
    fontSize: 12,
    textAlign: "left",
    padding: "6px 10px",
    borderTop: "1px solid #1f1f25",
    borderBottom: "1px solid #1f1f25",
    background: "transparent",
  };
  return (
    <tr>
      <th style={{ ...thStyle, paddingLeft: 30 }}>Nome</th>
      <th style={thStyle}>Responsável</th>
      <th style={thStyle}>Data de vencimento</th>
      <th style={thStyle}>Prioridade</th>
      <th style={thStyle}>Status</th>
      <th style={{ ...thStyle, textAlign: "center" }}>
        <IcChat size={13} />
      </th>
      <th style={{ ...thStyle, textAlign: "center" }}>
        <span
          style={{
            display: "inline-flex",
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#2a2a32",
            alignItems: "center",
            justifyContent: "center",
            color: "#cfcfd6",
          }}
        >
          <IcPlus size={11} />
        </span>
      </th>
    </tr>
  );
}

/* ─── Linha de tarefa ─────────────────────────────────────────────────────── */
function TaskRow({
  tarefa,
  status,
  expanded,
  onToggle,
}: {
  tarefa: Tarefa;
  status: StatusTarefa;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const cfg = STATUS_CONFIG[status];
  const StatusIcon = cfg.Icon;
  const membro = tarefa.responsavelId
    ? mockMembros.find((m) => m.id === tarefa.responsavelId)
    : null;
  const prio = tarefa.prioridade ? PRIO_CONFIG[tarefa.prioridade] : null;
  const dias = diasUntil(tarefa.dataVencimento);

  let dateText = "";
  let dateColor = "#b6b6bf";
  let dateSub = "";
  if (tarefa.dataVencimento) {
    const d = new Date(tarefa.dataVencimento + "T00:00:00.000Z");
    dateText = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    if (dias != null) {
      if (dias < 0) { dateColor = "#fbbf24"; dateSub = `ATRASADO ${Math.abs(dias)}D`; }
      else if (dias === 0) { dateColor = "#7c5cff"; dateSub = "HOJE"; }
    }
  }

  const tdStyle: React.CSSProperties = {
    padding: 0,
    borderBottom: "1px solid #1f1f25",
    height: 38,
    verticalAlign: "middle",
    color: "#b6b6bf",
    background: hovered ? "#15151a" : "transparent",
  };

  const cellStyle: React.CSSProperties = {
    padding: "0 10px",
    height: 38,
    display: "flex",
    alignItems: "center",
    gap: 8,
  };

  return (
    <>
      <tr
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* nome */}
        <td style={tdStyle}>
          <div style={{ ...cellStyle, paddingLeft: 14, gap: 10 }}>
            {tarefa.subtarefas > 0 ? (
              <button
                type="button"
                onClick={onToggle}
                style={{
                  width: 14,
                  color: "#7a7a85",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  opacity: 0.7,
                  background: "none",
                  border: 0,
                  transform: expanded ? "rotate(90deg)" : "none",
                  transition: "transform .15s",
                }}
              >
                <IcCaretR size={12} />
              </button>
            ) : (
              <span style={{ width: 14, visibility: "hidden", display: "inline-flex" }}>
                <IcCaretR size={12} />
              </span>
            )}
            {/* ícone de status colorido */}
            <span style={{ display: "inline-flex", color: cfg.iconColor }}>
              <StatusIcon size={13} />
            </span>
            <span style={{ color: "#e6e6ea", fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {tarefa.nome}
            </span>
            {tarefa.subtarefas > 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "#7a7a85", fontSize: 11, marginLeft: 2 }}>
                <IcGitFork size={11} /> {tarefa.subtarefas}
              </span>
            )}
          </div>
        </td>
        {/* responsável */}
        <td style={tdStyle}>
          <div style={cellStyle}>
            {membro ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "#3d2a6b",
                    color: "#d8ccff",
                    fontSize: 10,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {membro.iniciais}
                </div>
                <span style={{ fontSize: 12, color: "#b6b6bf" }}>{membro.iniciais}</span>
              </div>
            ) : (
              <span style={{ color: "#4a4a54", opacity: hovered ? 1 : 0, transition: "opacity .15s" }}>
                <IcUserPlus size={14} />
              </span>
            )}
          </div>
        </td>
        {/* data */}
        <td style={tdStyle}>
          <div style={{ ...cellStyle, flexDirection: "column", alignItems: "flex-start", gap: 1, justifyContent: "center" }}>
            {dateText ? (
              <>
                <span style={{ fontSize: 13, color: dateColor }}>{dateText}</span>
                {dateSub && (
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase", color: "#7a7a85" }}>
                    {dateSub}
                  </span>
                )}
              </>
            ) : (
              <span style={{ color: "#4a4a54", opacity: hovered ? 1 : 0, transition: "opacity .15s" }}>
                <IcCalPlus size={14} />
              </span>
            )}
          </div>
        </td>
        {/* prioridade */}
        <td style={tdStyle}>
          <div style={cellStyle}>
            {prio ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: prio.color }}>
                <IcFlag size={13} />
                {prio.label}
              </span>
            ) : (
              <span style={{ color: "#4a4a54", opacity: hovered ? 1 : 0, transition: "opacity .15s" }}>
                <IcFlag size={14} />
              </span>
            )}
          </div>
        </td>
        {/* status pill */}
        <td style={tdStyle}>
          <div style={cellStyle}>
            <StatusInlinePill status={tarefa.status} />
          </div>
        </td>
        {/* comentários */}
        <td style={tdStyle}>
          <div style={{ ...cellStyle, justifyContent: "center", padding: "0 6px" }}>
            <span style={{ color: "#4a4a54", opacity: hovered ? 1 : 0, transition: "opacity .15s" }}>
              <IcChat size={14} />
            </span>
          </div>
        </td>
        {/* plus */}
        <td style={tdStyle} />
      </tr>

      {/* subtarefas expandidas */}
      {expanded && tarefa.subtarefas > 0 && (
        <SubRow hovered={false} />
      )}
    </>
  );
}

/* pill inline nas linhas */
const INLINE_PILL_STYLE: Record<StatusTarefa, { bg: string; color: string }> = {
  "em-progresso": { bg: "#7c5cff",   color: "#fff" },
  pendente:       { bg: "#2a2a31",   color: "#cfcfd6" },
  bloqueado:      { bg: "#3d1212",   color: "#fca5a5" },
  atrasado:       { bg: "#3a2800",   color: "#fcd34d" },
  concluido:      { bg: "#0d2e1e",   color: "#6ee7b7" },
};

function StatusInlinePill({ status }: { status: StatusTarefa }) {
  const cfg = STATUS_CONFIG[status];
  const style = INLINE_PILL_STYLE[status];
  const StatusIcon = cfg.Icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 9px",
        borderRadius: 5,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: ".7px",
        textTransform: "uppercase",
        background: style.bg,
        color: style.color,
        whiteSpace: "nowrap",
      }}
    >
      <StatusIcon size={11} />
      {cfg.label}
    </span>
  );
}

/* ─── Linha de subtarefa ──────────────────────────────────────────────────── */
function SubRow({ hovered }: { hovered: boolean }) {
  return (
    <tr>
      <td
        colSpan={7}
        style={{
          padding: 0,
          borderBottom: "1px solid #1f1f25",
          height: 34,
          background: "#101015",
        }}
      >
        <div
          style={{
            paddingLeft: 54,
            height: 34,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ width: 14, visibility: "hidden", display: "inline-flex" }}>
            <IcCaretR size={12} />
          </span>
          <span style={{ display: "inline-flex", color: "#8a8a93" }}>
            <IcPending size={13} />
          </span>
          <span style={{ color: "#b6b6bf", fontWeight: 500, fontSize: 13 }}>Subtarefa</span>
        </div>
      </td>
    </tr>
  );
}

/* ─── Add row ─────────────────────────────────────────────────────────────── */
function AddRow() {
  const [hovered, setHovered] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <td
        colSpan={7}
        style={{
          height: 34,
          borderBottom: "1px solid #1f1f25",
          background: hovered ? "#15151a" : "transparent",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            paddingLeft: 30,
            height: 34,
            display: "flex",
            alignItems: "center",
            gap: 7,
            color: hovered ? "#e6e6ea" : "#7a7a85",
            fontSize: 13,
          }}
        >
          <IcPlus size={13} />
          Adicionar Tarefa
        </div>
      </td>
    </tr>
  );
}

/* ─── Empty state ─────────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div
      style={{
        marginTop: 40,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        padding: 40,
        border: "1px dashed #26262d",
        borderRadius: 8,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "#1f1f25",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#7a7a85",
        }}
      >
        <IcPlus size={18} />
      </div>
      <p style={{ color: "#e6e6ea", fontSize: 14, fontWeight: 500, margin: 0 }}>
        Nenhuma tarefa neste espaço ainda
      </p>
      <p style={{ color: "#7a7a85", fontSize: 12, margin: 0 }}>
        Crie a primeira tarefa para começar.
      </p>
    </div>
  );
}
