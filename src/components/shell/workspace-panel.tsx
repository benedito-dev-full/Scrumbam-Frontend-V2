"use client";

import { Fragment, useState } from "react";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Settings2 } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth";
import { SpaceTree } from "@/components/spaces/space-tree";
import { FormsPanel } from "./forms-panel";
import { DocsPanel } from "./docs-panel";
import {
  ExpandableItem,
  PlannerAside,
  SectionBlock,
  SidebarIconButton,
  buildSections,
  homeItems,
} from "./workspace-panel-navigation";

export function WorkspacePanel() {
  const pathname = usePathname();
  const [homeOpen, setHomeOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Admin enxerga tarefas de qualquer pessoa/time → o item /assigned deixa de
  // ser "Minhas tarefas" e vira "Painel de tarefas". Usuário comum mantém.
  const isAdmin = useAuthStore((s) => s.user?.orgRole === "ADMIN");

  const sections = buildSections();

  /* painéis alternativos por rota */
  if (pathname.startsWith("/planner")) {
    return <PlannerAside />;
  }

  if (pathname.startsWith("/forms")) {
    return (
      <aside
        aria-label="Painel de formulários"
        className="flex h-full w-[260px] shrink-0 flex-col bg-sidebar border-r border-border"
      >
        <FormsPanel />
      </aside>
    );
  }

  if (pathname.startsWith("/ia")) {
    return null;
  }

  // Central de IA (MCP): tela cheia, sem painel lateral.
  if (pathname.startsWith("/ai")) {
    return null;
  }

  if (pathname.startsWith("/teams")) {
    return null;
  }

  if (pathname === "/docs") {
    return (
      <aside
        aria-label="Painel de documentos"
        className="flex h-full w-[260px] shrink-0 flex-col bg-sidebar border-r border-border overflow-y-auto"
      >
        <DocsPanel />
      </aside>
    );
  }

  if (pathname.startsWith("/docs/")) {
    return null;
  }

  return (
    <aside
      aria-label={
        sidebarCollapsed ? "Barra lateral recolhida" : "Painel do workspace"
      }
      className={cn(
        "relative flex h-full shrink-0 flex-col overflow-hidden border-r border-border bg-sidebar transition-[width] duration-200 ease-out",
        sidebarCollapsed ? "w-10" : "w-[260px]",
      )}
    >
      {sidebarCollapsed && (
        <div className="absolute left-1/2 top-2 z-10 -translate-x-1/2">
          <SidebarIconButton
            label="Abrir barra lateral"
            onClick={() => setSidebarCollapsed(false)}
          >
            <PanelLeftOpen size={15} strokeWidth={1.7} />
          </SidebarIconButton>
        </div>
      )}

      <div
        aria-hidden={sidebarCollapsed}
        className={cn(
          "flex h-full w-[260px] shrink-0 flex-col transition-all duration-150 ease-out",
          sidebarCollapsed
            ? "pointer-events-none -translate-x-2 opacity-0"
            : "translate-x-0 opacity-100",
        )}
      >
        {/* header "Início" */}
        <header className="flex h-10 items-center justify-between gap-1 px-3">
          <button
            type="button"
            onClick={() => setHomeOpen((v) => !v)}
            className="flex h-7 flex-1 items-center gap-1 rounded px-1 text-[13px] font-semibold text-sidebar-foreground transition-colors hover:text-foreground"
          >
            Início
          </button>
          <SidebarIconButton
            label="Fechar barra lateral"
            side="bottom"
            onClick={() => setSidebarCollapsed(true)}
          >
            <PanelLeftClose size={15} strokeWidth={1.7} />
          </SidebarIconButton>
        </header>

      <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-scrollbar]]:hidden">
        <div className="space-y-5 px-2 pb-4">
          {/* seção Início */}
          {homeOpen && (
            <div className="space-y-1">
              {homeItems.map((item) => (
                <ExpandableItem
                  key={item.href}
                  item={
                    isAdmin && item.href === "/assigned"
                      ? { ...item, label: "Painel de tarefas" }
                      : item
                  }
                  active={pathname === item.href}
                  activeHref={pathname}
                />
              ))}
              {/* MoreItem oculto até as rotas filhas existirem (chat-activity, drafts, posts). */}
              {/* <MoreItem /> */}
            </div>
          )}

          {/* seções + SpaceTree após favoritos */}
          {sections.map((section) => (
            <Fragment key={section.id}>
              <SectionBlock section={section} />
              {section.id === "favoritos" && <SpaceTree />}
            </Fragment>
          ))}
        </div>
      </ScrollArea>

      {/* footer fixo — Personalizar a barra lateral */}
      <div className="shrink-0 border-t border-border px-2 py-2">
        <button
          type="button"
          className="flex h-[calc(var(--row-h)-6px)] w-full items-center gap-2 rounded-[5px] px-3 text-[12px] text-muted-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        >
          <Settings2 className="size-3.5 shrink-0" />
          Personalizar a barra lateral
        </button>
      </div>
      </div>
    </aside>
  );
}
