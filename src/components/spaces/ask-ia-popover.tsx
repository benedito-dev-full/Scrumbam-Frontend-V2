"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SendHorizonal, Sparkles } from "lucide-react";

/**
 * Popover de pergunta rápida para a IA, acionado pelo botão "Pergunte à IA".
 *
 * Abre abaixo do botão com a borda direita alinhada. Ao enviar, redireciona
 * para /ia com a pergunta pré-preenchida via query param `?q=`.
 */
export function AskIAPopover() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const btnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  /* fecha ao clicar fora */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* foca o textarea ao abrir */
  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open]);

  function handleSend() {
    const q = question.trim();
    if (!q) return;
    setOpen(false);
    setQuestion("");
    router.push(`/ia?q=${encodeURIComponent(q)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div style={{ position: "relative" }}>
      {/* botão "Pergunte à IA" */}
      <button
        ref={btnRef}
        type="button"
        aria-label="Pergunte à IA"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          height: 28,
          padding: "0 10px",
          borderRadius: 6,
          border: 0,
          background: open ? "var(--accent)" : "none",
          cursor: "pointer",
          color: open ? "var(--foreground)" : "var(--muted-foreground)",
          fontSize: 12,
          transition: "background 120ms, color 120ms",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--accent)";
          e.currentTarget.style.color = "var(--foreground)";
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.background = "none";
            e.currentTarget.style.color = "var(--muted-foreground)";
          }
        }}
      >
        <span style={{ fontSize: 13 }}>✦</span>
        Pergunte à IA
      </button>

      {/* popover */}
      {open && (
        <div
          ref={popoverRef}
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            width: 320,
            borderRadius: 12,
            background: "var(--card)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            zIndex: 9999,
            overflow: "hidden",
          }}
        >
          {/* cabeçalho */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "12px 14px 8px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <Sparkles size={13} style={{ color: "#7c3aed", flexShrink: 0 }} />
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--foreground)",
              }}
            >
              Pergunte ao Nexus
            </span>
          </div>

          {/* área de input */}
          <div style={{ padding: "10px 14px 8px" }}>
            <textarea
              ref={textareaRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua pergunta aqui…"
              rows={3}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                resize: "none",
                fontSize: 13,
                color: "var(--foreground)",
                lineHeight: 1.6,
              }}
            />
          </div>

          {/* rodapé com botão enviar */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              padding: "6px 14px 12px",
            }}
          >
            <button
              type="button"
              onClick={handleSend}
              disabled={!question.trim()}
              aria-label="Enviar pergunta"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                height: 30,
                padding: "0 14px",
                borderRadius: 7,
                border: "none",
                cursor: question.trim() ? "pointer" : "default",
                background: question.trim() ? "#2563eb" : "var(--accent)",
                color: question.trim() ? "#fff" : "var(--muted-foreground)",
                fontSize: 12,
                fontWeight: 600,
                transition: "background 150ms",
              }}
              onMouseEnter={(e) => {
                if (question.trim())
                  e.currentTarget.style.filter = "brightness(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "none";
              }}
            >
              <SendHorizonal size={13} />
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
