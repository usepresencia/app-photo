"use client";

import Image from "next/image";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import { useSlideshow } from "@/lib/_hooks/useSlideshow";
import { useSwipe } from "@/lib/_hooks/useSwipe";
import type { Photo } from "@/actions/_mock/types";
import { Editable } from "@/app/_components/Editable";
import { EditableText } from "@/app/_components/EditableText";

function AlbumSlides({ photos }: { photos: Photo[] }) {
  const { index, direction, goTo } = useSlideshow({ count: photos.length, autoplayMs: 5000 });
  const swipeHandlers = useSwipe({
    onSwipeLeft: () => goTo(index + 1 === photos.length ? 0 : index + 1),
    onSwipeRight: () => goTo(index === 0 ? photos.length - 1 : index - 1),
  });

  return (
    <>
      <div className="album-stage relative h-full w-full overflow-hidden" {...swipeHandlers}>
        {photos.map((photo, i) =>
          i === index ? (
            <Editable
              key={photo.placementId}
              type="placement"
              id={photo.placementId}
              className={`absolute inset-0 ${direction === 1 ? "album-page-next" : "album-page-prev"}`}
            >
              <Image
                src={photo.src}
                alt={`Foto ${String(i + 1).padStart(2, "0")} do ensaio`}
                fill
                sizes="100vw"
                placeholder="blur"
                blurDataURL={photo.blurDataURL}
                className="object-contain"
                priority={i === 0}
              />
            </Editable>
          ) : null,
        )}
      </div>

      <div className="absolute bottom-8 left-0 right-0 z-30 flex items-center justify-center gap-3">
        {photos.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Ir para a foto ${i + 1}`}
            onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-8 bg-gold" : "w-1.5 bg-white/30"}`}
          />
        ))}
      </div>
    </>
  );
}

export function NicheHero({
  slug,
  title,
  subtitle,
  landscapePhotos,
  portraitPhotos,
}: {
  slug: string;
  title: string;
  subtitle: string;
  landscapePhotos: Photo[];
  portraitPhotos: Photo[];
}) {
  return (
    <header className="relative aspect-2/3 overflow-hidden bg-surface sm:aspect-3/2">
      <div className="h-full w-full sm:hidden">
        <AlbumSlides photos={portraitPhotos} />
      </div>
      <div className="hidden h-full w-full sm:block">
        <AlbumSlides photos={landscapePhotos} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-2/5 bg-linear-to-t from-background via-background/70 to-transparent" />

      <div className="absolute inset-0 z-20 mx-auto flex w-full max-w-3xl flex-col justify-end px-5 pb-14">
        <Link
          href="/"
          aria-label="Voltar"
          className="absolute left-5 top-6 z-30 flex size-10 items-center justify-center rounded-full border border-gold/40 bg-background/50 text-gold backdrop-blur-sm transition-colors hover:border-gold"
        >
          <FaArrowLeft className="size-4" />
        </Link>
        <span className="gold-rule block" />
        <EditableText
          type="niche"
          id={slug}
          field="title"
          as="h1"
          className="display-xl mt-4 text-[2.8rem] leading-[0.95] text-foreground sm:text-6xl"
        >
          {title}
        </EditableText>
        <EditableText
          type="niche"
          id={slug}
          field="subtitle"
          as="p"
          className="font-condensed mt-1 text-[0.68rem] uppercase tracking-[0.4em] text-muted-foreground"
        >
          {subtitle}
        </EditableText>
      </div>
    </header>
  );
}
