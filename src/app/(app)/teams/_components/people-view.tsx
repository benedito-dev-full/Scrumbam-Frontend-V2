"use client";

import { useState } from "react";
import { ChevronDown, Search, LayoutGrid, List } from "lucide-react";
import type { PersonMock, PeopleFilter } from "../_lib/teams-local";

/* ══════════════════════════════════════════════════════════════════
   ALL PEOPLE VIEW — aba "Todas as pessoas"
══════════════════════════════════════════════════════════════════ */

export function AllPeopleView({ pessoas }: { pessoas: PersonMock[] }) {
  const [activeFilter, setActiveFilter] = useState<PeopleFilter | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filters: { id: PeopleFilter; label: string }[] = [
    { id: "status", label: "Status" },
    { id: "equipe", label: "Equipe" },
    { id: "tipo", label: "Tipo de conta" },
    { id: "gerente", label: "Gerente" },
    { id: "classificar", label: "Classificar" },
  ];

  const filtered = search.trim()
    ? pessoas.filter((p) => p.nome.toLowerCase().includes(search.toLowerCase()))
    : pessoas;

  const getIniciais = (nome: string) =>
    nome
      .trim()
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* topbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          height: 52,
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <h1
          style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)" }}
        >
          Todas as pessoas
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            style={{
              height: 30,
              padding: "0 14px",
              borderRadius: 7,
              border: "1px solid var(--border)",
              background: "none",
              cursor: "pointer",
              color: "var(--foreground)",
              fontSize: 13,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--foreground)";
            }}
          >
            <svg
              width={13}
              height={13}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Exportar
          </button>
          <button
            type="button"
            style={{
              height: 30,
              padding: "0 14px",
              borderRadius: 7,
              border: "none",
              background: "var(--primary)",
              cursor: "pointer",
              color: "var(--primary-foreground)",
              fontSize: 13,
              fontWeight: 600,
              transition: "filter 120ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = "brightness(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "none";
            }}
          >
            Convidar
          </button>
        </div>
      </div>

      {/* barra de filtros */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          height: 44,
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() =>
                setActiveFilter(activeFilter === f.id ? null : f.id)
              }
              style={{
                height: 28,
                padding: "0 10px",
                borderRadius: 6,
                border: "1px solid",
                borderColor:
                  activeFilter === f.id ? "var(--border)" : "var(--border)",
                background: activeFilter === f.id ? "var(--border)" : "none",
                cursor: "pointer",
                color:
                  activeFilter === f.id
                    ? "var(--foreground)"
                    : "var(--muted-foreground)",
                fontSize: 12,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "all .15s",
              }}
              onMouseEnter={(e) => {
                if (activeFilter !== f.id) {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--foreground)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeFilter !== f.id) {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--muted-foreground)";
                }
              }}
            >
              {f.label} <ChevronDown size={11} strokeWidth={2} />
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {searchOpen ? (
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={() => {
                if (!search) setSearchOpen(false);
              }}
              placeholder="Pesquisar pessoa..."
              style={{
                height: 28,
                padding: "0 10px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "var(--border)",
                color: "var(--foreground)",
                fontSize: 12,
                outline: "none",
                width: 180,
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "none",
                cursor: "pointer",
                color: "var(--muted-foreground)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--foreground)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--muted-foreground)";
              }}
            >
              <Search size={13} strokeWidth={1.8} />
            </button>
          )}
          {(
            [
              { mode: "grid" as const, icon: LayoutGrid },
              { mode: "list" as const, icon: List },
            ] as const
          ).map(({ mode, icon: Icon }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: "1px solid",
                borderColor:
                  viewMode === mode ? "var(--border)" : "var(--border)",
                background: viewMode === mode ? "var(--border)" : "none",
                cursor: "pointer",
                color:
                  viewMode === mode
                    ? "var(--foreground)"
                    : "var(--muted-foreground)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={13} strokeWidth={1.8} />
            </button>
          ))}
        </div>
      </div>

      {/* grid de pessoas */}
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {filtered.length === 0 && search ? (
          <p style={{ color: "var(--muted-foreground)", fontSize: 13 }}>
            Nenhuma pessoa encontrada para &ldquo;{search}&rdquo;.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "calc(var(--row-gap) + 6px)",
            }}
          >
            {filtered.map((p) => (
              <div
                key={p.id}
                style={{
                  width: 148,
                  borderRadius: 10,
                  background: "var(--accent)",
                  border: "1px solid var(--border)",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "border-color .15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "var(--border)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "var(--border)";
                }}
              >
                {/* avatar grande */}
                <div
                  style={{
                    height: 148,
                    background: "var(--muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 36,
                      fontWeight: 800,
                      color: "var(--foreground)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {getIniciais(p.nome)}
                  </span>
                </div>
                {/* nome + dot */}
                <div
                  style={{
                    padding: "10px 12px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--foreground)",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.nome}
                  </span>
                  {p.online && (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#22c55e",
                        flexShrink: 0,
                        boxShadow: "0 0 0 2px #1e1e1e",
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
