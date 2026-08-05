"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Photo } from "@/actions/_mock/types";

const SLOT_COUNT = 4;

/**
 * Mantém `SLOT_COUNT` índices sempre distintos entre si, cada um avançando no
 * seu próprio intervalo (efeito de rotação dessincronizada do filme). Ao
 * avançar, pula qualquer candidato já exibido em outro slot.
 */
function useDistinctRotation(length: number, baseIntervalMs: number) {
  const [slots, setSlots] = useState<number[]>(() =>
    Array.from({ length: SLOT_COUNT }, (_, i) => i % Math.max(length, 1)),
  );

  useEffect(() => {
    if (length <= 1) return;
    const timers = Array.from({ length: SLOT_COUNT }, (_, slot) =>
      setInterval(
        () => {
          setSlots((prev) => {
            const others = new Set(prev.filter((_, i) => i !== slot));
            let next = (prev[slot] + 1) % length;
            while (others.has(next) && others.size < length) {
              next = (next + 1) % length;
            }
            if (next === prev[slot]) return prev;
            const updated = [...prev];
            updated[slot] = next;
            return updated;
          });
        },
        baseIntervalMs + slot * 350,
      ),
    );
    return () => timers.forEach(clearInterval);
  }, [length, baseIntervalMs]);

  return slots;
}

function RotatingPhoto({ photo }: { photo: Photo }) {
  const [current, setCurrent] = useState(photo);
  const [previous, setPrevious] = useState(photo);
  const [flash, setFlash] = useState(false);

  if (photo !== current) {
    setPrevious(current);
    setCurrent(photo);
    setFlash(true);
  }

  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(false), 220);
    return () => clearTimeout(id);
  }, [flash]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {[previous, current].map((p, i) => (
        <div
          key={`${i}-${p.src}`}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${i === 1 ? "opacity-100" : "opacity-0"}`}
        >
          <Image
            src={p.src}
            alt=""
            fill
            sizes="200px"
            aria-hidden="true"
            placeholder="blur"
            blurDataURL={p.blurDataURL}
            className="object-contain"
          />
        </div>
      ))}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 bg-white transition-opacity duration-150 ease-out ${flash ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}

export function HeroFilmStrip({ photos }: { photos: Photo[] }) {
  const slots = useDistinctRotation(photos.length, 4000);

  return (
    <div
      aria-hidden="true"
      className="film-strip pointer-events-none absolute -right-8 top-1/2 w-[44%] -translate-y-1/2 p-1.5 sm:-right-4 sm:-top-10 sm:w-[40%] sm:translate-y-0"
    >
      <div className="flex flex-col gap-1.5">
        {slots.map((photoIndex, i) => (
          <div
            key={i}
            className="hero-strip-fade-in aspect-[3/2] overflow-hidden border border-white/10"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            <RotatingPhoto photo={photos[photoIndex]} />
          </div>
        ))}
      </div>
    </div>
  );
}
