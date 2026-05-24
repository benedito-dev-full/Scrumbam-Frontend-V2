"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

import { STATUS_CONFIG, PRIO_CONFIG } from "@/components/lists/config";
import { mockMembros } from "@/lib/mocks/entidades";
import { diasUntil } from "@/lib/mocks/tarefas";
import type { Prioridade, StatusTarefa, Tarefa } from "@/lib/types/tarefa";

/* ─── Tipos internos ──────────────────────────────────────────────────────── */

interface TaskSheetProps {
  /** Tarefa exibida. Se null, o sheet não é renderizado. */
  task: Tarefa | null;
  /** Callback para fechar o sheet */
  onClose: () => void;
}

interface SubtarefaItem {
  id: string;
  nome: string;
  concluida: boolean;
}

/* ─── Helpers de formatação ───────────────────────────────────────────────── */

function formatarData(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00.000Z");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function corData(iso: string | null): string {
  const dias = diasUntil(iso);
  if (dias === null) return "#b6b6bf";
  if (dias < 0) return "#fbbf24";
  if (dias === 0) return "#7c5cff";
  return "#b6b6bf";
}

/* ─── Ícones internos do sheet ────────────────────────────────────────────── */

function IcArrowLeft({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function IcDots({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="12" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <circle cx="19" cy="12" r="1.2" fill="currentColor" />
    </svg>
  );
}

function IcChevDown({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IcCalendar({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function IcFlag({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 21V4" /><path d="M5 4h13l-2 4 2 4H5" />
    </svg>
  );
}

function IcPlus({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IcCheck({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

/* ─── Sub-componentes das seções ──────────────────────────────────────────── */

/** Badge/select de status clicável */
function StatusSelect({
  value,
  onChange,
}: {
  value: StatusTarefa;
  onChange: (v: StatusTarefa) => void;
}) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[value];
  const StatusIcon = cfg.Icon;
  const allStatuses: StatusTarefa[] = ["em-progresso", "pendente", "bloqueado", "atrasado", "concluido"];

  const pillBg: Record<StatusTarefa, string> = {
    "em-progresso": "rgba(124,92,255,0.18)",
    pendente: "rgba(138,138,147,0.15)",
    bloqueado: "rgba(239,68,68,0.15)",
    atrasado: "rgba(245,158,11,0.15)",
    concluido: "rgba(16,185,129,0.15)",
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "4px 10px", borderRadius: 6,
          background: pillBg[value], border: "1px solid rgba(255,255,255,0.06)",
          color: cfg.iconColor, fontSize: 12, fontWeight: 600,
          letterSpacing: ".5px", textTransform: "uppercase", cursor: "pointer",
        }}
      >
        <StatusIcon size={12} />
        {cfg.label}
        <IcChevDown size={11} />
      </button>
      {open && (
        <>
          {/* camada de fecho ao clicar fora */}
          <div
            style={{ position: "fixed", inset: 0, zIndex: 1 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 2,
            background: "#1c1c24", border: "1px solid #2e2e38", borderRadius: 8,
            padding: 4, minWidth: 160, boxShadow: "0 8px 24px rgba(0,0,0,.4)",
          }}>
            {allStatuses.map((s) => {
              const c = STATUS_CONFIG[s];
              const Icon = c.Icon;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => { onChange(s); setOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    width: "100%", padding: "7px 10px", borderRadius: 5,
                    background: s === value ? "rgba(124,92,255,0.12)" : "none",
                    border: 0, color: c.iconColor, fontSize: 12, fontWeight: 500,
                    cursor: "pointer", textAlign: "left",
                  }}
                  onMouseEnter={(e) => { if (s !== value) e.currentTarget.style.background = "#26262f"; }}
                  onMouseLeave={(e) => { if (s !== value) e.currentTarget.style.background = "none"; }}
                >
                  <Icon size={12} />
                  <span style={{ color: "#d4d4dc" }}>{c.label}</span>
                  {s === value && (
                    <span style={{ marginLeft: "auto", color: "#7c5cff" }}>
                      <IcCheck size={11} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/** Select de prioridade */
function PrioridadeSelect({
  value,
  onChange,
}: {
  value: Prioridade | null;
  onChange: (v: Prioridade | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const prio = value ? PRIO_CONFIG[value] : null;
  const allPrios: Prioridade[] = ["urgente", "alta", "media", "baixa"];

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "4px 10px", borderRadius: 6,
          background: "#1c1c24", border: "1px solid #2e2e38",
          color: prio ? prio.color : "#7a7a85", fontSize: 12, fontWeight: 500,
          cursor: "pointer",
        }}
      >
        <IcFlag size={12} />
        <span style={{ color: prio ? prio.color : "#7a7a85" }}>
          {prio ? prio.label : "Sem prioridade"}
        </span>
        <IcChevDown size={11} />
      </button>
      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 1 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 2,
            background: "#1c1c24", border: "1px solid #2e2e38", borderRadius: 8,
            padding: 4, minWidth: 150, boxShadow: "0 8px 24px rgba(0,0,0,.4)",
          }}>
            <button
              type="button"
              onClick={() => { onChange(null); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", padding: "7px 10px", borderRadius: 5,
                background: value === null ? "rgba(124,92,255,0.12)" : "none",
                border: 0, color: "#7a7a85", fontSize: 12, cursor: "pointer", textAlign: "left",
              }}
              onMouseEnter={(e) => { if (value !== null) e.currentTarget.style.background = "#26262f"; }}
              onMouseLeave={(e) => { if (value !== null) e.currentTarget.style.background = "none"; }}
            >
              <IcFlag size={12} />
              <span style={{ color: "#d4d4dc" }}>Sem prioridade</span>
              {value === null && (
                <span style={{ marginLeft: "auto", color: "#7c5cff" }}><IcCheck size={11} /></span>
              )}
            </button>
            {allPrios.map((p) => {
              const c = PRIO_CONFIG[p];
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => { onChange(p); setOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    width: "100%", padding: "7px 10px", borderRadius: 5,
                    background: p === value ? "rgba(124,92,255,0.12)" : "none",
                    border: 0, color: c.color, fontSize: 12, cursor: "pointer", textAlign: "left",
                  }}
                  onMouseEnter={(e) => { if (p !== value) e.currentTarget.style.background = "#26262f"; }}
                  onMouseLeave={(e) => { if (p !== value) e.currentTarget.style.background = "none"; }}
                >
                  <IcFlag size={12} />
                  <span style={{ color: "#d4d4dc" }}>{c.label}</span>
                  {p === value && (
                    <span style={{ marginLeft: "auto", color: "#7c5cff" }}><IcCheck size={11} /></span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/** Select de responsável */
function ResponsavelSelect({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const membro = value ? mockMembros.find((m) => m.id === value) : null;

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "4px 10px", borderRadius: 6,
          background: "#1c1c24", border: "1px solid #2e2e38",
          color: "#b6b6bf", fontSize: 12, fontWeight: 500, cursor: "pointer",
        }}
      >
        {membro ? (
          <>
            <div style={{
              width: 20, height: 20, borderRadius: "50%",
              background: "#3d2a6b", color: "#d8ccff",
              fontSize: 9, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {membro.iniciais}
            </div>
            <span style={{ color: "#e6e6ea" }}>{membro.nome}</span>
          </>
        ) : (
          <span style={{ color: "#7a7a85" }}>Sem responsável</span>
        )}
        <IcChevDown size={11} />
      </button>
      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 1 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 2,
            background: "#1c1c24", border: "1px solid #2e2e38", borderRadius: 8,
            padding: 4, minWidth: 180, boxShadow: "0 8px 24px rgba(0,0,0,.4)",
          }}>
            <button
              type="button"
              onClick={() => { onChange(null); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", padding: "7px 10px", borderRadius: 5,
                background: value === null ? "rgba(124,92,255,0.12)" : "none",
                border: 0, color: "#7a7a85", fontSize: 12, cursor: "pointer",
              }}
              onMouseEnter={(e) => { if (value !== null) e.currentTarget.style.background = "#26262f"; }}
              onMouseLeave={(e) => { if (value !== null) e.currentTarget.style.background = "none"; }}
            >
              <span style={{ color: "#d4d4dc" }}>Sem responsável</span>
              {value === null && (
                <span style={{ marginLeft: "auto", color: "#7c5cff" }}><IcCheck size={11} /></span>
              )}
            </button>
            {mockMembros.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => { onChange(m.id); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  width: "100%", padding: "7px 10px", borderRadius: 5,
                  background: m.id === value ? "rgba(124,92,255,0.12)" : "none",
                  border: 0, color: "#d4d4dc", fontSize: 12, cursor: "pointer",
                }}
                onMouseEnter={(e) => { if (m.id !== value) e.currentTarget.style.background = "#26262f"; }}
                onMouseLeave={(e) => { if (m.id !== value) e.currentTarget.style.background = "none"; }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: "#3d2a6b", color: "#d8ccff",
                  fontSize: 9, fontWeight: 700, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {m.iniciais}
                </div>
                {m.nome}
                {m.id === value && (
                  <span style={{ marginLeft: "auto", color: "#7c5cff" }}><IcCheck size={11} /></span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Linha de propriedade do painel */
function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "130px 1fr",
      alignItems: "center", padding: "6px 0", gap: 12,
    }}>
      <span style={{ fontSize: 12, color: "#7a7a85", fontWeight: 500 }}>{label}</span>
      <div>{children}</div>
    </div>
  );
}

/* ─── Componente principal ────────────────────────────────────────────────── */

/**
 * Sheet lateral de detalhe de tarefa.
 *
 * Abre deslizando da direita com animação CSS. Fecha ao pressionar Escape,
 * clicar no overlay ou no botão de fechar.
 *
 * @example
 * <TaskSheet task={selectedTask} onClose={() => setSelectedTask(null)} />
 */
export function TaskSheet({ task, onClose }: TaskSheetProps) {
  /* estado local — sem persistência, só UI */
  const [nome, setNome] = useState("");
  const [editandoNome, setEditandoNome] = useState(false);
  const [status, setStatus] = useState<StatusTarefa>("pendente");
  const [prioridade, setPrioridade] = useState<Prioridade | null>(null);
  const [responsavelId, setResponsavelId] = useState<string | null>(null);
  const [descricao, setDescricao] = useState("");
  const [novaSubtarefa, setNovaSubtarefa] = useState("");
  const [subtarefas, setSubtarefas] = useState<SubtarefaItem[]>([]);
  const [comentario, setComentario] = useState("");
  const [visivel, setVisivel] = useState(false);

  const tituloInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* Sincroniza estado quando a tarefa muda.
   * Usa setTimeout para não chamar setState diretamente no corpo do effect
   * (react-hooks/set-state-in-effect). Mesmo padrão de provision-modal.tsx.
   */
  useEffect(() => {
    if (task) {
      const id = setTimeout(() => {
        setNome(task.nome);
        setStatus(task.status);
        setPrioridade(task.prioridade);
        setResponsavelId(task.responsavelId);
        setDescricao("");
        setNovaSubtarefa("");
        setComentario("");
        setEditandoNome(false);
        /* gera subtarefas mock a partir do contador */
        const items: SubtarefaItem[] = Array.from({ length: task.subtarefas }, (_, i) => ({
          id: `sub-${task.id}-${i}`,
          nome: `Subtarefa ${i + 1}`,
          concluida: false,
        }));
        setSubtarefas(items);
      }, 0);
      /* pequeno delay para que o transform já tenha sido aplicado antes do reflow */
      requestAnimationFrame(() => setVisivel(true));
      return () => clearTimeout(id);
    } else {
      const hideId = setTimeout(() => setVisivel(false), 0);
      return () => clearTimeout(hideId);
    }
  }, [task]);

  /* Fechar com Escape */
  useEffect(() => {
    if (!task) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [task, onClose]);

  /* Auto-resize do textarea de descrição */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [descricao]);

  /* Foca o input de título ao entrar em modo de edição */
  useEffect(() => {
    if (editandoNome) {
      tituloInputRef.current?.focus();
      tituloInputRef.current?.select();
    }
  }, [editandoNome]);

  const confirmarNome = useCallback(() => {
    setEditandoNome(false);
    if (!nome.trim()) setNome(task?.nome ?? "");
  }, [nome, task?.nome]);

  const adicionarSubtarefa = useCallback(() => {
    const texto = novaSubtarefa.trim();
    if (!texto) return;
    setSubtarefas((prev) => [
      ...prev,
      { id: `sub-new-${Date.now()}`, nome: texto, concluida: false },
    ]);
    setNovaSubtarefa("");
  }, [novaSubtarefa]);

  const toggleSubtarefa = useCallback((id: string) => {
    setSubtarefas((prev) =>
      prev.map((s) => (s.id === id ? { ...s, concluida: !s.concluida } : s)),
    );
  }, []);

  /* Não renderiza nada se não há tarefa (nem no DOM, evita FOUC) */
  if (!task) return null;

  const dataTexto = formatarData(task.dataVencimento);
  const dataCor = corData(task.dataVencimento);
  const diasRestantes = diasUntil(task.dataVencimento);

  /* ─── Render ─────────────────────────────────────────────────────────────── */
  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 998,
          background: "rgba(0,0,0,0.45)",
          opacity: visivel ? 1 : 0,
          transition: "opacity .22s ease",
        }}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes da tarefa: ${nome}`}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 999,
          width: 560, maxWidth: "90vw",
          background: "#131318",
          borderLeft: "1px solid #26262d",
          display: "flex", flexDirection: "column",
          boxShadow: "-8px 0 40px rgba(0,0,0,.5)",
          transform: visivel ? "translateX(0)" : "translateX(100%)",
          transition: "transform .24s cubic-bezier(.22,.68,0,1.08)",
        }}
      >
        {/* ── Header fixo ──────────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px", height: 48, flexShrink: 0,
          borderBottom: "1px solid #1f1f27",
        }}>
          <button
            type="button"
            aria-label="Fechar painel"
            onClick={onClose}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "none", border: 0, color: "#7a7a85",
              fontSize: 12, cursor: "pointer", padding: "4px 8px",
              borderRadius: 5,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#e6e6ea"; e.currentTarget.style.background = "#1e1e27"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#7a7a85"; e.currentTarget.style.background = "none"; }}
          >
            <IcArrowLeft size={15} />
            Fechar
          </button>

          <span style={{ fontSize: 12, color: "#5a5a64", fontWeight: 500, letterSpacing: ".5px" }}>
            {task.id.toUpperCase()}
          </span>

          <button
            type="button"
            aria-label="Mais ações"
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 30, height: 30, borderRadius: 6,
              background: "none", border: 0, color: "#7a7a85", cursor: "pointer",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#e6e6ea"; e.currentTarget.style.background = "#1e1e27"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#7a7a85"; e.currentTarget.style.background = "none"; }}
          >
            <IcDots size={16} />
          </button>
        </div>

        {/* ── Body scrollável ──────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 40px" }}>

          {/* Título editável inline */}
          <div style={{ marginBottom: 24 }}>
            {editandoNome ? (
              <input
                ref={tituloInputRef}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onBlur={confirmarNome}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmarNome();
                  if (e.key === "Escape") { setNome(task.nome); setEditandoNome(false); }
                }}
                style={{
                  width: "100%", background: "transparent",
                  border: "none", borderBottom: "1px solid #7c5cff",
                  color: "#f0f0f4", fontSize: 20, fontWeight: 700,
                  outline: "none", padding: "2px 0",
                  fontFamily: "inherit",
                }}
              />
            ) : (
              <h2
                role="button"
                tabIndex={0}
                onClick={() => setEditandoNome(true)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setEditandoNome(true); }}
                style={{
                  fontSize: 20, fontWeight: 700, color: "#f0f0f4",
                  margin: 0, cursor: "text", lineHeight: 1.35,
                  padding: "2px 0",
                }}
                title="Clique para editar o título"
              >
                {nome}
              </h2>
            )}
          </div>

          {/* Seção de Propriedades */}
          <section style={{
            background: "#1a1a22", borderRadius: 10,
            border: "1px solid #26262d", padding: "12px 16px",
            marginBottom: 24,
          }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#5a5a64", letterSpacing: ".7px", textTransform: "uppercase", margin: "0 0 10px" }}>
              Propriedades
            </p>

            <PropRow label="Status">
              <StatusSelect value={status} onChange={setStatus} />
            </PropRow>

            <div style={{ height: 1, background: "#22222a", margin: "4px 0" }} />

            <PropRow label="Prioridade">
              <PrioridadeSelect value={prioridade} onChange={setPrioridade} />
            </PropRow>

            <div style={{ height: 1, background: "#22222a", margin: "4px 0" }} />

            <PropRow label="Responsável">
              <ResponsavelSelect value={responsavelId} onChange={setResponsavelId} />
            </PropRow>

            <div style={{ height: 1, background: "#22222a", margin: "4px 0" }} />

            <PropRow label="Vencimento">
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: dataCor, fontSize: 12 }}>
                <IcCalendar size={13} />
                {dataTexto || <span style={{ color: "#5a5a64" }}>Sem data</span>}
                {diasRestantes !== null && diasRestantes < 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#fbbf24", letterSpacing: ".5px" }}>
                    ATRASADO {Math.abs(diasRestantes)}D
                  </span>
                )}
                {diasRestantes === 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#7c5cff", letterSpacing: ".5px" }}>
                    HOJE
                  </span>
                )}
              </div>
            </PropRow>
          </section>

          {/* Seção Descrição */}
          <section style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#b6b6bf", margin: "0 0 8px" }}>
              Descrição
            </p>
            <textarea
              ref={textareaRef}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Adicione uma descrição..."
              rows={3}
              style={{
                width: "100%", boxSizing: "border-box",
                background: "#1a1a22", border: "1px solid #26262d",
                borderRadius: 8, color: "#d4d4dc", fontSize: 13,
                padding: "10px 12px", outline: "none",
                resize: "none", lineHeight: 1.6,
                fontFamily: "inherit", minHeight: 80,
                transition: "border-color .15s",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#7c5cff"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#26262d"; }}
            />
          </section>

          {/* Seção Subtarefas */}
          <section style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#b6b6bf", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
              Subtarefas
              <span style={{ fontSize: 11, fontWeight: 500, color: "#5a5a64", background: "#1e1e27", borderRadius: 4, padding: "1px 6px" }}>
                {subtarefas.length}
              </span>
            </p>

            {subtarefas.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                {subtarefas.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "7px 10px", borderRadius: 6,
                      background: "#1a1a22", border: "1px solid #22222a",
                      marginBottom: 4,
                    }}
                  >
                    <button
                      type="button"
                      aria-label={s.concluida ? "Desmarcar subtarefa" : "Marcar subtarefa como concluída"}
                      onClick={() => toggleSubtarefa(s.id)}
                      style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        background: s.concluida ? "#7c5cff" : "transparent",
                        border: `1.5px solid ${s.concluida ? "#7c5cff" : "#3d3d4a"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      {s.concluida && <IcCheck size={10} />}
                    </button>
                    <span style={{
                      fontSize: 13, color: s.concluida ? "#5a5a64" : "#d4d4dc",
                      textDecoration: s.concluida ? "line-through" : "none",
                    }}>
                      {s.nome}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Input de nova subtarefa */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#1a1a22", border: "1px solid #26262d",
              borderRadius: 8, padding: "6px 10px",
            }}>
              <IcPlus size={13} />
              <input
                type="text"
                value={novaSubtarefa}
                onChange={(e) => setNovaSubtarefa(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") adicionarSubtarefa(); }}
                placeholder="Adicionar subtarefa..."
                style={{
                  flex: 1, background: "none", border: "none",
                  outline: "none", color: "#d4d4dc", fontSize: 13,
                  fontFamily: "inherit",
                }}
              />
            </div>
          </section>

          {/* Seção Atividade / Comentários */}
          <section>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#b6b6bf", margin: "0 0 10px" }}>
              Atividade
            </p>
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 10,
            }}>
              {/* Avatar do usuário atual (mock) */}
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: "#3d2a6b", color: "#d8ccff",
                fontSize: 10, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                RB
              </div>
              <div style={{
                flex: 1, background: "#1a1a22", border: "1px solid #26262d",
                borderRadius: 8, padding: "8px 12px",
                transition: "border-color .15s",
              }}
                onFocusCapture={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#7c5cff"; }}
                onBlurCapture={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#26262d"; }}
              >
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Adicionar comentário..."
                  rows={2}
                  style={{
                    width: "100%", background: "none", border: "none",
                    outline: "none", color: "#d4d4dc", fontSize: 13,
                    resize: "none", lineHeight: 1.6,
                    fontFamily: "inherit",
                  }}
                />
                {comentario.trim() && (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                    <button
                      type="button"
                      onClick={() => setComentario("")}
                      style={{
                        padding: "4px 12px", borderRadius: 5,
                        background: "#7c5cff", border: "none",
                        color: "#fff", fontSize: 12, fontWeight: 600,
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#6d4fee"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#7c5cff"; }}
                    >
                      Comentar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
