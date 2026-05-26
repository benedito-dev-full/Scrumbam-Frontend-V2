"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { X, Calendar, Clock, AlignLeft, Users } from "lucide-react";

import { cn } from "@/lib/utils";

interface CreateEventModalProps {
  /** Data/hora de inicio pre-preenchida (clicada pelo usuario). */
  date: Date;
  /** Hora pre-preenchida (so relevante em WeekView/DayView; null = dia todo). */
  hour: number | null;
  onClose: () => void;
}

/**
 * Modal prototipo de criacao de evento.
 *
 * Pre-preenche data e hora com base na celula clicada. Sem integracao
 * com backend por enquanto — preparado para futura conexao com Google
 * Calendar e com o endpoint de Planner do Scrumban-Backend-V2.
 */
export function CreateEventModal({ date, hour, onClose }: CreateEventModalProps) {
  const dateLabel = format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
  const timeLabel =
    hour !== null
      ? `${String(hour).padStart(2, "0")}:00 – ${String(hour + 1).padStart(2, "0")}:00`
      : "O dia todo";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border shadow-2xl"
        style={{ background: "var(--background)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[15px] font-semibold text-foreground">Novo evento</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Fechar"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 px-5 py-5">
          {/* Titulo */}
          <input
            autoFocus
            type="text"
            placeholder="Titulo do evento"
            className={cn(
              "w-full rounded-lg border border-border bg-transparent px-3 py-2.5",
              "text-[14px] text-foreground placeholder:text-muted-foreground",
              "outline-none focus:border-primary focus:ring-1 focus:ring-primary/30",
            )}
          />

          {/* Data e hora */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
              <Calendar size={14} className="flex-shrink-0" />
              <span className="capitalize">{dateLabel}</span>
            </div>
            <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
              <Clock size={14} className="flex-shrink-0" />
              <span>{timeLabel}</span>
            </div>
          </div>

          {/* Descricao */}
          <div className="flex items-start gap-3">
            <AlignLeft size={14} className="mt-2.5 flex-shrink-0 text-muted-foreground" />
            <textarea
              placeholder="Adicionar descricao"
              rows={2}
              className={cn(
                "w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2.5",
                "text-[13px] text-foreground placeholder:text-muted-foreground",
                "outline-none focus:border-primary focus:ring-1 focus:ring-primary/30",
              )}
            />
          </div>

          {/* Convidados */}
          <div className="flex items-center gap-3">
            <Users size={14} className="flex-shrink-0 text-muted-foreground" />
            <input
              type="text"
              placeholder="Adicionar convidados"
              className={cn(
                "w-full rounded-lg border border-border bg-transparent px-3 py-2.5",
                "text-[13px] text-foreground placeholder:text-muted-foreground",
                "outline-none focus:border-primary focus:ring-1 focus:ring-primary/30",
              )}
            />
          </div>

          {/* Badge Google Calendar (placeholder para futura integracao) */}
          <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
            <GoogleCalendarIcon />
            <span className="text-[11px] text-muted-foreground">
              Integracao com Google Calendar em breve
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Criar evento
          </button>
        </div>
      </div>
    </>
  );
}

function GoogleCalendarIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="#4285F4" strokeWidth="1.5" />
      <path d="M3 9h18" stroke="#4285F4" strokeWidth="1.5" />
      <path d="M9 3v6M15 3v6" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round" />
      <text x="12" y="17" textAnchor="middle" fontSize="7" fill="#4285F4" fontWeight="bold">G</text>
    </svg>
  );
}
