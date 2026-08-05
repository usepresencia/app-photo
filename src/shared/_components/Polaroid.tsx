import Image from "next/image";
import type { Photo } from "@/actions/_mock/types";

interface PolaroidProps {
  photo: Photo;
  alt: string;
  caption?: string;
  tape?: "top" | "corner" | "none";
  tapeRotationDeg?: number;
  className?: string;
  sizes?: string;
}

export function Polaroid({
  photo,
  alt,
  caption,
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
      <div className="relative h-[calc(100%-1.1rem)] w-full overflow-hidden bg-background">
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
      {caption && (
        <figcaption className="font-hand absolute inset-x-2 bottom-1 truncate text-[0.8rem] leading-none text-[oklch(0.25_0.02_60)]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
