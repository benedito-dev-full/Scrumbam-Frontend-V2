"use client";

import { useState } from "react";
import { ArrowUpDown, Search, ChevronDown, MoreHorizontal, Download } from "lucide-react";

/* ─── Ícones ──────────────────────────────────────────────────────────────── */
function IcFormItem() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M9 11l3 3 5-5" />
    </svg>
  );
}

function IcLocation() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 11l3 3 5-5" />
    </svg>
  );
}

/* ─── Modelos ─────────────────────────────────────────────────────────────── */
const TEMPLATES = [
  {
    label: "Recebimento do projeto",
    desc: "Simplifique as solicitações de novos projetos",
    bg: "#f43f5e",
    icon: (
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M12 18v-6M9 15h6" />
      </svg>
    ),
  },
  {
    label: "Formulário de feedback",
    desc: "Faça pesquisas e colete opiniões",
    bg: "#14b8a6",
    icon: (
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M8 10h8M8 14h5" />
      </svg>
    ),
  },
  {
    label: "Formulário de pedido",
    desc: "Colete e processe os pedidos dos clientes",
    bg: "#8b5cf6",
    icon: (
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
];

/* ─── Dados mock ──────────────────────────────────────────────────────────── */
const FORMS = [
  { id: "1", name: "Form", location: "Form", createdBy: "RB", viewedAt: "12:41 pm" },
];

/* ─── Row com hover para ações ────────────────────────────────────────────── */
function FormRow({ form }: { form: typeof FORMS[0] }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 220px 120px 160px 72px",
        height: 44, alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "0 16px", cursor: "pointer",
        background: hovered ? "#1a1a1a" : "transparent",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* nome */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <IcFormItem />
        <span style={{ fontSize: 13, color: "#d4d4e0" }}>{form.name}</span>
      </div>
      {/* localização */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#6a6a80", fontSize: 13 }}>
        <IcLocation />
        {form.location}
      </div>
      {/* criado por */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{
          width: 24, height: 24, borderRadius: "50%",
          background: "linear-gradient(135deg, #7c5cff, #e040fb)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, fontWeight: 700, color: "#fff", letterSpacing: "0.02em",
        }}>
          {form.createdBy}
        </div>
      </div>
      {/* data */}
      <span style={{ fontSize: 13, color: "#6a6a80" }}>{form.viewedAt}</span>
      {/* ações — só aparecem no hover */}
      <div style={{
        display: "flex", alignItems: "center", gap: 0, justifyContent: "flex-end",
        opacity: hovered ? 1 : 0, transition: "opacity .1s",
      }}>
        <button type="button" style={{ background: "none", border: 0, cursor: "pointer", color: "#7a7a90", padding: "4px 3px", borderRadius: 4 }}
          onMouseEnter={e => { e.currentTarget.style.color = "#c4c4cc"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#7a7a90"; }}
        >
          <Download size={13} strokeWidth={1.7} />
        </button>
        <button type="button" style={{ background: "none", border: 0, cursor: "pointer", color: "#7a7a90", padding: "4px 3px", borderRadius: 4 }}
          onMouseEnter={e => { e.currentTarget.style.color = "#c4c4cc"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#7a7a90"; }}
        >
          <MoreHorizontal size={13} strokeWidth={1.7} />
        </button>
      </div>
    </div>
  );
}

/* ─── Página ──────────────────────────────────────────────────────────────── */
export default function FormsPage() {
  const [search, setSearch] = useState("");

  const filtered = FORMS.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "#111111", color: "#e6e6ea" }}>

      {/* topbar da página */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: 52, borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0,
      }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#e6e6ea", letterSpacing: "-0.01em" }}>Todos os formulários</h1>
        <button type="button" style={{
          display: "flex", alignItems: "center", gap: 6,
          height: 34, padding: "0 16px", borderRadius: 7,
          background: "#7c5cff", border: "none", cursor: "pointer",
          color: "#fff", fontSize: 13, fontWeight: 600,
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "#6d4eef"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#7c5cff"; }}
        >
          Novo formulário
          <ChevronDown size={13} strokeWidth={2.5} />
        </button>
      </div>

      {/* conteúdo scrollável */}
      <div style={{ flex: 1, overflow: "auto", padding: "24px 24px 16px" }}>

        {/* label Modelos */}
        <p style={{ fontSize: 13, color: "#6a6a80", marginBottom: 12, fontWeight: 400 }}>Modelos</p>

        {/* cards de modelos — sem borda, fundo sutil */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
          {TEMPLATES.map((tpl) => (
            <button key={tpl.label} type="button" style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "16px 16px", borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.07)", background: "#181818",
              cursor: "pointer", textAlign: "left",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "#15151c"; e.currentTarget.style.borderColor = "#252530"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#181818"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
            >
              {/* ícone — quadrado colorido sólido */}
              <div style={{
                width: 44, height: 44, borderRadius: 10, background: tpl.bg, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {tpl.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#dcdce8", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tpl.label}</p>
                <p style={{ fontSize: 12, color: "#6a6a80", lineHeight: 1.45 }}>{tpl.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* toolbar: Classificar + Pesquisar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 0 }}>
          <button type="button" style={{
            display: "flex", alignItems: "center", gap: 6,
            height: 30, padding: "0 10px", borderRadius: 6,
            border: "1px solid #26262d", background: "none",
            cursor: "pointer", color: "#a0a0b8", fontSize: 12,
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#1e1e1e"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
          >
            <ArrowUpDown size={13} strokeWidth={1.8} />
            Classificar
          </button>

          {/* Pesquisar — sem borda, apenas ícone + texto */}
          <button type="button" style={{
            display: "flex", alignItems: "center", gap: 6,
            height: 30, padding: "0 10px", borderRadius: 6,
            border: "none", background: "none", cursor: "pointer", color: "#6a6a80", fontSize: 12,
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#1e1e1e"; e.currentTarget.style.color = "#a0a0b8"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#6a6a80"; }}
            onClick={() => {
              const inp = document.getElementById("forms-search");
              if (inp) inp.focus();
            }}
          >
            <Search size={13} strokeWidth={1.8} />
            {search ? (
              <input
                id="forms-search"
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ background: "none", border: "none", outline: "none", color: "#c4c4cc", fontSize: 12, width: 100 }}
              />
            ) : (
              <span>Pesquisar</span>
            )}
          </button>
        </div>

        {/* tabela */}
        <div style={{ borderRadius: 8, overflow: "hidden", marginTop: 2 }}>
          {/* cabeçalho */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 220px 120px 160px 72px",
            height: 34, alignItems: "center",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            padding: "0 16px",
          }}>
            {["Nome", "Localização", "Criado por", "Data de visual...", ""].map((col, i) => (
              <span key={i} style={{ fontSize: 12, fontWeight: 500, color: "#4a4a5e" }}>{col}</span>
            ))}
          </div>

          {/* linhas */}
          {filtered.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "#4a4a5e", fontSize: 13 }}>
              Nenhum formulário encontrado
            </div>
          ) : (
            filtered.map((form) => <FormRow key={form.id} form={form} />)
          )}
        </div>
      </div>
    </div>
  );
}
