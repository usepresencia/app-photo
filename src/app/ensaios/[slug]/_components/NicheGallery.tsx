import Image from "next/image";
import type { Photo } from "@/actions/_mock/types";
import { Addable } from "@/app/_components/Addable";
import { Editable } from "@/app/_components/Editable";

export function NicheGallery({
  photos,
  nicheTitle,
  nicheSlug,
}: {
  photos: Photo[];
  nicheTitle: string;
  nicheSlug: string;
}) {
  return (
    <div>
      <h4 className="font-condensed text-[0.68rem] uppercase tracking-[0.4em] text-gold">
        Galeria do ensaio
      </h4>
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
            </figure>
          </Editable>
        ))}
        <Addable
          type="placement"
          context={{ surface: "niche", refId: nicheSlug }}
          className="mb-2 flex aspect-square items-center justify-center break-inside-avoid text-4xl font-light"
        >
          +
        </Addable>
      </div>
    </div>
  );
}
