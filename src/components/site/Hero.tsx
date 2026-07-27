import { BRAND, heroStrips } from "./data";
import { Logo } from "./Logo";

function Strip({ images, dir, dur }: { images: string[]; dir: "left" | "right"; dur: string }) {
  const row = [...images, ...images, ...images, ...images];
  return (
    <div className="overflow-hidden">
      <div
        className={`flex w-max gap-2 ${dir === "left" ? "marquee-left" : "marquee-right"}`}
        style={{ ["--dur" as string]: dur }}
      >
        {row.map((src, i) => (
          <div
            key={i}
            className="h-28 w-[4.5rem] shrink-0 overflow-hidden border border-border bg-surface sm:h-36 sm:w-24"
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

function Ticker() {
  const words = ["Retratos", "Gestante", "Família", "Casamento", "Editorial", "Aniversário"];
  const row = [...words, ...words, ...words, ...words];
  return (
    <div className="overflow-hidden border-y border-border bg-surface py-2">
      <div className="ticker flex w-max items-center gap-6" style={{ ["--dur" as string]: "34s" }}>
        {row.map((w, i) => (
          <span
            key={i}
            className="font-condensed flex items-center gap-6 text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-muted-foreground"
          >
            {w}
            <span aria-hidden="true" className="text-gold">
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <header className="grain relative overflow-hidden pb-14">
      <div className="px-5 pt-6">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
          <Logo />
          <a
            href={BRAND.instagram}
            target="_blank"
            rel="noreferrer"
            className="font-condensed hidden text-[0.7rem] uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:text-gold sm:block"
          >
            Instagram
          </a>
        </div>
      </div>

      <div className="mx-auto mt-10 w-full max-w-3xl px-5">
        <div className="flex items-center gap-3">
          <span className="section-index">Est. 2014</span>
          <span className="gold-rule flex-1" />
        </div>
        <p className="font-condensed mt-4 text-[0.7rem] font-semibold uppercase tracking-[0.42em] text-gold">
          Fotografia autoral · Preto e branco
        </p>
        <h1 className="display-xl mt-3 text-[3.6rem] text-foreground sm:text-8xl">
          Memórias em
          <br />
          <span className="text-gold">preto</span>, branco
          <br />e tudo entre.
        </h1>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
          Ensaios em estúdio e externos, eventos e retratos profissionais. {BRAND.city}.
        </p>
        <div className="mt-7 grid w-full grid-cols-1 gap-3 sm:max-w-md sm:grid-cols-2">
          <a
            href="#contato"
            className="font-condensed bg-primary px-6 py-3.5 text-center text-sm font-semibold uppercase tracking-[0.22em] text-primary-foreground transition-opacity hover:opacity-90"
            style={{ boxShadow: "var(--shadow-gold)" }}
          >
            Fale comigo
          </a>
          <a
            href="#galeria"
            className="frame-gold font-condensed px-6 py-3.5 text-center text-sm font-semibold uppercase tracking-[0.22em] text-foreground transition-colors hover:bg-surface"
          >
            Ver galeria
          </a>
        </div>

        <dl className="mt-10 grid grid-cols-3 border-y border-border">
          {[
            ["10+", "anos"],
            ["300+", "ensaios"],
            ["7d", "entrega"],
          ].map(([n, l]) => (
            <div key={l} className="border-r border-border py-4 last:border-r-0">
              <dt className="font-display text-3xl leading-none text-gold">{n}</dt>
              <dd className="font-condensed mt-1 text-[0.62rem] uppercase tracking-[0.3em] text-muted-foreground">
                {l}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="relative mt-12 space-y-2">
        <Strip images={heroStrips[0]} dir="left" dur="26s" />
        <Strip images={heroStrips[1]} dir="right" dur="32s" />
        <Strip images={heroStrips[2]} dir="left" dur="38s" />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
          style={{ background: "var(--gradient-fade)" }}
        />
      </div>

      <div className="mt-10">
        <Ticker />
      </div>
    </header>
  );
}
