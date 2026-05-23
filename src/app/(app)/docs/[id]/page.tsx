"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  Star, Share2, Sparkles, Plus, X, MoreHorizontal,
  Tag, MessageSquare, Type, RotateCcw, Brush, Download, Link2,
} from "lucide-react";
import { SpaceChip } from "@/components/shell/space-chip";
import { useEntidadesStore } from "@/lib/stores/entidades";
import { mockEntidades } from "@/lib/mocks/entidades";
import { isEspaco } from "@/lib/types/entidade";

/* ─── Ícone doc ───────────────────────────────────────────────────────────── */
function IcDoc({ color = "#60a5fa", size = 13, strokeWidth = 1.8 }: { color?: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8" />
    </svg>
  );
}

/* ─── Página ──────────────────────────────────────────────────────────────── */
export default function DocPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const entidade = useEntidadesStore((s) => s.entidades.find((e) => e.id === id) ?? null);
  const renomearEntidade = useEntidadesStore((s) => s.renomearEntidade);
  const [body, setBody] = useState<string>("");

  if (!entidade || entidade.idClasse !== "doc") {
    return <div style={{ color: "#7a7a85", padding: 40 }}>Documento não encontrado.</div>;
  }

  /* ancestral espaço para o breadcrumb */
  function findEspacoAncestor(idPai: string | null): ReturnType<typeof mockEntidades.find> | null {
    let cur = idPai ? mockEntidades.find((e) => e.id === idPai) : null;
    while (cur) {
      if (isEspaco(cur)) return cur;
      cur = cur.idPai ? mockEntidades.find((e) => e.id === cur!.idPai) : null;
    }
    return null;
  }
  const espacoAncestor = findEspacoAncestor(entidade.idPai);
  const espacoMeta = espacoAncestor && isEspaco(espacoAncestor) ? espacoAncestor.meta : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#111111", overflow: "hidden" }}>

      {/* ── Topbar ── */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", height: 44, flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#111111",
      }}>
        {/* breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {espacoAncestor && espacoMeta && (
            <>
              <Link href={`/spaces/${espacoAncestor.id}`} style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
                <SpaceChip iniciais={espacoMeta.iniciais} cor={espacoMeta.cor} iconName={espacoMeta.iconName} size="sm" />
                <span style={{ fontSize: 13, color: "#c4c4c4", fontWeight: 500 }}>{espacoAncestor.nome}</span>
              </Link>
              <span style={{ color: "#404048", fontSize: 13 }}>/</span>
            </>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <IcDoc />
            <span style={{ fontSize: 13, color: "#e4e4e4", fontWeight: 500 }}>{entidade.nome}</span>
            <button type="button" style={{ display: "grid", width: 22, height: 22, placeItems: "center", borderRadius: 5, border: 0, background: "none", cursor: "pointer", color: "#606068" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#f59e0b"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#606068"; }}
            >
              <Star size={13} />
            </button>
          </div>
        </div>

        {/* ações */}
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <TopBtn icon={<Tag size={13} />} />
          <TopBtn icon={<Sparkles size={13} style={{ color: "#a78bfa" }} />} label="Pergunte à IA" />
          <TopBtn icon={<Share2 size={13} />} label="Compartilhar" />
          <TopBtn icon={<MoreHorizontal size={14} />} />
          <Link href="/docs" style={{
            display: "grid", width: 28, height: 28, placeItems: "center", borderRadius: 6,
            color: "#888892", textDecoration: "none",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#1e1e1e"; (e.currentTarget as HTMLElement).style.color = "#c4c4c4"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#888892"; }}
          >
            <X size={14} />
          </Link>
        </div>
      </header>

      {/* ── Layout principal ── */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>

        {/* mini-sidebar de páginas */}
        <aside style={{
          width: 220, flexShrink: 0, padding: "16px 12px",
          borderRight: "1px solid rgba(255,255,255,0.05)",
        }}>
          <button type="button" style={{
            display: "flex", alignItems: "center", gap: 7,
            width: "100%", height: 32, padding: "0 10px", borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.09)", background: "none",
            cursor: "pointer", color: "#c4c4c4", fontSize: 12, fontWeight: 500,
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#1e1e1e"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
          >
            <Plus size={13} />
            Adicionar página
          </button>
        </aside>

        {/* área central do documento */}
        <main style={{ flex: 1, overflowY: "auto", padding: "32px 64px 80px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>

            {/* vincular tarefa */}
            <button type="button" style={{
              display: "flex", alignItems: "center", gap: 6,
              margin: "0 auto 28px", padding: "6px 12px",
              border: 0, background: "none", cursor: "pointer",
              color: "#606068", fontSize: 12,
            }}
              onMouseEnter={e => { e.currentTarget.style.color = "#c4c4c4"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#606068"; }}
            >
              <Link2 size={13} />
              Vincular tarefa ou documento
            </button>

            {/* título */}
            <input
              type="text"
              value={entidade.nome}
              onChange={(e) => renomearEntidade(entidade.id, e.target.value)}
              placeholder="Sem título"
              style={{
                width: "100%", border: 0, outline: "none", background: "transparent",
                fontSize: 38, fontWeight: 700, color: "#f4f4f5",
                margin: 0, marginBottom: 14, lineHeight: 1.15,
                letterSpacing: "-0.02em", padding: 0, fontFamily: "inherit",
              }}
            />

            {/* metadados autor */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: "#7c3aed", color: "white",
                display: "grid", placeItems: "center",
                fontSize: 10, fontWeight: 700,
              }}>
                BB
              </div>
              <span style={{ fontSize: 12, color: "#888892", fontWeight: 500 }}>Benedito Bittencourt</span>
              <span style={{ color: "#404048" }}>•</span>
              <span style={{ fontSize: 12, color: "#606068" }}>Atualizado por último Ontem at 12:32 pm</span>
            </div>

            {/* corpo editável */}
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Comece a escrever ou digite '/' para comandos"
              style={{
                width: "100%", minHeight: 400,
                border: 0, outline: "none", resize: "none",
                background: "transparent", color: "#e4e4e4",
                fontSize: 15, lineHeight: 1.7, fontFamily: "inherit",
                padding: 0,
              }}
            />
          </div>
        </main>

        {/* rail direita */}
        <aside style={{
          width: 44, flexShrink: 0, padding: "16px 0",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          borderLeft: "1px solid rgba(255,255,255,0.05)",
        }}>
          <RailBtn icon={<MessageSquare size={14} />} />
          <RailBtn icon={<Type size={14} />} />
          <RailBtn icon={<RotateCcw size={14} />} />
          <RailBtn icon={<Brush size={14} />} />
          <RailBtn icon={<Download size={14} />} />
        </aside>
      </div>
    </div>
  );
}

/* ─── Botões ──────────────────────────────────────────────────────────────── */
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

function RailBtn({ icon }: { icon: React.ReactNode }) {
  return (
    <button type="button" style={{
      display: "grid", width: 28, height: 28, placeItems: "center",
      border: 0, background: "none", cursor: "pointer", color: "#606068", borderRadius: 6,
    }}
      onMouseEnter={e => { e.currentTarget.style.background = "#1e1e1e"; e.currentTarget.style.color = "#c4c4c4"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#606068"; }}
    >
      {icon}
    </button>
  );
}
