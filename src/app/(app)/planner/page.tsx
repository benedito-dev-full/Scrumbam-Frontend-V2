"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Settings,
  RefreshCw,
  CalendarDays,
  Sparkles,
  Search,
} from "lucide-react";

/* ─── Constantes ──────────────────────────────────────────────────────────── */
const HOURS = [
  "O dia", "todo", "10 am", "11 am", "12 pm", "1 pm", "2 pm", "3 pm",
  "4 pm", "5 pm", "6 pm", "7 pm", "8 pm", "9 pm", "10 pm", "11 pm",
];

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function getWeekDates(base: Date) {
  const day = base.getDay(); // 0=dom
  const monday = new Date(base);
  monday.setDate(base.getDate() - day); // vai para domingo
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function fmtMonthYear(date: Date) {
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function isToday(date: Date) {
  const t = new Date();
  return date.getDate() === t.getDate() &&
    date.getMonth() === t.getMonth() &&
    date.getFullYear() === t.getFullYear();
}

/* ─── Calendário semanal ──────────────────────────────────────────────────── */
function WeekCalendar() {
  const [baseDate, setBaseDate] = useState(new Date());
  const weekDates = getWeekDates(baseDate);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  /* posição da linha de hora atual — começa em 10am (hora 10 = 600min) */
  const startMinutes = 10 * 60;
  const endMinutes = 23 * 60;
  const timelineTop = Math.max(0, ((currentMinutes - startMinutes) / (endMinutes - startMinutes)) * 100);
  const showTimeline = currentMinutes >= startMinutes && currentMinutes <= endMinutes;

  const prevWeek = () => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - 7);
    setBaseDate(d);
  };
  const nextWeek = () => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 7);
    setBaseDate(d);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#0f0f12" }}>

      {/* toolbar do calendário */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", height: 44, borderBottom: "1px solid #1e1e24", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button type="button" onClick={prevWeek} style={navBtnStyle}>
            <ChevronLeft size={15} strokeWidth={2} />
          </button>
          <button type="button" onClick={nextWeek} style={navBtnStyle}>
            <ChevronRight size={15} strokeWidth={2} />
          </button>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#e6e6ea", marginLeft: 4 }}>
            {fmtMonthYear(weekDates[0])}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Anotações com IA */}
          <button type="button" style={{
            display: "flex", alignItems: "center", gap: 6, padding: "4px 10px",
            borderRadius: 6, border: "1px solid #26262d", background: "none",
            cursor: "pointer", color: "#b0b0c4", fontSize: 12,
          }}>
            <Sparkles size={13} strokeWidth={1.7} style={{ color: "#a78bfa" }} />
            Anotações com IA
          </button>
          <ToolbarIconBtn><CalendarDays size={14} strokeWidth={1.7} /></ToolbarIconBtn>
          <ToolbarIconBtn><RefreshCw size={14} strokeWidth={1.7} /></ToolbarIconBtn>
          <ToolbarIconBtn><Settings size={14} strokeWidth={1.7} /></ToolbarIconBtn>

          {/* seletor Semana */}
          <button type="button" style={{
            display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
            borderRadius: 6, border: "1px solid #26262d", background: "none",
            cursor: "pointer", color: "#b0b0c4", fontSize: 12,
          }}>
            Semana
            <ChevronDown size={12} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* grid do calendário */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>

        {/* cabeçalho dos dias */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "60px repeat(7, 1fr)",
          borderBottom: "1px solid #1e1e24",
          flexShrink: 0,
          background: "#0f0f12",
          position: "sticky", top: 0, zIndex: 2,
        }}>
          {/* coluna GMT */}
          <div style={{
            padding: "8px 0", textAlign: "center",
            fontSize: 10, color: "#5a5a64", borderRight: "1px solid #1e1e24",
          }}>
            GMT-3
          </div>
          {weekDates.map((date, i) => {
            const today = isToday(date);
            return (
              <div key={i} style={{
                padding: "6px 0", textAlign: "center",
                borderRight: i < 6 ? "1px solid #1e1e24" : "none",
                background: today ? "#13131a" : "transparent",
              }}>
                <div style={{ fontSize: 11, color: "#7a7a90", marginBottom: 2 }}>
                  {WEEK_DAYS[date.getDay()]}
                </div>
                <div style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 26, height: 26, borderRadius: "50%",
                  background: today ? "#ef4444" : "transparent",
                  fontSize: 13, fontWeight: today ? 700 : 400,
                  color: today ? "#fff" : "#e6e6ea",
                }}>
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* corpo: horas + células */}
        <div style={{ position: "relative", flex: 1 }}>
          {HOURS.map((hour, hi) => (
            <div key={hi} style={{
              display: "grid",
              gridTemplateColumns: "60px repeat(7, 1fr)",
              height: hi < 2 ? 28 : 60,
              borderBottom: "1px solid #1e1e24",
            }}>
              {/* label da hora */}
              <div style={{
                display: "flex", alignItems: "flex-start", justifyContent: "flex-end",
                paddingRight: 8, paddingTop: 6,
                fontSize: 10, color: "#5a5a64",
                borderRight: "1px solid #1e1e24", flexShrink: 0,
              }}>
                {hi === 0 ? "O dia" : hi === 1 ? "todo" : hour}
              </div>

              {/* células dos 7 dias */}
              {Array.from({ length: 7 }, (_, di) => {
                const today = isToday(weekDates[di]);
                return (
                  <div key={di} style={{
                    borderRight: di < 6 ? "1px solid #1e1e24" : "none",
                    background: today ? "#11111a" : "transparent",
                    cursor: "pointer",
                    transition: "background .1s",
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#16161f"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = today ? "#11111a" : "transparent"; }}
                  />
                );
              })}
            </div>
          ))}

          {/* linha de hora atual */}
          {showTimeline && (
            <div style={{
              position: "absolute",
              top: `calc(56px + ${timelineTop}% )`,
              left: 60, right: 0,
              display: "flex", alignItems: "center",
              pointerEvents: "none", zIndex: 3,
            }}>
              {/* hora atual */}
              <div style={{
                position: "absolute", left: -58,
                background: "#ef4444", color: "#fff",
                fontSize: 10, fontWeight: 700,
                padding: "1px 4px", borderRadius: 4,
              }}>
                {now.getHours()}:{String(now.getMinutes()).padStart(2, "0")}
              </div>
              {/* ponto + linha */}
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
              <div style={{ flex: 1, height: 1, background: "#ef4444" }} />
            </div>
          )}
        </div>
      </div>

      {/* barra de busca no rodapé */}
      <div style={{
        borderTop: "1px solid #1e1e24", padding: "10px 16px", flexShrink: 0,
        display: "flex", justifyContent: "center",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          width: "100%", maxWidth: 520, height: 34,
          background: "#0c0c0f", border: "1px solid #26262d",
          borderRadius: 8, padding: "0 12px",
        }}>
          <Search size={13} style={{ color: "#5a5a64", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "#5a5a64" }}>
            Pesquise eventos, colegas de equipe, comandos...
          </span>
          <span style={{ marginLeft: "auto", flexShrink: 0 }}>
            <SparklesGradient />
          </span>
        </div>
      </div>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 6, border: "1px solid #26262d",
  background: "none", cursor: "pointer", color: "#b0b0c4",
  display: "flex", alignItems: "center", justifyContent: "center",
};

function ToolbarIconBtn({ children }: { children: React.ReactNode }) {
  return (
    <button type="button" style={{
      width: 28, height: 28, borderRadius: 6, border: 0,
      background: "none", cursor: "pointer", color: "#7a7a90",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}
      onMouseEnter={e => { e.currentTarget.style.background = "#1e1e28"; e.currentTarget.style.color = "#c4c4cc"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#7a7a90"; }}
    >
      {children}
    </button>
  );
}

function SparklesGradient() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="pl-spark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c5cff" />
          <stop offset="100%" stopColor="#e040fb" />
        </linearGradient>
      </defs>
      <path
        d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
        stroke="url(#pl-spark)" strokeWidth={1.6} fill="none"
      />
    </svg>
  );
}

/* ─── Página principal — só o calendário (painel esq. vive no WorkspacePanel) */
export default function PlannerPage() {
  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <WeekCalendar />
    </div>
  );
}
