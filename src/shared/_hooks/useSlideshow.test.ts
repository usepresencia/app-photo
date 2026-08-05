import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSlideshow } from "./useSlideshow";

describe("useSlideshow", () => {
  it("avança para o índice pedido e marca direção 1", () => {
    const { result } = renderHook(() => useSlideshow({ count: 3 }));
    act(() => result.current.goTo(2));
    expect(result.current.index).toBe(2);
    expect(result.current.direction).toBe(1);
  });

  it("ignora índices fora do intervalo [0, count)", () => {
    const { result } = renderHook(() => useSlideshow({ count: 3 }));
    act(() => result.current.goTo(5));
    expect(result.current.index).toBe(0);
  });

  describe("com autoplay", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("avança automaticamente no intervalo configurado", () => {
      const { result } = renderHook(() => useSlideshow({ count: 3, autoplayMs: 1000 }));
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.index).toBe(1);
    });

    it("reinicia o timer de autoplay após um goTo manual", () => {
      const { result } = renderHook(() => useSlideshow({ count: 3, autoplayMs: 1000 }));
      act(() => {
        vi.advanceTimersByTime(600);
        result.current.goTo(2);
      });
      act(() => {
        vi.advanceTimersByTime(600);
      });
      // 600ms desde o goTo (que reinicia o timer) ainda não completa os 1000ms do autoplay
      expect(result.current.index).toBe(2);
    });
  });
});
