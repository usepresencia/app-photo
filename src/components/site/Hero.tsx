import { BRAND, heroStrips } from "./data";
import { Logo } from "./Logo";

function Strip({ images, dir, dur }: { images: string[]; dir: "left" | "right"; dur: string }) {
  const row = [...images, ...images, ...images, ...images];
  return (
    <div className="overflow-hidden">
      <div
        className={`flex w-max gap-3 ${dir === "left" ? "marquee-left" : "marquee-right"}`}
        style={{ ["--dur" as string]: dur }}
      >
        {row.map((src, i) => (
          <div
            key={i}
            className="h-24 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-surface sm:h-32 sm:w-24"
          >
            <img
              src={src}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="h-full w-full object-cover opacity-70 grayscale"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <header className="relative overflow-hidden px-5 pb-16 pt-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
        <Logo />
        <p className="eyebrow mt-12">Fotografia autoral</p>
        <h1 className="font-display mt-4 text-center text-4xl leading-[1.05] text-foreground sm:text-6xl">
          Memórias em preto,
          <br />
          branco e tudo entre.
        </h1>
        <p className="mt-5 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
          Ensaios em estúdio e externos, eventos e retratos profissionais. {BRAND.city}.
        </p>
        <div className="mt-8 grid w-full max-w-sm grid-cols-1 gap-3 sm:grid-cols-2">
          <a
            href="#contato"
            className="rounded-full bg-primary px-6 py-3 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Fale comigo
          </a>
          <a
            href="#galeria"
            className="rounded-full border border-border px-6 py-3 text-center text-sm font-semibold text-foreground transition-colors hover:bg-surface"
          >
            Ver galeria
          </a>
        </div>
      </div>

      <div className="relative mt-14 space-y-3">
        <Strip images={heroStrips[0]} dir="left" dur="26s" />
        <Strip images={heroStrips[1]} dir="right" dur="32s" />
        <Strip images={heroStrips[2]} dir="left" dur="38s" />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
          style={{ background: "var(--gradient-fade)" }}
        />
      </div>
    </header>
  );
}
