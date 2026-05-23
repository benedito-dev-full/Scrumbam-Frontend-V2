"use client";

import React, { useState } from "react";
import Link from "next/link";

/* ─── Ícones compartilhados entre /spaces/[id] e /folders/[id] ───────────── */

export function IcList() {
  return (
    <svg width={13} height={13} viewBox="0 0 18 18" fill="none">
      <path d="M2 5 L4.5 7.5 L7 3.5" stroke="#7c6ff7" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 11 L4.5 13.5 L7 9.5" stroke="#7c6ff7" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <line x1="9" y1="5.5" x2="16" y2="5.5" stroke="#7c6ff7" strokeWidth={1.6} strokeLinecap="round" />
      <line x1="9" y1="11.5" x2="16" y2="11.5" stroke="#7c6ff7" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

export function IcFolder({ color = "#9ca3af" }: { color?: string }) {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function IcDoc({ color = "#9ca3af", size = 13, strokeWidth = 1.7 }: { color?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8" />
    </svg>
  );
}

export function IcCaret() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function IcMenu() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export function IcVoice() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
    </svg>
  );
}

/* ─── Botão do topo (header de spaces/folders) ───────────────────────────── */
export function TopBtn({ icon, label }: { icon: React.ReactNode; label?: string }) {
  return (
    <button type="button" style={{
      display: "flex", alignItems: "center", gap: 5,
      height: 28, padding: label ? "0 10px" : "0 7px", borderRadius: 6,
      border: 0, background: "none", cursor: "pointer", color: "#888892", fontSize: 12,
    }}
      onMouseEnter={e => { e.currentTarget.style.background = "#1e1e1e"; e.currentTarget.style.color = "#c4c4c4"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#888892"; }}
    >
      {icon}{label}
    </button>
  );
}

/* ─── Linha de lista (tabela de Lists dentro de space/folder) ────────────── */
export function ListRow({ id, nome }: { id: string; nome: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={`/lists/${id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) 80px 180px 120px 120px 100px 100px 36px",
        height: 40, padding: "0 16px", textDecoration: "none",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: hovered ? "rgba(255,255,255,0.025)" : "transparent",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <IcList />
        <span style={{ fontSize: 13, color: "#c4c4c4", fontWeight: 500 }}>{nome}</span>
      </div>
      <div style={{ fontSize: 12, color: "#404048" }}>-</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, height: 4, borderRadius: 2, background: "#2a2a2a" }}>
          <div style={{ width: "0%", height: "100%", borderRadius: 2, background: "#7c3aed" }} />
        </div>
        <span style={{ fontSize: 11, color: "#505058", whiteSpace: "nowrap" }}>0/0</span>
      </div>
      <div style={{ fontSize: 12, color: "#404048", display: "flex", alignItems: "center" }}>
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#404048" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>
      </div>
      <div style={{ fontSize: 12, color: "#404048", display: "flex", alignItems: "center" }}>
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#404048" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>
      </div>
      <div>
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#404048" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M5 21V4"/><path d="M5 4h13l-2 4 2 4H5"/></svg>
      </div>
      <div>
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#404048" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>
      </div>
      <div />
    </Link>
  );
}

/* ─── Botão "Nova lista" no rodapé da tabela ─────────────────────────────── */
export function AddListRow() {
  const [hovered, setHovered] = useState(false);
  return (
    <button type="button"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 7,
        width: "100%", height: 36, padding: "0 16px",
        border: 0, background: hovered ? "rgba(255,255,255,0.025)" : "transparent",
        cursor: "pointer", color: hovered ? "#888892" : "#505058", fontSize: 13,
      }}
    >
      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
      Nova lista
    </button>
  );
}
