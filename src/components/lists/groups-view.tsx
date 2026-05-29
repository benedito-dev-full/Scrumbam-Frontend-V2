"use client";

import React, { useState } from "react";
import { ChevronDown, Plus, MessageSquarePlus, User, GitBranch } from "lucide-react";

/**
 * GroupsView — visualizacao de tarefas em GRUPOS (estilo Monday.com).
 *
 * PROTOTIPO VISUAL ISOLADO. Nao depende do backend nem dos hooks do projeto:
 * usa mock data interno (MOCK_GROUPS) para validar a igualdade visual com a
 * referencia do Monday antes de integrar. Cada grupo e uma "caixa" com tabela
 * propria, cabecalho de colunas, linha "+ Adicionar tarefa" e rodape de totais.
 *
 * Substitui conceitualmente a antiga view "Blocos" (grid de cards) — esta NAO
 * deve ser confundida com ela. Quando aprovada, ligamos esta view ao
 * /lists/[id] e removemos a antiga.
 *
 * Adaptado aos tokens do projeto (var(--card), var(--border), var(--foreground),
 * roxo primario #7c5cff) — funciona em light e dark.
 *
 * @example
 * <GroupsView />
 */
export function GroupsView() {
  return (
    <div
      className="flex-1 overflow-auto"
      style={{ background: "var(--background)", padding: "16px 20px 80px" }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {MOCK_GROUPS.map((g) => (
          <GroupBox key={g.id} group={g} />
        ))}
      </div>
    </div>
  );
}

/* ─── Tipos do mock ──────────────────────────────────────────────────────── */

type StatusKey = "em-andamento" | "pronto" | "concluido" | "backlog";
type TipoKey = "qualidade" | "funcionalidade" | "bug";

interface MockTask {
  id: string;
  nome: string;
  status: StatusKey | null;
  tipo: TipoKey | null;
  codigo: string | null;
  sp: number | null;
  epico: string | null;
  githubLink: string | null;
}

interface MockGroup {
  id: string;
  nome: string;
  /** cor da barra/accent do grupo (espelha a cor da pill no Monday) */
  cor: string;
  periodo?: string;
  tasks: MockTask[];
}

/* ─── Paletas de Status / Tipo (pills SOLIDAS, igual Monday) ──────────────── */

const STATUS_STYLE: Record<StatusKey, { bg: string; label: string }> = {
  "em-andamento": { bg: "#f5a623", label: "Em andamento" },
  pronto: { bg: "#4a8df7", label: "Pronto para com..." },
  concluido: { bg: "#22c55e", label: "Concluído" },
  backlog: { bg: "#6b7280", label: "Backlog" },
};

const TIPO_STYLE: Record<TipoKey, { bg: string; label: string }> = {
  qualidade: { bg: "#e879c4", label: "Qualidade" },
  funcionalidade: { bg: "#22c55e", label: "Funcionalidade" },
  bug: { bg: "#ef4444", label: "Bug" },
};

/* ─── Mock data — espelha o print de referencia ──────────────────────────── */

const MOCK_GROUPS: MockGroup[] = [
  {
    id: "sprint-1",
    nome: "Sprint 1",
    cor: "#e0457b",
    periodo: "mai 21 - jun 3",
    tasks: [
      {
        id: "t1",
        nome: "Tarefa 1",
        status: "em-andamento",
        tipo: "qualidade",
        codigo: "TMYT-001",
        sp: 3,
        epico: "Infraestrutura",
        githubLink: null,
      },
      {
        id: "t2",
        nome: "Tarefa 2",
        status: "pronto",
        tipo: "funcionalidade",
        codigo: "TMYT-002",
        sp: null,
        epico: null,
        githubLink: null,
      },
    ],
  },
  {
    id: "backlog",
    nome: "Backlog",
    cor: "#7c5cff",
    tasks: [],
  },
];

/* ─── Larguras das colunas (px) ──────────────────────────────────────────── */

const COLS = {
  check: 36,
  nome: 360,
  resp: 96,
  status: 150,
  tipo: 150,
  codigo: 130,
  sp: 130,
  epico: 200,
  github: 150,
  add: 44,
};

/* ─── GroupBox — uma caixa de grupo (header + tabela + footer) ────────────── */

function GroupBox({ group }: { group: MockGroup }) {
  const [open, setOpen] = useState(true);

  const totalSp = group.tasks.reduce((acc, t) => acc + (t.sp ?? 0), 0);

  return (
    <section>
      {/* cabecalho do grupo */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Recolher grupo" : "Expandir grupo"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 20,
            height: 20,
            border: 0,
            background: "none",
            color: group.cor,
            cursor: "pointer",
            transform: open ? "none" : "rotate(-90deg)",
            transition: "transform .15s",
          }}
        >
          <ChevronDown size={16} strokeWidth={2.5} />
        </button>
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: group.cor,
            letterSpacing: ".2px",
          }}
        >
          {group.nome}
        </span>
        {group.periodo && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 12,
              color: "var(--muted-foreground)",
            }}
          >
            {group.periodo}
          </span>
        )}
      </header>

      {open && (
        <div
          style={{
            position: "relative",
            borderRadius: 8,
            overflow: "hidden",
            border: "1px solid var(--border)",
            background: "var(--card)",
          }}
        >
          {/* barra colorida do grupo (lado esquerdo) */}
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              background: group.cor,
              zIndex: 2,
            }}
          />

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              tableLayout: "fixed",
              minWidth: 1080,
            }}
          >
            <colgroup>
              <col style={{ width: COLS.check }} />
              <col style={{ width: COLS.nome }} />
              <col style={{ width: COLS.resp }} />
              <col style={{ width: COLS.status }} />
              <col style={{ width: COLS.tipo }} />
              <col style={{ width: COLS.codigo }} />
              <col style={{ width: COLS.sp }} />
              <col style={{ width: COLS.epico }} />
              <col style={{ width: COLS.github }} />
              <col style={{ width: COLS.add }} />
            </colgroup>

            <HeadRow corGrupo={group.cor} />

            <tbody>
              {group.tasks.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
              <AddTaskRow />
            </tbody>

            <FooterRow totalSp={totalSp} tasks={group.tasks} />
          </table>
        </div>
      )}
    </section>
  );
}

/* ─── Cabecalho de colunas ───────────────────────────────────────────────── */

function HeadRow({ corGrupo }: { corGrupo: string }) {
  const th: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: "var(--muted-foreground)",
    textAlign: "center",
    padding: "9px 8px",
    borderBottom: "1px solid var(--border)",
    background: "color-mix(in srgb, var(--foreground) 3%, transparent)",
    whiteSpace: "nowrap",
  };
  return (
    <thead>
      <tr>
        <th style={{ ...th, padding: 0 }}>
          <span style={{ display: "inline-flex" }}>
            <Checkbox />
          </span>
        </th>
        <th style={{ ...th, textAlign: "left", paddingLeft: 4 }}>Tarefa</th>
        <th style={th}>Resp.</th>
        <th style={th}>Status</th>
        <th style={th}>Tipo</th>
        <th style={th}>ID da tarefa</th>
        <th style={th}>SP estimados</th>
        <th style={th}>Épico</th>
        <th style={th}>Link do GitHub</th>
        <th style={th}>
          <span
            style={{
              display: "inline-flex",
              color: "var(--muted-foreground)",
            }}
          >
            <Plus size={14} />
          </span>
        </th>
      </tr>
    </thead>
  );
}

/* ─── Linha de tarefa ────────────────────────────────────────────────────── */

function TaskRow({ task }: { task: MockTask }) {
  const [hover, setHover] = useState(false);
  const td: React.CSSProperties = {
    padding: "0 8px",
    height: 38,
    borderBottom: "1px solid var(--border)",
    borderRight: "1px solid var(--border)",
    verticalAlign: "middle",
    fontSize: 13,
    color: "var(--foreground)",
    background: hover ? "var(--accent)" : "transparent",
    transition: "background .1s",
  };
  return (
    <tr onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {/* checkbox */}
      <td style={{ ...td, padding: 0, textAlign: "center" }}>
        <Checkbox />
      </td>

      {/* nome */}
      <td style={{ ...td, fontWeight: 500 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {task.nome}
          </span>
          <button
            type="button"
            aria-label="Comentar"
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              border: 0,
              background: "none",
              color: "var(--muted-foreground)",
              cursor: "pointer",
              opacity: hover ? 1 : 0,
              transition: "opacity .1s",
            }}
          >
            <MessageSquarePlus size={15} />
          </button>
        </div>
      </td>

      {/* responsavel */}
      <td style={{ ...td, textAlign: "center" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 26,
            height: 26,
            borderRadius: "50%",
            border: "1.5px dashed var(--border)",
            color: "var(--muted-foreground)",
          }}
        >
          <User size={13} />
        </span>
      </td>

      {/* status — pill solida full-cell */}
      <td style={{ ...td, padding: 2 }}>
        {task.status ? (
          <Pill bg={STATUS_STYLE[task.status].bg}>
            {STATUS_STYLE[task.status].label}
          </Pill>
        ) : (
          <EmptyCell />
        )}
      </td>

      {/* tipo — pill solida full-cell */}
      <td style={{ ...td, padding: 2 }}>
        {task.tipo ? (
          <Pill bg={TIPO_STYLE[task.tipo].bg}>
            {TIPO_STYLE[task.tipo].label}
          </Pill>
        ) : (
          <EmptyCell />
        )}
      </td>

      {/* id da tarefa */}
      <td style={{ ...td, textAlign: "center", color: "var(--muted-foreground)" }}>
        {task.codigo ?? ""}
      </td>

      {/* sp estimados */}
      <td style={{ ...td, textAlign: "center" }}>
        {task.sp != null ? `${task.sp} SP` : ""}
      </td>

      {/* epico */}
      <td style={td}>
        {task.epico ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 8px",
              borderRadius: 5,
              fontSize: 12,
              background: "var(--accent)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            }}
          >
            {task.epico}
            <span style={{ color: "var(--muted-foreground)" }}>×</span>
          </span>
        ) : (
          ""
        )}
      </td>

      {/* github */}
      <td style={{ ...td, textAlign: "center", color: "var(--muted-foreground)" }}>
        {task.githubLink ? (
          <GitBranch size={14} />
        ) : (
          ""
        )}
      </td>

      {/* coluna do "+" — vazia na linha */}
      <td style={{ ...td, borderRight: 0 }} />
    </tr>
  );
}

/* ─── Linha "+ Adicionar tarefa" ─────────────────────────────────────────── */

function AddTaskRow() {
  const [hover, setHover] = useState(false);
  return (
    <tr onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <td
        colSpan={10}
        style={{
          height: 38,
          borderBottom: "1px solid var(--border)",
          background: hover ? "var(--accent)" : "transparent",
          transition: "background .1s",
        }}
      >
        <button
          type="button"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            height: 38,
            padding: "0 14px",
            border: 0,
            background: "none",
            color: "var(--muted-foreground)",
            fontSize: 13,
            cursor: "pointer",
            width: "100%",
            textAlign: "left",
          }}
        >
          <Plus size={14} />
          Adicionar tarefa
        </button>
      </td>
    </tr>
  );
}

/* ─── Rodape de totais ───────────────────────────────────────────────────── */

function FooterRow({
  totalSp,
  tasks,
}: {
  totalSp: number;
  tasks: MockTask[];
}) {
  const td: React.CSSProperties = {
    height: 42,
    borderRight: "1px solid var(--border)",
    background: "color-mix(in srgb, var(--foreground) 2%, transparent)",
    verticalAlign: "middle",
  };
  // distribuicao de cores (barra segmentada) para Status e Tipo
  const statusColors = tasks
    .filter((t) => t.status)
    .map((t) => STATUS_STYLE[t.status as StatusKey].bg);
  const tipoColors = tasks
    .filter((t) => t.tipo)
    .map((t) => TIPO_STYLE[t.tipo as TipoKey].bg);

  return (
    <tfoot>
      <tr>
        <td style={{ ...td, borderRight: 0 }} />
        <td style={{ ...td, borderRight: 0 }} />
        <td style={{ ...td, borderRight: 0 }} />
        <td style={{ ...td, padding: 8 }}>
          <SegmentBar colors={statusColors} />
        </td>
        <td style={{ ...td, padding: 8 }}>
          <SegmentBar colors={tipoColors} />
        </td>
        <td style={{ ...td, borderRight: 0 }} />
        <td style={{ ...td, textAlign: "center" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              lineHeight: 1.2,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--foreground)",
              }}
            >
              {totalSp} SP
            </span>
            <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>
              Total
            </span>
          </div>
        </td>
        <td style={td} />
        <td style={td} />
        <td style={{ ...td, borderRight: 0 }} />
      </tr>
    </tfoot>
  );
}

/* ─── Primitivos visuais ─────────────────────────────────────────────────── */

/** Pill solida que preenche a celula (Status / Tipo), igual Monday. */
function Pill({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        height: 34,
        borderRadius: 4,
        background: bg,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 500,
        padding: "0 8px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
}

/** Celula de status/tipo vazia — tracejada, convidando ao preenchimento. */
function EmptyCell() {
  return (
    <div
      style={{
        height: 34,
        borderRadius: 4,
        background: "color-mix(in srgb, var(--muted-foreground) 12%, transparent)",
      }}
    />
  );
}

/** Barra segmentada de cores no rodape (distribuicao de status/tipo). */
function SegmentBar({ colors }: { colors: string[] }) {
  if (colors.length === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        height: 22,
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      {colors.map((c, i) => (
        <span key={i} style={{ flex: 1, background: c }} />
      ))}
    </div>
  );
}

function Checkbox() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 15,
        height: 15,
        borderRadius: 3,
        border: "1.5px solid var(--border)",
        background: "transparent",
      }}
    />
  );
}
