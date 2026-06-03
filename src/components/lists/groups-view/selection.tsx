"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowRight,
  Copy,
  CornerDownRight,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Popover } from "./cells";

/* ─── Contexto de selecao (checkbox → barra de acoes flutuante) ───────────── */

/**
 * Estado de selecao de tarefas via checkbox, consumido pelos checkboxes das
 * linhas (pai e subtarefa) e pelo header de grupo ("selecionar tudo"). Quando
 * `null`, os checkboxes ficam decorativos.
 */
export interface SelectionContextValue {
  /** IDs atualmente selecionados. */
  selectedIds: Set<string>;
  /** Marca/desmarca uma task individual. */
  toggle: (id: string, next: boolean) => void;
  /** Marca/desmarca um conjunto de tasks de uma vez (header do grupo). */
  toggleMany: (ids: string[], next: boolean) => void;
}

export const SelectionContext = createContext<SelectionContextValue | null>(null);

/** Hook interno — retorna o contexto de selecao ou null (modo decorativo). */
export function useSelection(): SelectionContextValue | null {
  return useContext(SelectionContext);
}

/** Alvo de movimentacao (bloco ou mae) — id + nome para o popover do Mover. */
export interface MoveTarget {
  id: string;
  nome: string;
}

/** Vermelho da acao destrutiva (Excluir). */
export const DANGER_COLOR = "#ef4444";

/**
 * Botao de acao da barra de selecao. Empilha icone + rotulo (estilo Monday).
 *
 * @param disabled - Atenua e bloqueia (acoes decorativas ou em andamento).
 * @param danger - Acao destrutiva (Excluir): no hover, icone+texto ficam
 *   vermelhos e o fundo ganha um tom rosado. Em repouso fica neutro como as
 *   demais.
 * @param btnRef - Ref do botao (usado para ancorar o popover do "Mover").
 */
export function ActionBtn({
  icon,
  label,
  onClick,
  disabled,
  danger,
  btnRef,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  btnRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  const baseColor = disabled ? "var(--muted-foreground)" : "var(--foreground)";
  return (
    <button
      ref={btnRef}
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        minWidth: 58,
        padding: "4px 8px",
        borderRadius: 8,
        border: 0,
        background: "none",
        color: baseColor,
        fontSize: 11,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "background .1s, color .1s",
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (danger) {
          // Acao destrutiva: vermelho no hover (icone+texto via color, herdado
          // pelo currentColor do lucide) + fundo rosado.
          e.currentTarget.style.color = DANGER_COLOR;
          e.currentTarget.style.background = "rgba(239,68,68,0.12)";
        } else {
          e.currentTarget.style.background = "var(--accent)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "none";
        e.currentTarget.style.color = baseColor;
      }}
    >
      {icon}
      {label}
    </button>
  );
}

/**
 * Lista de destinos do "Mover" dentro do popover.
 * - `kind="maes"`: lista os blocos (+ "Sem bloco") → onPickBlock.
 * - `kind="filhas"`: lista as maes possiveis → onPickParent.
 *
 * Quando a lista de destinos esta vazia, mostra um aviso (ex: nao ha outra
 * mae para receber as filhas).
 */
export function MoveTargetList({
  kind,
  blockTargets,
  parentTargets,
  onPickBlock,
  onPickParent,
}: {
  kind: "maes" | "filhas";
  blockTargets: MoveTarget[];
  parentTargets: MoveTarget[];
  onPickBlock: (blockId: string | null) => void;
  onPickParent: (parentId: string) => void;
}) {
  const itemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "8px 10px",
    borderRadius: 5,
    border: 0,
    background: "none",
    color: "var(--foreground)",
    fontSize: 13,
    cursor: "pointer",
    textAlign: "left",
  };
  const header: React.CSSProperties = {
    margin: "0 0 4px",
    padding: "0 4px",
    fontSize: 10,
    letterSpacing: ".5px",
    textTransform: "uppercase",
    color: "var(--muted-foreground)",
  };

  return (
    <div
      style={{ padding: 6, minWidth: 220, maxHeight: 320, overflowY: "auto" }}
    >
      {kind === "maes" ? (
        <>
          <p style={header}>Mover para bloco</p>
          {blockTargets.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => onPickBlock(b.id)}
              style={itemStyle}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--accent)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              {b.nome}
            </button>
          ))}
          {/* Desvincular → "Sem bloco" */}
          <button
            type="button"
            onClick={() => onPickBlock(null)}
            style={{ ...itemStyle, color: "var(--muted-foreground)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--accent)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            Sem bloco
          </button>
        </>
      ) : (
        <>
          <p style={header}>Mover para tarefa-mãe</p>
          {parentTargets.length === 0 ? (
            <div
              style={{
                padding: "8px 10px",
                fontSize: 12,
                color: "var(--muted-foreground)",
              }}
            >
              Nenhuma outra tarefa-mãe disponível.
            </div>
          ) : (
            parentTargets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPickParent(p.id)}
                style={itemStyle}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--accent)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "none")
                }
              >
                {p.nome}
              </button>
            ))
          )}
        </>
      )}
    </div>
  );
}

/**
 * Barra de acoes flutuante (estilo Monday) que surge no rodape quando ha
 * tarefas selecionadas via checkbox. Mostra o contador + acoes. Nesta versao
 * **Duplicar**, **Excluir** e **Mover** sao funcionais; as demais (Exportar,
 * Converter, Sidekick) sao decorativas. O botao X (e o ESC) limpam a selecao.
 *
 * Quando `count === 0` nao renderiza nada.
 *
 * @param count         - Numero de tarefas selecionadas (mostrado no badge).
 * @param onClose       - Limpa a selecao (X / ESC).
 * @param onDelete      - Exclui as tarefas selecionadas (acao funcional).
 * @param deleting      - Enquanto true, desabilita o Excluir.
 * @param onDuplicate   - Duplica as tarefas selecionadas (acao funcional).
 * @param duplicating   - Enquanto true, desabilita o Duplicar.
 * @param moveKind      - Tipo da selecao p/ o Mover: "maes" (→ blocos),
 *   "filhas" (→ maes), "mista"/"vazia" (Mover desabilitado).
 * @param blockTargets  - Blocos destino (quando moveKind="maes").
 * @param parentTargets - Maes destino (quando moveKind="filhas").
 * @param onMoveToBlock - Move maes para um bloco (null = "Sem bloco").
 * @param onMoveToParent- Move filhas para outra mae.
 */
export function SelectionActionBar({
  count,
  onClose,
  onDelete,
  deleting,
  onDuplicate,
  duplicating,
  moveKind,
  blockTargets,
  parentTargets,
  onMoveToBlock,
  onMoveToParent,
}: {
  count: number;
  onClose: () => void;
  onDelete: () => void;
  deleting: boolean;
  onDuplicate: () => void;
  duplicating: boolean;
  moveKind: "maes" | "filhas" | "mista" | "vazia";
  blockTargets: MoveTarget[];
  parentTargets: MoveTarget[];
  onMoveToBlock: (blockId: string | null) => void;
  onMoveToParent: (parentId: string) => void;
}) {
  // Ref do botao Mover + estado do popover de destinos.
  const moveBtnRef = useRef<HTMLButtonElement>(null);
  const [moveOpen, setMoveOpen] = useState(false);
  // Mover so e permitido com selecao homogenea (so maes OU so filhas).
  const canMove = moveKind === "maes" || moveKind === "filhas";
  // ESC limpa a selecao (atalho padrao). Registrado so quando a barra existe.
  useEffect(() => {
    if (count === 0) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, onClose]);

  if (count === 0 || typeof document === "undefined") return null;

  return (
    <div
      role="toolbar"
      aria-label="Acoes da selecao"
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        // Estado final do transform — o keyframe `groups-action-bar-in` anima
        // de translate(-50%,16px)+opacity:0 ate este estado (slide de baixo pra
        // cima + fade-in). `both` mantem o frame inicial antes de comecar.
        transform: "translate(-50%, 0)",
        animation: "groups-action-bar-in .4s cubic-bezier(.16,1,.3,1) both",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "10px 12px",
        borderRadius: 12,
        background: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "0 12px 40px rgba(0,0,0,.5)",
      }}
    >
      {/* Badge contador + rotulo */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 26,
          height: 26,
          padding: "0 6px",
          borderRadius: "50%",
          background: "#7c5cff",
          color: "#fff",
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        {count}
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--foreground)",
          padding: "0 10px 0 4px",
          whiteSpace: "nowrap",
        }}
      >
        {count === 1 ? "Tarefa Selecionada" : "Tarefas Selecionadas"}
      </span>

      <ActionBtn
        icon={<Copy size={16} />}
        label="Duplicar"
        onClick={onDuplicate}
        disabled={duplicating}
      />
      <ActionBtn icon={<Upload size={16} />} label="Exportar" disabled />
      <ActionBtn
        icon={<Trash2 size={16} />}
        label="Excluir"
        onClick={onDelete}
        disabled={deleting}
        danger
      />
      <ActionBtn icon={<CornerDownRight size={16} />} label="Converter" />
      <ActionBtn
        btnRef={moveBtnRef}
        icon={<ArrowRight size={16} />}
        label="Mover"
        disabled={!canMove}
        onClick={() => setMoveOpen((v) => !v)}
      />
      {moveOpen && canMove && (
        <Popover
          anchorRef={moveBtnRef}
          onClose={() => setMoveOpen(false)}
          placement="top"
        >
          <MoveTargetList
            kind={moveKind}
            blockTargets={blockTargets}
            parentTargets={parentTargets}
            onPickBlock={(blockId) => {
              onMoveToBlock(blockId);
              setMoveOpen(false);
            }}
            onPickParent={(parentId) => {
              onMoveToParent(parentId);
              setMoveOpen(false);
            }}
          />
        </Popover>
      )}
      <ActionBtn icon={<Sparkles size={16} />} label="Sidekick" />

      {/* Divisor + fechar */}
      <span
        style={{
          width: 1,
          height: 28,
          background: "var(--border)",
          margin: "0 4px",
        }}
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Limpar selecao"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 30,
          height: 30,
          borderRadius: 8,
          border: 0,
          background: "none",
          color: "var(--muted-foreground)",
          cursor: "pointer",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--accent)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
      >
        <X size={18} />
      </button>
    </div>
  );
}
