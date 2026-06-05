"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Check, Lock } from "lucide-react";
import { useAiProviders, useAiPreference } from "@/hooks/use-ai-providers";
import type { AiProviderName } from "@/lib/types/nexus";

/* ─── Provedores reais (multi-provider) ──────────────────────────────────────
   Os SVGs são os logos oficiais (OpenAI, Anthropic, Gemini) que já existiam
   neste arquivo na versão fake — reaproveitados para manter o visual. */
interface ProviderMeta {
  id: AiProviderName;
  label: string;
  icon: ReactNode;
}

const PROVIDERS: ProviderMeta[] = [
  {
    id: "gemini",
    label: "Gemini",
    icon: (
      <svg width={15} height={15} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z"
          fill="url(#gem-grad)"
        />
        <defs>
          <linearGradient id="gem-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    id: "claude",
    label: "Claude",
    icon: (
      /* Logo oficial Anthropic */
      <svg width={15} height={15} viewBox="0 0 24 24" fill="#d97706">
        <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017L3.674 20H0L6.57 3.52zm4.132 9.959L8.453 7.687 6.205 13.48h4.496z" />
      </svg>
    ),
  },
  {
    id: "openai",
    label: "OpenAI",
    icon: (
      /* Logo oficial OpenAI */
      <svg
        width={15}
        height={15}
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ color: "var(--foreground)" }}
      >
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0L4.006 14.5A4.501 4.501 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387 2.019-1.168a.076.076 0 0 1 .071 0l4.816 2.801a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.397-.673zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.814-2.798a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
      </svg>
    ),
  },
];

/** Fallback default quando não há preferência da org. */
const DEFAULT_PROVIDER: AiProviderName = "gemini";

interface ModelDropdownProps {
  /** Provider atualmente selecionado na conversa. */
  value: AiProviderName;
  /** Notifica a seleção de um provider configurado. */
  onChange: (provider: AiProviderName) => void;
}

/**
 * Seletor de provedor de IA do chat Nexus.
 *
 * Lista os 3 provedores reais (Gemini/Claude/OpenAI) com disponibilidade
 * vinda de `GET /ai/providers`: não-configurados ficam desabilitados com
 * tooltip orientando a cadastrar a chave em Configurações. Componente
 * controlado — a seleção sobe via `onChange` para virar `provider` no envio.
 */
export function ModelDropdown({ value, onChange }: ModelDropdownProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  /**
   * Altura estimada do menu: título (~30px) + 3 itens × 36px + padding (~26px).
   * Usada para decidir se o menu abre para baixo ou para cima.
   */
  const MENU_HEIGHT = 30 + PROVIDERS.length * 36 + 26;
  const ref = useRef<HTMLDivElement>(null);

  const { data: providersData } = useAiProviders();
  const { data: preference } = useAiPreference();

  /** Mapa provider → configured (default: tudo indisponível até carregar). */
  const configuredMap = useMemo(() => {
    const map = new Map<AiProviderName, boolean>();
    for (const p of providersData?.providers ?? []) {
      map.set(p.provider, p.configured);
    }
    return map;
  }, [providersData]);

  // Default por preferência da org → senão Gemini. Só aplica enquanto o
  // usuário ainda não escolheu manualmente (value cai no default inicial).
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    const pref = preference?.provider;
    if (pref && configuredMap.get(pref)) {
      didInitRef.current = true;
      if (pref !== value) onChange(pref);
    } else if (providersData) {
      // Providers carregaram e não há preferência válida — fixa no default.
      didInitRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preference, providersData, configuredMap]);

  // Guarda contra provider travado: se o selecionado deixou de estar
  // configurado (ex.: admin removeu a chave em outra aba), volta para a
  // preferência da org → senão Gemini. Evita enviar e tomar 502.
  useEffect(() => {
    // Só age depois que a disponibilidade carregou.
    if (!providersData) return;
    if (configuredMap.get(value)) return;
    const pref = preference?.provider;
    const fallback =
      pref && configuredMap.get(pref) ? pref : DEFAULT_PROVIDER;
    if (fallback !== value) onChange(fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configuredMap, providersData, value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleOpen() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      // O seletor vive no rodapé do chat: na prática não há espaço abaixo.
      // Abre para baixo só se couber; caso contrário, ancora acima do botão.
      const spaceBelow = window.innerHeight - r.bottom;
      const openUp = spaceBelow < MENU_HEIGHT + 6;
      const top = openUp ? r.top - MENU_HEIGHT - 6 : r.bottom + 6;
      setPos({ top, left: r.left });
    }
    setOpen((v) => !v);
  }

  const current =
    PROVIDERS.find((p) => p.id === value) ??
    PROVIDERS.find((p) => p.id === DEFAULT_PROVIDER) ??
    PROVIDERS[0];

  return (
    <div style={{ position: "relative" }}>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          height: 28,
          padding: "0 10px",
          borderRadius: 6,
          border: "none",
          background: "none",
          cursor: "pointer",
          color: "var(--foreground)",
          fontSize: 13,
          fontWeight: 500,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--secondary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "none";
        }}
      >
        {current.icon}
        {current.label}
        {open ? (
          <ChevronUp size={12} strokeWidth={2.5} />
        ) : (
          <ChevronDown size={12} strokeWidth={2.5} />
        )}
      </button>

      {open && (
        <div
          ref={ref}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            width: 220,
            borderRadius: 10,
            background: "var(--accent)",
            border: "1px solid #2a2a2a",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            zIndex: 9999,
            overflow: "hidden",
            padding: "8px 0",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--muted-foreground)",
              padding: "4px 14px 8px",
              textTransform: "none",
              letterSpacing: 0,
            }}
          >
            Provedor de IA
          </p>

          {PROVIDERS.map((provider) => {
            const configured = configuredMap.get(provider.id) ?? false;
            const selected = value === provider.id;
            return (
              <button
                key={provider.id}
                type="button"
                disabled={!configured}
                title={
                  configured
                    ? undefined
                    : "Configure a chave em Configurações para usar este provedor"
                }
                onClick={() => {
                  if (!configured) return;
                  onChange(provider.id);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  height: 36,
                  padding: "0 14px",
                  border: 0,
                  background: "none",
                  cursor: configured ? "pointer" : "not-allowed",
                  color: configured
                    ? "var(--foreground)"
                    : "var(--muted-foreground)",
                  opacity: configured ? 1 : 0.55,
                  fontSize: 13,
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  if (configured) e.currentTarget.style.background = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                }}
              >
                <span style={{ flexShrink: 0 }}>{provider.icon}</span>
                <span style={{ flex: 1 }}>{provider.label}</span>
                {!configured && (
                  <Lock
                    size={12}
                    strokeWidth={2}
                    style={{ color: "var(--muted-foreground)", flexShrink: 0 }}
                  />
                )}
                {selected && configured && (
                  <Check
                    size={13}
                    strokeWidth={2.5}
                    style={{ color: "#60a5fa", flexShrink: 0 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
