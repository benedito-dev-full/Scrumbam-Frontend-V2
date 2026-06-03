"use client";

import type { TeamLocal } from "../_lib/teams-local";

/* ══════════════════════════════════════════════════════════════════
   MODAL CONFIRMAR EXCLUSAO
══════════════════════════════════════════════════════════════════ */

export function DeleteTeamModal({
  team,
  onClose,
  onConfirm,
  isDeleting,
}: {
  team: TeamLocal;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div
        style={{
          width: 420,
          borderRadius: 12,
          background: "var(--card)",
          border: "1px solid var(--border)",
          padding: "28px 28px 24px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        {/* ícone */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: "rgba(248,113,113,0.1)",
            border: "1px solid rgba(248,113,113,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f87171"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </div>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--foreground)",
            marginBottom: 8,
          }}
        >
          Excluir &ldquo;{team.nome}&rdquo;?
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "var(--muted-foreground)",
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          Esta ação não pode ser desfeita. Todos os membros serão removidos e o
          time será excluído permanentemente.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            style={{
              height: 34,
              padding: "0 16px",
              borderRadius: 7,
              border: "1px solid var(--border)",
              background: "none",
              cursor: isDeleting ? "not-allowed" : "pointer",
              color: "var(--muted-foreground)",
              fontSize: 13,
              opacity: isDeleting ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isDeleting)
                e.currentTarget.style.color = "var(--foreground)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--muted-foreground)";
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              height: 34,
              padding: "0 20px",
              borderRadius: 7,
              border: "none",
              background: isDeleting ? "#7f1d1d" : "#ef4444",
              cursor: isDeleting ? "not-allowed" : "pointer",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              transition: "background .15s",
              minWidth: 100,
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) e.currentTarget.style.background = "#dc2626";
            }}
            onMouseLeave={(e) => {
              if (!isDeleting) e.currentTarget.style.background = "#ef4444";
            }}
          >
            {isDeleting ? "Excluindo..." : "Sim, excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}
