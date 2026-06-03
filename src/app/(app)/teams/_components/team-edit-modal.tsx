"use client";

import React, { useState } from "react";
import type { TeamLocal } from "../_lib/teams-local";

/* ══════════════════════════════════════════════════════════════════
   MODAL EDITAR EQUIPE
══════════════════════════════════════════════════════════════════ */

export function EditTeamModal({
  team,
  onClose,
  onSave,
}: {
  team: TeamLocal;
  onClose: () => void;
  onSave: (id: string, nome: string) => void;
}) {
  const [nome, setNome] = useState(team.nome);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nome.trim();
    if (!trimmed || trimmed === team.nome) {
      onClose();
      return;
    }
    onSave(team.id, trimmed);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.55)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
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
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--foreground)",
            marginBottom: 6,
          }}
        >
          Editar equipe
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "var(--muted-foreground)",
            marginBottom: 20,
            lineHeight: 1.5,
          }}
        >
          Altere o nome da equipe.
        </p>
        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: "var(--muted-foreground)",
              marginBottom: 6,
            }}
          >
            Nome da equipe
          </label>
          <input
            autoFocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome da equipe..."
            style={{
              width: "100%",
              height: 38,
              padding: "0 12px",
              borderRadius: 7,
              border: "1px solid var(--border)",
              background: "var(--border)",
              color: "var(--foreground)",
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 20,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                height: 34,
                padding: "0 16px",
                borderRadius: 7,
                border: "1px solid var(--border)",
                background: "none",
                cursor: "pointer",
                color: "var(--muted-foreground)",
                fontSize: 13,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--foreground)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--muted-foreground)";
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!nome.trim()}
              style={{
                height: 34,
                padding: "0 20px",
                borderRadius: 7,
                border: "none",
                background: nome.trim() ? "var(--primary)" : "var(--accent)",
                cursor: nome.trim() ? "pointer" : "not-allowed",
                color: nome.trim()
                  ? "var(--primary-foreground)"
                  : "var(--muted-foreground)",
                fontSize: 13,
                fontWeight: 600,
                transition: "all .15s",
              }}
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

