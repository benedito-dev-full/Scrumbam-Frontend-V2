"use client";

import { Plus, Users, Search, PanelLeftClose } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AtribuidasAMimSection } from "@/components/shell/planner/atribuidas-a-mim-section";
import { HojeEAtrasadasSection } from "@/components/shell/planner/hoje-e-atrasadas-section";
import { PrioridadesSection } from "@/components/shell/planner/prioridades-section";
import { usePlannerUIStore } from "@/lib/stores/planner-ui";

function Divider() {
  return <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 12, fontWeight: 600, color: "var(--foreground)",
      padding: "0 14px", marginBottom: 4,
    }}>
      {children}
    </p>
  );
}

export function PlannerPanel() {
  const searchOpen = usePlannerUIStore((s) => s.searchOpen);
  const setSearchOpen = usePlannerUIStore((s) => s.setSearchOpen);
  const toggleSidebar = usePlannerUIStore((s) => s.toggleSidebar);
  const setCreateEventOpen = usePlannerUIStore((s) => s.setCreateEventOpen);

  const headerActions: Array<{
    Icon: React.ElementType;
    label: string;
    onClick: () => void;
    'data-planner-search-trigger'?: boolean;
  }> = [
    {
      Icon: Search,
      label: "Buscar eventos",
      onClick: () => setSearchOpen(!searchOpen),
      'data-planner-search-trigger': true,
    },
    { Icon: PanelLeftClose, label: "Recolher painel", onClick: toggleSidebar },
    { Icon: Plus, label: "Novo evento", onClick: () => setCreateEventOpen(true) },
  ];

  return (
    <>
      {/* header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 12px", height: 44, borderBottom: "1px solid #1c1c1f", flexShrink: 0,
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>Planejador</span>
        <div style={{ display: "flex", gap: 2 }}>
          {headerActions.map(({ Icon, label, onClick, ...rest }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              title={label}
              onClick={onClick}
              {...rest}
              style={{
                width: 26, height: 26, borderRadius: 5, border: 0,
                background: "none", cursor: "pointer", color: "var(--muted-foreground)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.color = "var(--foreground)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--muted-foreground)"; }}
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
            <PrioridadesSection />
          </div>

          <Divider />

          {/* Reunião com */}
          <div style={{ padding: "10px 0" }}>
            <SectionLabel>Reunião com</SectionLabel>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              margin: "6px 12px 0", padding: "7px 10px",
              borderRadius: 6, border: "1px solid var(--border)", background: "var(--background)",
            }}>
              <Users size={13} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Pesquisar pessoas...</span>
            </div>
          </div>

          <Divider />

          {/* Atribuídas a mim */}
          <div style={{ padding: "6px 0" }}>
            <AtribuidasAMimSection />
          </div>

          <Divider />

          {/* Hoje e atrasadas */}
          <div style={{ padding: "6px 0" }}>
            <HojeEAtrasadasSection />
          </div>

          <Divider />

          {/* Lista de pendências */}
          <div style={{ padding: "10px 0" }}>
            <SectionLabel>Lista de pendências</SectionLabel>
            <div style={{
              margin: "6px 12px 0", padding: "16px 12px", borderRadius: 8,
              background: "var(--card)", textAlign: "center",
            }}>
              <p style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.6 }}>
                Nenhuma tarefa corresponde a esses filtros
              </p>
            </div>
          </div>

        </div>
      </ScrollArea>
    </>
  );
}
