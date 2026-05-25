"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  IcCaretR, IcGitFork, IcUserPlus, IcCalPlus, IcFlag, IcChat, IcPending, IcCheck,
} from "./icons";
import { STATUS_CONFIG, PRIO_CONFIG, INLINE_PILL_STYLE } from "./config";
import { mockMembros } from "@/lib/mocks/entidades";
import { diasUntil } from "@/lib/mocks/tarefas";
import { useTasksStore } from "@/lib/stores/tasks";
import type { Prioridade, StatusTarefa, Tarefa } from "@/lib/types/tarefa";

/* ─── Dropdown portal ──────────────────────────────────────────────────────── */

function CellDropdown({
  anchorRef,
  onClose,
  children,
}: {
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
    <div
      ref={dropRef}
      style={{
        position: "fixed", top: pos.top, left: pos.left, zIndex: 99999,
        background: "#1c1c24", border: "1px solid #2e2e38", borderRadius: 8,
        padding: "4px", minWidth: 180,
        boxShadow: "0 8px 24px rgba(0,0,0,.5)",
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

function DropItem({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        width: "100%", padding: "7px 10px", borderRadius: 5,
        background: active ? "rgba(124,92,255,0.12)" : "none",
        border: 0, color: "#d4d4dc", fontSize: 12,
        cursor: "pointer", textAlign: "left",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#26262f"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "none"; }}
    >
      {children}
      {active && <span style={{ marginLeft: "auto", color: "#7c5cff" }}><IcCheck size={11} /></span>}
    </button>
  );
}

/* ─── TaskRow ──────────────────────────────────────────────────────────────── */

/**
 * Linha individual de uma tarefa na tabela do board.
 *
 * Expande para mostrar subtarefas quando `expanded` é true.
 * Campos Responsável, Data, Prioridade e Status são editáveis inline via dropdown.
 */
export function TaskRow({
  tarefa,
  status,
  expanded,
  onToggle,
  onOpen,
}: {
  tarefa: Tarefa;
  status: StatusTarefa;
  expanded: boolean;
  onToggle: () => void;
  onOpen?: () => void;
}) {
  const updateTask = useTasksStore((s) => s.updateTask);
  const [rowHovered, setRowHovered] = useState(false);
  const [openDD, setOpenDD] = useState<string | null>(null);
  /* célula que está a piscar verde após salvar */
  const [flashCell, setFlashCell] = useState<string | null>(null);

  function saveAndFlash(cell: string, patch: Parameters<typeof updateTask>[1]) {
    updateTask(tarefa.id, patch);
    setFlashCell(cell);
    setTimeout(() => setFlashCell(null), 600);
  }

  /* refs nas próprias <td> — toda a célula serve de âncora */
  const respTd   = useRef<HTMLTableCellElement>(null);
  const dataTd   = useRef<HTMLTableCellElement>(null);
  const prioTd   = useRef<HTMLTableCellElement>(null);
  const statusTd = useRef<HTMLTableCellElement>(null);

  const cfg = STATUS_CONFIG[status];
  const StatusIcon = cfg.Icon;
  const membro = tarefa.responsavelId ? mockMembros.find((m) => m.id === tarefa.responsavelId) : null;
  const prio = tarefa.prioridade ? PRIO_CONFIG[tarefa.prioridade] : null;
  const dias = diasUntil(tarefa.dataVencimento);

  let dateText = "", dateColor = "#b6b6bf", dateSub = "";
  if (tarefa.dataVencimento) {
    const d = new Date(tarefa.dataVencimento + "T00:00:00.000Z");
    dateText = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    if (dias != null) {
      if (dias < 0) { dateColor = "#fbbf24"; dateSub = `ATRASADO ${Math.abs(dias)}D`; }
      else if (dias === 0) { dateColor = "#7c5cff"; dateSub = "HOJE"; }
    }
  }

  const allStatuses: StatusTarefa[] = ["backlog", "pronto", "em-progresso", "concluido", "falhou"];
  const allPrios: Prioridade[] = ["urgente", "alta", "media", "baixa"];

  function toggle(dd: string) {
    setOpenDD((v) => (v === dd ? null : dd));
  }

  /* estilo base da <td> — hover por célula editável é adicionado inline */
  function tdBase(hov?: boolean): React.CSSProperties {
    return {
      padding: 0, borderBottom: "1px solid #1f1f25", height: 38, verticalAlign: "middle",
      color: "#b6b6bf",
      background: hov ? "#1e1e28" : rowHovered ? "#15151a" : "transparent",
      cursor: hov !== undefined ? "pointer" : "default",
      transition: "background .1s",
    };
  }

  const cellInner: React.CSSProperties = {
    padding: "0 10px", height: 38, display: "flex", alignItems: "center", gap: 8,
  };

  return (
    <>
      <tr onMouseEnter={() => setRowHovered(true)} onMouseLeave={() => setRowHovered(false)}>

        {/* Nome — não editável inline */}
        <td style={tdBase()}>
          <div style={{ ...cellInner, paddingLeft: 14, gap: 10 }}>
            {tarefa.subtarefas > 0 ? (
              <button
                type="button"
                onClick={onToggle}
                style={{
                  width: 14, color: "#7a7a85", display: "inline-flex",
                  alignItems: "center", justifyContent: "center",
                  cursor: "pointer", opacity: 0.7, background: "none", border: 0,
                  transform: expanded ? "rotate(90deg)" : "none", transition: "transform .15s",
                }}
              >
                <IcCaretR size={12} />
              </button>
            ) : (
              <span style={{ width: 14, visibility: "hidden", display: "inline-flex" }}>
                <IcCaretR size={12} />
              </span>
            )}
            <span style={{ display: "inline-flex", color: cfg.iconColor }}>
              <StatusIcon size={13} />
            </span>
            <span
              role={onOpen ? "button" : undefined}
              tabIndex={onOpen ? 0 : undefined}
              onClick={onOpen}
              onKeyDown={onOpen ? (e) => { if (e.key === "Enter" || e.key === " ") onOpen(); } : undefined}
              style={{
                color: "#e6e6ea", fontWeight: 600, fontSize: 13,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                cursor: onOpen ? "pointer" : "default",
              }}
              onMouseEnter={onOpen ? (e) => { e.currentTarget.style.color = "#cfc1ff"; e.currentTarget.style.textDecoration = "underline"; } : undefined}
              onMouseLeave={onOpen ? (e) => { e.currentTarget.style.color = "#e6e6ea"; e.currentTarget.style.textDecoration = "none"; } : undefined}
            >
              {tarefa.nome}
            </span>
            {tarefa.subtarefas > 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "#7a7a85", fontSize: 11, marginLeft: 2 }}>
                <IcGitFork size={11} /> {tarefa.subtarefas}
              </span>
            )}
          </div>
        </td>

        {/* Responsável */}
        <EditableTd
          tdRef={respTd}
          active={openDD === "responsavel"}
          flash={flashCell === "responsavel"}
          rowHovered={rowHovered}
          onClick={() => toggle("responsavel")}
        >
          {membro ? (
            <>
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: "#3d2a6b", color: "#d8ccff",
                fontSize: 10, fontWeight: 600, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {membro.iniciais}
              </div>
              <span style={{ fontSize: 12, color: "#c0c0cc" }}>{membro.nome}</span>
            </>
          ) : (
            <span style={{ color: "#6a6a75" }}><IcUserPlus size={14} /></span>
          )}
          {openDD === "responsavel" && (
            <CellDropdown anchorRef={respTd} onClose={() => setOpenDD(null)}>
              <DropItem active={!tarefa.responsavelId} onClick={() => { saveAndFlash("responsavel", { responsavelId: null }); setOpenDD(null); }}>
                <span style={{ color: "#7a7a85" }}>Sem responsável</span>
              </DropItem>
              {mockMembros.map((m) => (
                <DropItem key={m.id} active={tarefa.responsavelId === m.id} onClick={() => { saveAndFlash("responsavel", { responsavelId: m.id }); setOpenDD(null); }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%",
                    background: "#3d2a6b", color: "#d8ccff",
                    fontSize: 9, fontWeight: 700, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {m.iniciais}
                  </div>
                  {m.nome}
                </DropItem>
              ))}
            </CellDropdown>
          )}
        </EditableTd>

        {/* Data de vencimento */}
        <EditableTd
          tdRef={dataTd}
          active={openDD === "data"}
          flash={flashCell === "data"}
          rowHovered={rowHovered}
          onClick={() => toggle("data")}
        >
          {dateText ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 13, color: dateColor }}>{dateText}</span>
              {dateSub && <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase", color: "#7a7a85" }}>{dateSub}</span>}
            </div>
          ) : (
            <span style={{ color: "#6a6a75" }}><IcCalPlus size={14} /></span>
          )}
          {openDD === "data" && (
            <CellDropdown anchorRef={dataTd} onClose={() => setOpenDD(null)}>
              <div style={{ padding: "4px 6px 6px" }}>
                <p style={{ fontSize: 11, color: "#7a7a85", margin: "0 0 6px", fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase" }}>
                  Data de vencimento
                </p>
                <input
                  type="date"
                  autoFocus
                  defaultValue={tarefa.dataVencimento ?? ""}
                  onChange={(e) => saveAndFlash("data", { dataVencimento: e.target.value || null })}
                  onBlur={() => setOpenDD(null)}
                  style={{
                    background: "#26262f", border: "1px solid #3a3a46",
                    borderRadius: 6, color: "#d4d4dc", fontSize: 12,
                    padding: "5px 8px", outline: "none", width: "100%",
                    colorScheme: "dark",
                  }}
                />
                {tarefa.dataVencimento && (
                  <button
                    type="button"
                    onClick={() => { saveAndFlash("data", { dataVencimento: null }); setOpenDD(null); }}
                    style={{
                      marginTop: 6, width: "100%", padding: "5px 0",
                      background: "none", border: "1px solid #2e2e38",
                      borderRadius: 5, color: "#ef4444", fontSize: 12, cursor: "pointer",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                  >
                    Remover data
                  </button>
                )}
              </div>
            </CellDropdown>
          )}
        </EditableTd>

        {/* Prioridade */}
        <EditableTd
          tdRef={prioTd}
          active={openDD === "prioridade"}
          flash={flashCell === "prioridade"}
          rowHovered={rowHovered}
          onClick={() => toggle("prioridade")}
        >
          {prio ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: prio.color }}>
              <IcFlag size={13} />{prio.label}
            </span>
          ) : (
            <span style={{ color: "#6a6a75" }}><IcFlag size={14} /></span>
          )}
          {openDD === "prioridade" && (
            <CellDropdown anchorRef={prioTd} onClose={() => setOpenDD(null)}>
              <DropItem active={!tarefa.prioridade} onClick={() => { saveAndFlash("prioridade", { prioridade: null }); setOpenDD(null); }}>
                <IcFlag size={12} />
                <span style={{ color: "#7a7a85" }}>Sem prioridade</span>
              </DropItem>
              {allPrios.map((p) => {
                const c = PRIO_CONFIG[p];
                return (
                  <DropItem key={p} active={tarefa.prioridade === p} onClick={() => { saveAndFlash("prioridade", { prioridade: p }); setOpenDD(null); }}>
                    <IcFlag size={12} />
                    <span style={{ color: c.color }}>{c.label}</span>
                  </DropItem>
                );
              })}
            </CellDropdown>
          )}
        </EditableTd>

        {/* Status */}
        <EditableTd
          tdRef={statusTd}
          active={openDD === "status"}
          flash={flashCell === "status"}
          rowHovered={rowHovered}
          onClick={() => toggle("status")}
        >
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "3px 9px", borderRadius: 5,
            fontSize: 11, fontWeight: 700, letterSpacing: ".7px", textTransform: "uppercase",
            background: INLINE_PILL_STYLE[tarefa.status].bg,
            color: INLINE_PILL_STYLE[tarefa.status].color,
            whiteSpace: "nowrap",
          }}>
            <StatusIcon size={11} />{cfg.label}
          </span>
          {openDD === "status" && (
            <CellDropdown anchorRef={statusTd} onClose={() => setOpenDD(null)}>
              {allStatuses.map((s) => {
                const c = STATUS_CONFIG[s];
                const Icon = c.Icon;
                return (
                  <DropItem key={s} active={tarefa.status === s} onClick={() => { saveAndFlash("status", { status: s }); setOpenDD(null); }}>
                    <Icon size={12} />
                    <span style={{ color: c.iconColor }}>{c.label}</span>
                  </DropItem>
                );
              })}
            </CellDropdown>
          )}
        </EditableTd>

        {/* Comentários — apenas visual */}
        <td style={{
          padding: 0, borderBottom: "1px solid #1f1f25", height: 38, verticalAlign: "middle",
          background: rowHovered ? "#15151a" : "transparent",
        }}>
          <div style={{ display: "flex", justifyContent: "center", padding: "0 6px", height: 38, alignItems: "center" }}>
            <span style={{ color: "#6a6a75" }}><IcChat size={14} /></span>
          </div>
        </td>

        <td style={{
          padding: 0, borderBottom: "1px solid #1f1f25", height: 38,
          background: rowHovered ? "#15151a" : "transparent",
        }} />
      </tr>

      {expanded && tarefa.subtarefas > 0 && (
        <tr>
          <td colSpan={7} style={{ padding: 0, borderBottom: "1px solid #1f1f25", height: 34, background: "#101015" }}>
            <div style={{ paddingLeft: 54, height: 34, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 14, visibility: "hidden", display: "inline-flex" }}><IcCaretR size={12} /></span>
              <span style={{ display: "inline-flex", color: "#8a8a93" }}><IcPending size={13} /></span>
              <span style={{ color: "#b6b6bf", fontWeight: 500, fontSize: 13 }}>Subtarefa</span>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ─── Célula editável — hover por célula inteira ───────────────────────────── */

function EditableTd({
  tdRef,
  active,
  flash,
  rowHovered,
  onClick,
  children,
}: {
  tdRef: React.RefObject<HTMLTableCellElement | null>;
  active: boolean;
  flash: boolean;
  rowHovered: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const [hov, setHov] = useState(false);
  /* fase: idle → in → out → idle */
  const [phase, setPhase] = useState<"idle" | "in" | "out">("idle");

  useEffect(() => {
    if (!flash) return;
    setPhase("in");
    const t1 = setTimeout(() => setPhase("out"), 200);
    const t2 = setTimeout(() => setPhase("idle"), 650);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [flash]);

  return (
    <td
      ref={tdRef}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "0 10px", borderBottom: "1px solid #1f1f25", height: 38,
        verticalAlign: "middle", cursor: "pointer", position: "relative",
        background: rowHovered ? "#15151a" : "transparent",
        boxShadow: hov || active ? "inset 0 0 0 1px #3a3a46" : "none",
        borderRadius: 4,
        transition: "box-shadow .1s",
      }}
    >
      {/* overlay verde com fade-in / fade-out */}
      {phase !== "idle" && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: 4, pointerEvents: "none",
          background: "rgba(34,197,94,0.28)",
          opacity: phase === "in" ? 1 : 0,
          transition: phase === "in" ? "opacity .15s ease-in" : "opacity .45s ease-out",
        }} />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 6, height: "100%", position: "relative" }}>
        {children}
      </div>
    </td>
  );
}
