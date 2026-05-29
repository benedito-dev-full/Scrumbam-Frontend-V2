"use client";

import { GroupsView } from "@/components/lists/groups-view";

/**
 * Preview isolado da nova visualizacao de GRUPOS (estilo Monday.com).
 *
 * Rota descartavel para validar a igualdade visual antes de integrar ao
 * /lists/[id]. Nao faz parte do fluxo de producao — pode ser removida
 * apos a aprovacao do componente.
 */
export default function GroupsPreviewPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        background: "var(--background)",
      }}
    >
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid var(--border)",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--foreground)",
        }}
      >
        Preview — Visualização de Grupos (estilo Monday)
      </div>
      <GroupsView />
    </div>
  );
}
