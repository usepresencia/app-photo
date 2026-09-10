"use client";

import { useState } from "react";
import Image from "next/image";
import { Section } from "@/lib/_components/Section";
import { useSwipe } from "@/lib/_hooks/useSwipe";
import { useSlideshow } from "@/lib/_hooks/useSlideshow";
import type { LabeledPhoto } from "@/actions/_shared/getPhotosBySurface";
import { Addable } from "./Addable";
import { Editable } from "./Editable";

const AUTOPLAY_MS = 6000;

const spreadPoses = [
  "col-span-8 col-start-1 aspect-4/5 -rotate-[3deg] z-10",
  "col-span-7 col-start-6 -mt-52 aspect-4/3 rotate-[3.5deg] z-30",
  "col-span-7 col-start-1 -mt-28 aspect-5/4 rotate-[1.5deg] z-20",
  "col-span-7 col-start-6 -mt-36 aspect-3/4 -rotate-[2.5deg] z-40",
  "col-span-6 col-start-1 -mt-40 aspect-square rotate-[4deg] z-30",
  "col-span-9 col-start-3 -mt-36 aspect-4/5 -rotate-[2deg] z-50",
];

function GalleryAlbum({ photos }: { photos: LabeledPhoto[] }) {
  const spreads: LabeledPhoto[][] = [];
  for (let i = 0; i < photos.length; i += 6) spreads.push(photos.slice(i, i + 6));

  const [isHovered, setIsHovered] = useState(false);
  const {
    index: page,
    direction: dir,
    goTo,
  } = useSlideshow({ count: spreads.length, autoplayMs: isHovered ? undefined : AUTOPLAY_MS });
  const swipeHandlers = useSwipe({
    onSwipeLeft: () => goTo(page + 1 === spreads.length ? 0 : page + 1),
    onSwipeRight: () => goTo(page === 0 ? spreads.length - 1 : page - 1),
  });

  const spread = spreads[page] ?? [];

  return (
    <div className="select-none">
      <div
        className="album-stage relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...swipeHandlers}
      >
        <div key={page} className={dir === 1 ? "album-page-next" : "album-page-prev"}>
          <div className="grid grid-cols-12 items-start gap-x-0">
            {spread.map((photo, i) => {
              const n = page * 6 + i + 1;
              return (
                <Editable
                  key={photo.placementId}
                  type="placement"
                  id={photo.placementId}
                  className={spreadPoses[i]}
                >
                  <figure
                    style={{ ["--tape-rot" as string]: `${i % 2 ? 5 : -6}deg` }}
                    className={`group polaroid relative transition-all duration-500 hover:z-60 hover:rotate-0 hover:scale-[1.04] active:z-60 active:rotate-0 active:scale-[1.04] ${i % 3 === 0 ? "tape" : i % 3 === 1 ? "tape-corner" : ""}`}
                  >
                    <div className="relative h-[calc(100%-var(--polaroid-legenda))] w-full overflow-hidden bg-background">
                      <Image
                        src={photo.src}
                        alt={`Foto ${n} do portfólio`}
                        fill
                        sizes="(min-width: 640px) 500px, 60vw"
                        placeholder="blur"
                        blurDataURL={photo.blurDataURL}
                        className="object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0 group-active:scale-105 group-active:grayscale-0"
                      />
                    </div>
                    <figcaption className="font-hand absolute inset-x-2 bottom-1 flex items-baseline justify-between text-[0.85rem] leading-none">
                      <span>{photo.label}</span>
                      <span className="font-condensed text-[0.5rem] tracking-[0.25em] opacity-60">
                        {String(n).padStart(2, "0")}
                      </span>
                    </figcaption>
                  </figure>
                </Editable>
              );
            })}
          </div>
          {page === spreads.length - 1 && (
            <Addable
              type="placement"
              context={{ surface: "home-gallery" }}
              className="mt-4 aspect-4/5 w-full text-4xl font-light"
            >
              +
            </Addable>
          )}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2">
        {spreads.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Ir para a página ${i + 1}`}
            onClick={() => goTo(i)}
            className={`h-1.5 transition-all ${i === page ? "w-6 bg-gold" : "w-1.5 bg-border"}`}
          />
        ))}
      </div>
      <p className="font-condensed mt-3 text-center text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground">
        Arraste para o lado para virar a página
      </p>
    </div>
  );
}

export function Gallery({ photos }: { photos: LabeledPhoto[] }) {
  return (
    <Section id="galeria" index="02" eyebrow="Portfólio" title="Meus trabalhos">
      <GalleryAlbum photos={photos} />
    </Section>
  );
}
