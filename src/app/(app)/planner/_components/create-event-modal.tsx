"use client";

import { useEffect, useRef, useState } from "react";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlignLeft,
  Calendar,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  Clock,
  Coffee,
  Link2,
  MapPin,
  Phone,
  Pin,
  Tag,
  Users,
  Video,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

const EVENT_TYPES = [
  { value: "meeting", label: "Reunião", Icon: Video,        color: "text-blue-400" },
  { value: "event",   label: "Evento",  Icon: CalendarDays, color: "text-violet-400" },
  { value: "task",    label: "Tarefa",  Icon: CheckSquare,  color: "text-emerald-400" },
  { value: "lunch",   label: "Almoço",  Icon: Coffee,       color: "text-amber-400" },
  { value: "call",    label: "Ligação", Icon: Phone,        color: "text-cyan-400" },
  { value: "other",   label: "Outro",   Icon: Pin,          color: "text-slate-400" },
] as const;

type EventTypeValue = typeof EVENT_TYPES[number]["value"];

const PRIORITIES = [
  { value: "urgent", label: "Urgente", color: "text-red-400" },
  { value: "high",   label: "Alta",    color: "text-orange-400" },
  { value: "medium", label: "Média",   color: "text-yellow-400" },
  { value: "low",    label: "Baixa",   color: "text-slate-400" },
] as const;

type PriorityValue = typeof PRIORITIES[number]["value"];

interface DropdownOption {
  value: string;
  label: string;
  color?: string;
  Icon?: React.ElementType;
}

/** Dropdown customizado — abre sempre abaixo do trigger, sem portal. */
function CustomDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: DropdownOption[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value)!;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative flex-1">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] text-foreground transition-colors",
          "hover:border-primary/50 focus:outline-none",
          open && "border-primary ring-1 ring-primary/30",
        )}
      >
        {selected.Icon && (
          <selected.Icon size={13} className={cn("flex-shrink-0", selected.color)} />
        )}
        <span className="flex-1 text-left">{selected.label}</span>
        <ChevronDown
          size={12}
          className={cn("flex-shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {/* Lista — posicionada abaixo do trigger via margin-top */}
      {open && (
        <div
          className="absolute left-0 right-0 top-full z-[60] mt-1 overflow-hidden rounded-lg border border-border shadow-xl"
          style={{ background: "var(--background)" }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2 text-[13px] transition-colors hover:bg-secondary",
                value === opt.value ? "bg-primary/10 text-foreground" : "text-muted-foreground",
              )}
            >
              {opt.Icon && (
                <opt.Icon size={13} className={cn("flex-shrink-0", opt.color)} />
              )}
              <span>{opt.label}</span>
              {value === opt.value && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface CreateEventModalProps {
  date: Date;
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
 * Campos mapeados para DTask (Scrumban-Backend-V2):
 * nome, idTaskType, dueDate, descricao, idAssignee, idPriority,
 * dados.meetLink, dados.location.
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

  const isMeeting = eventType === "meeting" || eventType === "call";
  const selectedType = EVENT_TYPES.find((t) => t.value === eventType)!;
  const SelectedIcon = selectedType.Icon;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />

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
            placeholder="Título do evento"
            className={cn(inputClass, "text-[14px] py-2.5")}
          />

          {/* Tipo */}
          <div className="flex items-center gap-2.5">
            <Tag size={13} className="flex-shrink-0 text-muted-foreground" />
            <CustomDropdown
              value={eventType}
              options={EVENT_TYPES as unknown as DropdownOption[]}
              onChange={(v) => setEventType(v as EventTypeValue)}
            />
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

          {/* Descricao */}
          <div className="flex items-start gap-2.5">
            <AlignLeft size={13} className="mt-2.5 flex-shrink-0 text-muted-foreground" />
            <textarea
              placeholder="Adicionar descrição"
              rows={2}
              className={cn(inputClass, "resize-none")}
            />
          </div>

          {/* Convidados */}
          <div className="flex items-center gap-2.5">
            <Users size={13} className="flex-shrink-0 text-muted-foreground" />
            <input type="text" placeholder="Adicionar convidados ou participantes" className={inputClass} />
          </div>

          {/* Prioridade */}
          <div className="flex items-center gap-2.5">
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0 text-muted-foreground">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" x2="4" y1="22" y2="15" />
            </svg>
            <CustomDropdown
              value={priority}
              options={PRIORITIES as unknown as DropdownOption[]}
              onChange={(v) => setPriority(v as PriorityValue)}
            />
          </div>

          {/* Link de reuniao — so para Reuniao e Ligacao */}
          {isMeeting && (
            <div className="flex items-center gap-2.5">
              <Link2 size={13} className="flex-shrink-0 text-muted-foreground" />
              {showMeetLink ? (
                <input
                  autoFocus
                  type="url"
                  placeholder="https://zoom.us/j/... ou meet.google.com/..."
                  className={inputClass}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowMeetLink(true)}
                  className="text-[13px] text-primary hover:underline"
                >
                  + Adicionar link de reunião (Zoom / Meet)
                </button>
              )}
            </div>
          )}

          {/* Local */}
          <div className="flex items-center gap-2.5">
            <MapPin size={13} className="flex-shrink-0 text-muted-foreground" />
            {showLocation ? (
              <input
                autoFocus
                type="text"
                placeholder="Adicionar local ou endereço"
                className={inputClass}
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowLocation(true)}
                className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                + Adicionar local
              </button>
            )}
          </div>

          {/* Integracoes futuras */}
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
            <SelectedIcon size={13} className={selectedType.color} />
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
