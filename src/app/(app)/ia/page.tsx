"use client";

import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Globe,
  Check,
  Search,
} from "lucide-react";
import { MentionsInput, Mention } from "react-mentions";
import { NexusIcon, NexusMiniIcon } from "@/components/ia/icons";
import { AgentsTab } from "@/components/ia/agents-tab";
import { useNexusChat } from "@/hooks/use-nexus-chat";
import { useSpaces } from "@/hooks/use-projects";
import type { MentionsInputStyle } from "react-mentions";

/* ─── Cards de ação rápida ────────────────────────────────────────────────── */
const QUICK_ACTIONS = [
  {
    label: "Summarize Recent",
    sublabel: "Summarize all activity",
    icon: (
      /* grade 2x2 igual ClickUp */
      <svg
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="8" height="8" rx="1" />
        <rect x="13" y="3" width="8" height="8" rx="1" />
        <rect x="3" y="13" width="8" height="8" rx="1" />
        <rect x="13" y="13" width="8" height="8" rx="1" />
      </svg>
    ),
  },
  {
    label: "Create Task",
    sublabel: "Add new task",
    icon: (
      /* lista com + igual ClickUp */
      <svg
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <path d="M3 18h0M5 16v4M3 18h4" />
      </svg>
    ),
  },
  {
    label: "Find Docs",
    sublabel: "Search related docs",
    icon: <Search size={16} strokeWidth={1.9} />,
  },
  {
    label: "Brainstorm Ideas",
    sublabel: "Generate new ideas",
    icon: (
      /* asterisco/sparkle igual ClickUp */
      <svg
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="2" x2="12" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
      </svg>
    ),
  },
];

type Tab = "pergunta" | "agentes";

/* ─── Modelos disponíveis ─────────────────────────────────────────────────── */
const MODELS = [
  {
    id: "nexus2",
    label: "Nexus²",
    badge: "Max",
    icon: <NexusMiniIcon />,
  },
  {
    id: "gpt55",
    label: "GPT-5.5",
    icon: (
      /* Logo oficial OpenAI */
      <svg
        width={15}
        height={15}
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ color: "#fff" }}
      >
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0L4.006 14.5A4.501 4.501 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387 2.019-1.168a.076.076 0 0 1 .071 0l4.816 2.801a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.397-.673zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.814-2.798a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
      </svg>
    ),
  },
  {
    id: "claude",
    label: "Claude Opus 4.7",
    icon: (
      /* Logo oficial Anthropic */
      <svg width={15} height={15} viewBox="0 0 24 24" fill="#d97706">
        <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017L3.674 20H0L6.57 3.52zm4.132 9.959L8.453 7.687 6.205 13.48h4.496z" />
      </svg>
    ),
  },
  {
    id: "gemini",
    label: "Gemini 3.1 Pro",
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
];

function ModelDropdown() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("nexus2");
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const ref = useRef<HTMLDivElement>(null);

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
      setPos({ top: r.bottom + 6, left: r.left });
    }
    setOpen((v) => !v);
  }

  const current = MODELS.find((m) => m.id === selected) ?? MODELS[0];

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
            Best models
          </p>

          {MODELS.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={() => {
                setSelected(model.id);
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
                cursor: "pointer",
                color: "var(--foreground)",
                fontSize: 13,
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
              }}
            >
              <span style={{ flexShrink: 0 }}>{model.icon}</span>
              <span style={{ flex: 1 }}>{model.label}</span>
              {model.badge && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#fff",
                    background: "#2563eb",
                    borderRadius: 4,
                    padding: "1px 6px",
                  }}
                >
                  {model.badge}
                </span>
              )}
              {selected === model.id && (
                <Check
                  size={13}
                  strokeWidth={2.5}
                  style={{ color: "#60a5fa", flexShrink: 0 }}
                />
              )}
            </button>
          ))}

          <div
            style={{ height: 1, background: "var(--accent)", margin: "4px 0" }}
          />

          <button
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              height: 34,
              padding: "0 14px",
              border: 0,
              background: "none",
              cursor: "pointer",
              color: "var(--muted-foreground)",
              fontSize: 13,
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
            <ChevronDown size={13} strokeWidth={2} />
            Mostrar mais
          </button>
        </div>
      )}
    </div>
  );
}

/** Estilo inline para o MentionsInput seguindo o dark theme do Nexus. */
const MENTIONS_INPUT_STYLE: MentionsInputStyle = {
  control: {
    background: "transparent",
    fontSize: 14,
    lineHeight: 1.65,
  },
  "&multiLine": {
    control: {
      minHeight: 48,
    },
    highlighter: {
      padding: 0,
      border: "none",
    },
    input: {
      background: "transparent",
      border: "none",
      outline: "none",
      color: "var(--foreground)",
      resize: "none",
      padding: 0,
    },
  },
  suggestions: {
    // zIndex alto porque renderizamos via suggestionsPortalHost no body
    // (acima de modais, drawers e qualquer overlay da aplicação).
    zIndex: 9999,
    list: {
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      overflow: "hidden",
      maxHeight: 220,
      overflowY: "auto",
    },
    item: {
      padding: "8px 14px",
      fontSize: 13,
      color: "var(--foreground)",
      cursor: "pointer",
      "&focused": {
        background: "var(--accent)",
      },
    },
  },
};

/** Estilo de highlight da mention dentro do input. */
const MENTION_HIGHLIGHT_STYLE: React.CSSProperties = {
  background: "rgba(37,99,235,0.2)",
  borderRadius: 4,
  color: "#60a5fa",
};

function IAPageContent() {
  const [tab, setTab] = useState<Tab>("pergunta");
  const [input, setInput] = useState("");
  const { messages, isSending, sendMessage } = useNexusChat();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();
  const autoSentRef = useRef(false);

  /* Spaces para o @mention */
  const { data: spaces = [] } = useSpaces();
  const spaceSuggestions = useMemo(
    () => spaces.map((s) => ({ id: s.id, display: s.nome })),
    [spaces]
  );

  const mentionsStyle = useMemo(
    (): MentionsInputStyle => ({
      ...MENTIONS_INPUT_STYLE,
      "&multiLine": {
        ...MENTIONS_INPUT_STYLE["&multiLine"],
        input: {
          ...MENTIONS_INPUT_STYLE["&multiLine"]?.input,
          opacity: isSending ? 0.6 : 1,
        },
      },
    }),
    [isSending]
  );

  /* lê ?q= da URL e dispara o envio automaticamente uma única vez */
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !autoSentRef.current && messages.length === 0 && !isSending) {
      autoSentRef.current = true;
      sendMessage(q.trim());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Há conversa em andamento? Layout muda de "centro vertical" para topo
  // quando o usuário começou a interagir — sem alterar nenhum estilo dos
  // elementos existentes.
  const hasConversation =
    tab === "pergunta" && (messages.length > 0 || isSending);

  // Auto-scroll: rola para a última mensagem quando o histórico cresce ou
  // quando o assistant entra em "pensando..." — comportamento padrão de chat.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages.length, isSending]);

  function serializeMentions(raw: string): string {
    // react-mentions armazena internamente como @[Nome](id)
    // serializar para o backend como [Nome](projectId:id)
    return raw.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, "[$1](projectId:$2)");
  }

  function handleSend() {
    const content = input.trim();
    if (!content || isSending) return;
    sendMessage(serializeMentions(content));
    setInput("");
  }

  function handleKeyDown(
    e:
      | React.KeyboardEvent<HTMLTextAreaElement>
      | React.KeyboardEvent<HTMLInputElement>
  ) {
    // Enter envia; Shift+Enter quebra linha (padrão chat).
    // Quando o popover de suggestions está aberto, react-mentions
    // intercepta Enter internamente — não chegamos aqui nesse caso.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        background: "var(--background)",
        overflow: "hidden",
      }}
    >
      {/* ══ HEADER FIXO — logo Nexus sempre visível ══ */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 72,
          background: "var(--background)",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* gradiente aurora atrás do header */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 80% 200% at 50% -60%, #7c3aed44 0%, #2563eb33 40%, #ea580c22 70%, transparent 100%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <NexusIcon size={32} />
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "var(--foreground)",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            Nexus
            <sup
              style={{
                fontSize: 10,
                fontWeight: 400,
                color: "var(--muted-foreground)",
                verticalAlign: "super",
                marginLeft: 2,
              }}
            >
              ™
            </sup>
          </span>
        </div>
      </div>

      {/* ══ ÁREA SCROLLÁVEL — mensagens ou conteúdo da aba ══ */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 700,
            padding: "24px 24px 16px",
          }}
        >
          {/* aba "pergunta" — histórico de mensagens */}
          {tab === "pergunta" && (
            <>
              {/* estado vazio: quick actions centralizadas */}
              {!hasConversation && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 6,
                    marginTop: 32,
                  }}
                >
                  {QUICK_ACTIONS.map((a) => (
                    <button
                      key={a.label}
                      type="button"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 8,
                        padding: "12px 14px",
                        borderRadius: 10,
                        border: "none",
                        overflow: "hidden",
                        background: "var(--card)",
                        cursor: "pointer",
                        textAlign: "left",
                        minWidth: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--accent)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--card)";
                      }}
                    >
                      <span style={{ color: "var(--foreground)", flexShrink: 0 }}>
                        {a.icon}
                      </span>
                      <div style={{ minWidth: 0, width: "100%" }}>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--foreground)",
                            marginBottom: 3,
                          }}
                        >
                          {a.label}
                        </p>
                        <p
                          style={{
                            fontSize: 11,
                            color: "var(--muted-foreground)",
                            lineHeight: 1.4,
                          }}
                        >
                          {a.sublabel}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* histórico de mensagens */}
              {hasConversation && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        justifyContent:
                          msg.role === "user" ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "82%",
                          padding: "10px 14px",
                          borderRadius: 14,
                          background:
                            msg.role === "user" ? "#2563eb" : "var(--card)",
                          color:
                            msg.role === "user" ? "#fff" : "var(--foreground)",
                          fontSize: 14,
                          lineHeight: 1.55,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}

                  {isSending && (
                    <div style={{ display: "flex", justifyContent: "flex-start" }}>
                      <div
                        style={{
                          padding: "10px 14px",
                          borderRadius: 14,
                          background: "var(--card)",
                          color: "var(--muted-foreground)",
                          fontSize: 14,
                          fontStyle: "italic",
                        }}
                      >
                        Nexus está pensando...
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </>
          )}

          {/* aba "agentes" */}
          {tab === "agentes" && (
            <div style={{ width: "100%" }}>
              <div
                style={{
                  display: "flex",
                  gap: 2,
                  padding: "4px 0 16px",
                  borderBottom: "1px solid var(--border)",
                  marginBottom: 20,
                }}
              >
                <button
                  type="button"
                  onClick={() => setTab("pergunta")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    height: 30,
                    padding: "0 14px",
                    borderRadius: 7,
                    border: 0,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 500,
                    background: "transparent",
                    color: "var(--muted-foreground)",
                  }}
                >
                  <NexusMiniIcon />
                  Faça uma pergunta
                </button>
                <button
                  type="button"
                  onClick={() => setTab("agentes")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    height: 30,
                    padding: "0 14px",
                    borderRadius: 7,
                    border: 0,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 500,
                    background: "rgba(34,211,238,0.08)",
                    color: "#22d3ee",
                  }}
                >
                  <svg
                    width={14}
                    height={14}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path d="M12 12c-2-2.5-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.5 6-4z" />
                    <path d="M12 12c2 2.5 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.5-6 4z" />
                  </svg>
                  Agentes
                </button>
              </div>
              <AgentsTab />
            </div>
          )}
        </div>
      </div>

      {/* ══ FOOTER FIXO — input sempre visível ══ */}
      {tab === "pergunta" && (
        <div
          style={{
            flexShrink: 0,
            padding: "12px 24px 20px",
            background: "var(--background)",
          }}
        >
          <div
            style={{
              maxWidth: 700,
              margin: "0 auto",
              borderRadius: 16,
              padding: 2,
              background:
                "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #dc2626 100%)",
              boxShadow:
                "0 0 40px rgba(37,99,235,0.15), 0 0 40px rgba(124,58,237,0.1)",
            }}
          >
            <div
              style={{
                borderRadius: 14,
                background: "var(--card)",
                overflow: "hidden",
              }}
            >
              {/* abas */}
              <div style={{ display: "flex", gap: 2, padding: "10px 10px 0" }}>
                <button
                  type="button"
                  onClick={() => setTab("pergunta")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    height: 30,
                    padding: "0 14px",
                    borderRadius: 7,
                    border: 0,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 500,
                    background: "#2563eb",
                    color: "#fff",
                    transition: "background .12s, color .12s",
                  }}
                >
                  <NexusMiniIcon />
                  Faça uma pergunta
                </button>
                <button
                  type="button"
                  onClick={() => setTab("agentes")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    height: 30,
                    padding: "0 14px",
                    borderRadius: 7,
                    border: 0,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 500,
                    background: "transparent",
                    color: "var(--foreground)",
                    transition: "background .12s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <svg
                    width={14}
                    height={14}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path d="M12 12c-2-2.5-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.5 6-4z" />
                    <path d="M12 12c2 2.5 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.5-6 4z" />
                  </svg>
                  Agentes
                </button>
              </div>

              {/* input com @mention */}
              <div
                style={{
                  padding: "16px 18px 4px",
                  opacity: isSending ? 0.6 : 1,
                }}
              >
                <MentionsInput
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSending}
                  placeholder="Pesquise em seu espaço de trabalho e na web em segundos. Digite @ para mencionar um projeto."
                  allowSuggestionsAboveCursor
                  a11ySuggestionsListLabel="Projetos disponíveis"
                  // Renderiza o dropdown via React Portal no document.body
                  // para escapar do clipping/overflow do container pai
                  // (sem isso o popover aparecia cortado E o suggestionsElement
                  // ficava parcialmente fora do viewport, quebrando o Tab).
                  suggestionsPortalHost={
                    typeof document !== "undefined" ? document.body : undefined
                  }
                  style={mentionsStyle}
                >
                  <Mention
                    trigger="@"
                    data={spaceSuggestions}
                    markup="@[__display__](__id__)"
                    appendSpaceOnAdd
                    style={MENTION_HIGHLIGHT_STYLE}
                    renderSuggestion={(suggestion, _search, highlightedDisplay) => (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 5,
                            background: "#2563eb22",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            flexShrink: 0,
                          }}
                        >
                          #
                        </span>
                        <span>{highlightedDisplay}</span>
                      </div>
                    )}
                  />
                </MentionsInput>
              </div>

              {/* rodapé do card */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px 12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    type="button"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                      background: "none",
                      cursor: "pointer",
                      color: "var(--muted-foreground)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--secondary)";
                      e.currentTarget.style.color = "var(--foreground)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "none";
                      e.currentTarget.style.color = "var(--muted-foreground)";
                    }}
                  >
                    <Plus size={14} strokeWidth={2} />
                  </button>
                  <ModelDropdown />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    type="button"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      color: "var(--muted-foreground)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--foreground)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--muted-foreground)";
                    }}
                  >
                    <Globe size={15} strokeWidth={1.7} />
                  </button>

                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!input.trim() || isSending}
                    aria-label="Enviar pergunta ao Nexus"
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 7,
                      border: "none",
                      cursor: input.trim() && !isSending ? "pointer" : "default",
                      background:
                        input.trim() && !isSending ? "#2563eb" : "var(--accent)",
                      color:
                        input.trim() && !isSending
                          ? "#fff"
                          : "var(--muted-foreground)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background .15s",
                      opacity: isSending ? 0.7 : 1,
                    }}
                  >
                    <svg
                      width={13}
                      height={13}
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M5 3l14 9-14 9V3z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function IAPage() {
  return (
    <Suspense>
      <IAPageContent />
    </Suspense>
  );
}
