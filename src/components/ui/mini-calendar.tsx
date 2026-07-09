"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";

const calNavBtn: React.CSSProperties = {
  display: "grid",
  placeItems: "center",
  width: 26,
  height: 26,
  borderRadius: 6,
  border: 0,
  background: "transparent",
  color: "var(--muted-foreground)",
  cursor: "pointer",
};

const calFootBtn: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  border: 0,
  background: "transparent",
  borderRadius: 6,
  padding: "4px 8px",
  cursor: "pointer",
};

/**
 * Calendário custom (nosso) — grid do mês navegável em pt-BR, com o dia atual
 * destacado e atalhos "Hoje" / "Limpar". Substitui o `<input type="date">`
 * nativo (feio e inconsistente entre browsers) por um popover alinhado ao
 * design system. Reutilizado no painel `/assigned` e na coluna "Data limite"
 * dos Blocos/Lista.
 *
 * @param value - Data selecionada no formato `YYYY-MM-DD` (ou `""` quando vazia).
 * @param onSelect - Recebe `YYYY-MM-DD` ao escolher um dia, ou `null` ao limpar.
 */
export function MiniCalendar({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (v: string | null) => void;
}) {
  const selected = value ? parseISO(value) : null;
  const today = new Date();
  const [view, setView] = useState<Date>(selected ?? today);

  const gridStart = startOfWeek(startOfMonth(view), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(view), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const week = ["D", "S", "T", "Q", "Q", "S", "S"];

  return (
    <div style={{ width: 250, padding: 12, userSelect: "none" }}>
      {/* Cabeçalho: mês/ano + navegação */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <button
          type="button"
          aria-label="Mês anterior"
          onClick={() => setView(subMonths(view, 1))}
          style={calNavBtn}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--accent)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <ChevronLeft size={16} />
        </button>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--foreground)",
            textTransform: "capitalize",
          }}
        >
          {format(view, "MMMM yyyy", { locale: ptBR })}
        </span>
        <button
          type="button"
          aria-label="Próximo mês"
          onClick={() => setView(addMonths(view, 1))}
          style={calNavBtn}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--accent)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Dias da semana */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
          marginBottom: 4,
        }}
      >
        {week.map((w, i) => (
          <span
            key={i}
            style={{
              textAlign: "center",
              fontSize: 10,
              fontWeight: 600,
              color: "var(--muted-foreground)",
            }}
          >
            {w}
          </span>
        ))}
      </div>

      {/* Grid de dias */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
        }}
      >
        {days.map((d) => {
          const inMonth = isSameMonth(d, view);
          const isSel = !!selected && isSameDay(d, selected);
          const isToday = isSameDay(d, today);
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => onSelect(format(d, "yyyy-MM-dd"))}
              style={{
                height: 30,
                borderRadius: 6,
                border: 0,
                cursor: "pointer",
                fontSize: 12,
                fontVariantNumeric: "tabular-nums",
                background: isSel ? "#7c5cff" : "transparent",
                color: isSel
                  ? "#fff"
                  : inMonth
                    ? "var(--foreground)"
                    : "var(--muted-foreground)",
                opacity: inMonth ? 1 : 0.4,
                fontWeight: isSel || isToday ? 700 : 400,
                boxShadow:
                  isToday && !isSel
                    ? "inset 0 0 0 1px rgba(124,92,255,0.55)"
                    : "none",
              }}
              onMouseEnter={(e) => {
                if (!isSel) e.currentTarget.style.background = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                if (!isSel) e.currentTarget.style.background = "transparent";
              }}
            >
              {format(d, "d")}
            </button>
          );
        })}
      </div>

      {/* Rodapé: atalhos */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 10,
          paddingTop: 8,
          borderTop: "1px solid var(--border)",
        }}
      >
        <button
          type="button"
          onClick={() => onSelect(format(today, "yyyy-MM-dd"))}
          style={{ ...calFootBtn, color: "#7c5cff" }}
        >
          Hoje
        </button>
        <button
          type="button"
          onClick={() => onSelect(null)}
          style={{ ...calFootBtn, color: "#ef5f5f" }}
        >
          Limpar
        </button>
      </div>
    </div>
  );
}
