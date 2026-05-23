import React, { useState } from "react";

import {
  IcCaretR, IcGitFork, IcUserPlus, IcCalPlus, IcFlag, IcChat, IcPending,
} from "./icons";
import { STATUS_CONFIG, PRIO_CONFIG, INLINE_PILL_STYLE } from "./config";
import { mockMembros } from "@/lib/mocks/entidades";
import { diasUntil } from "@/lib/mocks/tarefas";
import type { StatusTarefa, Tarefa } from "@/lib/types/tarefa";

/**
 * Linha individual de uma tarefa na tabela do board.
 *
 * Expande para mostrar subtarefas quando `expanded` é true.
 */
export function TaskRow({
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

  const tdStyle: React.CSSProperties = {
    padding: 0, borderBottom: "1px solid #1f1f25", height: 38, verticalAlign: "middle",
    color: "#b6b6bf", background: hovered ? "#15151a" : "transparent",
  };
  const cellStyle: React.CSSProperties = { padding: "0 10px", height: 38, display: "flex", alignItems: "center", gap: 8 };

  return (
    <>
      <tr onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <td style={tdStyle}>
          <div style={{ ...cellStyle, paddingLeft: 14, gap: 10 }}>
            {tarefa.subtarefas > 0 ? (
              <button type="button" onClick={onToggle} style={{ width: 14, color: "#7a7a85", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: 0.7, background: "none", border: 0, transform: expanded ? "rotate(90deg)" : "none", transition: "transform .15s" }}>
                <IcCaretR size={12} />
              </button>
            ) : (
              <span style={{ width: 14, visibility: "hidden", display: "inline-flex" }}><IcCaretR size={12} /></span>
            )}
            <span style={{ display: "inline-flex", color: cfg.iconColor }}><StatusIcon size={13} /></span>
            <span style={{ color: "#e6e6ea", fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tarefa.nome}</span>
            {tarefa.subtarefas > 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "#7a7a85", fontSize: 11, marginLeft: 2 }}>
                <IcGitFork size={11} /> {tarefa.subtarefas}
              </span>
            )}
          </div>
        </td>
        <td style={tdStyle}>
          <div style={cellStyle}>
            {membro ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#3d2a6b", color: "#d8ccff", fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>{membro.iniciais}</div>
                <span style={{ fontSize: 12, color: "#b6b6bf" }}>{membro.iniciais}</span>
              </div>
            ) : (
              <span style={{ color: "#4a4a54", opacity: hovered ? 1 : 0, transition: "opacity .15s" }}><IcUserPlus size={14} /></span>
            )}
          </div>
        </td>
        <td style={tdStyle}>
          <div style={{ ...cellStyle, flexDirection: "column", alignItems: "flex-start", gap: 1, justifyContent: "center" }}>
            {dateText ? (
              <>
                <span style={{ fontSize: 13, color: dateColor }}>{dateText}</span>
                {dateSub && <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase", color: "#7a7a85" }}>{dateSub}</span>}
              </>
            ) : (
              <span style={{ color: "#4a4a54", opacity: hovered ? 1 : 0, transition: "opacity .15s" }}><IcCalPlus size={14} /></span>
            )}
          </div>
        </td>
        <td style={tdStyle}>
          <div style={cellStyle}>
            {prio ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: prio.color }}><IcFlag size={13} />{prio.label}</span>
            ) : (
              <span style={{ color: "#4a4a54", opacity: hovered ? 1 : 0, transition: "opacity .15s" }}><IcFlag size={14} /></span>
            )}
          </div>
        </td>
        <td style={tdStyle}>
          <div style={cellStyle}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 9px", borderRadius: 5, fontSize: 11, fontWeight: 700, letterSpacing: ".7px", textTransform: "uppercase", background: INLINE_PILL_STYLE[tarefa.status].bg, color: INLINE_PILL_STYLE[tarefa.status].color, whiteSpace: "nowrap" }}>
              <StatusIcon size={11} />{cfg.label}
            </span>
          </div>
        </td>
        <td style={tdStyle}>
          <div style={{ ...cellStyle, justifyContent: "center", padding: "0 6px" }}>
            <span style={{ color: "#4a4a54", opacity: hovered ? 1 : 0, transition: "opacity .15s" }}><IcChat size={14} /></span>
          </div>
        </td>
        <td style={tdStyle} />
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
