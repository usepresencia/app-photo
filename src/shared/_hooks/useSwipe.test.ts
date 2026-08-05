import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSwipe } from "./useSwipe";
import type { TouchEvent } from "react";

function touchEvent(clientX: number) {
  return { touches: [{ clientX }], changedTouches: [{ clientX }] } as unknown as TouchEvent;
}

describe("useSwipe", () => {
  it("chama onSwipeLeft ao arrastar para a esquerda além do threshold", () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();
    const { result } = renderHook(() => useSwipe({ onSwipeLeft, onSwipeRight }));

    result.current.onTouchStart(touchEvent(200));
    result.current.onTouchEnd(touchEvent(100));

    expect(onSwipeLeft).toHaveBeenCalledOnce();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it("não dispara swipe abaixo do threshold", () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();
    const { result } = renderHook(() => useSwipe({ onSwipeLeft, onSwipeRight, threshold: 45 }));

    result.current.onTouchStart(touchEvent(200));
    result.current.onTouchEnd(touchEvent(180));

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });
});
