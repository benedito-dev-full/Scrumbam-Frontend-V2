"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Settings, Users, LayoutGrid, FileText, SlidersHorizontal, Zap,
} from "lucide-react";

/**
 * Workspace switcher do topbar — botão "F Fortalshop ▾" com dropdown rico.
 *
 * Contém: cabeçalho do workspace (logo + nome + plano), botões de
 * Configurações/Pessoas, lista "Gerenciar" e troca de workspace.
 */
export function WorkspaceSwitcher() {
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
              transition: "background .12s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#252528"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
          />
        }
      >
        {/* logo "F" colorido — igual ao ClickUp */}
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 5,
            background: "linear-gradient(135deg, #3b5bdb 0%, #4c6ef5 100%)",
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
      <DropdownMenuContent align="start" sideOffset={4} style={{ width: 260, padding: "8px 0" }}>

        {/* cabeçalho: logo + nome + plano */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 14px 10px" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
            background: "linear-gradient(135deg,#3b5bdb,#4c6ef5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 700, color: "#fff",
          }}>F</div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#e4e4e4", lineHeight: 1.3 }}>Fortalshop</p>
            <p style={{ fontSize: 12, color: "#606068", lineHeight: 1.3 }}>
              Free Forever •{" "}
              <span style={{ color: "#7c6ff7", cursor: "pointer" }}>Fazer upgrade</span>
            </p>
          </div>
        </div>

        {/* botões Configurações + Pessoas */}
        <div style={{ display: "flex", gap: 6, padding: "0 10px 10px" }}>
          {[
            { icon: <Settings size={13} />, label: "Configurações" },
            { icon: <Users size={13} />,   label: "Pessoas" },
          ].map(({ icon, label }) => (
            <button key={label} type="button" style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              gap: 5, height: 30, borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.09)", background: "none",
              cursor: "pointer", color: "#c4c4c4", fontSize: 12,
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        <DropdownMenuSeparator />

        {/* Gerenciar */}
        <p style={{ fontSize: 11, color: "#505058", padding: "8px 14px 4px", fontWeight: 500 }}>Gerenciar</p>
        {[
          { icon: <LayoutGrid size={14} style={{ color: "#e879f9" }} />,        label: "Aplicativos" },
          { icon: <FileText size={14} style={{ color: "#9ca3af" }} />,           label: "Modelos" },
          { icon: <SlidersHorizontal size={14} style={{ color: "#9ca3af" }} />, label: "Campos personalizados" },
          { icon: <Zap size={14} style={{ color: "#f59e0b" }} />,               label: "Automações" },
        ].map(({ icon, label }) => (
          <button key={label} type="button" style={{
            display: "flex", alignItems: "center", gap: 10,
            width: "100%", height: 34, padding: "0 14px",
            border: 0, background: "none", cursor: "pointer",
            color: "#c4c4c4", fontSize: 13, textAlign: "left",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
          >
            {icon}{label}
          </button>
        ))}

        <DropdownMenuSeparator style={{ margin: "6px 0" }} />

        {/* Alternar Espaços de trabalho */}
        <p style={{ fontSize: 11, color: "#505058", padding: "4px 14px", fontWeight: 500 }}>Alternar Espaços de trabalho</p>
        <button type="button" style={{
          display: "flex", alignItems: "center", gap: 10,
          width: "100%", height: 36, padding: "0 14px",
          border: 0, background: "none", cursor: "pointer",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
        >
          <div style={{
            width: 24, height: 24, borderRadius: 6, flexShrink: 0,
            background: "linear-gradient(135deg,#10b981,#059669)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: "#fff",
          }}>S</div>
          <span style={{ fontSize: 13, color: "#c4c4c4" }}>Scrumban</span>
        </button>

        <DropdownMenuSeparator style={{ margin: "6px 0" }} />

        {/* Criar workspace */}
        <button type="button" style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "calc(100% - 20px)", margin: "4px 10px 6px",
          height: 32, borderRadius: 6,
          border: "1px solid rgba(255,255,255,0.09)", background: "none",
          cursor: "pointer", color: "#c4c4c4", fontSize: 13,
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
        >
          + Criar Espaço de trabalho
        </button>

      </DropdownMenuContent>
    </DropdownMenu>
  );
}
