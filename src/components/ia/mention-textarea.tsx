"use client";

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";

export interface MentionSuggestion {
  id: string;
  display: string;
}

interface MentionTextareaProps {
  value: string;
  onChange: (v: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  suggestions: MentionSuggestion[];
  placeholder?: string;
  disabled?: boolean;
  /**
   * Notifica o parent quando uma nova mention e inserida (acumulativo).
   * Mapeia display lowercase -> id, para uso em serializacao posterior.
   */
  onMentionAdded?: (display: string, id: string) => void;
  maxHeight?: number;
}

/**
 * Propriedades CSS replicadas do textarea para o div-espelho usado em
 * `getCaretCoordinates` (calcula posicao do caret em pixels).
 */
const MIRROR_PROPS = [
  "boxSizing",
  "width",
  "height",
  "overflowX",
  "overflowY",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderStyle",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontStretch",
  "fontSize",
  "fontSizeAdjust",
  "lineHeight",
  "fontFamily",
  "textAlign",
  "textTransform",
  "textIndent",
  "textDecoration",
  "letterSpacing",
  "wordSpacing",
  "tabSize",
  "whiteSpace",
  "wordBreak",
  "wordWrap",
] as const;

/**
 * Mede a posicao do caret em coordenadas relativas ao textarea, usando um
 * div-espelho temporario com as mesmas metricas tipograficas. Tecnica padrao
 * para autocomplete inline em textareas (sem dependencia externa).
 */
function getCaretCoordinates(
  el: HTMLTextAreaElement,
  position: number
): { top: number; left: number; height: number } {
  const div = document.createElement("div");
  document.body.appendChild(div);
  const style = div.style;
  const computed = window.getComputedStyle(el);
  style.position = "absolute";
  style.visibility = "hidden";
  style.whiteSpace = "pre-wrap";
  style.wordWrap = "break-word";
  for (const prop of MIRROR_PROPS) {
    (style as unknown as Record<string, string>)[prop] = computed[prop];
  }
  div.textContent = el.value.substring(0, position);
  const span = document.createElement("span");
  span.textContent = el.value.substring(position) || ".";
  div.appendChild(span);
  const lineHeight = parseInt(computed.lineHeight) || 18;
  const coords = {
    top: span.offsetTop + (parseInt(computed.borderTopWidth) || 0),
    left: span.offsetLeft + (parseInt(computed.borderLeftWidth) || 0),
    height: lineHeight,
  };
  document.body.removeChild(div);
  return coords;
}

/**
 * Textarea com autocomplete inline para @mention.
 *
 * Substitui react-mentions: usa textarea nativo + popover absolutamente
 * posicionado no caret. Suporta navegacao Up/Down/Enter/Tab/Escape e
 * filtragem por substring (case-insensitive).
 *
 * O valor visivel armazena `@Display` literal — a serializacao final para
 * o backend (`[Display](projectId:id)`) e responsabilidade do parent,
 * usando o mapa de mentions acumulado via `onMentionAdded`.
 */
export function MentionTextarea({
  value,
  onChange,
  onKeyDown,
  suggestions,
  placeholder,
  disabled,
  onMentionAdded,
  maxHeight = 200,
}: MentionTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [caret, setCaret] = useState({ top: 0, left: 0, height: 18 });
  const [mentionStart, setMentionStart] = useState(0);
  const [highlightRaw, setHighlight] = useState(0);

  const filtered = useMemo(() => {
    if (!query) return suggestions.slice(0, 8);
    const q = query.toLowerCase();
    return suggestions
      .filter((s) => s.display.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, suggestions]);

  // clamp para evitar highlight fora dos limites quando filtered encolhe
  const highlight = filtered.length === 0 ? 0 : highlightRaw % filtered.length;

  // Auto-grow do textarea ate maxHeight
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [value, maxHeight]);

  const detectMention = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const pos = el.selectionStart;
    const text = el.value.substring(0, pos);
    // captura @ no inicio do input ou apos espaco/quebra, ate o caret
    const m = text.match(/(?:^|\s)@([\wÀ-ſ-]*)$/);
    if (m) {
      const start = pos - m[1].length - 1;
      setMentionStart(start);
      setQuery(m[1]);
      const coords = getCaretCoordinates(el, start);
      setCaret(coords);
      setOpen(true);
      setHighlight(0);
    } else {
      setOpen(false);
    }
  }, []);

  const insertMention = useCallback(
    (s: MentionSuggestion) => {
      const el = ref.current;
      if (!el) return;
      const before = value.substring(0, mentionStart);
      const after = value.substring(el.selectionStart);
      const inserted = `@${s.display} `;
      const newValue = before + inserted + after;
      onChange(newValue);
      onMentionAdded?.(s.display, s.id);
      setOpen(false);
      const newPos = before.length + inserted.length;
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(newPos, newPos);
      });
    },
    [value, mentionStart, onChange, onMentionAdded]
  );

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    requestAnimationFrame(detectMention);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (open && filtered.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => (h + 1) % filtered.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => (h - 1 + filtered.length) % filtered.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filtered[highlight]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
    }
    onKeyDown?.(e);
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={detectMention}
        onKeyUp={(e) => {
          // setas/home/end movem caret sem disparar onChange
          if (
            e.key === "ArrowLeft" ||
            e.key === "ArrowRight" ||
            e.key === "Home" ||
            e.key === "End"
          ) {
            detectMention();
          }
        }}
        onBlur={() => {
          // delay para nao fechar antes do onMouseDown do item
          setTimeout(() => setOpen(false), 150);
        }}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          outline: "none",
          resize: "none",
          color: "var(--foreground)",
          fontSize: 14,
          lineHeight: 1.65,
          fontFamily: "inherit",
          minHeight: 24,
          maxHeight,
          overflowY: "auto",
        }}
      />
      {open && filtered.length > 0 && (
        <div
          role="listbox"
          aria-label="Projetos disponiveis"
          style={{
            position: "absolute",
            top: caret.top + caret.height + 6,
            left: caret.left,
            zIndex: 1000,
            minWidth: 240,
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
            overflow: "hidden",
            padding: 4,
          }}
        >
          {filtered.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(s);
              }}
              onMouseEnter={() => setHighlight(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "7px 10px",
                background: i === highlight ? "var(--accent)" : "transparent",
                color: "inherit",
                border: "none",
                borderRadius: 6,
                fontSize: 13,
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.08s",
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: "rgba(37,99,235,0.18)",
                  color: "#60a5fa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  flexShrink: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                {s.display
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>{s.display}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
