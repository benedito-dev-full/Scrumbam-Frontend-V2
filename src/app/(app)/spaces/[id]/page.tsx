"use client";

import { use, useState } from "react";
import {
  Star, Share2, Bot, Sparkles, Plus, Filter,
  RefreshCw, LayoutGrid, Maximize2, Settings2,
} from "lucide-react";
import { SpaceChip } from "@/components/shell/space-chip";
import { useEntidadesStore } from "@/lib/stores/entidades";
import { useFilhosDe } from "@/lib/stores/entidades";
import { isEspaco } from "@/lib/types/entidade";
import { mockEntidades } from "@/lib/mocks/entidades";
import Link from "next/link";

/* ─── Ícones ──────────────────────────────────────────────────────────────── */
function IcList() {
  return (
    <svg width={13} height={13} viewBox="0 0 18 18" fill="none">
      <path d="M2 5 L4.5 7.5 L7 3.5" stroke="#7c6ff7" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 11 L4.5 13.5 L7 9.5" stroke="#7c6ff7" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <line x1="9" y1="5.5" x2="16" y2="5.5" stroke="#7c6ff7" strokeWidth={1.6} strokeLinecap="round" />
      <line x1="9" y1="11.5" x2="16" y2="11.5" stroke="#7c6ff7" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

function IcFolder({ color = "#9ca3af" }: { color?: string }) {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IcDoc() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8" />
    </svg>
  );
}

function IcCaret() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IcMenu() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function IcVoice() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
    </svg>
  );
}

function IcBookmark() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/* ─── Tabs ────────────────────────────────────────────────────────────────── */
type TabId = "overview" | "lista" | "quadro" | "calendario" | "gantt" | "tabela";

const TABS: { id: TabId; label: string; icon?: React.ReactNode }[] = [
  { id: "overview",   label: "Overview" },
  { id: "lista",      label: "Lista",      icon: <svg width={12} height={12} viewBox="0 0 18 18" fill="none"><path d="M2 4.5 L4.5 7 L7 3" stroke="#e879f9" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/><line x1="9" y1="5" x2="16" y2="5" stroke="#e879f9" strokeWidth={1.6} strokeLinecap="round"/><path d="M2 10.5 L4.5 13 L7 9" stroke="#e879f9" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/><line x1="9" y1="11" x2="16" y2="11" stroke="#e879f9" strokeWidth={1.6} strokeLinecap="round"/></svg> },
  { id: "quadro",     label: "Quadro",     icon: <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/></svg> },
  { id: "calendario", label: "Calendário", icon: <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg> },
  { id: "gantt",      label: "Gantt",      icon: <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="14" y2="6"/><line x1="7" y1="12" x2="20" y2="12"/><line x1="3" y1="18" x2="16" y2="18"/></svg> },
  { id: "tabela",     label: "Tabela",     icon: <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg> },
];

/* ─── Página ──────────────────────────────────────────────────────────────── */
export default function SpacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const entidade = useEntidadesStore((s) => s.entidades.find((e) => e.id === id) ?? null);
  const filhos = useFilhosDe(id);

  if (!entidade || !isEspaco(entidade)) {
    return <div style={{ color: "#7a7a85", padding: 40 }}>Espaço não encontrado.</div>;
  }

  const pastas = filhos.filter((f) => f.idClasse === "pasta");
  const listas = filhos.filter((f) => f.idClasse === "backlog" || f.idClasse === "board");
  const docs   = filhos.filter((f) => f.idClasse === "doc");

  /* recent — todos os filhos diretos + filhos das pastas */
  const filhosDasPastas = pastas.flatMap((p) =>
    mockEntidades.filter((e) => e.idPai === p.id)
  );
  const recentes = [...filhos, ...filhosDasPastas].slice(0, 6);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#111111", overflow: "hidden" }}>

      {/* ── Topbar do espaço ── */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", height: 44, flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#111111",
      }}>
        {/* esquerda: chip + nome + estrela + menu */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <SpaceChip iniciais={entidade.meta.iniciais} cor={entidade.meta.cor} iconName={entidade.meta.iconName} size="sm" />
          <button type="button" style={{ display: "flex", alignItems: "center", gap: 4, border: 0, background: "none", cursor: "pointer", color: "#e4e4e4", fontSize: 14, fontWeight: 600 }}>
            {entidade.nome}
            <IcCaret />
          </button>
          <button type="button" style={{ display: "grid", width: 24, height: 24, placeItems: "center", borderRadius: 5, border: 0, background: "none", cursor: "pointer", color: "#606068" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#f59e0b"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#606068"; }}
          >
            <Star size={14} />
          </button>
          <button type="button" style={{ display: "grid", width: 24, height: 24, placeItems: "center", borderRadius: 5, border: 0, background: "none", cursor: "pointer", color: "#606068" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#c4c4c4"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#606068"; }}
          >
            <IcMenu />
          </button>
        </div>

        {/* direita: ações */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <TopBtn icon={<IcVoice />} />
          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />
          <TopBtn icon={<Bot size={14} />} label="Agentes" />
          <TopBtn icon={<Sparkles size={14} />} />
          <TopBtn icon={<span style={{ fontSize: 13 }}>✦</span>} label="Pergunte à IA" />
          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />
          <button type="button" style={{
            display: "flex", alignItems: "center", gap: 5,
            height: 28, padding: "0 12px", borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.12)", background: "none",
            cursor: "pointer", color: "#c4c4c4", fontSize: 12,
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#1e1e1e"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
          >
            <Share2 size={13} />
            Compartilhar
          </button>
        </div>
      </header>

      {/* ── Tabs ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 2,
        padding: "0 16px", height: 38, flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#111111",
        overflowX: "auto",
      }}>
        {/* Adicionar canal */}
        <button type="button" style={{
          display: "flex", alignItems: "center", gap: 5, height: 36, padding: "0 10px",
          border: 0, background: "none", cursor: "pointer", color: "#606068", fontSize: 12, whiteSpace: "nowrap",
        }}
          onMouseEnter={e => { e.currentTarget.style.color = "#c4c4c4"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#606068"; }}
        >
          <Plus size={12} />
          Adicionar canal
        </button>

        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.07)", margin: "0 2px" }} />

        {TABS.map((tab) => (
          <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} style={{
            display: "flex", alignItems: "center", gap: 5,
            height: 36, padding: "0 10px", borderRadius: 0,
            border: 0, background: "none", cursor: "pointer",
            color: activeTab === tab.id ? "#e4e4e4" : "#888892",
            fontSize: 12, fontWeight: activeTab === tab.id ? 600 : 400,
            borderBottom: activeTab === tab.id ? "2px solid #7c3aed" : "2px solid transparent",
            whiteSpace: "nowrap",
          }}
            onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = "#c4c4c4"; }}
            onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = "#888892"; }}
          >
            {tab.icon && <span>{tab.icon}</span>}
            {tab.label}
          </button>
        ))}

        <button type="button" style={{
          display: "flex", alignItems: "center", gap: 4, height: 36, padding: "0 10px",
          border: 0, background: "none", cursor: "pointer", color: "#606068", fontSize: 12, whiteSpace: "nowrap",
        }}
          onMouseEnter={e => { e.currentTarget.style.color = "#c4c4c4"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#606068"; }}
        >
          <Plus size={12} />
          Visualização
        </button>
      </div>

      {/* ── Conteúdo scrollável ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 40px" }}>

        {/* Toolbar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 44, borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          <button type="button" style={{ display: "flex", alignItems: "center", gap: 5, height: 28, padding: "0 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.09)", background: "none", cursor: "pointer", color: "#888892", fontSize: 12 }}
            onMouseEnter={e => { e.currentTarget.style.background = "#1e1e1e"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
          >
            <Filter size={11} />
            Filtros
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#555" }}>
              <RefreshCw size={11} />
              Atualização: 10 minutos atrás
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#555" }}>
              <RefreshCw size={11} style={{ color: "#22c55e" }} />
              Atualização automática: Ligado
            </span>
            <button type="button" style={{ fontSize: 12, color: "#888892", border: 0, background: "none", cursor: "pointer", padding: "0 6px" }}>Personalizar</button>
            <button type="button" style={{
              height: 28, padding: "0 12px", borderRadius: 6,
              border: 0, background: "#e4e4e4", cursor: "pointer",
              color: "#111", fontSize: 12, fontWeight: 600,
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#e4e4e4"; }}
            >
              Adicionar cartão
            </button>
          </div>
        </div>

        {/* ── Cards: Recent | Docs | Bookmarks ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 16, marginBottom: 16 }}>

          {/* Recent */}
          <div style={{ background: "#1a1a1a", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", padding: "16px 18px", minHeight: 200 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#888892", marginBottom: 12 }}>Recent</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {recentes.map((item) => {
                const pai = item.idPai ? mockEntidades.find(e => e.id === item.idPai) : null;
                const href = item.idClasse === "backlog" || item.idClasse === "board"
                  ? `/lists/${item.id}`
                  : item.idClasse === "pasta"
                  ? `/folders/${item.id}`
                  : `/docs/${item.id}`;
                return (
                  <Link key={item.id} href={href} style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "5px 0", textDecoration: "none",
                  }}>
                    <span style={{ flexShrink: 0 }}>
                      {item.idClasse === "pasta" ? <IcFolder /> :
                       item.idClasse === "doc"   ? <IcDoc /> : <IcList />}
                    </span>
                    <span style={{ fontSize: 13, color: "#c4c4c4", fontWeight: 500 }}>{item.nome}</span>
                    {pai && <span style={{ fontSize: 12, color: "#505058" }}>• em {pai.nome}</span>}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Docs */}
          <div style={{ background: "#1a1a1a", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", padding: "16px 18px", minHeight: 200 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#888892", marginBottom: 12 }}>Docs</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {docs.length > 0 ? docs.map((doc) => {
                const pai = doc.idPai ? mockEntidades.find(e => e.id === doc.idPai) : null;
                return (
                  <Link key={doc.id} href={`/docs/${doc.id}`} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 0", textDecoration: "none" }}>
                    <IcDoc />
                    <span style={{ fontSize: 13, color: "#c4c4c4", fontWeight: 500 }}>{doc.nome}</span>
                    {pai && <span style={{ fontSize: 12, color: "#505058" }}>• em {pai.nome}</span>}
                  </Link>
                );
              }) : (
                <p style={{ fontSize: 12, color: "#404048" }}>Nenhum documento ainda</p>
              )}
            </div>
          </div>

          {/* Bookmarks */}
          <div style={{ background: "#1a1a1a", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", padding: "16px 18px", minHeight: 200 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#888892", marginBottom: 12 }}>Bookmarks</p>
            {docs.length > 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: "#222", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ width: 32, height: 32, borderRadius: 7, background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <IcDoc />
                </div>
                <span style={{ fontSize: 13, color: "#c4c4c4", fontWeight: 500 }}>{docs[0].nome}</span>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: "#404048" }}>Nenhum favorito ainda</p>
            )}
          </div>
        </div>

        {/* ── Folders — container próprio com borda ── */}
        {pastas.length > 0 && (
          <section style={{ marginBottom: 12, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, overflow: "hidden" }}>
            {/* header do container */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)",
              background: "#1a1a1a",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <LayoutGrid size={13} style={{ color: "#606068" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#c4c4c4" }}>Folders</span>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button type="button" style={{ width: 24, height: 24, display: "grid", placeItems: "center", border: 0, background: "none", cursor: "pointer", color: "#606068", borderRadius: 5 }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#2a2a2a"; e.currentTarget.style.color = "#c4c4c4"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#606068"; }}
                >
                  <Maximize2 size={12} />
                </button>
                <button type="button" style={{ width: 24, height: 24, display: "grid", placeItems: "center", border: 0, background: "none", cursor: "pointer", color: "#606068", borderRadius: 5 }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#2a2a2a"; e.currentTarget.style.color = "#c4c4c4"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#606068"; }}
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
            {/* cards de pasta dentro do container */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: "14px 16px", background: "#111111", minHeight: "28vh", maxHeight: "33vh", overflowY: "auto", alignContent: "flex-start" }}>
              {pastas.map((pasta) => (
                <Link key={pasta.id} href={`/folders/${pasta.id}`} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  width: 200, padding: "10px 14px", borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.07)", background: "#1a1a1a",
                  textDecoration: "none",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#1e1e1e"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#1a1a1a"; }}
                >
                  <IcFolder color="#9ca3af" />
                  <span style={{ fontSize: 13, color: "#c4c4c4", fontWeight: 500 }}>{pasta.nome}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Lists — container próprio com borda ── */}
        <section style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, overflow: "hidden" }}>
          {/* header do container */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)",
            background: "#1a1a1a",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <LayoutGrid size={13} style={{ color: "#606068" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#c4c4c4" }}>Lists</span>
            </div>
          </div>

          {/* tabela dentro do container */}
          <div style={{ background: "#111111", minHeight: "28vh", maxHeight: "33vh", overflowY: "auto" }}>
            {/* cabeçalho da tabela */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr) 80px 180px 120px 120px 100px 100px 36px",
              height: 34, borderBottom: "1px solid rgba(255,255,255,0.06)",
              padding: "0 16px", background: "#1a1a1a",
            }}>
              {["Nome","Cor","Progresso","Início","Término","Prioridade","Proprietário",""].map((col, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", fontSize: 11, color: "#505058", fontWeight: 500 }}>{col}</div>
              ))}
            </div>

            {listas.length > 0 ? listas.map((lista) => (
              <ListRow key={lista.id} id={lista.id} nome={lista.nome} />
            )) : (
              <div style={{ padding: "20px 16px", fontSize: 12, color: "#404048" }}>Nenhuma lista ainda</div>
            )}

            <AddListRow espacoId={id} />
          </div>
        </section>
      </div>
    </div>
  );
}

/* ─── Linha de lista ──────────────────────────────────────────────────────── */
function ListRow({ id, nome }: { id: string; nome: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={`/lists/${id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) 80px 180px 120px 120px 100px 100px 36px",
        height: 40, padding: "0 16px", textDecoration: "none",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: hovered ? "rgba(255,255,255,0.025)" : "transparent",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <IcList />
        <span style={{ fontSize: 13, color: "#c4c4c4", fontWeight: 500 }}>{nome}</span>
      </div>
      {/* cor */}
      <div style={{ fontSize: 12, color: "#404048" }}>-</div>
      {/* progresso */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, height: 4, borderRadius: 2, background: "#2a2a2a" }}>
          <div style={{ width: "0%", height: "100%", borderRadius: 2, background: "#7c3aed" }} />
        </div>
        <span style={{ fontSize: 11, color: "#505058", whiteSpace: "nowrap" }}>0/0</span>
      </div>
      {/* início */}
      <div style={{ fontSize: 12, color: "#404048", display: "flex", alignItems: "center" }}>
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#404048" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>
      </div>
      {/* término */}
      <div style={{ fontSize: 12, color: "#404048", display: "flex", alignItems: "center" }}>
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#404048" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>
      </div>
      {/* prioridade */}
      <div>
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#404048" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M5 21V4"/><path d="M5 4h13l-2 4 2 4H5"/></svg>
      </div>
      {/* proprietário */}
      <div>
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#404048" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>
      </div>
      <div />
    </Link>
  );
}

function AddListRow({ espacoId }: { espacoId: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button type="button"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 7,
        width: "100%", height: 36, padding: "0 16px",
        border: 0, background: hovered ? "rgba(255,255,255,0.025)" : "transparent",
        cursor: "pointer", color: hovered ? "#888892" : "#505058", fontSize: 13,
      }}
    >
      <Plus size={13} />
      Nova lista
    </button>
  );
}

/* ─── Botão topo ──────────────────────────────────────────────────────────── */
function TopBtn({ icon, label }: { icon: React.ReactNode; label?: string }) {
  return (
    <button type="button" style={{
      display: "flex", alignItems: "center", gap: 5,
      height: 28, padding: label ? "0 10px" : "0 7px", borderRadius: 6,
      border: 0, background: "none", cursor: "pointer", color: "#888892", fontSize: 12,
    }}
      onMouseEnter={e => { e.currentTarget.style.background = "#1e1e1e"; e.currentTarget.style.color = "#c4c4c4"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#888892"; }}
    >
      {icon}{label}
    </button>
  );
}
