"use client";

import { useState } from "react";
import { Plus, Star } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

function IcFormItem() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 11l3 3 5-5" />
    </svg>
  );
}

function IcAllForms() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  );
}

function IcMyForms() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M16 11l2 2 4-4" />
    </svg>
  );
}

type NavItem = { label: string; href: string; badge?: number; renderIcon: () => React.ReactNode };

const navItems: NavItem[] = [
  { label: "Todos os formulários", href: "/forms",      renderIcon: () => <IcAllForms /> },
  { label: "Meus formulários",     href: "/forms/mine", badge: 1, renderIcon: () => <IcMyForms /> },
];

export function FormsPanel() {
  const [active, setActive] = useState("/forms");

  return (
    <>
      {/* header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 12px", height: 44, borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0,
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e6" }}>Formulários</span>
        <button type="button" style={{
          width: 22, height: 22, borderRadius: 5, border: 0,
          background: "none", cursor: "pointer", color: "var(--muted-foreground)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "#202022"; e.currentTarget.style.color = "#c0c0c4"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--muted-foreground)"; }}
        >
          <Plus size={14} strokeWidth={2} />
        </button>
      </header>

      <ScrollArea className="flex-1">
        <div style={{ padding: "8px 0" }}>

          {/* nav items */}
          <div style={{ padding: "0 6px", marginBottom: 8 }}>
            {navItems.map((item) => {
              const isActive = active === item.href;
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => setActive(item.href)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    width: "100%", height: 34, padding: "0 8px",
                    borderRadius: 5, border: 0, cursor: "pointer", textAlign: "left",
                    background: isActive ? "#202022" : "none",
                    color: isActive ? "#e4e4e6" : "var(--muted-foreground)",
                    fontSize: 13, fontWeight: isActive ? 500 : 400,
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#1a1a1c"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "none"; }}
                >
                  <span style={{ color: isActive ? "#c0c0c4" : "var(--muted-foreground)", flexShrink: 0 }}>
                    {item.renderIcon()}
                  </span>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
                  {item.badge !== undefined && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)",
                      background: "#202022", borderRadius: 4, padding: "0 5px", lineHeight: "18px",
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Favoritos */}
          <div style={{ padding: "4px 0 8px" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "0 14px", marginBottom: 4 }}>
              Favoritos
            </p>
            <div style={{
              margin: "4px 10px 0", padding: "16px 12px", borderRadius: 8,
              border: "1px dashed #282828", textAlign: "center",
            }}>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 4, marginBottom: 6 }}>
                <Star size={14} style={{ color: "#f59e0b", fill: "#f59e0b" }} />
                <Star size={10} style={{ color: "#f59e0b", fill: "#f59e0b", opacity: 0.5 }} />
              </div>
              <p style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.6 }}>
                Marque um Formulário com estrela<br />para que apareça aqui
              </p>
            </div>
          </div>

          {/* Recentes */}
          <div style={{ padding: "4px 0" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "0 14px", marginBottom: 4 }}>
              Recentes
            </p>
            <div style={{ padding: "0 6px" }}>
              <button type="button" style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", height: 34, padding: "0 8px",
                borderRadius: 5, border: 0, background: "none", cursor: "pointer",
                color: "var(--muted-foreground)", fontSize: 13, textAlign: "left",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "#1a1a1c"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
              >
                <IcFormItem />
                <span>Form</span>
              </button>
            </div>
          </div>

        </div>
      </ScrollArea>
    </>
  );
}
