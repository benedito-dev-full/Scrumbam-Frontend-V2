"use client";

import { Fragment } from "react";

/**
 * Renderiza o conteudo de uma mensagem do Nexus aplicando markdown inline
 * leve e convertendo mentions no formato cru `[Display](projectId:id)` em
 * chips visuais `@Display`.
 *
 * O backend continua recebendo/persistindo o formato cru (necessario para
 * contexto da IA). Aqui apenas embelezamos a exibicao para o usuario.
 *
 * Markdown suportado (subset que a IA realmente emite):
 *  - `**negrito**`  -> <strong>
 *  - `*italico*`    -> <em>
 *  - `` `codigo` `` -> <code>
 *  - linhas iniciadas por `* ` ou `- ` -> bullet `•`
 *
 * Mentions suportadas:
 *  - projectId (mention de projeto/space)
 *  - userId    (mention de usuario, caso seja adicionado no futuro)
 *
 * O balao usa `white-space: pre-wrap`, entao quebras de linha e a estrutura
 * de lista sao preservadas pelo container — aqui so tratamos o inline.
 *
 * Tudo que nao casar com a regex passa como texto puro.
 */
interface MessageContentProps {
  content: string;
  /** Cor do texto base (herdada do balao). */
  variant?: "user" | "assistant";
}

/**
 * Aplica markdown inline (negrito, italico, codigo) a um trecho de texto puro.
 * Recebe um prefixo de key para garantir chaves estaveis entre segmentos.
 */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // Ordem importa: `**` antes de `*` para nao quebrar negrito em italico.
  const inlineRe = /\*\*([^*]+?)\*\*|`([^`]+?)`|\*([^*\n]+?)\*/g;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;

  while ((m = inlineRe.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(
        <Fragment key={`${keyPrefix}-t${i}`}>{text.slice(last, m.index)}</Fragment>,
      );
    }

    if (m[1] !== undefined) {
      nodes.push(
        <strong key={`${keyPrefix}-b${i}`} style={{ fontWeight: 600 }}>
          {m[1]}
        </strong>,
      );
    } else if (m[2] !== undefined) {
      nodes.push(
        <code
          key={`${keyPrefix}-c${i}`}
          style={{
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: "0.88em",
            padding: "1px 5px",
            borderRadius: 5,
            background: "rgba(127,127,127,0.18)",
          }}
        >
          {m[2]}
        </code>,
      );
    } else if (m[3] !== undefined) {
      nodes.push(<em key={`${keyPrefix}-i${i}`}>{m[3]}</em>);
    }

    last = m.index + m[0].length;
    i++;
  }

  if (last < text.length) {
    nodes.push(<Fragment key={`${keyPrefix}-t${i}`}>{text.slice(last)}</Fragment>);
  }

  return nodes;
}

export function MessageContent({ content, variant = "assistant" }: MessageContentProps) {
  // Converte bullets de inicio de linha (`* ` / `- `) em `•`, sem afetar
  // `**negrito**` (exige espaco depois do marcador) nem `*` no meio da linha.
  const normalized = content.replace(/^[ \t]*[*-][ \t]+/gm, "• ");

  // Regex criada por chamada para nao compartilhar lastIndex entre renders
  const mentionRe = /\[([^\]]+)\]\((projectId|userId):([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mentionRe.exec(normalized)) !== null) {
    const [full, display, kind] = match;
    const start = match.index;

    if (start > lastIndex) {
      parts.push(...renderInline(normalized.slice(lastIndex, start), `s-${lastIndex}`));
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

  if (lastIndex < normalized.length) {
    parts.push(...renderInline(normalized.slice(lastIndex), `s-${lastIndex}`));
  }

  return <>{parts}</>;
}
