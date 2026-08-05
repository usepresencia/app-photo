import { getBrand } from "@/actions/brand";
import { getHeroPhotos } from "@/actions/gallery";
import { Logo } from "@/shared/_components/Logo";
import { CtaLink } from "@/shared/_components/CtaLink";
import { ThemeToggle } from "@/shared/_components/ThemeToggle";
import { HeroFilmStrip } from "./_HeroFilmStrip";

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

export async function Hero() {
  const [brand, photos] = await Promise.all([getBrand(), getHeroPhotos()]);

  return (
    <header className="grain relative overflow-hidden pb-12">
      <div className="px-5 pt-6">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <a
              href={brand.instagram}
              target="_blank"
              rel="noreferrer"
              className="font-condensed hidden text-[0.7rem] uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:text-gold sm:block"
            >
              Instagram
            </a>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 w-full max-w-3xl px-5">
        <div
          className="relative overflow-hidden border border-gold/20 px-6 pb-10 pt-10 sm:px-10 sm:pb-14 sm:pt-14"
          style={{ boxShadow: "var(--shadow-gold)" }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 18%, color-mix(in oklab, var(--gold) 12%, transparent) 0 14px, transparent 15px), radial-gradient(circle at 62% 34%, color-mix(in oklab, var(--gold) 8%, transparent) 0 20px, transparent 21px), radial-gradient(circle at 34% 68%, color-mix(in oklab, var(--gold) 10%, transparent) 0 18px, transparent 19px), radial-gradient(circle at 78% 88%, color-mix(in oklab, var(--gold) 8%, transparent) 0 16px, transparent 17px)",
              backgroundSize: "190px 190px",
            }}
          />

          <HeroFilmStrip photos={photos} />

          <div className="relative z-10 max-w-[58%] sm:max-w-[55%]">
            <h1 className="text-[2rem] font-light leading-[1.02] tracking-tight text-foreground sm:text-[3.4rem]">
              Transforme
              <br />
              <span className="opacity-70">momentos simples em</span>
              <br />
              <strong className="font-extrabold">memórias</strong>
              <br />
              <strong className="font-extrabold text-gold">eternas</strong>
            </h1>

            <span className="mt-5 block h-px w-16 bg-gold/50" />

            <p className="mt-5 text-sm leading-snug text-muted-foreground sm:text-lg">
              Um <strong className="font-bold text-foreground">clique pode guardar</strong> o que o
              tempo não apaga.
            </p>

            <p className="font-condensed mt-6 text-[0.62rem] uppercase tracking-[0.32em] text-muted-foreground">
              {brand.city}
            </p>
          </div>

          <div className="relative z-10 mt-8 grid max-w-[58%] grid-cols-1 gap-2.5 sm:max-w-md sm:grid-cols-2">
            <CtaLink href="#contato" variant="solid">
              Fale comigo
            </CtaLink>
            <CtaLink href="#galeria" variant="outline">
              Ver galeria
            </CtaLink>
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
