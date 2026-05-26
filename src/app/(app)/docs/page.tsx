"use client";

import { useState } from "react";
import { Filter, ArrowUpDown, Search, MoreHorizontal, ChevronDown, Download, Info } from "lucide-react";
import { SpaceChip } from "@/components/shell/space-chip";
import { mockEntidades } from "@/lib/mocks/entidades";
import { isEspaco } from "@/lib/types/entidade";

/* ─── Ícone de documento — quadrado azul com dobra (estilo ClickUp) ───────── */
function IcDocBlue() {
  return (
    <svg width={18} height={18} viewBox="0 0 20 20" fill="none">
      {/* corpo do documento */}
      <rect x="2" y="1" width="13" height="17" rx="2" fill="#3b82f6" />
      {/* dobra no canto superior direito */}
      <path d="M11 1 L15 5 L11 5 Z" fill="#1d4ed8" />
      {/* linhas de texto */}
      <line x1="5" y1="9"  x2="12" y2="9"  stroke="var(--border)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="5" y1="12" x2="12" y2="12" stroke="var(--border)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="5" y1="15" x2="9"  y2="15" stroke="var(--border)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Ícone de pasta (localização "Documentos" — sem espaço associado) ────── */
function IcFolderOutline({ color = "var(--muted-foreground)" }: { color?: string }) {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/* ─── Resolve espaço ancestral de um doc ──────────────────────────────────── */
function resolveEspaco(idPai: string | null) {
  if (!idPai) return null;
  let cursor = mockEntidades.find(e => e.id === idPai) ?? null;
  while (cursor) {
    if (isEspaco(cursor)) return cursor;
    const pai = cursor.idPai;
    cursor = pai ? (mockEntidades.find(e => e.id === pai) ?? null) : null;
  }
  return null;
}

/* ─── Modelos ─────────────────────────────────────────────────────────────── */
const TEMPLATES = [
  {
    icon: (
      <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#f97316,#dc2626)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
    ),
    title: "Visão geral do projeto",
    desc: "Resuma metas, escopo e marcos",
  },
  {
    icon: (
      <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#f59e0b,#d97706)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
    ),
    title: "Atas da reunião",
    desc: "Colete uma pauta, anotações e itens de ação",
  },
  {
    icon: (
      <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
    ),
    title: "Wiki",
    desc: "Organize as informações em um só lugar",
    verified: true,
  },
];

/* ─── Docs mock — ligados ao mockEntidades ────────────────────────────────── */
type Doc = {
  nome: string;
  idPai: string | null;
  localizacaoLabel: string;
  semEspaco?: boolean; // localização "Documentos" — pasta genérica
  atualizadoEm: string;
  visualizadoEm: string;
  autorCor: string;
  autorLetra: string;
};

const DOCS: Doc[] = [
  {
    nome: "Documento",
    idPai: null,
    localizacaoLabel: "Documentos",
    semEspaco: true,
    atualizadoEm: "Yesterday",
    visualizadoEm: "Yesterday",
    autorCor: "#22c55e",
    autorLetra: "F",
  },
  {
    nome: "Documento",
    idPai: "esp-marketing",
    localizacaoLabel: "Marketing",
    atualizadoEm: "Yesterday",
    visualizadoEm: "Yesterday",
    autorCor: "#22c55e",
    autorLetra: "F",
  },
  {
    nome: "Documento teste",
    idPai: "esp-marketing",
    localizacaoLabel: "Marketing",
    atualizadoEm: "Yesterday",
    visualizadoEm: "Yesterday",
    autorCor: "#22c55e",
    autorLetra: "F",
  },
];

/* ─── Linha da tabela ─────────────────────────────────────────────────────── */
function DocRow({ doc }: { doc: Doc }) {
  const [hovered, setHovered] = useState(false);
  const espaco = doc.idPai ? resolveEspaco(doc.idPai) : null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) 200px 120px 160px 160px 72px 32px",
        alignItems: "center",
        height: 44,
        borderBottom: "1px solid var(--border)",
        background: hovered ? "var(--border)" : "transparent",
        cursor: "pointer",
        paddingLeft: 16,
        paddingRight: 8,
      }}
    >
      {/* nome */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
        <IcDocBlue />
        <span style={{ fontSize: 13, color: "var(--foreground)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {doc.nome}
        </span>
      </div>

      {/* localização — SpaceChip do espaço real, ou pasta genérica */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {doc.semEspaco || !espaco ? (
          <IcFolderOutline color="var(--muted-foreground)" />
        ) : (
          <SpaceChip
            iniciais={espaco.meta.iniciais}
            cor={espaco.meta.cor}
            iconName={espaco.meta.iconName}
            size="xs"
          />
        )}
        <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{doc.localizacaoLabel}</span>
      </div>

      {/* etiquetas */}
      <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>–</div>

      {/* data de atualização */}
      <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{doc.atualizadoEm}</div>

      {/* data de visualização */}
      <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{doc.visualizadoEm}</div>

      {/* compartilhamento — avatar */}
      <div>
        <div style={{
          width: 22, height: 22, borderRadius: "50%",
          background: doc.autorCor,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 700, color: "#fff",
        }}>{doc.autorLetra}</div>
      </div>

      {/* ações */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        {hovered && (
          <button type="button" style={{
            width: 24, height: 24, borderRadius: 5, border: 0,
            background: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--muted-foreground)",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.color = "var(--foreground)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--muted-foreground)"; }}
          >
            <MoreHorizontal size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Cabeçalho da tabela ─────────────────────────────────────────────────── */
function TableHead() {
  const cols = [
    { label: "Nome",                  accent: false },
    { label: "Localização",           accent: true  },
    { label: "Etiquetas",             accent: false },
    { label: "Data de atualização",   accent: false },
    { label: "Data de visual...",     accent: false, icon: true },
    { label: "Compartilha...",        accent: false },
    { label: "",                      accent: false, info: true },
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "minmax(0,1fr) 200px 120px 160px 160px 72px 32px",
      alignItems: "center",
      height: 36,
      borderBottom: "1px solid var(--border)",
      paddingLeft: 16,
      paddingRight: 8,
    }}>
      {cols.map((col, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 11, color: col.accent ? "var(--muted-foreground)" : "var(--muted-foreground)", fontWeight: 500 }}>
            {col.label}
          </span>
          {col.icon && <ArrowUpDown size={10} color="var(--muted-foreground)" />}
          {col.info && <Info size={11} color="var(--muted-foreground)" />}
        </div>
      ))}
    </div>
  );
}

/* ─── Página ──────────────────────────────────────────────────────────────── */
export default function DocsPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--background)", overflow: "hidden" }}>

      {/* topbar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", height: 52,
        borderBottom: "1px solid var(--border)", flexShrink: 0,
      }}>
        <h1 style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)" }}>Todos os documentos</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" style={{
            display: "flex", alignItems: "center", gap: 6,
            height: 32, padding: "0 12px", borderRadius: 7,
            border: "1px solid var(--border)", background: "none",
            cursor: "pointer", color: "var(--muted-foreground)", fontSize: 13,
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.color = "var(--foreground)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--muted-foreground)"; }}
          >
            <Download size={13} strokeWidth={1.7} />
            Importar
          </button>
          <button type="button" style={{
            display: "flex", alignItems: "center", gap: 6,
            height: 32, padding: "0 14px", borderRadius: 7,
            border: "none", background: "var(--foreground)",
            cursor: "pointer", color: "var(--primary-foreground)", fontSize: 13, fontWeight: 700,
          }}
            onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.filter = "none"; }}
          >
            Novo documento
            <ChevronDown size={12} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* conteúdo scrollável */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

        {/* Modelos */}
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 10 }}>Modelos</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
          {TEMPLATES.map((tpl) => (
            <button key={tpl.title} type="button" style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px 16px", borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--card)", cursor: "pointer", textAlign: "left",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.borderColor = "var(--border)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--card)"; e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              {tpl.icon}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{tpl.title}</p>
                  {tpl.verified && (
                    <svg width={13} height={13} viewBox="0 0 24 24" fill="#3b82f6">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>{tpl.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button type="button" style={{
              display: "flex", alignItems: "center", gap: 5,
              height: 30, padding: "0 10px", borderRadius: 6,
              border: "1px solid var(--border)", background: "none",
              cursor: "pointer", color: "var(--muted-foreground)", fontSize: 12,
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--accent)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
            >
              <Filter size={11} strokeWidth={2} />
              filtros
            </button>
            <button type="button" style={{
              display: "flex", alignItems: "center", gap: 5,
              height: 30, padding: "0 10px", borderRadius: 6,
              border: "none", background: "none",
              cursor: "pointer", color: "var(--muted-foreground)", fontSize: 12,
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--accent)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
            >
              <ArrowUpDown size={11} strokeWidth={2} />
              Classificar
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 4 }}>
              <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Etiquetas:</span>
              <button type="button" style={{
                height: 28, padding: "0 10px", borderRadius: 6,
                border: "none", background: "none",
                cursor: "pointer", color: "var(--muted-foreground)", fontSize: 12,
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--accent)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
              >
                Visualizar tudo
              </button>
            </div>
          </div>
          <button type="button" style={{
            display: "flex", alignItems: "center", gap: 5,
            height: 30, padding: "0 10px", borderRadius: 6,
            border: "none", background: "none",
            cursor: "pointer", color: "var(--muted-foreground)", fontSize: 12,
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--accent)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
          >
            <Search size={12} strokeWidth={2} />
            Pesquisar
          </button>
        </div>

        {/* Tabela */}
        <div style={{
          borderRadius: 8,
          border: "1px solid var(--border)",
          overflow: "hidden",
          background: "var(--card)",
        }}>
          <TableHead />
          {DOCS.map((doc, i) => (
            <DocRow key={i} doc={doc} />
          ))}
        </div>

      </div>
    </div>
  );
}
