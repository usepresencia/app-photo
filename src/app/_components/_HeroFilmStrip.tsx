"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Photo } from "@/actions/_mock/types";
import { Editable } from "./Editable";

const SLOT_COUNT = 4;
/** Ritmo da troca. A defasagem evita que os quatro quadros virem em bloco. */
const INTERVALO_MS = 2600;
const DEFASAGEM_MS = 250;

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
        baseIntervalMs + slot * DEFASAGEM_MS,
      ),
    );
    return () => timers.forEach(clearInterval);
  }, [length, baseIntervalMs]);

  return slots;
}

function Quadro({ photo, className = "" }: { photo: Photo; className?: string }) {
  return (
    <div className={`absolute inset-0 ${className}`}>
      <Image
        src={photo.src}
        alt=""
        fill
        sizes="200px"
        aria-hidden="true"
        placeholder="blur"
        blurDataURL={photo.blurDataURL}
        className="object-contain"
      />
    </div>
  );
}

function RotatingPhoto({ photo }: { photo: Photo }) {
  const [current, setCurrent] = useState(photo);
  const [previous, setPrevious] = useState<Photo | null>(null);
  const [troca, setTroca] = useState(0);

  if (photo !== current) {
    setPrevious(current);
    setCurrent(photo);
    setTroca((t) => t + 1);
  }

  // Dissolve e flash são remontados juntos pela mesma troca, então as duas
  // animações começam no mesmo quadro e terminam juntas — a sincronia não
  // depende de nenhum timer em JS.
  return (
    <div className="relative h-full w-full overflow-hidden">
      {previous && <Quadro photo={previous} />}
      <Editable type="placement" id={current.placementId} className="absolute inset-0">
        <Quadro key={`foto-${troca}`} photo={current} className="hero-photo-in" />
      </Editable>
      {troca > 0 && (
        <div
          key={`flash-${troca}`}
          aria-hidden="true"
          className="hero-flash pointer-events-none absolute inset-0 bg-white"
        />
      )}
    </div>
  );
}

export function HeroFilmStrip({ photos }: { photos: Photo[] }) {
  const slots = useDistinctRotation(photos.length, INTERVALO_MS);

  return (
    <div
      aria-hidden="true"
      className="film-strip pointer-events-none absolute -right-8 top-1/2 w-[44%] -translate-y-1/2 p-1.5 sm:-right-4 sm:-top-10 sm:w-[40%] sm:translate-y-0"
    >
      <div className="flex flex-col gap-1.5">
        {slots.map((photoIndex, i) => (
          <div
            key={i}
            className="hero-strip-fade-in aspect-3/2 overflow-hidden border border-white/10"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            <RotatingPhoto photo={photos[photoIndex]} />
          </div>
        ))}
      </div>
    </div>
  );
}
