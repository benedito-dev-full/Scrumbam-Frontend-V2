"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { addDays, addMonths, addWeeks } from "date-fns";

import type { PlannerView } from "@/lib/types/planner-event";

/** Fracao da largura do container que precisa ser arrastada para acionar snap. */
const SNAP_RATIO = 0.25;

/** Resistencia elastica durante o drag (1 = sem resistencia, 0 = sem movimento). */
const DRAG_RESISTANCE = 0.5;

/** Duracao da animacao de snap em ms — valor alto para o spring ser perceptivel. */
const SNAP_DURATION_MS = 1950;

/**
 * Spring easing: dispara em velocidade maxima e desacelera
 * progressivamente, como uma mola amortecida parando no lugar.
 * Quanto maior SNAP_DURATION_MS, mais suave e visivel o efeito.
 */
const SNAP_EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

export type SlideOffset = -1 | 0 | 1;

interface UseDragNavigationResult {
  /** Data dos 3 slides: [-1] prev, [0] current, [1] next */
  slideDates: Record<SlideOffset, Date>;
  /** Offset horizontal atual do trilho (px, inclui posicao base + drag). */
  railOffset: number;
  /** Se true, a animacao de snap esta rodando. */
  isSnapping: boolean;
  /** Easing CSS a aplicar na transition durante snap. */
  snapEasing: string;
  /** Duracao da animacao de snap em ms. */
  snapDuration: number;
  /** Se true, o usuario esta arrastando (cursor grabbing). */
  isDragging: boolean;
  /** Largura do container (px) — necessaria para posicionar os slides. */
  containerWidth: number;
  /** Ref para o container — necessaria para medir a largura. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Bind nos eventos de pointer do container. */
  pointerHandlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
  };
}

/**
 * Calcula a data do slide adjacente com base na view ativa.
 * - Dia: +/- 1 dia
 * - Semana: +/- 1 semana
 * - Mes: +/- 1 mes
 */
function shiftDate(view: PlannerView, base: Date, dir: 1 | -1): Date {
  if (view === "day") return addDays(base, dir);
  if (view === "week") return addWeeks(base, dir);
  return addMonths(base, dir);
}

/**
 * Gerencia o carrossel de 3 slides para navegacao fluida por drag horizontal.
 *
 * Mantem sempre 3 periodos pre-renderizados (anterior, atual, proximo).
 * Ao arrastar, o trilho inteiro se move. Ao soltar alem do limiar, faz snap
 * para o slide adjacente e recalcula os 3 periodos. Janela deslizante —
 * sem acumulo de slides.
 */
export function useDragNavigation(
  view: PlannerView,
  cursorDate: Date,
  onCursorChange: (date: Date) => void,
): UseDragNavigationResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Offset base do trilho sem drag (0 = slide atual centralizado)
  const baseOffsetRef = useRef(0);
  // Offset total incluindo drag
  const [railOffset, setRailOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);

  const startXRef = useRef<number | null>(null);
  const dragActiveRef = useRef(false);

  // Mede o container e atualiza em resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    setContainerWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  // Datas dos 3 slides
  const slideDates: Record<SlideOffset, Date> = {
    [-1]: shiftDate(view, cursorDate, -1),
    [0]: cursorDate,
    [1]: shiftDate(view, cursorDate, 1),
  };

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const tag = (e.target as HTMLElement).closest("button, a, input, [role='button']");
    if (tag) return;

    startXRef.current = e.clientX;
    dragActiveRef.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (startXRef.current === null) return;

      const delta = e.clientX - startXRef.current;

      if (!dragActiveRef.current && Math.abs(delta) < 5) return;
      if (!dragActiveRef.current) {
        dragActiveRef.current = true;
        setIsDragging(true);
      }

      const offset = baseOffsetRef.current + delta * DRAG_RESISTANCE;
      setRailOffset(offset);
    },
    [],
  );

  const commit = useCallback(
    (e: React.PointerEvent) => {
      if (startXRef.current === null) return;

      const totalDelta = e.clientX - startXRef.current;
      startXRef.current = null;
      dragActiveRef.current = false;
      setIsDragging(false);

      const w = containerRef.current?.getBoundingClientRect().width ?? containerWidth;
      const threshold = w * SNAP_RATIO;

      if (Math.abs(totalDelta) < threshold) {
        setIsSnapping(true);
        setRailOffset(baseOffsetRef.current);
        setTimeout(() => setIsSnapping(false), SNAP_DURATION_MS);
        return;
      }

      const dir = totalDelta < 0 ? 1 : -1;
      const newDate = shiftDate(view, cursorDate, dir as 1 | -1);

      const snapTarget = baseOffsetRef.current + dir * -1 * w;
      setIsSnapping(true);
      setRailOffset(snapTarget);

      setTimeout(() => {
        baseOffsetRef.current = 0;
        setRailOffset(0);
        setIsSnapping(false);
        onCursorChange(newDate);
      }, SNAP_DURATION_MS);
    },
    [view, cursorDate, containerWidth, onCursorChange],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      commit(e);
    },
    [commit],
  );

  const onPointerCancel = useCallback(() => {
    startXRef.current = null;
    dragActiveRef.current = false;
    setIsDragging(false);
    setIsSnapping(true);
    setRailOffset(baseOffsetRef.current);
    setTimeout(() => setIsSnapping(false), SNAP_DURATION_MS);
  }, []);

  return {
    slideDates,
    railOffset,
    isSnapping,
    snapEasing: SNAP_EASING,
    snapDuration: SNAP_DURATION_MS,
    isDragging,
    containerWidth,
    containerRef,
    pointerHandlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  };
}
