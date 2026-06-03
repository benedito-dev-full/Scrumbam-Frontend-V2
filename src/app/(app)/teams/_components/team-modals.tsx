"use client";

import { useState } from "react";
import type { TeamLocal, CreateTeamPayloadLocal } from "../_lib/teams-local";

/* ══════════════════════════════════════════════════════════════════
   CONSTANTES — paleta de cores e icones SVG
══════════════════════════════════════════════════════════════════ */

export const COLOR_PALETTE = [
  "#8b5cf6",
  "#6366f1",
  "#3b82f6",
  "#06b6d4",
  "#22c55e",
  "#eab308",
  "#f97316",
  "#ef4444",
  "#ec4899",
  "#f43f5e",
  "#a3a3a3",
  "#64748b",
];

/** Icones SVG monocromaticos — paths Lucide */
export const TEAM_ICONS: { name: string; path: string }[] = [
  {
    name: "users",
    path: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  },
  {
    name: "rocket",
    path: "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z",
  },
  {
    name: "star",
    path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  },
  { name: "zap", path: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
  { name: "shield", path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
  {
    name: "target",
    path: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  },
  { name: "code", path: "M16 18l6-6-6-6M8 6l-6 6 6 6" },
  { name: "bar-chart", path: "M18 20V10M12 20V4M6 20v-6" },
  {
    name: "globe",
    path: "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
  },
  {
    name: "wrench",
    path: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  },
  {
    name: "layers",
    path: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  },
  {
    name: "briefcase",
    path: "M20 7H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2",
  },
  { name: "trending-up", path: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" },
  {
    name: "settings",
    path: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  },
  {
    name: "flag",
    path: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7",
  },
  {
    name: "cpu",
    path: "M18 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM9 9h6v6H9zM9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3",
  },
  {
    name: "package",
    path: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12",
  },
  {
    name: "heart",
    path: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  },
  {
    name: "lock",
    path: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4",
  },
  {
    name: "message",
    path: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  },
  {
    name: "database",
    path: "M12 2C6.48 2 2 4.24 2 7v10c0 2.76 4.48 5 10 5s10-2.24 10-5V7c0-2.76-4.48-5-10-5zM2 12c0 2.76 4.48 5 10 5s10-2.24 10-5M2 7c0 2.76 4.48 5 10 5s10-2.24 10-5",
  },
  {
    name: "compass",
    path: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z",
  },
  {
    name: "award",
    path: "M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.21 13.89L7 23l5-3 5 3-1.21-9.12",
  },
  { name: "map", path: "M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4zM8 2v16M16 6v16" },
  {
    name: "box",
    path: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
  },
  {
    name: "book",
    path: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z",
  },
  {
    name: "camera",
    path: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  },
  { name: "activity", path: "M22 12h-4l-3 9L9 3l-3 9H2" },
  { name: "cloud", path: "M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" },
  { name: "terminal", path: "M4 17l6-6-6-6M12 19h8" },
  {
    name: "git-branch",
    path: "M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9",
  },
  {
    name: "layout",
    path: "M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM3 9h18M9 21V9",
  },
  {
    name: "mail",
    path: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  },
  {
    name: "phone",
    path: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  },
  {
    name: "search",
    path: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35",
  },
  {
    name: "home",
    path: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  },
  {
    name: "printer",
    path: "M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z",
  },
  {
    name: "wifi",
    path: "M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01",
  },
  {
    name: "bell",
    path: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  },
  {
    name: "user",
    path: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  },
  {
    name: "edit",
    path: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  },
  {
    name: "trash",
    path: "M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6",
  },
  {
    name: "link",
    path: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  },
  {
    name: "eye",
    path: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  },
  { name: "filter", path: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z" },
  {
    name: "copy",
    path: "M20 9H11a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
  },
  {
    name: "upload",
    path: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  },
  {
    name: "download",
    path: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  },
  {
    name: "maximize",
    path: "M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3",
  },
  { name: "grid", path: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" },
  { name: "list", path: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" },
  { name: "minus", path: "M5 12h14" },
  { name: "plus", path: "M12 5v14M5 12h14" },
  { name: "check", path: "M20 6L9 17l-5-5" },
  { name: "x", path: "M18 6L6 18M6 6l12 12" },
  {
    name: "info",
    path: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01",
  },
  {
    name: "alert",
    path: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  },
  {
    name: "help",
    path: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01",
  },
  {
    name: "tag",
    path: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
  },
  {
    name: "bookmark",
    path: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z",
  },
  {
    name: "calendar",
    path: "M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18",
  },
  {
    name: "clock",
    path: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  },
  {
    name: "refresh",
    path: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  },
  {
    name: "share",
    path: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13",
  },
  { name: "send", path: "M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" },
  {
    name: "paper-clip",
    path: "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48",
  },
  {
    name: "image",
    path: "M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21",
  },
  {
    name: "video",
    path: "M22.54 6.42a2.78 2.78 0 0 0-1.95-1.95C18.88 4 12 4 12 4s-6.88 0-8.59.47a2.78 2.78 0 0 0-1.95 1.95A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z",
  },
];

/* ══════════════════════════════════════════════════════════════════
   TEAM ICON SVG — helper de renderizacao de icone monocromatico
══════════════════════════════════════════════════════════════════ */

export function TeamIconSvg({
  path,
  size = 16,
  color = "currentColor",
}: {
  path: string;
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}

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
