import Image from "next/image";
import type { LabeledPhoto } from "@/actions/_shared/getPhotosBySurface";
import { Addable } from "@/app/_components/Addable";
import { Editable } from "@/app/_components/Editable";

export function NicheGallery({
  photos,
  nicheTitle,
  nicheSlug,
}: {
  photos: LabeledPhoto[];
  nicheTitle: string;
  nicheSlug: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h4 className="font-condensed text-[0.68rem] uppercase tracking-[0.4em] text-gold">
          Galeria do ensaio
        </h4>
        <Addable
          type="placement"
          context={{ surface: "niche", refId: nicheSlug }}
          className="font-condensed flex h-9 shrink-0 items-center whitespace-nowrap rounded-full px-4 text-[0.65rem] font-semibold uppercase tracking-[0.2em]"
        >
          Adicionar nova foto
        </Addable>
      </div>
      <div className="mt-4 columns-2 gap-2">
        {photos.map((photo, i) => (
          <Editable key={photo.placementId} type="placement" id={photo.placementId}>
            <figure
              className={`group polaroid relative mb-2 break-inside-avoid transition-all duration-500 hover:z-60 hover:scale-105 active:z-60 active:scale-105 ${i % 2 ? "tape-corner" : "tape"} ${
                i % 3 === 0 ? "aspect-3/4" : "aspect-square"
              }`}
              style={{ ["--tape-rot" as string]: `${i % 2 ? 5 : -6}deg` }}
            >
              <div className="relative h-[calc(100%-1.1rem)] w-full overflow-hidden bg-background">
                <Image
                  src={photo.src}
                  alt={`Foto de ensaio de ${nicheTitle}`}
                  fill
                  sizes="(min-width: 640px) 350px, 50vw"
                  placeholder="blur"
                  blurDataURL={photo.blurDataURL}
                  className="object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-active:grayscale-0"
                />
              </div>
              {photo.label && (
                <figcaption className="font-hand mt-2 px-1 text-sm leading-snug sm:text-base">
                  {photo.label}
                </figcaption>
              )}
            </figure>
          </Editable>
        ))}
      </div>
    </div>
  );
}
