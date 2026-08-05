"use client";

import { useRef } from "react";
import type { PointerEvent, TouchEvent } from "react";

interface UseSwipeOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  threshold?: number;
}

export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 45 }: UseSwipeOptions) {
  const startX = useRef<number | null>(null);

  const onStart = (x: number) => {
    startX.current = x;
  };

  const onEnd = (x: number) => {
    if (startX.current === null) return;
    const dx = x - startX.current;
    startX.current = null;
    if (Math.abs(dx) < threshold) return;
    if (dx < 0) onSwipeLeft();
    else onSwipeRight();
  };

  return {
    onTouchStart: (e: TouchEvent) => onStart(e.touches[0].clientX),
    onTouchEnd: (e: TouchEvent) => onEnd(e.changedTouches[0].clientX),
    onPointerDown: (e: PointerEvent) => e.pointerType === "mouse" && onStart(e.clientX),
    onPointerUp: (e: PointerEvent) => e.pointerType === "mouse" && onEnd(e.clientX),
  };
}
