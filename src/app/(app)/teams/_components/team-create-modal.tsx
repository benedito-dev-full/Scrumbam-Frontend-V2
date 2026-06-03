"use client";

import React, { useState } from "react";
import type { CreateTeamPayloadLocal } from "../_lib/teams-local";
import { COLOR_PALETTE, TEAM_ICONS, TeamIconSvg } from "./team-icons";

/* ══════════════════════════════════════════════════════════════════
   MODAL CRIAR EQUIPE
══════════════════════════════════════════════════════════════════ */

export function CreateTeamModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (p: CreateTeamPayloadLocal) => void;
}) {
  const [nome, setNome] = useState("");
  const [color, setColor] = useState(COLOR_PALETTE[2]);
  const [icon, setIcon] = useState(TEAM_ICONS[0].name);
  const [panelOpen, setPanelOpen] = useState(false);
  const [colorDropOpen, setColorDropOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedIcon = TEAM_ICONS.find((i) => i.name === icon) ?? TEAM_ICONS[0];
  const filteredIcons = search.trim()
    ? TEAM_ICONS.filter((i) => i.name.includes(search.toLowerCase()))
    : TEAM_ICONS;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nome.trim();
    if (!trimmed) return;
    onCreate({ nome: trimmed, color, icon });
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
        // fecha sub-dropdowns ao clicar fora
        if (colorDropOpen) setColorDropOpen(false);
        if (panelOpen) setPanelOpen(false);
      }}
    >
      <div
        style={{
          width: 460,
          borderRadius: 12,
          background: "var(--card)",
          border: "1px solid var(--border)",
          padding: "28px 28px 24px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--foreground)",
            marginBottom: 6,
          }}
        >
          Criar equipe
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "var(--muted-foreground)",
            marginBottom: 20,
            lineHeight: 1.5,
          }}
        >
          Uma equipe representa um grupo de pessoas com espaços e configurações
          próprias.
        </p>

        <form onSubmit={handleSubmit}>
          <p
            style={{
              fontSize: 12,
              color: "var(--muted-foreground)",
              fontWeight: 500,
              marginBottom: 8,
            }}
          >
            Ícone e nome
          </p>

          {/* linha: avatar-botão + input nome */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: panelOpen ? 0 : 20,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setPanelOpen((v) => !v);
                setColorDropOpen(false);
              }}
              style={{
                flexShrink: 0,
                width: 42,
                height: 42,
                borderRadius: 8,
                background: color,
                border: panelOpen
                  ? "2px solid var(--border)"
                  : "2px solid transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "border-color .15s",
              }}
            >
              <TeamIconSvg path={selectedIcon.path} size={22} color="#fff" />
            </button>

            <input
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="por exemplo, marketing, engenharia, RH"
              style={{
                flex: 1,
                height: 42,
                padding: "0 14px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--border)",
                color: "var(--foreground)",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            />
          </div>

          {/* painel de ícones — sem aba de cor, cor é sub-dropdown */}
          {panelOpen && (
            <div
              style={{
                marginTop: 2,
                marginBottom: 20,
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--card)",
                overflow: "visible",
              }}
            >
              {/* cabeçalho fixo da aba ícone */}
              <div
                style={{
                  display: "flex",
                  borderBottom: "1px solid var(--border)",
                  padding: "0 10px",
                }}
              >
                <div
                  style={{
                    height: 38,
                    display: "flex",
                    alignItems: "center",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--foreground)",
                    borderBottom: "2px solid #e4e4e4",
                    paddingBottom: 0,
                  }}
                >
                  Ícone
                </div>
              </div>

              <div style={{ padding: "10px 10px 12px" }}>
                {/* barra pesquisa + bolinha cor (sub-dropdown) */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 10,
                    position: "relative",
                  }}
                >
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Pesquisar..."
                    style={{
                      flex: 1,
                      height: 30,
                      padding: "0 10px",
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                      background: "var(--border)",
                      color: "var(--foreground)",
                      fontSize: 12,
                      outline: "none",
                    }}
                  />

                  {/* bolinha cor — abre sub-dropdown flutuante */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setColorDropOpen((v) => !v);
                      }}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        border: "2px solid var(--border)",
                        background: color,
                        cursor: "pointer",
                        display: "block",
                      }}
                    />

                    {colorDropOpen && (
                      <div
                        style={{
                          position: "absolute",
                          top: 30,
                          right: 0,
                          zIndex: 10,
                          background: "var(--accent)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          padding: "10px",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 6,
                          width: 168,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {COLOR_PALETTE.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              setColor(c);
                              setColorDropOpen(false);
                            }}
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: "50%",
                              background: c,
                              border: "2px solid",
                              borderColor: color === c ? "#fff" : "transparent",
                              cursor: "pointer",
                              transition: "border-color .1s",
                              boxShadow:
                                color === c ? `0 0 0 1px ${c}` : "none",
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* grid de ícones SVG — selecionar NÃO fecha painel */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(11, 1fr)",
                    gap: 0,
                    maxHeight: 196,
                    overflowY: "auto",
                  }}
                >
                  {filteredIcons.map((opt) => (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => setIcon(opt.name)}
                      title={opt.name}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 4,
                        border: "none",
                        background:
                          icon === opt.name ? "var(--border)" : "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color:
                          icon === opt.name
                            ? "var(--foreground)"
                            : "var(--muted-foreground)",
                        transition: "background .1s, color .1s",
                      }}
                      onMouseEnter={(e) => {
                        if (icon !== opt.name) {
                          e.currentTarget.style.background = "var(--border)";
                          e.currentTarget.style.color = "var(--foreground)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (icon !== opt.name) {
                          e.currentTarget.style.background = "none";
                          e.currentTarget.style.color =
                            "var(--muted-foreground)";
                        }
                      }}
                    >
                      <TeamIconSvg
                        path={opt.path}
                        size={16}
                        color="currentColor"
                      />
                    </button>
                  ))}
                </div>

                {/* botão confirmar seleção */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 10,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setPanelOpen(false)}
                    style={{
                      height: 28,
                      padding: "0 14px",
                      borderRadius: 6,
                      border: "none",
                      background: "var(--border)",
                      cursor: "pointer",
                      color: "var(--foreground)",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--border)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--border)";
                    }}
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
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
              Criar equipe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

