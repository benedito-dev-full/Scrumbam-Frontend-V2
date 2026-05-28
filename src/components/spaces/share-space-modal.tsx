"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Search, Check, Users } from "lucide-react";
import { useOrgMembers } from "@/hooks/use-org-members";
import type { OrgMemberDto } from "@/lib/types/api";

interface ShareSpaceModalProps {
  open: boolean;
  spaceName: string;
  onClose: () => void;
  /** Chamado com os userIds selecionados ao clicar em Confirmar */
  onConfirm: (userIds: string[]) => void;
  isPending?: boolean;
}

function Avatar({ nome, size = 36 }: { nome: string; size?: number }) {
  const initials = nome
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const colors = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f97316",
    "#22c55e", "#14b8a6", "#3b82f6", "#eab308",
  ];
  const color = colors[nome.charCodeAt(0) % colors.length];

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 700,
        color: "#fff",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export function ShareSpaceModal({
  open,
  spaceName,
  onClose,
  onConfirm,
  isPending,
}: ShareSpaceModalProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { data: members = [], isLoading } = useOrgMembers();
  const searchRef = useRef<HTMLInputElement>(null);

  /* foca o input ao abrir e limpa seleção */
  useEffect(() => {
    if (open) {
      setSearch("");
      setSelected(new Set());
      setTimeout(() => searchRef.current?.focus(), 80);
    }
  }, [open]);

  /* fecha com Escape */
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.nome.toLowerCase().includes(q) ||
      (m.email ?? "").toLowerCase().includes(q)
    );
  });

  function toggle(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function handleConfirm() {
    onConfirm(Array.from(selected));
  }

  const roleLabel: Record<OrgMemberDto["role"], string> = {
    ADMIN: "Admin",
    MEMBER: "Membro",
    VIEWER: "Visualizador",
  };

  return createPortal(
    <>
      {/* overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          zIndex: 10000,
        }}
      />

      {/* modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(560px, calc(100vw - 32px))",
          maxHeight: "80vh",
          borderRadius: 16,
          background: "var(--card)",
          border: "1px solid var(--border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          zIndex: 10001,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* ── cabeçalho ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 16px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--foreground)",
                margin: 0,
              }}
            >
              Compartilhar espaço
            </h2>
            <p
              style={{
                fontSize: 12,
                color: "var(--muted-foreground)",
                marginTop: 3,
              }}
            >
              {spaceName} · Selecione os membros que terão acesso
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: 0,
              background: "none",
              cursor: "pointer",
              color: "var(--muted-foreground)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--accent)";
              e.currentTarget.style.color = "var(--foreground)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.color = "var(--muted-foreground)";
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── busca ── */}
        <div
          style={{
            padding: "14px 24px 10px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 38,
              padding: "0 12px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--background)",
            }}
          >
            <Search size={14} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou e-mail…"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 13,
                color: "var(--foreground)",
              }}
            />
          </div>
        </div>

        {/* ── lista de membros ── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "4px 16px 8px",
          }}
        >
          {isLoading && (
            <p style={{ fontSize: 13, color: "var(--muted-foreground)", padding: "16px 8px" }}>
              Carregando membros…
            </p>
          )}

          {!isLoading && filtered.length === 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                padding: "40px 0",
                color: "var(--muted-foreground)",
              }}
            >
              <Users size={32} strokeWidth={1.5} />
              <p style={{ fontSize: 13 }}>Nenhum membro encontrado</p>
            </div>
          )}

          {filtered.map((member) => {
            const isSelected = selected.has(member.userId);
            return (
              <button
                key={member.userId}
                type="button"
                onClick={() => toggle(member.userId)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  padding: "10px 8px",
                  borderRadius: 10,
                  border: 0,
                  background: isSelected ? "rgba(37,99,235,0.08)" : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 120ms",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected)
                    e.currentTarget.style.background = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                <Avatar nome={member.nome} size={38} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--foreground)",
                      marginBottom: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {member.nome}
                  </p>
                  {member.email && (
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--muted-foreground)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {member.email}
                    </p>
                  )}
                </div>

                <span
                  style={{
                    fontSize: 11,
                    color: "var(--muted-foreground)",
                    flexShrink: 0,
                    marginRight: 8,
                  }}
                >
                  {roleLabel[member.role]}
                </span>

                {/* checkbox */}
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    border: isSelected
                      ? "2px solid #2563eb"
                      : "2px solid var(--border)",
                    background: isSelected ? "#2563eb" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "background 150ms, border-color 150ms",
                  }}
                >
                  {isSelected && <Check size={12} strokeWidth={3} color="#fff" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── rodapé ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 24px 20px",
            borderTop: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
            {selected.size > 0
              ? `${selected.size} membro${selected.size > 1 ? "s" : ""} selecionado${selected.size > 1 ? "s" : ""}`
              : "Nenhum membro selecionado"}
          </span>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                height: 34,
                padding: "0 16px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "none",
                cursor: "pointer",
                color: "var(--foreground)",
                fontSize: 13,
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selected.size === 0 || isPending}
              style={{
                height: 34,
                padding: "0 20px",
                borderRadius: 8,
                border: "none",
                background: selected.size > 0 ? "#2563eb" : "var(--accent)",
                cursor: selected.size > 0 && !isPending ? "pointer" : "default",
                color: selected.size > 0 ? "#fff" : "var(--muted-foreground)",
                fontSize: 13,
                fontWeight: 600,
                transition: "background 150ms, filter 150ms",
                opacity: isPending ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (selected.size > 0 && !isPending)
                  e.currentTarget.style.filter = "brightness(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "none";
              }}
            >
              {isPending ? "Convidando…" : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
