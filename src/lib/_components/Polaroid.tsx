import Image from "next/image";
import type { ReactNode } from "react";
import type { Photo } from "@/actions/_mock/types";

interface PolaroidProps {
  photo: Photo;
  alt: string;
  // ReactNode, não string: algumas legendas (ex. campos de Profile) vêm
  // envolvidas em EditableText pra edição inline, não como texto puro.
  caption?: ReactNode;
  /** Proporção da foto. A altura do cartão vem daqui mais a legenda. */
  aspect?: string;
  tape?: "top" | "corner" | "none";
  tapeRotationDeg?: number;
  className?: string;
  sizes?: string;
}

export function Polaroid({
  photo,
  alt,
  caption,
  aspect = "aspect-3/4",
  tape = "top",
  tapeRotationDeg = -6,
  className = "",
  sizes = "(min-width: 640px) 400px, 60vw",
}: PolaroidProps) {
  const tapeClass = tape === "top" ? "tape" : tape === "corner" ? "tape-corner" : "";
  return (
    <figure
      style={{ ["--tape-rot" as string]: `${tapeRotationDeg}deg` }}
      className={`polaroid relative ${tapeClass} ${className}`}
    >
      <div className={`relative w-full overflow-hidden bg-background ${aspect}`}>
        <Image
          src={photo.src}
          alt={alt}
          fill
          sizes={sizes}
          placeholder="blur"
          blurDataURL={photo.blurDataURL}
          className="object-cover grayscale transition-all duration-500 hover:grayscale-0 active:grayscale-0"
        />
      </div>
      {/* A legenda corre no fluxo abaixo da foto, e não presa dentro da tarja:
          assim o cartão cresce com o texto em vez de cortá-lo. */}
      {caption && (
        <figcaption className="font-hand mt-2 px-1 text-sm leading-snug sm:text-base">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
