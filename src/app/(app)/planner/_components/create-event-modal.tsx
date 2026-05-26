"use client";

import { useState } from "react";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlignLeft,
  Calendar,
  ChevronDown,
  Clock,
  Link2,
  MapPin,
  Tag,
  Users,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

// Tipos de evento mapeados para DTabela (idTaskType) — seeds futuros no backend
const EVENT_TYPES = [
  { value: "meeting",      label: "Reunião",     icon: "🤝", color: "text-blue-400" },
  { value: "event",        label: "Evento",      icon: "📅", color: "text-violet-400" },
  { value: "task",         label: "Tarefa",      icon: "✅", color: "text-emerald-400" },
  { value: "lunch",        label: "Almoço",      icon: "🍽️", color: "text-amber-400" },
  { value: "call",         label: "Ligação",     icon: "📞", color: "text-cyan-400" },
  { value: "other",        label: "Outro",       icon: "📌", color: "text-slate-400" },
] as const;

type EventTypeValue = typeof EVENT_TYPES[number]["value"];

// Prioridades mapeadas para DTabela (idPriority)
const PRIORITIES = [
  { value: "urgent", label: "Urgente",  color: "text-red-400" },
  { value: "high",   label: "Alta",     color: "text-orange-400" },
  { value: "medium", label: "Media",    color: "text-yellow-400" },
  { value: "low",    label: "Baixa",    color: "text-slate-400" },
] as const;

type PriorityValue = typeof PRIORITIES[number]["value"];

interface CreateEventModalProps {
  /** Data de inicio pre-preenchida (celula clicada). */
  date: Date;
  /** Hora pre-preenchida (null = dia todo). Mapeia para dueDate em DTask. */
  hour: number | null;
  onClose: () => void;
}

const inputClass = cn(
  "w-full rounded-lg border border-border bg-transparent px-3 py-2",
  "text-[13px] text-foreground placeholder:text-muted-foreground",
  "outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors",
);

/**
 * Modal de criacao de evento do Planner.
 *
 * Campos alinhados com DTask do Scrumban-Backend-V2:
 * - nome        → titulo
 * - idTaskType  → tipo (DTabela lookup)
 * - dueDate     → data + hora
 * - descricao   → descricao
 * - idAssignee  → convidados (DEntidade)
 * - idPriority  → prioridade (DTabela lookup)
 * - dados.meetLink  → link de reuniao (Zoom/Meet — JSON polimórfico)
 * - dados.location  → local
 *
 * Preparado para integracao com Google Calendar (dados.googleEventId)
 * e Zoom (dados.zoomId, dados.zoomJoinUrl).
 */
export function CreateEventModal({ date, hour, onClose }: CreateEventModalProps) {
  const [eventType, setEventType] = useState<EventTypeValue>("meeting");
  const [priority, setPriority] = useState<PriorityValue>("medium");
  const [showMeetLink, setShowMeetLink] = useState(false);
  const [showLocation, setShowLocation] = useState(false);

  const dateLabel = format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const timeLabel =
    hour !== null
      ? `${String(hour).padStart(2, "0")}:00 – ${String(hour + 1).padStart(2, "0")}:00`
      : "O dia todo";

  const selectedType = EVENT_TYPES.find((t) => t.value === eventType)!;
  const isMeeting = eventType === "meeting" || eventType === "call";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal */}
      <div
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border shadow-2xl"
        style={{ background: "var(--background)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-[14px] font-semibold text-foreground">Novo evento</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Fechar"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-3.5 px-5 py-4">

          {/* Titulo */}
          <input
            autoFocus
            type="text"
            placeholder="Titulo do evento"
            className={cn(inputClass, "text-[14px] py-2.5")}
          />

          {/* Tipo de evento */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <Tag size={11} />
              Tipo
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setEventType(t.value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] transition-all",
                    eventType === t.value
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-border/80 hover:bg-secondary",
                  )}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Data e hora */}
          <div className="flex gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-border px-3 py-2 text-[13px] text-muted-foreground">
              <Calendar size={13} className="flex-shrink-0" />
              <span className="capitalize truncate">{dateLabel}</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-[13px] text-muted-foreground">
              <Clock size={13} className="flex-shrink-0" />
              <span className="whitespace-nowrap">{timeLabel}</span>
            </div>
          </div>

          {/* Descricao — mapeia para DTask.descricao */}
          <div className="flex items-start gap-2.5">
            <AlignLeft size={13} className="mt-2.5 flex-shrink-0 text-muted-foreground" />
            <textarea
              placeholder="Adicionar descricao"
              rows={2}
              className={cn(inputClass, "resize-none")}
            />
          </div>

          {/* Convidados — mapeia para DTask.idAssignee (DEntidade) */}
          <div className="flex items-center gap-2.5">
            <Users size={13} className="flex-shrink-0 text-muted-foreground" />
            <input type="text" placeholder="Adicionar convidados ou participantes" className={inputClass} />
          </div>

          {/* Prioridade — mapeia para DTask.idPriority (DTabela) */}
          <div className="flex items-center gap-2.5">
            <div className="flex-shrink-0 text-muted-foreground">
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" x2="4" y1="22" y2="15" />
              </svg>
            </div>
            <div className="relative flex-1">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityValue)}
                className={cn(inputClass, "appearance-none pr-8 cursor-pointer")}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* Link de reuniao — mapeia para DTask.dados.meetLink */}
          {isMeeting && (
            <div className="flex items-center gap-2.5">
              <Link2 size={13} className="flex-shrink-0 text-muted-foreground" />
              {showMeetLink ? (
                <input type="url" placeholder="https://zoom.us/j/... ou meet.google.com/..." className={inputClass} />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowMeetLink(true)}
                  className="text-[13px] text-primary hover:underline"
                >
                  + Adicionar link de reuniao (Zoom / Meet)
                </button>
              )}
            </div>
          )}

          {/* Local — mapeia para DTask.dados.location */}
          {showLocation ? (
            <div className="flex items-center gap-2.5">
              <MapPin size={13} className="flex-shrink-0 text-muted-foreground" />
              <input type="text" placeholder="Adicionar local ou endereco" className={inputClass} />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowLocation(true)}
              className="flex items-center gap-2.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <MapPin size={13} />
              <span>+ Adicionar local</span>
            </button>
          )}

          {/* Integrações futuras */}
          <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <GoogleCalendarIcon />
              <span className="text-[11px] text-muted-foreground">Google Calendar</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <ZoomIcon />
              <span className="text-[11px] text-muted-foreground">Zoom</span>
            </div>
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              Em breve
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3.5">
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <span className={selectedType.color}>{selectedType.icon}</span>
            <span>{selectedType.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-3.5 py-1.5 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Criar evento
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function GoogleCalendarIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="#4285F4" strokeWidth="1.8" />
      <path d="M3 9h18" stroke="#4285F4" strokeWidth="1.5" />
      <path d="M9 3v6M15 3v6" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round" />
      <text x="12" y="18" textAnchor="middle" fontSize="7" fill="#4285F4" fontWeight="bold">G</text>
    </svg>
  );
}

function ZoomIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="14" height="12" rx="2" stroke="#2D8CFF" strokeWidth="1.8" />
      <path d="M16 10l6-4v12l-6-4v-4z" stroke="#2D8CFF" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
