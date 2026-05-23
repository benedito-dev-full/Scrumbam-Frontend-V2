"use client";

import { useState } from "react";
import { ChevronRight, Plus, Flag, Users, Search, PanelLeftClose } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

function Divider() {
  return <div style={{ height: 1, background: "#1e1e24", margin: "4px 0" }} />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 12, fontWeight: 600, color: "#c4c4cc",
      padding: "0 14px", marginBottom: 4,
    }}>
      {children}
    </p>
  );
}

function CollapsibleRow({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen(v => !v)}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        width: "100%", padding: "6px 14px",
        border: 0, background: "none", cursor: "pointer",
        fontSize: 13, fontWeight: 600, color: "#c4c4cc", textAlign: "left",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "#16161f"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
    >
      <ChevronRight
        size={13} strokeWidth={2.5}
        style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .15s", color: "#7a7a90" }}
      />
      {label}
    </button>
  );
}

export function PlannerPanel() {
  return (
    <>
      {/* header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 12px", height: 44, borderBottom: "1px solid #1e1e24", flexShrink: 0,
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#e6e6ea" }}>Planejador</span>
        <div style={{ display: "flex", gap: 2 }}>
          {([Search, PanelLeftClose, Plus] as React.ElementType[]).map((Icon, i) => (
            <button key={i} type="button" style={{
              width: 26, height: 26, borderRadius: 5, border: 0,
              background: "none", cursor: "pointer", color: "#7a7a90",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "#1e1e28"; e.currentTarget.style.color = "#c4c4cc"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#7a7a90"; }}
            >
              <Icon size={14} strokeWidth={1.7} />
            </button>
          ))}
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div style={{ padding: "12px 0" }}>

          {/* Prioridades */}
          <div style={{ paddingBottom: 10 }}>
            <SectionLabel>Prioridades</SectionLabel>
            <div style={{
              margin: "6px 12px 8px", padding: "18px 12px", borderRadius: 8,
              border: "1px dashed #2a2a35", textAlign: "center",
            }}>
              <Flag size={16} style={{ color: "#ef4444", margin: "0 auto 8px", display: "block" }} />
              <p style={{ fontSize: 12, color: "#7a7a90", lineHeight: 1.6 }}>
                Priorize uma tarefa para vê-la aqui
              </p>
            </div>
            <button type="button" style={{
              display: "flex", alignItems: "center", gap: 6,
              width: "calc(100% - 24px)", margin: "0 12px",
              padding: "5px 8px", borderRadius: 6, border: 0,
              background: "none", cursor: "pointer", color: "#7a7a90", fontSize: 13,
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "#1a1a22"; e.currentTarget.style.color = "#c4c4cc"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#7a7a90"; }}
            >
              <Plus size={13} strokeWidth={2} />
              Adicionar prioridade
            </button>
          </div>

          <Divider />

          {/* Reunião com */}
          <div style={{ padding: "10px 0" }}>
            <SectionLabel>Reunião com</SectionLabel>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              margin: "6px 12px 0", padding: "7px 10px",
              borderRadius: 6, border: "1px solid #26262d", background: "#0c0c0f",
            }}>
              <Users size={13} style={{ color: "#5a5a64", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#5a5a64" }}>Pesquisar pessoas...</span>
            </div>
          </div>

          <Divider />

          {/* Atribuídas a mim */}
          <div style={{ padding: "6px 0" }}>
            <CollapsibleRow label="Atribuídas a mim" />
          </div>

          <Divider />

          {/* Hoje e atrasadas */}
          <div style={{ padding: "6px 0" }}>
            <CollapsibleRow label="Hoje e atrasadas" />
          </div>

          <Divider />

          {/* Lista de pendências */}
          <div style={{ padding: "10px 0" }}>
            <SectionLabel>Lista de pendências</SectionLabel>
            <div style={{
              margin: "6px 12px 0", padding: "16px 12px", borderRadius: 8,
              background: "#13131a", textAlign: "center",
            }}>
              <p style={{ fontSize: 12, color: "#7a7a90", lineHeight: 1.6 }}>
                Nenhuma tarefa corresponde a esses filtros
              </p>
            </div>
          </div>

        </div>
      </ScrollArea>
    </>
  );
}
