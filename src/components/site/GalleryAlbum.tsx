import { useRef, useState } from "react";

const spreadPoses = [
  "col-span-8 col-start-1 aspect-[4/5] -rotate-[3deg] z-10",
  "col-span-7 col-start-6 -mt-52 aspect-[4/3] rotate-[3.5deg] z-30",
  "col-span-7 col-start-1 -mt-28 aspect-[5/4] rotate-[1.5deg] z-20",
  "col-span-7 col-start-6 -mt-36 aspect-[3/4] -rotate-[2.5deg] z-40",
  "col-span-6 col-start-1 -mt-40 aspect-square rotate-[4deg] z-30",
  "col-span-8 col-start-5 -mt-32 aspect-[4/5] -rotate-[2deg] z-50",
];


const notes = [
  "registros que ficam",
  "luz da tarde",
  "sem pose, só verdade",
  "o instante certo",
];


export function GalleryAlbum({ images }: { images: string[] }) {
  const spreads: string[][] = [];
  for (let i = 0; i < images.length; i += 6) spreads.push(images.slice(i, i + 6));

  const [page, setPage] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const startX = useRef<number | null>(null);

  const go = (next: number) => {
    if (next < 0 || next >= spreads.length || next === page) return;
    setDir(next > page ? 1 : -1);
    setPage(next);
  };

  const onStart = (x: number) => {
    startX.current = x;
  };
  const onEnd = (x: number) => {
    if (startX.current === null) return;
    const dx = x - startX.current;
    startX.current = null;
    if (Math.abs(dx) < 45) return;
    go(dx < 0 ? page + 1 : page - 1);
  };

  const spread = spreads[page] ?? [];

  return (
    <div className="select-none">
      <div className="mb-4 flex items-center gap-3">
        <span className="font-condensed text-[0.6rem] uppercase tracking-[0.35em] text-gold">
          Página {String(page + 1).padStart(2, "0")} / {String(spreads.length).padStart(2, "0")}
        </span>
        <span className="gold-rule flex-1" />
      </div>

      <div
        className="album-stage relative"
        onTouchStart={(e) => onStart(e.touches[0].clientX)}
        onTouchEnd={(e) => onEnd(e.changedTouches[0].clientX)}
        onPointerDown={(e) => e.pointerType === "mouse" && onStart(e.clientX)}
        onPointerUp={(e) => e.pointerType === "mouse" && onEnd(e.clientX)}
      >
        <div
          key={page}
          className={dir === 1 ? "album-page-next" : "album-page-prev"}
        >
          <div className="grid grid-cols-12 items-start gap-x-0">
            {spread.map((src, i) => {
              const n = page * 6 + i + 1;
              return (
                <figure
                  key={src + i}
                  style={{ ["--tape-rot" as string]: `${i % 2 ? 5 : -6}deg` }}
                  className={`group polaroid relative transition-all duration-500 hover:z-30 hover:rotate-0 hover:scale-[1.04] ${i % 3 === 0 ? "tape" : i % 3 === 1 ? "tape-corner" : ""} ${spreadPoses[i]}`}
                >
                  <div className="h-[calc(100%-1.1rem)] w-full overflow-hidden bg-background">
                    <img
                      src={src}
                      alt={`Foto ${n} do portfólio`}
                      loading="lazy"
                      draggable={false}
                      className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                    />
                  </div>
                  <figcaption className="font-hand absolute inset-x-2 bottom-1 flex items-baseline justify-between text-[0.85rem] leading-none text-[oklch(0.25_0.02_60)]">
                    <span>{notes[(page + i) % notes.length]}</span>
                    <span className="font-condensed text-[0.5rem] tracking-[0.25em] opacity-60">
                      {String(n).padStart(2, "0")}
                    </span>
                  </figcaption>
                </figure>

              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => go(page - 1)}
          disabled={page === 0}
          className="font-condensed border border-border px-4 py-2 text-[0.65rem] uppercase tracking-[0.25em] text-foreground disabled:opacity-30"
        >
          Anterior
        </button>
        <div className="flex items-center gap-2">
          {spreads.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir para a página ${i + 1}`}
              onClick={() => go(i)}
              className={`h-1.5 transition-all ${i === page ? "w-6 bg-gold" : "w-1.5 bg-border"}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(page + 1)}
          disabled={page === spreads.length - 1}
          className="font-condensed border border-gold bg-primary px-4 py-2 text-[0.65rem] uppercase tracking-[0.25em] text-primary-foreground disabled:opacity-30"
        >
          Próxima
        </button>
      </div>
      <p className="font-condensed mt-3 text-center text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground">
        Arraste para o lado para virar a página
      </p>
    </div>
  );
}
