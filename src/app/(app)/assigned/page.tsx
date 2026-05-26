"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Settings,
  ChevronLeft,
  ChevronRight,
  List,
  Calendar,
  Filter,
  CheckCheck,
  Search,
  Layers,
  Link2,
} from "lucide-react";
import { useMyTasks } from "@/hooks/use-tasks";
import { useSpaces } from "@/hooks/use-projects";
import { useAuthStore } from "@/lib/stores/auth";
import type { DProjectDto, V3Intention } from "@/lib/types/api";

const TERMINAL_STATUSES: V3Intention[] = [
  "DONE",
  "CANCELLED",
  "DISCARDED",
  "FAILED",
];

/* ─── Ícones por idClasse ────────────────────────────────────────────────── */
function ClassIcon({ idClasse }: { idClasse: string }) {
  if (idClasse === "-353") {
    return (
      <svg
        width={13}
        height={13}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#9ca3af"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8" />
      </svg>
    );
  }
  if (idClasse === "-351") {
    return (
      <svg
        width={13}
        height={13}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#9ca3af"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    );
  }
  // LIST (-352) ou SPACE (-350)
  return (
    <svg width={13} height={13} viewBox="0 0 18 18" fill="none">
      <path
        d="M2 5 L4.5 7.5 L7 3.5"
        stroke="#7c6ff7"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 11 L4.5 13.5 L7 9.5"
        stroke="#7c6ff7"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="9"
        y1="5.5"
        x2="16"
        y2="5.5"
        stroke="#7c6ff7"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <line
        x1="9"
        y1="11.5"
        x2="16"
        y2="11.5"
        stroke="#7c6ff7"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function hrefDeProject(item: DProjectDto) {
  if (item.idClasse === "-353") return `/docs/${item.id}`;
  if (item.idClasse === "-351") return `/folders/${item.id}`;
  if (item.idClasse === "-350") return `/spaces/${item.id}`;
  return `/lists/${item.id}`;
}

const HOURS = [
  "O dia todo",
  "1 am",
  "2 am",
  "3 am",
  "4 am",
  "5 am",
  "6 am",
  "7 am",
  "8 am",
  "9 am",
  "10 am",
  "11 am",
  "12 pm",
];

const STATUS_DOT: Record<string, string> = {
  INBOX: "var(--muted-foreground)",
  READY: "#3b82f6",
  EXECUTING: "#f59e0b",
  VALIDATING: "#8b5cf6",
  VALIDATED: "#10b981",
  DONE: "#10b981",
  FAILED: "#ef4444",
  CANCELLED: "var(--muted-foreground)",
  DISCARDED: "var(--muted-foreground)",
};

/* ─── Página ─────────────────────────────────────────────────────────────── */
export default function MinhasTarefasPage() {
  const [agendaDia, setAgendaDia] = useState(() => new Date());
  const [agendaView, setAgendaView] = useState<"lista" | "calendario">("lista");

  const user = useAuthStore((s) => s.user);
  const userName = user?.name ?? "você";

  const { data: myTasks = [], isLoading: loadingTasks } = useMyTasks();
  const { data: spaces = [], isLoading: loadingSpaces } = useSpaces();

  const recentes = useMemo(() => {
    return [...spaces]
      .sort((a, b) => (b.atualizadoEm > a.atualizadoEm ? 1 : -1))
      .slice(0, 8);
  }, [spaces]);

  const minhas = useMemo(
    () =>
      myTasks.filter((t) => !TERMINAL_STATUSES.includes(t.status)).slice(0, 6),
    [myTasks],
  );

  const diaLabel = agendaDia.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const diaNumero = agendaDia.getDate();
  const tzLabel =
    "GMT" +
    (new Date().getTimezoneOffset() <= 0 ? "+" : "-") +
    Math.abs(new Date().getTimezoneOffset() / 60);

  function shiftDia(delta: number) {
    setAgendaDia((d) => {
      const nd = new Date(d);
      nd.setDate(nd.getDate() + delta);
      return nd;
    });
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--background)",
        overflow: "hidden",
      }}
    >
      {/* ── Topbar ── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          height: 44,
          flexShrink: 0,
          borderBottom: "1px solid var(--border)",
          background: "var(--background)",
        }}
      >
        <span
          style={{ fontSize: 13, color: "var(--foreground)", fontWeight: 500 }}
        >
          Minhas tarefas
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            type="button"
            style={{
              height: 28,
              padding: "0 12px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "none",
              cursor: "pointer",
              color: "var(--foreground)",
              fontSize: 12,
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
            }}
          >
            Gerenciar cartões
          </button>
          <button
            type="button"
            style={{
              display: "grid",
              width: 28,
              height: 28,
              placeItems: "center",
              borderRadius: 6,
              border: 0,
              background: "none",
              cursor: "pointer",
              color: "var(--muted-foreground)",
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
            <Settings size={14} />
          </button>
        </div>
      </header>

      {/* ── Conteúdo ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px 40px" }}>
        {/* Saudação */}
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "var(--foreground)",
            margin: 0,
            marginBottom: 20,
            letterSpacing: "-0.02em",
          }}
        >
          {saudacao()}, {userName}
        </h1>

        {/* Grid 2x2 */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          {/* ─── Recentes ─── */}
          <Card title="Recentes">
            {loadingSpaces ? (
              <div
                style={{
                  color: "var(--muted-foreground)",
                  fontSize: 12,
                  padding: "8px 0",
                }}
              >
                Carregando...
              </div>
            ) : recentes.length === 0 ? (
              <EmptyArea
                icon={<Layers size={20} />}
                text="Nenhum espaço ainda"
                hint="Crie um espaço para começar a organizar seu trabalho."
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {recentes.map((item) => (
                  <Link
                    key={item.id}
                    href={hrefDeProject(item)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "7px 10px",
                      margin: "0 -10px",
                      borderRadius: 6,
                      textDecoration: "none",
                      transition: "background 120ms",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "var(--accent)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "transparent";
                    }}
                  >
                    <ClassIcon idClasse={item.idClasse} />
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--foreground)",
                        fontWeight: 500,
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.nome}
                    </span>
                    {item.memberCount > 0 && (
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--muted-foreground)",
                        }}
                      >
                        {item.memberCount} membro
                        {item.memberCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* ─── Agenda ─── */}
          <Card
            title="Agenda"
            headerExtra={
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button
                  type="button"
                  onClick={() => shiftDia(-1)}
                  style={iconBtnStyle}
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => shiftDia(1)}
                  style={iconBtnStyle}
                >
                  <ChevronRight size={14} />
                </button>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--foreground)",
                    fontWeight: 500,
                    margin: "0 6px",
                  }}
                >
                  {diaLabel}
                </span>
                <div
                  style={{
                    display: "flex",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    overflow: "hidden",
                    marginLeft: 4,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setAgendaView("lista")}
                    style={{
                      width: 26,
                      height: 24,
                      display: "grid",
                      placeItems: "center",
                      border: 0,
                      cursor: "pointer",
                      background:
                        agendaView === "lista"
                          ? "var(--accent)"
                          : "transparent",
                      color:
                        agendaView === "lista"
                          ? "var(--foreground)"
                          : "var(--muted-foreground)",
                    }}
                  >
                    <List size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgendaView("calendario")}
                    style={{
                      width: 26,
                      height: 24,
                      display: "grid",
                      placeItems: "center",
                      border: 0,
                      cursor: "pointer",
                      background:
                        agendaView === "calendario"
                          ? "var(--accent)"
                          : "transparent",
                      color:
                        agendaView === "calendario"
                          ? "var(--foreground)"
                          : "var(--muted-foreground)",
                    }}
                  >
                    <Calendar size={12} />
                  </button>
                </div>
              </div>
            }
          >
            {/* cabeçalho do dia */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "60px 1fr",
                borderBottom: "1px solid var(--border)",
                paddingBottom: 8,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "var(--muted-foreground)",
                  fontWeight: 500,
                }}
              >
                {tzLabel}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                  color: "var(--muted-foreground)",
                  fontWeight: 600,
                }}
              >
                {diaLabel.split(",")[0]}
                <span
                  style={{
                    display: "grid",
                    placeItems: "center",
                    minWidth: 18,
                    height: 18,
                    padding: "0 5px",
                    borderRadius: "50%",
                    background: "#dc2626",
                    color: "white",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {diaNumero}
                </span>
              </div>
            </div>

            {/* timeline */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                maxHeight: 240,
                overflowY: "auto",
              }}
            >
              {HOURS.map((h) => (
                <div
                  key={h}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "60px 1fr",
                    minHeight: 32,
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--muted-foreground)",
                      paddingTop: 6,
                    }}
                  >
                    {h}
                  </div>
                  <div />
                </div>
              ))}
            </div>
          </Card>

          {/* ─── Atribuídas a mim ─── */}
          <Card
            title="Atribuídas a mim"
            headerExtra={
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button type="button" style={iconBtnStyle}>
                  <Filter size={12} />
                </button>
                <button type="button" style={iconBtnStyle}>
                  <CheckCheck size={12} />
                </button>
                <button type="button" style={iconBtnStyle}>
                  <Search size={12} />
                </button>
                <button type="button" style={iconBtnStyle}>
                  <Settings size={12} />
                </button>
              </div>
            }
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                marginBottom: 12,
              }}
            >
              <button
                type="button"
                style={{
                  width: 26,
                  height: 26,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 6,
                  border: 0,
                  background: "rgba(124,58,237,0.16)",
                  cursor: "pointer",
                  color: "#a78bfa",
                }}
              >
                <Layers size={13} />
              </button>
              <button type="button" style={iconBtnStyle}>
                <Link2 size={12} />
              </button>
            </div>

            {loadingTasks ? (
              <div
                style={{
                  color: "var(--muted-foreground)",
                  fontSize: 12,
                  padding: "8px 0",
                }}
              >
                Carregando...
              </div>
            ) : minhas.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {minhas.map((t) => {
                  const dotColor =
                    STATUS_DOT[t.status] ?? "var(--muted-foreground)";
                  return (
                    <Link
                      key={t.id}
                      href={`/lists/${t.projectId}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "7px 10px",
                        margin: "0 -10px",
                        borderRadius: 6,
                        cursor: "pointer",
                        transition: "background 120ms",
                        textDecoration: "none",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          "var(--accent)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          "transparent";
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: dotColor,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 13,
                          color: "var(--foreground)",
                          flex: 1,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {t.nome}
                      </span>
                      {t.identifier && (
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--muted-foreground)",
                            flexShrink: 0,
                          }}
                        >
                          {t.identifier}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyArea
                icon={<CheckCheck size={20} />}
                text="Tudo em dia"
                hint="Nenhuma tarefa atribuída a você no momento."
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ─── Subcomponentes ─────────────────────────────────────────────────────── */
function Card({
  title,
  headerExtra,
  children,
}: {
  title: string;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "var(--card)",
        borderRadius: 10,
        border: "1px solid var(--border)",
        padding: "14px 16px",
        minHeight: 260,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
          minHeight: 26,
        }}
      >
        <h2
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--foreground)",
            margin: 0,
          }}
        >
          {title}
        </h2>
        {headerExtra}
      </header>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </section>
  );
}

function EmptyArea({
  icon,
  text,
  hint,
}: {
  icon: React.ReactNode;
  text: string;
  hint: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "32px 16px",
        color: "var(--muted-foreground)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          background: "var(--accent)",
          color: "var(--muted-foreground)",
        }}
      >
        {icon}
      </div>
      <p
        style={{
          fontSize: 13,
          color: "var(--muted-foreground)",
          fontWeight: 500,
          margin: 0,
        }}
      >
        {text}
      </p>
      <p
        style={{
          fontSize: 11,
          color: "var(--muted-foreground)",
          margin: 0,
          textAlign: "center",
        }}
      >
        {hint}
      </p>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  display: "grid",
  width: 24,
  height: 24,
  placeItems: "center",
  borderRadius: 5,
  border: 0,
  background: "none",
  cursor: "pointer",
  color: "var(--muted-foreground)",
};
