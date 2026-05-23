"use client";

import { useState } from "react";
import { Plus, Star } from "lucide-react";

/* ─── Ícones ──────────────────────────────────────────────────────────────── */
function IcDocFilled() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#3b82f6" />
      <path d="M14 2v6h6" fill="none" stroke="#1d4ed8" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcDocOutline() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

function IcMyDocs() {
  return (
    <div style={{
      width: 14, height: 14, borderRadius: "50%",
      background: "#3b82f6",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 8, fontWeight: 900, color: "#fff", lineHeight: 1,
    }}>B</div>
  );
}

function IcShared() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function IcLock() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IcArchive() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  );
}

/* ─── Nav items ───────────────────────────────────────────────────────────── */
const navItems = [
  { label: "Todos os documentos", icon: <IcDocFilled />,  active: true,  badge: undefined, accent: false },
  { label: "Meus documentos",     icon: <IcMyDocs />,     active: false, badge: "3",       accent: false },
  { label: "Compartilhado comigo",icon: <IcShared />,     active: false, badge: undefined, accent: false },
  { label: "Privado",             icon: <IcLock />,       active: false, badge: undefined, accent: false },
  { label: "Atas da reunião",     icon: <IcDocOutline />, active: false, badge: undefined, accent: true  },
  { label: "Arquivado",           icon: <IcArchive />,    active: false, badge: undefined, accent: false },
];

const recentPages = ["Sem título", "Sem título", "Documento teste"];

/* ─── Label de seção (sem uppercase, sem chevron, estilo ClickUp) ─────────── */
function SectionLabel({ label }: { label: string }) {
  return (
    <p style={{
      fontSize: 12, fontWeight: 500, color: "#7a7a8a",
      padding: "12px 14px 6px",
    }}>
      {label}
    </p>
  );
}

export function DocsPanel() {
  return (
    <>
      {/* header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 14px", height: 44,
        borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0,
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e4" }}>Documentos</span>
        <div style={{ display: "flex", gap: 4 }}>
          {/* collapse icon — ClickUp tem << */}
          <button type="button" style={{
            width: 24, height: 24, borderRadius: 5, border: 0,
            background: "none", cursor: "pointer", color: "#606068",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#222"; e.currentTarget.style.color = "#c0c0c4"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#606068"; }}
          >
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" />
            </svg>
          </button>
          <button type="button" style={{
            width: 24, height: 24, borderRadius: 5, border: 0,
            background: "none", cursor: "pointer", color: "#606068",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#222"; e.currentTarget.style.color = "#c0c0c4"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#606068"; }}
          >
            <Plus size={14} strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* nav items */}
      <div style={{ padding: "8px 6px 4px" }}>
        {navItems.map((item) => (
          <button key={item.label} type="button" style={{
            display: "flex", alignItems: "center", gap: 8,
            width: "100%", height: 34, padding: "0 8px", borderRadius: 5,
            border: 0, cursor: "pointer", textAlign: "left",
            background: item.active ? "#2a2a2a" : "none",
            color: item.active ? "#f0f0f0" : item.accent ? "#a78bfa" : "#b0b0b8",
            fontSize: 13, fontWeight: item.active ? 600 : 400,
          }}
            onMouseEnter={e => { if (!item.active) e.currentTarget.style.background = "#1e1e1e"; }}
            onMouseLeave={e => { if (!item.active) e.currentTarget.style.background = "none"; }}
          >
            <span style={{
              color: item.active ? "#e4e4e4" : item.accent ? "#a78bfa" : "#606068",
              flexShrink: 0, display: "flex", alignItems: "center",
            }}>
              {item.icon}
            </span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge && (
              <span style={{
                fontSize: 11, color: "#7a7a8a", background: "#252525",
                borderRadius: 4, padding: "0 5px", lineHeight: "18px",
              }}>{item.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Favoritos */}
      <SectionLabel label="Favoritos" />
      <div style={{ margin: "0 10px 4px", borderRadius: 8, background: "#141414", overflow: "hidden", position: "relative", minHeight: 80 }}>
        {/* estrelas decorativas nos cantos — igual ClickUp */}
        <Star size={20} style={{ position: "absolute", top: 8, left: 10, color: "#f59e0b", opacity: 0.15, transform: "rotate(-15deg)" }} />
        <Star size={14} style={{ position: "absolute", top: 14, right: 16, color: "#f59e0b", opacity: 0.12, transform: "rotate(10deg)" }} />
        <Star size={10} style={{ position: "absolute", bottom: 12, right: 28, color: "#f59e0b", opacity: 0.10 }} />
        <div style={{ padding: "16px 12px", textAlign: "center" }}>
          <Star size={16} style={{ color: "#f59e0b", margin: "0 auto 6px", display: "block" }} />
          <p style={{ fontSize: 11, color: "#606068", lineHeight: 1.7 }}>
            Marque um Documento com<br />estrela para que apareça aqui
          </p>
        </div>
      </div>

      {/* Páginas recentes */}
      <SectionLabel label="Páginas recentes" />
      <div style={{ padding: "0 6px 4px" }}>
        {recentPages.map((name, i) => (
          <button key={i} type="button" style={{
            display: "flex", alignItems: "center", gap: 8,
            width: "100%", height: 32, padding: "0 8px", borderRadius: 5,
            border: 0, background: "none", cursor: "pointer",
            color: "#b0b0b8", fontSize: 13, textAlign: "left",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#1e1e1e"; e.currentTarget.style.color = "#e4e4e4"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#b0b0b8"; }}
          >
            <span style={{ color: "#606068", flexShrink: 0 }}><IcDocOutline /></span>
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
          </button>
        ))}
      </div>

      {/* Wikis populares */}
      <SectionLabel label="Wikis populares" />
      <div style={{ margin: "0 10px 8px", borderRadius: 8, background: "#141414", padding: "16px 12px", textAlign: "center" }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 6px", display: "block" }}>
          <circle cx="12" cy="12" r="10" fill="#2a2a2a" />
          <polyline points="9 11 12 14 22 4" fill="none" stroke="#505058" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p style={{ fontSize: 11, color: "#606068", lineHeight: 1.7 }}>
          As wikis mais vistas e ativas<br />aparecem aqui
        </p>
      </div>
    </>
  );
}
