"use client";

import { useCallback, useRef, useState } from "react";

import { addDays } from "date-fns";

import type { PlannerView } from "@/lib/types/planner-event";

import { stepDate } from "../_lib/date";

/** Largura minima (px) de arrasto para acionar navegacao de 1 periodo. */
const SNAP_THRESHOLD = 80;

/** Pixels por dia no modo Semana (usado para calcular quantos dias passar). */
const PX_PER_DAY_WEEK = 120;

/** Pixels por dia no modo Dia (limiar menor — scroll de 1 dia). */
const PX_PER_DAY_DAY = 120;

interface UseDragNavigationOptions {
  view: PlannerView;
  cursorDate: Date;
  onCursorChange: (date: Date) => void;
}

interface UseDragNavigationResult {
  /** Offset horizontal atual (px) — aplicar via `transform: translateX`. */
  dragOffset: number;
  /** Bind nos eventos de pointer do container. */
  pointerHandlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
  };
  /** True enquanto o usuario esta arrastando (para desabilitar clicks acidentais). */
  isDragging: boolean;
}

/**
 * Controla navegacao de periodo via drag horizontal (swipe/arrasto).
 *
 * No modo Semana, cada `PX_PER_DAY_WEEK` pixels equivale a 1 dia.
 * No modo Dia, cada `PX_PER_DAY_DAY` pixels equivale a 1 dia.
 * Ao soltar, calcula quantos dias passar e chama `onCursorChange`.
 * Se o arrasto for menor que `SNAP_THRESHOLD`, cancela sem navegar.
 */
export function useDragNavigation({
  view,
  cursorDate,
  onCursorChange,
}: UseDragNavigationOptions): UseDragNavigationResult {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startXRef = useRef<number | null>(null);
  const currentOffsetRef = useRef(0);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Apenas arrasto com dedo ou botao esquerdo do mouse
    if (e.button !== 0 && e.pointerType === "mouse") return;
    // Nao interceptar se o alvo e um botao/input/link
    const tag = (e.target as HTMLElement).closest("button, a, input, [role='button']");
    if (tag) return;

    startXRef.current = e.clientX;
    currentOffsetRef.current = 0;
    setIsDragging(false);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (startXRef.current === null) return;

    const delta = e.clientX - startXRef.current;

    // So ativa o modo "arrastando" apos 5px para nao conflitar com clicks
    if (!isDragging && Math.abs(delta) < 5) return;

    if (!isDragging) setIsDragging(true);

    // Resistencia elastica: reduz o offset nas bordas para dar feedback de limite
    const resistance = 0.45;
    const offset = delta * resistance;

    currentOffsetRef.current = offset;
    setDragOffset(offset);
  }, [isDragging]);

  const commit = useCallback((e: React.PointerEvent) => {
    if (startXRef.current === null) return;

    const totalDelta = e.clientX - startXRef.current;
    startXRef.current = null;

    setDragOffset(0);
    setIsDragging(false);
    currentOffsetRef.current = 0;

    if (Math.abs(totalDelta) < SNAP_THRESHOLD) return;

    const pxPerDay = view === "day" ? PX_PER_DAY_DAY : PX_PER_DAY_WEEK;
    // Calcula quantos dias navegar (minimo 1)
    const days = Math.max(1, Math.round(Math.abs(totalDelta) / pxPerDay));
    const dir = totalDelta < 0 ? 1 : -1;

    if (view === "day" || view === "week") {
      onCursorChange(addDays(cursorDate, days * dir));
    } else {
      // Modo mes: navega 1 periodo (mes) independente da distancia
      onCursorChange(stepDate(view, cursorDate, dir as 1 | -1));
    }
  }, [view, cursorDate, onCursorChange]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    commit(e);
  }, [commit]);

  const onPointerCancel = useCallback((e: React.PointerEvent) => {
    startXRef.current = null;
    setDragOffset(0);
    setIsDragging(false);
  }, []);

  return {
    dragOffset,
    isDragging,
    pointerHandlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  };
}
