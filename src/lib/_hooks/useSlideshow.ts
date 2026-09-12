"use client";

import { useEffect, useState } from "react";

interface UseSlideshowOptions {
  count: number;
  autoplayMs?: number;
}

export function useSlideshow({ count, autoplayMs }: UseSlideshowOptions) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const goTo = (next: number) => {
    if (next < 0 || next >= count || next === index) return;
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  };

  const next = () => goTo(index === count - 1 ? 0 : index + 1);
  const prev = () => goTo(index === 0 ? count - 1 : index - 1);

  useEffect(() => {
    if (!autoplayMs || count <= 1) return;
    const id = setInterval(() => {
      setIndex((prevIndex) => {
        const nextIndex = prevIndex === count - 1 ? 0 : prevIndex + 1;
        setDirection(nextIndex > prevIndex ? 1 : -1);
        return nextIndex;
      });
    }, autoplayMs);
    return () => clearInterval(id);
    // `index` entra nas dependências de propósito, mesmo sem ser lido aqui
    // dentro (o setState usa a forma funcional): é o que reinicia o timer a
    // cada interação manual, replicando o resetTimer() do protótipo original.
  }, [autoplayMs, count, index]);

  return { index, direction, goTo, next, prev };
}
