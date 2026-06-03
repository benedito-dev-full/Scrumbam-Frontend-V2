"use client";

import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Globe, Trash2 } from "lucide-react";
import { NexusIcon, NexusMiniIcon } from "@/components/ia/icons";
import { AgentsTab } from "@/components/ia/agents-tab";
import { MentionTextarea } from "@/components/ia/mention-textarea";
import { MessageContent } from "@/components/ia/message-content";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNexusChat } from "@/hooks/use-nexus-chat";
import { useSpaces } from "@/hooks/use-projects";
import { ModelDropdown } from "./_components/model-dropdown";
import { QUICK_ACTIONS } from "./_components/quick-actions";

type Tab = "pergunta" | "agentes";

function IAPageContent() {
  const [tab, setTab] = useState<Tab>("pergunta");
  const [input, setInput] = useState("");
  const { messages, isSending, sendMessage, clearChat, isClearing } =
    useNexusChat();
  const [clearOpen, setClearOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();
  const autoSentRef = useRef(false);

  /* Spaces para o @mention */
  const { data: spaces = [] } = useSpaces();
  const spaceSuggestions = useMemo(
    () => spaces.map((s) => ({ id: s.id, display: s.nome })),
    [spaces]
  );

  /**
   * Mapa acumulado de mentions inseridas no input atual (display -> id).
   * Usado em serializeMentions para converter `@Display` -> `[Display](projectId:id)`.
   * Resetado ao enviar a mensagem.
   */
  const mentionMapRef = useRef<Map<string, string>>(new Map());

  /* lÃª ?q= da URL e dispara o envio automaticamente uma Ãºnica vez */
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !autoSentRef.current && messages.length === 0 && !isSending) {
      autoSentRef.current = true;
      sendMessage(q.trim());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // HÃ¡ conversa em andamento? Layout muda de "centro vertical" para topo
  // quando o usuÃ¡rio comeÃ§ou a interagir â€” sem alterar nenhum estilo dos
  // elementos existentes.
  const hasConversation =
    tab === "pergunta" && (messages.length > 0 || isSending);

  // Auto-scroll: rola para a Ãºltima mensagem quando o histÃ³rico cresce ou
  // quando o assistant entra em "pensando..." â€” comportamento padrÃ£o de chat.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages.length, isSending]);

  /**
   * Substitui `@Display` (literal no textarea) por `[Display](projectId:id)`
   * usando o mapa acumulado de mentions. Itera por display de tamanho
   * decrescente para evitar prefix collision (ex: "Foo" matchar antes de
   * "Foo Bar").
   */
  function serializeMentions(raw: string): string {
    const entries = Array.from(mentionMapRef.current.entries()).sort(
      (a, b) => b[0].length - a[0].length
    );
    let out = raw;
    for (const [display, id] of entries) {
      const escaped = display.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(
        new RegExp(`@${escaped}(?=\\s|$|[.,;!?])`, "g"),
        `[${display}](projectId:${id})`
      );
    }
    return out;
  }

  function handleSend() {
    const content = input.trim();
    if (!content || isSending) return;
    sendMessage(serializeMentions(content));
    setInput("");
    mentionMapRef.current.clear();
  }

  function handleKeyDown(
    e:
      | React.KeyboardEvent<HTMLTextAreaElement>
      | React.KeyboardEvent<HTMLInputElement>
  ) {
    // Enter envia; Shift+Enter quebra linha (padrÃ£o chat).
    // Quando o popover de @mention estÃ¡ aberto, MentionTextarea intercepta
    // Enter/Tab internamente e nem chama este onKeyDown.
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
      {/* â•â• HEADER FIXO â€” logo Nexus sempre visÃ­vel â•â• */}
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
        {/* gradiente aurora atrÃ¡s do header */}
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
              â„¢
            </sup>
          </span>
        </div>

        {/* botÃ£o de limpar conversa â€” canto direito do header */}
        {tab === "pergunta" && messages.length > 0 && (
          <div
            style={{
              position: "absolute",
              right: 20,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 1,
            }}
          >
            <button
              type="button"
              disabled={isClearing || isSending}
              aria-label="Apagar conversa"
              title="Apagar conversa"
              onClick={() => setClearOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 12px",
                borderRadius: 8,
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--muted-foreground)",
                fontSize: 13,
                cursor: isClearing || isSending ? "not-allowed" : "pointer",
                opacity: isClearing || isSending ? 0.5 : 1,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (isClearing || isSending) return;
                e.currentTarget.style.color = "var(--foreground)";
                e.currentTarget.style.borderColor =
                  "var(--muted-foreground)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--muted-foreground)";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              <Trash2 size={14} />
              <span>Nova conversa</span>
            </button>

            <AlertDialog
              open={clearOpen}
              onOpenChange={(v) => !isClearing && setClearOpen(v)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Apagar conversa?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Toda a conversa atual com o Nexus serÃ¡ removida do
                    histÃ³rico. Esta aÃ§Ã£o nÃ£o pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    disabled={isClearing}
                    onClick={() => setClearOpen(false)}
                  >
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    disabled={isClearing}
                    onClick={() => {
                      clearChat();
                      setClearOpen(false);
                    }}
                    style={{
                      background: "#dc2626",
                      color: "#fff",
                    }}
                  >
                    {isClearing ? "Apagando..." : "Apagar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* â•â• ÃREA SCROLLÃVEL â€” mensagens ou conteÃºdo da aba â•â• */}
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
          {/* aba "pergunta" â€” histÃ³rico de mensagens */}
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

              {/* histÃ³rico de mensagens */}
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
                        <MessageContent
                          content={msg.content}
                          variant={msg.role === "user" ? "user" : "assistant"}
                        />
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
                        Nexus estÃ¡ pensando...
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
                  FaÃ§a uma pergunta
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

      {/* â•â• FOOTER FIXO â€” input sempre visÃ­vel â•â• */}
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
                  FaÃ§a uma pergunta
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
                <MentionTextarea
                  value={input}
                  onChange={setInput}
                  onKeyDown={handleKeyDown}
                  disabled={isSending}
                  suggestions={spaceSuggestions}
                  onMentionAdded={(display, id) => {
                    mentionMapRef.current.set(display, id);
                  }}
                  placeholder="Pesquise em seu espaÃ§o de trabalho e na web em segundos. Digite @ para mencionar um projeto."
                />
              </div>

              {/* rodapÃ© do card */}
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
