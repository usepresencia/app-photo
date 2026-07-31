import { BRAND, heroStrips } from "./data";
import { Logo } from "./Logo";

const filmPhotos = [heroStrips[0][0], heroStrips[1][1], heroStrips[2][0], heroStrips[0][2]];

function FilmStrip() {
  return (
    <div
      aria-hidden="true"
      className="film-strip pointer-events-none absolute -right-6 -top-10 bottom-[-3rem] w-[42%] p-1.5 sm:w-[38%]"
    >
      <div className="flex h-full flex-col gap-1.5">
        {filmPhotos.map((src, i) => (
          <div key={i} className="min-h-0 flex-1 overflow-hidden">
            <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
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
    <header className="grain relative overflow-hidden pb-12">
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

      <div className="mx-auto mt-6 w-full max-w-3xl px-5">
        <div
          className="paper-panel relative overflow-hidden px-6 pb-10 pt-10 sm:px-10 sm:pb-14 sm:pt-14"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          <FilmStrip />

          <div className="relative z-10 max-w-[58%] sm:max-w-[55%]">
            <h1 className="text-[2rem] font-light leading-[1.02] tracking-tight sm:text-[3.4rem]">
              Transforme
              <br />
              <span className="opacity-70">momentos simples em</span>
              <br />
              <strong className="font-extrabold">memórias</strong>
              <br />
              <strong className="font-extrabold text-gold">eternas</strong>
            </h1>

            <span className="mt-5 block h-px w-16 bg-[color:var(--ink)] opacity-30" />

            <p className="mt-5 text-sm leading-snug sm:text-lg">
              Um <strong className="font-bold">clique pode guardar</strong> o que o tempo não apaga.
            </p>

            <p className="font-condensed mt-6 text-[0.62rem] uppercase tracking-[0.32em] opacity-60">
              {BRAND.city}
            </p>
          </div>

          <div className="relative z-10 mt-8 grid max-w-[58%] grid-cols-1 gap-2.5 sm:max-w-md sm:grid-cols-2">
            <a
              href="#contato"
              className="font-condensed bg-[color:var(--ink)] px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--paper)] transition-opacity hover:opacity-85"
            >
              Fale comigo
            </a>
            <a
              href="#galeria"
              className="font-condensed border border-[color:var(--ink)]/30 px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.22em] transition-colors hover:border-[color:var(--ink)]"
            >
              Ver galeria
            </a>
          </div>
        </div>

        <dl className="mt-8 grid grid-cols-3 border-y border-border">
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

      <div className="mt-8">
        <Ticker />
      </div>
    </header>
  );
}
