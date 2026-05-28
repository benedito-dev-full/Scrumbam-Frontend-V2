"use client";

import { Fragment } from "react";

/**
 * Renderiza o conteudo de uma mensagem do Nexus convertendo mentions no
 * formato cru `[Display](projectId:id)` em chips visuais `@Display`.
 *
 * O backend continua recebendo/persistindo o formato cru (necessario para
 * contexto da IA). Aqui apenas embelezamos a exibicao para o usuario.
 *
 * Suporta:
 *  - projectId (mention de projeto/space)
 *  - userId    (mention de usuario, caso seja adicionado no futuro)
 *
 * Tudo que nao casar com a regex passa como texto puro.
 */
interface MessageContentProps {
  content: string;
  /** Cor do texto base (herdada do balao). */
  variant?: "user" | "assistant";
}

export function MessageContent({ content, variant = "assistant" }: MessageContentProps) {
  // Regex criada por chamada para nao compartilhar lastIndex entre renders
  const mentionRe = /\[([^\]]+)\]\((projectId|userId):([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mentionRe.exec(content)) !== null) {
    const [full, display, kind] = match;
    const start = match.index;

    if (start > lastIndex) {
      parts.push(
        <Fragment key={`t-${lastIndex}`}>
          {content.slice(lastIndex, start)}
        </Fragment>,
      );
    }

    parts.push(
      <span
        key={`m-${start}`}
        data-mention-kind={kind}
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "1px 7px",
          borderRadius: 6,
          fontSize: "0.92em",
          fontWeight: 500,
          background:
            variant === "user"
              ? "rgba(255,255,255,0.18)"
              : "rgba(37,99,235,0.18)",
          color: variant === "user" ? "#fff" : "#60a5fa",
          whiteSpace: "nowrap",
        }}
      >
        @{display}
      </span>,
    );

    lastIndex = start + full.length;
  }

  if (lastIndex < content.length) {
    parts.push(
      <Fragment key={`t-${lastIndex}`}>{content.slice(lastIndex)}</Fragment>,
    );
  }

  // Fast path: sem mentions, evita criar wrapper
  if (parts.length === 0) return <>{content}</>;

  return <>{parts}</>;
}
