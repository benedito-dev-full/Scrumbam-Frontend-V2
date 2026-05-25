"use client";

import React, { use, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";

import { KanbanBoard } from "@/components/tasks/kanban-board";
import { TaskDetailDrawer } from "@/components/tasks/task-detail-drawer";
import { useProject, useLists } from "@/hooks/use-projects";
import { useTasksByProject, useCreateTask, useUpdateTask } from "@/hooks/use-tasks";
import {
  KANBAN_COLUMNS,
  intentionToColumn,
  isOverdue,
  priorityToColor,
  priorityToLabel,
} from "@/lib/mappers/task-status.mapper";
import type { TaskResponseDto, V3Intention } from "@/lib/types/api";
import { cn } from "@/lib/utils";

// ─── Tokens (espelham Marketing List.html) ────────────────────────────────────

const C = {
  bg:         "#111114",
  bg2:        "#17171b",
  line:       "#2a2a30",
  line2:      "#232328",
  text:       "#e9e9ee",
  muted:      "#a4a4ad",
  muted2:     "#8a8a93",
  chip:       "#1c1c21",
  chip2:      "#242429",
  accent:     "#7a5cff",
  accentBg:   "rgba(122,92,255,0.16)",
  accentBgS:  "rgba(122,92,255,0.28)",
  green:      "#22c55e",
} as const;

// ─── Config visual por status ─────────────────────────────────────────────────

type ColCfg = {
  label: string;
  chipBg: string;
  chipColor: string;
  dotEl: React.ReactNode;   // ícone SVG do dot dentro do chip
  taskStatusEl: React.ReactNode; // ícone na linha da task
};

const COL_CFG: Record<string, ColCfg> = {
  backlog: {
    label: "BACKLOG",
    chipBg: "#2a2a2f", chipColor: "#d6d6dc",
    dotEl: (
      <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#d6d6dc" strokeWidth="1.6" strokeDasharray="2 2">
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
    taskStatusEl: (
      <span style={{
        width: 14, height: 14, borderRadius: "50%",
        border: "1.5px dashed #6a6a72", background: "transparent",
        display: "inline-flex", flexShrink: 0,
      }} />
    ),
  },
  ready: {
    label: "READY",
    chipBg: "#1e3060", chipColor: "#93c5fd",
    dotEl: (
      <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="3" fill="#93c5fd" />
      </svg>
    ),
    taskStatusEl: (
      <span style={{
        width: 14, height: 14, borderRadius: "50%",
        border: "2px solid #3b82f6", background: "transparent",
        display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#3b82f6", display: "block" }} />
      </span>
    ),
  },
  "em-progresso": {
    label: "EM PROGRESSO",
    chipBg: "#6f54f7", chipColor: "#ffffff",
    dotEl: (
      <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3 a9 9 0 0 1 0 18" stroke="white" strokeWidth="3" fill="none" />
      </svg>
    ),
    taskStatusEl: (
      <span style={{
        width: 14, height: 14, borderRadius: "50%",
        border: "2px solid #7a5cff", background: "transparent",
        position: "relative", display: "inline-flex", flexShrink: 0,
      }}>
        <span style={{
          position: "absolute", inset: 2, borderRadius: "50%",
          background: "conic-gradient(#7a5cff 0 50%, transparent 50% 100%)",
        }} />
      </span>
    ),
  },
  concluido: {
    label: "CONCLUÍDO",
    chipBg: "#14532d", chipColor: "#6ee7b7",
    dotEl: (
      <svg width={10} height={10} viewBox="0 0 24 24" fill="#22c55e">
        <circle cx="12" cy="12" r="10" />
        <path d="M7 12.5l3.5 3.5 6-7" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    taskStatusEl: (
      <span style={{
        width: 14, height: 14, borderRadius: "50%",
        background: "#22c55e",
        display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    ),
  },
  falhou: {
    label: "FALHOU",
    chipBg: "#7f1d1d", chipColor: "#fca5a5",
    dotEl: (
      <svg width={10} height={10} viewBox="0 0 24 24" fill="#ef4444">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 8l8 8M16 8l-8 8" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    taskStatusEl: (
      <span style={{
        width: 14, height: 14, borderRadius: "50%",
        background: "#ef4444",
        display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </span>
    ),
  },
};

const PRIO_CFG: Record<string, { label: string; color: string }> = {
  URGENT: { label: "Urgente", color: "#ef4444" },
  HIGH:   { label: "Alta",    color: "#f59e0b" },
  MEDIUM: { label: "Média",   color: "#60a5fa" },
  LOW:    { label: "Baixa",   color: "#71717a" },
};

// ─── SVGs inline (copiados do HTML de referência) ─────────────────────────────

const IcoList = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: C.muted }}>
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);
const IcoBoard = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ color: "#f97316" }}>
    <rect x="3" y="4" width="5" height="16" rx="1" /><rect x="10" y="4" width="5" height="10" rx="1" /><rect x="17" y="4" width="4" height="13" rx="1" />
  </svg>
);
const IcoPlus = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IcoChevronDown = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IcoStar = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const IcoFilter = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);
const IcoCheck = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" />
  </svg>
);
const IcoUser = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const IcoSearch = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IcoSettings = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const IcoGitFork = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" /><path d="M3 6h4" /><path d="M3 12h4" /><path d="M3 18h4" />
  </svg>
);
const IcoColumns = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="1" /><line x1="9" y1="4" x2="9" y2="20" /><line x1="15" y1="4" x2="15" y2="20" />
  </svg>
);
const IcoLayers = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
  </svg>
);
const IcoUserAssign = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="3.2" /><path d="M5 20c0-3 3.2-5 7-5s7 2 7 5" /><line x1="17" y1="6" x2="20" y2="6" />
  </svg>
);
const IcoCalendar = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" />
    <line x1="8" y1="3" x2="8" y2="7" /><line x1="16" y1="3" x2="16" y2="7" />
    <line x1="16" y1="15" x2="18" y2="15" /><line x1="17" y1="14" x2="17" y2="16" />
  </svg>
);
const IcoFlag = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" />
  </svg>
);
const IcoCheckSmall = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: listData, isLoading } = useProject(id);
  const { data: folderData } = useProject(listData?.idPai ?? null);
  const { data: spaceData } = useProject(folderData?.idPai ?? null);

  const [view, setView] = useState<"lista" | "quadro">("lista");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalStatus, setCreateModalStatus] = useState<string>("backlog");

  function openCreateModal(colId?: string) {
    setCreateModalStatus(colId ?? "backlog");
    setCreateModalOpen(true);
  }

  if (isLoading) {
    return <div style={{ display: "grid", height: "100%", placeItems: "center", color: C.muted, fontSize: 13 }}>Carregando…</div>;
  }
  if (!listData) {
    return <div style={{ display: "grid", height: "100%", placeItems: "center", color: C.muted, fontSize: 13 }}>Lista não encontrada.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: 13 }}>

      {/* ── Top bar (44px) ───────────────────────────────────────────────────── */}
      <header style={{ height: 44, display: "flex", alignItems: "center", padding: "0 18px", gap: 6, borderBottom: `1px solid ${C.line2}`, flexShrink: 0 }}>

        {/* Breadcrumb */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 600 }}>
          {/* Ícone de folder (space) */}
          {spaceData && (
            <>
              <span style={{ width: 16, height: 16, background: C.green, borderRadius: 3, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#0a0a0a", fontSize: 10, fontWeight: 800 }}>
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
              </span>
              <Link href={`/spaces/${spaceData.id}`} style={{ color: C.text }}>{spaceData.nome}</Link>
              <span style={{ color: C.muted2, margin: "0 4px", fontWeight: 400 }}>/</span>
            </>
          )}
          {folderData && (
            <>
              <Link href={`/folders/${folderData.id}`} style={{ color: C.text }}>{folderData.nome}</Link>
              <span style={{ color: C.muted2, margin: "0 4px", fontWeight: 400 }}>/</span>
            </>
          )}
          {/* List pill */}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
            <IcoList />
            List
            <span style={{ color: C.muted2, fontSize: 10 }}>▾</span>
          </span>
        </div>

        {/* Estrela favorito */}
        <button type="button" style={{ color: C.muted2, marginLeft: 4, fontSize: 14, padding: 4, borderRadius: 6, background: "none", border: 0, cursor: "pointer", display: "inline-flex" }}>
          <IcoStar />
        </button>

        {/* Ações direita */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
          {/* Telefone + caret */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.text, fontSize: 13 }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span style={{ color: C.muted2, fontSize: 10 }}>▾</span>
          </div>
          {/* Agentes */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.text, fontSize: 13 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="6" width="18" height="12" rx="2" /><path d="M7 12h.01" /><path d="M12 12h.01" /><path d="M17 12h.01" />
            </svg>
            <span>Agentes</span>
          </div>
          {/* Bolt amarelo */}
          <div style={{ display: "inline-flex", alignItems: "center", color: "#facc15" }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          {/* Pergunte à IA */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#ff7ab6", fontSize: 13 }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <circle cx="12" cy="12" r="3" /><circle cx="5" cy="12" r="2.5" opacity=".6" /><circle cx="19" cy="12" r="2.5" opacity=".6" /><circle cx="12" cy="5" r="2.5" opacity=".6" /><circle cx="12" cy="19" r="2.5" opacity=".6" />
            </svg>
            <span>Pergunte à IA</span>
          </div>
          {/* Compartilhar */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.text, fontSize: 13 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>Compartilhar</span>
          </div>
        </div>
      </header>

      {/* ── Tabs row (40px) ──────────────────────────────────────────────────── */}
      <nav style={{ height: 40, display: "flex", alignItems: "center", padding: "0 18px", gap: 6, borderBottom: `1px solid ${C.line2}`, flexShrink: 0 }}>
        {/* Adicionar canal */}
        <button type="button" style={{ padding: "6px 10px", borderRadius: 6, color: C.text, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6, height: 28, background: "none", border: `1px solid ${C.line}`, fontWeight: 500, cursor: "pointer" }}>
          Adicionar canal
        </button>

        {/* Lista (ativa) */}
        <button
          type="button"
          onClick={() => setView("lista")}
          style={{
            padding: "6px 10px", borderRadius: 6, fontSize: 13,
            display: "inline-flex", alignItems: "center", gap: 6, height: 28, cursor: "pointer",
            color: view === "lista" ? C.text : C.muted,
            background: view === "lista" ? C.chip : "none",
            fontWeight: view === "lista" ? 600 : 400,
            border: 0,
          }}
        >
          <IcoList />
          Lista
        </button>

        {/* Quadro */}
        <button
          type="button"
          onClick={() => setView("quadro")}
          style={{
            padding: "6px 10px", borderRadius: 6, fontSize: 13,
            display: "inline-flex", alignItems: "center", gap: 6, height: 28, cursor: "pointer",
            color: view === "quadro" ? C.text : C.muted,
            background: view === "quadro" ? C.chip : "none",
            fontWeight: view === "quadro" ? 600 : 400,
            border: 0,
          }}
        >
          <IcoBoard />
          Quadro
        </button>

        {/* + Visualização */}
        <button type="button" style={{ padding: "6px 10px", borderRadius: 6, color: C.muted, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6, height: 28, background: "none", border: 0, cursor: "pointer" }}>
          <IcoPlus size={12} />
          Visualização
        </button>
      </nav>

      {/* ── Toolbar (48px) ───────────────────────────────────────────────────── */}
      <Toolbar listId={id} onOpenModal={() => openCreateModal()} />

      {/* ── Conteúdo ────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        {view === "lista" ? (
          <ListView listId={id} onSelectTask={setSelectedTaskId} onOpenModal={openCreateModal} />
        ) : (
          <KanbanBoard projectId={id} onSelectTask={setSelectedTaskId} />
        )}
      </div>

      {selectedTaskId && (
        <TaskDetailDrawer
          taskId={selectedTaskId}
          projectId={id}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

      {createModalOpen && (
        <CreateTaskModal
          listId={id}
          listName={listData.nome}
          folderId={listData.idPai ?? null}
          defaultColId={createModalStatus}
          onClose={() => setCreateModalOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

function Toolbar({ listId, onOpenModal }: { listId: string; onOpenModal: () => void }) {
  const { mutate: createTask } = useCreateTask();
  void createTask; // usado via onOpenModal agora

  const toolStyle: React.CSSProperties = {
    height: 30, padding: "0 10px", borderRadius: 6,
    display: "inline-flex", alignItems: "center", gap: 6,
    color: C.text, fontSize: 12.5, background: "none", border: 0, cursor: "pointer",
  };

  return (
    <div style={{ height: 48, display: "flex", alignItems: "center", padding: "0 18px", gap: 8, borderBottom: `1px solid ${C.line2}`, flexShrink: 0 }}>
      {/* Esquerda */}
      <button type="button" style={{ ...toolStyle, background: C.accentBg, color: "#cfc4ff" }}>
        <span style={{ color: "#cfc4ff", display: "inline-flex" }}><IcoLayers /></span>
        Grupo: Status
      </button>
      <button type="button" style={toolStyle}>
        <span style={{ color: C.muted, display: "inline-flex" }}><IcoGitFork /></span>
        Subtarefas
      </button>
      <button type="button" style={toolStyle}>
        <span style={{ color: C.muted, display: "inline-flex" }}><IcoColumns /></span>
        Colunas
      </button>

      {/* Direita */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
        <button type="button" style={toolStyle}>
          <span style={{ color: C.muted, display: "inline-flex" }}><IcoFilter /></span>
          Filtro
        </button>
        <button type="button" style={toolStyle}>
          <span style={{ color: C.muted, display: "inline-flex" }}><IcoCheck /></span>
          Fechado
        </button>
        <button type="button" style={toolStyle}>
          <span style={{ color: C.muted, display: "inline-flex" }}><IcoUser /></span>
          Responsável
        </button>

        {/* Avatar B */}
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "white", fontWeight: 700, fontSize: 11, display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "0 2px" }}>
          B
        </div>

        {/* Search */}
        <button type="button" style={{ width: 30, height: 30, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", color: C.muted, background: "none", border: 0, cursor: "pointer" }}>
          <IcoSearch />
        </button>

        {/* Personalizar */}
        <button type="button" style={toolStyle}>
          <span style={{ color: C.muted, display: "inline-flex" }}><IcoSettings /></span>
          Personalizar
        </button>

        {/* Add Tarefa split */}
        <div style={{ display: "inline-flex", alignItems: "center" }}>
          <button
            type="button"
            onClick={onOpenModal}
            style={{ height: 30, background: "#6f54f7", color: "white", padding: "0 12px", borderRadius: "6px 0 0 6px", fontWeight: 600, fontSize: 12.5, display: "inline-flex", alignItems: "center", border: 0, cursor: "pointer" }}
          >
            Add Tarefa
          </button>
          <button
            type="button"
            onClick={onOpenModal}
            style={{ height: 30, background: "#6f54f7", color: "white", padding: "0 8px", borderRadius: "0 6px 6px 0", marginLeft: 1, display: "inline-flex", alignItems: "center", border: 0, cursor: "pointer", borderLeft: "1px solid rgba(255,255,255,0.18)" }}
          >
            <IcoChevronDown />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Lista ────────────────────────────────────────────────────────────────────

function ListView({ listId, onSelectTask, onOpenModal }: {
  listId: string;
  onSelectTask: (id: string) => void;
  onOpenModal: (colId: string) => void;
}) {
  const { data: tasks = [], isLoading } = useTasksByProject(listId);

  const groups = KANBAN_COLUMNS.map((col) => ({
    col,
    tasks: tasks.filter((t) => intentionToColumn(t.status as V3Intention) === col.id),
  }));

  return (
    <div style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
      <div style={{ minWidth: 720, padding: "18px 18px 0 18px" }}>
        {isLoading ? (
          <Skeleton />
        ) : (
          <>
            {groups.map(({ col, tasks: gt }) => {
              const cfg = COL_CFG[col.id] ?? COL_CFG.backlog;
              return (
                <GroupBlock
                  key={col.id}
                  cfg={cfg}
                  tasks={gt}
                  listId={listId}
                  onSelectTask={onSelectTask}
                  onOpenModal={() => onOpenModal(col.id)}
                />
              );
            })}

            {/* Novo status */}
            <button
              type="button"
              style={{ marginTop: 12, color: C.muted, fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", background: "none", border: 0 }}
            >
              <IcoPlus size={12} />
              Novo status
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── GroupBlock ───────────────────────────────────────────────────────────────

function GroupBlock({ cfg, tasks, listId, onSelectTask, onOpenModal }: {
  cfg: ColCfg;
  tasks: TaskResponseDto[];
  listId: string;
  onSelectTask: (id: string) => void;
  onOpenModal: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [addingInline, setAddingInline] = useState(false);
  const [draft, setDraft] = useState("");
  const { mutate: createTask, isPending } = useCreateTask();

  function handleInlineSubmit() {
    if (!draft.trim()) return;
    createTask(
      { titulo: draft.trim(), idProject: listId },
      { onSuccess: () => { setDraft(""); setAddingInline(false); } },
    );
  }

  return (
    <div style={{ marginBottom: 22 }}>
      {/* Group header */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 8, height: 28, marginLeft: 22, position: "relative", cursor: "pointer" }}
        onClick={() => setOpen((v) => !v)}
      >
        {/* Twirl */}
        <span style={{
          width: 16, height: 16, position: "absolute", marginLeft: -22,
          color: C.muted, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10,
          transform: open ? "none" : "rotate(-90deg)", transition: "transform 0.15s",
        }}>
          <svg width={10} height={10} viewBox="0 0 24 24" fill="currentColor">
            <polygon points="6 9 18 9 12 17" />
          </svg>
        </span>

        {/* Status chip */}
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          height: 22, padding: "0 9px", borderRadius: 4,
          fontSize: 10.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
          background: cfg.chipBg, color: cfg.chipColor,
        }}>
          <span style={{ width: 10, height: 10, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            {cfg.dotEl}
          </span>
          {cfg.label}
        </span>

        <span style={{ color: C.muted, fontSize: 12 }}>{tasks.length}</span>
      </div>

      {/* Table */}
      {open && (
        <div style={{ marginTop: 4, borderTop: `1px solid ${C.line2}` }}>
          {/* Head row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) 220px 220px 220px 40px",
            alignItems: "center", height: 32, borderBottom: `1px solid ${C.line2}`,
            padding: "0 14px 0 6px", color: C.muted, fontSize: 12,
          }}>
            <div style={{ paddingLeft: 30 }}>Nome</div>
            <div>Responsável</div>
            <div>Data de vencimento</div>
            <div>Prioridade</div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <span style={{
                width: 22, height: 22, borderRadius: "50%", background: "#2a2a2f",
                display: "inline-flex", alignItems: "center", justifyContent: "center", color: C.muted, cursor: "pointer",
              }}>
                <IcoPlus size={11} />
              </span>
            </div>
          </div>

          {/* Task rows */}
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              cfg={cfg}
              listId={listId}
              onOpen={() => onSelectTask(task.id)}
            />
          ))}

          {/* Adicionar Tarefa / inline input */}
          {addingInline ? (
            <div style={{
              height: 32, display: "flex", alignItems: "center", gap: 8,
              paddingLeft: 14, borderBottom: `1px solid ${C.line2}`, color: C.muted, fontSize: 12.5,
            }}>
              <span style={{ width: 16, display: "inline-flex", justifyContent: "center", color: C.muted }}>
                {cfg.taskStatusEl}
              </span>
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleInlineSubmit();
                  if (e.key === "Escape") { setAddingInline(false); setDraft(""); }
                }}
                placeholder="Nome da tarefa…"
                disabled={isPending}
                style={{ flex: 1, background: "transparent", border: 0, outline: "none", color: C.text, fontSize: 13 }}
              />
              <span style={{ fontSize: 11, color: C.muted2, paddingRight: 8 }}>Enter · Esc</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingInline(true)}
              style={{
                height: 32, display: "flex", alignItems: "center", gap: 8,
                paddingLeft: 14, width: "100%", background: "none", border: 0,
                borderBottom: `1px solid ${C.line2}`, color: C.muted, fontSize: 12.5, cursor: "pointer",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = C.text; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; }}
            >
              <span style={{ width: 16, display: "inline-flex", justifyContent: "center", color: C.muted }}>
                <IcoPlus size={12} />
              </span>
              Adicionar Tarefa
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── TaskRow ──────────────────────────────────────────────────────────────────

function TaskRow({ task, cfg, listId, onOpen }: {
  task: TaskResponseDto;
  cfg: ColCfg;
  listId: string;
  onOpen: () => void;
}) {
  const { mutate: updateTask } = useUpdateTask();
  const [hovered, setHovered] = useState(false);
  const [flashCell, setFlashCell] = useState<string | null>(null);
  const [openDD, setOpenDD] = useState<string | null>(null);

  const respRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const prioRef = useRef<HTMLDivElement>(null);

  function saveAndFlash(cell: string, dto: { priority?: string; dueDate?: string | null; assigneeId?: string | null }) {
    updateTask({ id: task.id, projectId: listId, dto });
    setFlashCell(cell);
    setTimeout(() => setFlashCell(null), 600);
  }

  const overdue = isOverdue(task.dueDate, task.status as V3Intention);
  const dateLabel = task.dueDate
    ? new Date(task.dueDate.slice(0, 10) + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    : null;
  const prioLabel = task.priority ? priorityToLabel(task.priority) : null;
  const prioColor = task.priority ? priorityToColor(task.priority) : null;

  const rowStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "minmax(0,1fr) 220px 220px 220px 40px",
    alignItems: "center", height: 36,
    borderBottom: `1px solid ${C.line2}`,
    padding: "0 14px 0 6px",
    background: hovered ? "rgba(255,255,255,0.015)" : "transparent",
    position: "relative",
  };

  const cellIconStyle: React.CSSProperties = {
    color: hovered ? "#b6b6bf" : "#6a6a75",
    fontSize: 14, display: "flex", alignItems: "center", gap: 4,
    cursor: "pointer", height: "100%", paddingLeft: 8,
    transition: "color .1s",
  };

  return (
    <div style={rowStyle} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>

      {/* Nome */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 30, fontWeight: 600, color: C.text, fontSize: 13, overflow: "hidden" }}>
        <span style={{ flexShrink: 0 }}>{cfg.taskStatusEl}</span>
        <button
          type="button"
          onClick={onOpen}
          style={{ background: "none", border: 0, color: C.text, fontSize: 13, fontWeight: 600, cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "left" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#cfc1ff"; e.currentTarget.style.textDecoration = "underline"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = C.text; e.currentTarget.style.textDecoration = "none"; }}
        >
          {task.nome}
        </button>
        {task.identifier && (
          <span style={{ fontFamily: "monospace", fontSize: 11, color: "#5a5a64", opacity: hovered ? 1 : 0, transition: "opacity .15s", flexShrink: 0 }}>
            {task.identifier}
          </span>
        )}
      </div>

      {/* Responsável */}
      <EditableCell cellRef={respRef} active={openDD === "resp"} flash={flashCell === "resp"} onClick={() => setOpenDD((v) => v === "resp" ? null : "resp")}>
        <div style={cellIconStyle}>
          {task.assigneeId ? (
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#3d2a6b", color: "#d8ccff", fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {task.assigneeId.slice(0, 2).toUpperCase()}
            </div>
          ) : (
            <IcoUserAssign />
          )}
        </div>
        {openDD === "resp" && (
          <CellDropdown anchorRef={respRef} onClose={() => setOpenDD(null)}>
            <DropItem active={!task.assigneeId} onClick={() => setOpenDD(null)}>
              <span style={{ color: C.muted }}>Sem responsável</span>
            </DropItem>
          </CellDropdown>
        )}
      </EditableCell>

      {/* Data de vencimento */}
      <EditableCell cellRef={dateRef} active={openDD === "data"} flash={flashCell === "data"} onClick={() => setOpenDD((v) => v === "data" ? null : "data")}>
        <div style={cellIconStyle}>
          {dateLabel ? (
            <span style={{ fontSize: 13, color: overdue ? "#fbbf24" : C.muted }}>{dateLabel}</span>
          ) : (
            <IcoCalendar />
          )}
        </div>
        {openDD === "data" && (
          <CellDropdown anchorRef={dateRef} onClose={() => setOpenDD(null)}>
            <div style={{ padding: "4px 6px 6px" }}>
              <p style={{ fontSize: 11, color: C.muted, margin: "0 0 6px", fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase" }}>Data de vencimento</p>
              <input
                type="date"
                autoFocus
                defaultValue={task.dueDate ? task.dueDate.slice(0, 10) : ""}
                onChange={(e) => saveAndFlash("data", { dueDate: e.target.value || null })}
                onBlur={() => setOpenDD(null)}
                style={{ background: "#26262f", border: "1px solid #3a3a46", borderRadius: 6, color: "#d4d4dc", fontSize: 12, padding: "5px 8px", outline: "none", width: "100%", colorScheme: "dark" } as React.CSSProperties}
              />
              {task.dueDate && (
                <button
                  type="button"
                  onClick={() => { saveAndFlash("data", { dueDate: null }); setOpenDD(null); }}
                  style={{ marginTop: 6, width: "100%", padding: "5px 0", background: "none", border: "1px solid #2e2e38", borderRadius: 5, color: "#ef4444", fontSize: 12, cursor: "pointer" }}
                >
                  Remover data
                </button>
              )}
            </div>
          </CellDropdown>
        )}
      </EditableCell>

      {/* Prioridade */}
      <EditableCell cellRef={prioRef} active={openDD === "prio"} flash={flashCell === "prio"} onClick={() => setOpenDD((v) => v === "prio" ? null : "prio")}>
        <div style={cellIconStyle}>
          {prioLabel && prioColor ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: prioColor }}>
              <IcoFlag />{prioLabel}
            </span>
          ) : (
            <IcoFlag />
          )}
        </div>
        {openDD === "prio" && (
          <CellDropdown anchorRef={prioRef} onClose={() => setOpenDD(null)}>
            <DropItem active={!task.priority} onClick={() => { saveAndFlash("prio", { priority: undefined }); setOpenDD(null); }}>
              <IcoFlag /><span style={{ color: C.muted }}>Sem prioridade</span>
            </DropItem>
            {(["URGENT", "HIGH", "MEDIUM", "LOW"] as const).map((p) => {
              const c = PRIO_CFG[p];
              return (
                <DropItem key={p} active={task.priority === p} onClick={() => { saveAndFlash("prio", { priority: p }); setOpenDD(null); }}>
                  <IcoFlag /><span style={{ color: c.color }}>{c.label}</span>
                </DropItem>
              );
            })}
          </CellDropdown>
        )}
      </EditableCell>

      <div />
    </div>
  );
}

// ─── EditableCell ─────────────────────────────────────────────────────────────

function EditableCell({ cellRef, active, flash, onClick, children }: {
  cellRef: React.RefObject<HTMLDivElement | null>;
  active: boolean;
  flash: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const [hov, setHov] = useState(false);
  const [phase, setPhase] = useState<"idle" | "in" | "out">("idle");

  useEffect(() => {
    if (!flash) return;
    setPhase("in");
    const t1 = setTimeout(() => setPhase("out"), 200);
    const t2 = setTimeout(() => setPhase("idle"), 650);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [flash]);

  return (
    <div
      ref={cellRef}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        height: "100%", cursor: "pointer", position: "relative",
        boxShadow: hov || active ? "inset 0 0 0 1px #3a3a46" : "none",
        borderRadius: 4, transition: "box-shadow .1s",
      }}
    >
      {phase !== "idle" && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: 4, pointerEvents: "none",
          background: "rgba(34,197,94,0.28)",
          opacity: phase === "in" ? 1 : 0,
          transition: phase === "in" ? "opacity .15s ease-in" : "opacity .45s ease-out",
        }} />
      )}
      {children}
    </div>
  );
}

// ─── CellDropdown ─────────────────────────────────────────────────────────────

function CellDropdown({ anchorRef, onClose, children }: {
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left });
  }, [anchorRef]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (dropRef.current?.contains(e.target as Node)) return;
      if (anchorRef.current?.contains(e.target as Node)) return;
      onClose();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [anchorRef, onClose]);

  return createPortal(
    <div ref={dropRef} onClick={(e) => e.stopPropagation()} style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 99999, background: "#1c1c24", border: "1px solid #2e2e38", borderRadius: 8, padding: 4, minWidth: 180, boxShadow: "0 8px 24px rgba(0,0,0,.5)" }}>
      {children}
    </div>,
    document.body,
  );
}

function DropItem({ children, active, onClick }: {
  children: React.ReactNode; active?: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        display: "flex", alignItems: "center", gap: 8, width: "100%",
        padding: "7px 10px", borderRadius: 5,
        background: active ? "rgba(124,92,255,0.12)" : "none",
        border: 0, color: "#d4d4dc", fontSize: 12, cursor: "pointer", textAlign: "left",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#26262f"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = active ? "rgba(124,92,255,0.12)" : "none"; }}
    >
      {children}
      {active && <span style={{ marginLeft: "auto", color: C.accent }}><IcoCheckSmall /></span>}
    </button>
  );
}

// ─── Modal de criação de tarefa ───────────────────────────────────────────────

function CreateTaskModal({
  listId, listName, folderId, defaultColId, onClose,
}: {
  listId: string;
  listName: string;
  folderId: string | null;
  defaultColId: string;
  onClose: () => void;
}) {
  const { mutate: createTask, isPending } = useCreateTask();
  const { data: availableLists = [] } = useLists(folderId);

  const [titulo, setTitulo] = useState("");
  const [descricaoOpen, setDescricaoOpen] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [priority, setPriority] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string>("");
  const [selectedListId, setSelectedListId] = useState(listId);
  const [selectedColId, setSelectedColId] = useState(defaultColId);

  const [showListDD, setShowListDD] = useState(false);
  const [showStatusDD, setShowStatusDD] = useState(false);
  const [showRespDD, setShowRespDD] = useState(false);
  const [showPrioDD, setShowPrioDD] = useState(false);
  const [showDateDD, setShowDateDD] = useState(false);

  const listBtnRef  = useRef<HTMLButtonElement>(null);
  const statusBtnRef = useRef<HTMLButtonElement>(null);
  const respBtnRef  = useRef<HTMLButtonElement>(null);
  const prioRef     = useRef<HTMLButtonElement>(null);
  const dateRef     = useRef<HTMLButtonElement>(null);

  const cfg = COL_CFG[selectedColId] ?? COL_CFG.backlog;
  const selectedListName = availableLists.find((l) => l.id === selectedListId)?.nome ?? listName;

  const prioOptions = [
    { key: "URGENT", label: "Urgente", color: "#ef4444" },
    { key: "HIGH",   label: "Alta",    color: "#f59e0b" },
    { key: "MEDIUM", label: "Média",   color: "#60a5fa" },
    { key: "LOW",    label: "Baixa",   color: "#71717a" },
  ] as const;
  const selectedPrio = prioOptions.find((p) => p.key === priority);

  const statusOptions = Object.entries(COL_CFG);

  function handleCreate() {
    if (!titulo.trim() || isPending) return;
    createTask(
      {
        titulo: titulo.trim(),
        idProject: selectedListId,
        ...(priority ? { priority } : {}),
        ...(dueDate ? { dueDate } : {}),
      },
      { onSuccess: onClose },
    );
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const TABS = ["Tarefa", "Documento", "Lembrete", "Quadro branco", "Painéis"] as const;
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("Tarefa");

  const chipStyle = (active?: boolean): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 5,
    height: 26, padding: "0 10px", borderRadius: 5,
    background: active ? "#2e2e38" : "#2a2a30",
    border: "1px solid #3a3a42",
    color: "#b6b6bf", fontSize: 12, fontWeight: 500, cursor: "pointer",
  });

  const fieldBtn: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6,
    height: 28, padding: "0 10px", borderRadius: 6,
    background: "#232328", border: "1px solid #32323a",
    color: "#8a8a93", fontSize: 12, cursor: "pointer",
  };

  return createPortal(
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }} />

      {/* Modal */}
      <div style={{
        position: "fixed", zIndex: 10001,
        top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: 680, maxWidth: "calc(100vw - 32px)",
        background: "#1a1a20", border: "1px solid #2e2e38", borderRadius: 12,
        boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
        display: "flex", flexDirection: "column", overflow: "visible",
      }}>
        {/* ── Tabs ── */}
        <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #2a2a30", padding: "0 16px", gap: 2, borderRadius: "12px 12px 0 0", overflow: "hidden" }}>
          {TABS.map((t) => (
            <button key={t} type="button" onClick={() => setActiveTab(t)} style={{
              height: 44, padding: "0 14px", background: "none", border: 0, cursor: "pointer",
              fontSize: 13, fontWeight: 500,
              color: activeTab === t ? "#e9e9ee" : "#7a7a85",
              borderBottom: activeTab === t ? "2px solid #7a5cff" : "2px solid transparent",
            }}>{t}</button>
          ))}
          <button type="button" onClick={onClose} style={{
            marginLeft: "auto", width: 28, height: 28, borderRadius: 6,
            background: "none", border: 0, color: "#7a7a85", cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 16,
          }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#e9e9ee"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#7a7a85"; }}
          >✕</button>
        </div>

        {/* ── Corpo ── */}
        <div style={{ padding: "16px 20px 0 20px" }}>

          {/* Chips Lista + Status */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>

            {/* Lista dropdown */}
            <div style={{ position: "relative" }}>
              <button ref={listBtnRef} type="button" onClick={() => setShowListDD((v) => !v)} style={chipStyle(showListDD)}>
                <IcoList />
                {selectedListName}
                <IcoChevronDown size={9} />
              </button>
              {showListDD && availableLists.length > 0 && (
                <CellDropdown anchorRef={listBtnRef} onClose={() => setShowListDD(false)}>
                  {availableLists.map((l) => (
                    <DropItem key={l.id} active={l.id === selectedListId} onClick={() => { setSelectedListId(l.id); setShowListDD(false); }}>
                      <IcoList />
                      {l.nome}
                    </DropItem>
                  ))}
                </CellDropdown>
              )}
            </div>

            {/* Status dropdown */}
            <div style={{ position: "relative" }}>
              <button ref={statusBtnRef} type="button" onClick={() => setShowStatusDD((v) => !v)} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                height: 26, padding: "0 10px", borderRadius: 5,
                background: cfg.chipBg, border: `1px solid ${cfg.chipBg}`,
                color: cfg.chipColor, fontSize: 12, fontWeight: 700,
                letterSpacing: "0.04em", textTransform: "uppercase", cursor: "pointer",
              }}>
                <span style={{ width: 10, height: 10, display: "inline-flex" }}>{cfg.dotEl}</span>
                {cfg.label}
                <IcoChevronDown size={9} />
              </button>
              {showStatusDD && (
                <CellDropdown anchorRef={statusBtnRef} onClose={() => setShowStatusDD(false)}>
                  {statusOptions.map(([colId, c]) => (
                    <DropItem key={colId} active={selectedColId === colId} onClick={() => { setSelectedColId(colId); setShowStatusDD(false); }}>
                      <span style={{ width: 10, height: 10, display: "inline-flex" }}>{c.dotEl}</span>
                      <span style={{ color: c.chipColor }}>{c.label}</span>
                    </DropItem>
                  ))}
                </CellDropdown>
              )}
            </div>
          </div>

          {/* Input título */}
          <input
            autoFocus
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleCreate(); }}
            placeholder="Nome da Tarefa ou digite '/' para inserir comandos"
            style={{
              width: "100%", background: "transparent", border: 0, outline: "none",
              color: "#e9e9ee", fontSize: 15, fontWeight: 500, marginBottom: 12,
              caretColor: "#7a5cff",
            }}
          />

          {/* Adicionar descrição — toggle textarea */}
          {descricaoOpen ? (
            <textarea
              autoFocus
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Adicione uma descrição…"
              rows={3}
              style={{
                width: "100%", background: "#232328", border: "1px solid #32323a",
                borderRadius: 6, outline: "none", color: "#e9e9ee", fontSize: 13,
                padding: "8px 10px", resize: "vertical", marginBottom: 10,
                caretColor: "#7a5cff",
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setDescricaoOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: 9, background: "none", border: 0, color: "#7a7a85", fontSize: 13, cursor: "pointer", padding: "2px 0", marginBottom: 8 }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#e9e9ee"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#7a7a85"; }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Adicionar descrição
            </button>
          )}

          {/* Escrever com IA */}
          <button
            type="button"
            style={{ display: "flex", alignItems: "center", gap: 9, background: "none", border: 0, color: "#7a7a85", fontSize: 13, cursor: "pointer", padding: "2px 0", marginBottom: 14 }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#e9e9ee"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#7a7a85"; }}
          >
            <span style={{ width: 14, height: 14, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #3b82f6)", display: "inline-flex", flexShrink: 0 }} />
            Escrever com IA
          </button>

          {/* Campos rápidos */}
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, paddingBottom: 16, borderBottom: "1px solid #26262d" }}>

            {/* Responsável */}
            <div style={{ position: "relative" }}>
              <button ref={respBtnRef} type="button" onClick={() => setShowRespDD((v) => !v)} style={fieldBtn}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#4a4a52"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#32323a"; }}
              >
                <IcoUserAssign />
                Responsável
              </button>
              {showRespDD && (
                <CellDropdown anchorRef={respBtnRef} onClose={() => setShowRespDD(false)}>
                  <div style={{ padding: "8px 10px" }}>
                    <p style={{ fontSize: 11, color: "#7a7a85", margin: "0 0 8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>Responsável</p>
                    <DropItem active onClick={() => setShowRespDD(false)}>
                      <span style={{ color: "#7a7a85" }}>Sem responsável (em breve)</span>
                    </DropItem>
                  </div>
                </CellDropdown>
              )}
            </div>

            {/* Data de vencimento */}
            <div style={{ position: "relative" }}>
              <button ref={dateRef} type="button" onClick={() => setShowDateDD((v) => !v)} style={{
                ...fieldBtn,
                background: dueDate ? "#1e3060" : "#232328",
                border: `1px solid ${dueDate ? "#3b82f6" : "#32323a"}`,
                color: dueDate ? "#93c5fd" : "#8a8a93",
              }}
                onMouseEnter={(e) => { if (!dueDate) e.currentTarget.style.borderColor = "#4a4a52"; }}
                onMouseLeave={(e) => { if (!dueDate) e.currentTarget.style.borderColor = dueDate ? "#3b82f6" : "#32323a"; }}
              >
                <IcoCalendar />
                {dueDate
                  ? new Date(dueDate + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
                  : "Data de vencimento"}
              </button>
              {showDateDD && (
                <CellDropdown anchorRef={dateRef} onClose={() => setShowDateDD(false)}>
                  <div style={{ padding: "8px 10px" }}>
                    <p style={{ fontSize: 11, color: "#7a7a85", margin: "0 0 8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>Data de vencimento</p>
                    <input type="date" autoFocus value={dueDate}
                      onChange={(e) => { setDueDate(e.target.value); setShowDateDD(false); }}
                      style={{
                        background: "#26262f", border: "1px solid #3a3a46", borderRadius: 6,
                        color: "#d4d4dc", fontSize: 12, padding: "5px 8px", outline: "none",
                        width: "100%", colorScheme: "dark" as React.CSSProperties["colorScheme"],
                      }}
                    />
                    {dueDate && (
                      <button type="button" onClick={() => { setDueDate(""); setShowDateDD(false); }}
                        style={{ marginTop: 6, width: "100%", padding: "5px 0", background: "none", border: "1px solid #2e2e38", borderRadius: 5, color: "#ef4444", fontSize: 12, cursor: "pointer" }}>
                        Remover data
                      </button>
                    )}
                  </div>
                </CellDropdown>
              )}
            </div>

            {/* Prioridade */}
            <div style={{ position: "relative" }}>
              <button ref={prioRef} type="button" onClick={() => setShowPrioDD((v) => !v)} style={{
                ...fieldBtn,
                background: selectedPrio ? "rgba(0,0,0,0.2)" : "#232328",
                border: `1px solid ${selectedPrio ? selectedPrio.color + "55" : "#32323a"}`,
                color: selectedPrio ? selectedPrio.color : "#8a8a93",
              }}
                onMouseEnter={(e) => { if (!selectedPrio) e.currentTarget.style.borderColor = "#4a4a52"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = selectedPrio ? (selectedPrio.color + "55") : "#32323a"; }}
              >
                <IcoFlag />
                {selectedPrio ? selectedPrio.label : "Prioridade"}
              </button>
              {showPrioDD && (
                <CellDropdown anchorRef={prioRef} onClose={() => setShowPrioDD(false)}>
                  <DropItem active={!priority} onClick={() => { setPriority(null); setShowPrioDD(false); }}>
                    <IcoFlag /><span style={{ color: "#7a7a85" }}>Sem prioridade</span>
                  </DropItem>
                  {prioOptions.map((p) => (
                    <DropItem key={p.key} active={priority === p.key} onClick={() => { setPriority(p.key); setShowPrioDD(false); }}>
                      <IcoFlag /><span style={{ color: p.color }}>{p.label}</span>
                    </DropItem>
                  ))}
                </CellDropdown>
              )}
            </div>
          </div>
        </div>

        {/* ── Rodapé ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderTop: "1px solid #2a2a30" }}>
          <button type="button" style={{
            display: "inline-flex", alignItems: "center", gap: 6, height: 32, padding: "0 12px",
            borderRadius: 6, background: "#232328", border: "1px solid #32323a",
            color: "#8a8a93", fontSize: 12.5, cursor: "pointer",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#e9e9ee"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#8a8a93"; }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            Modelos
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button type="button" style={{ width: 32, height: 32, borderRadius: 6, background: "none", border: 0, color: "#7a7a85", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <button type="button" style={{ width: 32, height: 32, borderRadius: 6, background: "none", border: 0, color: "#7a7a85", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 3, fontSize: 12 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span>1</span>
            </button>

            <div style={{ display: "inline-flex", alignItems: "center", borderRadius: 6, overflow: "hidden", border: "1px solid #4a3fbb" }}>
              <button type="button" onClick={handleCreate} disabled={!titulo.trim() || isPending}
                style={{
                  height: 32, padding: "0 16px",
                  background: titulo.trim() ? "#5a4fcf" : "#3a3550",
                  border: 0, cursor: titulo.trim() ? "pointer" : "not-allowed",
                  color: titulo.trim() ? "white" : "#7a7a85",
                  fontSize: 13, fontWeight: 600, transition: "background .15s",
                }}
                onMouseEnter={(e) => { if (titulo.trim()) e.currentTarget.style.background = "#6b5fdd"; }}
                onMouseLeave={(e) => { if (titulo.trim()) e.currentTarget.style.background = "#5a4fcf"; }}
              >
                {isPending ? "Criando…" : "Criar Tarefa"}
              </button>
              <button type="button" style={{
                height: 32, padding: "0 8px", background: "#5a4fcf", border: 0, cursor: "pointer",
                color: "white", borderLeft: "1px solid rgba(255,255,255,0.15)",
                display: "inline-flex", alignItems: "center",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#6b5fdd"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#5a4fcf"; }}
              >
                <IcoChevronDown size={11} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div>
      {[1, 2, 3].map((g) => (
        <div key={g} style={{ marginBottom: 22 }}>
          <div style={{ height: 28, display: "flex", alignItems: "center", gap: 8, paddingLeft: 22 }}>
            <div style={{ height: 20, width: 90, borderRadius: 4, background: "#2a2a32", animation: "pulse 1.5s infinite" }} />
          </div>
          {[1, 2].map((r) => (
            <div key={r} style={{ height: 36, display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.line2}`, paddingLeft: 36 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#2a2a32" }} />
              <div style={{ height: 12, width: 180, borderRadius: 4, background: "#2a2a32" }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
