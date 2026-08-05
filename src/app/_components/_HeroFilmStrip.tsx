"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSlideshow } from "@/shared/_hooks/useSlideshow";
import type { Photo } from "@/actions/_mock/types";

function RotatingPhoto({
  photos,
  offset,
  intervalMs,
}: {
  photos: Photo[];
  offset: number;
  intervalMs: number;
}) {
  const { index } = useSlideshow({ count: photos.length, autoplayMs: intervalMs });
  const current = (index + offset) % photos.length;
  const previous = (index - 1 + offset + photos.length) % photos.length;
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    setFlash(true);
    const id = setTimeout(() => setFlash(false), 220);
    return () => clearTimeout(id);
  }, [index]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {[previous, current].map((photoIndex, i) => (
        <Image
          key={photoIndex}
          src={photos[photoIndex].src}
          alt=""
          fill
          sizes="200px"
          placeholder="blur"
          blurDataURL={photos[photoIndex].blurDataURL}
          className={`object-cover transition-opacity duration-700 ease-in-out ${i === 1 ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 bg-white transition-opacity duration-150 ease-out ${flash ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}

export function HeroFilmStrip({ photos }: { photos: Photo[] }) {
  return (
    <div
      aria-hidden="true"
      className="film-strip pointer-events-none absolute -right-4 -top-10 bottom-[-3rem] w-[44%] p-1.5 sm:w-[40%]"
    >
      <div className="flex h-full flex-col gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="hero-strip-fade-in min-h-0 flex-1 overflow-hidden border border-white/10"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            <RotatingPhoto photos={photos} offset={i} intervalMs={4000 + i * 350} />
          </div>
        ))}
      </div>
    </div>
  );
}
