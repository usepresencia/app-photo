import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { BRAND, niches, packages } from "@/components/site/data";

export const Route = createFileRoute("/ensaios/$slug")({
  loader: ({ params }) => {
    const niche = niches.find((n) => n.slug === params.slug);
    if (!niche) throw notFound();
    return { niche };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Ensaio não encontrado" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.niche.title} | Denise Galvão Fotografia`;
    const description = loaderData.niche.intro;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ServicePage,
});

function ServicePage() {
  const { niche } = Route.useLoaderData() as { niche: (typeof niches)[number] };

  const [selected, setSelected] = useState<string | null>(null);
  const pack = packages.find((p) => p.name === selected);

  const whatsapp = `${BRAND.whatsapp}?text=${encodeURIComponent(
    `Olá, Denise! Tenho interesse no ensaio de ${niche.title}${
      pack ? ` — ${pack.name} (${pack.price})` : ""
    }.`,
  )}`;

  return (
    <main className="min-h-screen bg-background">
      <header className="relative h-[62vh] min-h-[380px] overflow-hidden">
        <img
          src={niche.image}
          alt={`Ensaio de ${niche.title}`}
          className="absolute inset-0 h-full w-full object-cover grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        <div className="relative mx-auto flex h-full w-full max-w-3xl flex-col justify-end px-5 pb-8">
          <Link
            to="/"
            className="font-condensed absolute left-5 top-6 border border-gold/40 px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.28em] text-gold"
          >
            ← Voltar
          </Link>
          <span className="gold-rule block" />
          <p className="font-condensed mt-4 text-[0.68rem] uppercase tracking-[0.4em] text-muted-foreground">
            {niche.subtitle}
          </p>
          <h1 className="display-xl mt-2 text-[2.8rem] leading-[0.95] text-foreground sm:text-6xl">
            {niche.title}
          </h1>
        </div>
      </header>

      <section className="mx-auto w-full max-w-3xl px-5 py-10">
        <p className="border-l-2 border-gold bg-surface p-6 pl-5 text-sm leading-relaxed text-foreground">
          {niche.intro}
        </p>
        <div className="mt-5 space-y-4">
          {niche.description.map((p) => (
            <p key={p} className="text-sm leading-relaxed text-muted-foreground">
              {p}
            </p>
          ))}
        </div>
        <ul className="mt-6 grid gap-2 sm:grid-cols-3">
          {niche.highlights.map((h) => (
            <li
              key={h}
              className="font-condensed border border-border bg-surface px-4 py-3 text-[0.7rem] uppercase tracking-[0.2em] text-gold"
            >
              {h}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto w-full max-w-3xl px-5 pb-4">
        <div className="flex items-center gap-3">
          <span className="section-index">01</span>
          <span className="gold-rule flex-1" />
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="display-xl mt-4 text-4xl text-foreground">Escolha o pacote</h2>
          {pack && (
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="font-condensed shrink-0 border border-gold/40 px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.25em] text-gold transition-colors hover:bg-surface"
            >
              ← Trocar pacote
            </button>
          )}
        </div>

        <div className="album-stage mt-5">
          <div
            key={selected ?? "todos"}
            className={selected ? "album-page-next" : "album-page-prev"}
          >
            <div className={`grid gap-3 ${pack ? "" : "sm:grid-cols-3"}`}>
              {(pack ? [pack] : packages).map((p) => {
                const active = p.name === selected;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setSelected(active ? null : p.name)}
                    aria-pressed={active}
                    className={`border p-5 text-left transition-colors ${
                      active
                        ? "border-gold bg-surface-2"
                        : "border-border bg-surface hover:border-gold/50"
                    }`}
                    style={active ? { boxShadow: "var(--shadow-gold)" } : undefined}
                  >
                    <h3 className="display-xl text-2xl text-foreground">{p.name}</h3>
                    <span className="font-display mt-1 block text-2xl text-gold">{p.price}</span>
                    <span className="font-condensed mt-3 block text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground">
                      {active ? "Selecionado" : "Ver o que inclui"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>


      {pack && (
        <section
          key={pack.name}
          className="album-stage album-page-next mx-auto w-full max-w-3xl px-5 pb-16 pt-6"
        >

          <div className="frame-gold bg-surface/40 p-6">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4">
              <h3 className="display-xl text-3xl text-foreground">{pack.name}</h3>
              <span className="font-display shrink-0 text-3xl text-gold">{pack.price}</span>
            </div>
            <p className="font-condensed mt-1 text-[0.62rem] uppercase tracking-[0.3em] text-muted-foreground">
              Ensaio de {niche.title}
            </p>
            <ul className="mt-5 space-y-2">
              {pack.items.map((i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <span aria-hidden="true" className="text-gold">
                    —
                  </span>
                  {i}
                </li>
              ))}
            </ul>
            <p className="font-condensed mt-5 text-[0.62rem] uppercase tracking-[0.28em] text-muted-foreground">
              Pix, dinheiro ou cartão em até 6x
            </p>
          </div>

          <h4 className="font-condensed mt-10 text-[0.68rem] uppercase tracking-[0.4em] text-gold">
            Galeria do ensaio
          </h4>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {niche.gallery.map((src, i) => (
              <figure
                key={src}
                className={`polaroid ${i % 2 ? "tape-corner" : "tape"} ${
                  i % 3 === 0 ? "aspect-[3/4]" : "aspect-square"
                }`}
                style={{ ["--tape-rot" as string]: `${i % 2 ? 5 : -6}deg` }}
              >
                <div className="h-[calc(100%-1.1rem)] w-full overflow-hidden bg-background">
                  <img
                    src={src}
                    alt={`Foto de ensaio de ${niche.title}`}
                    loading="lazy"
                    className="h-full w-full object-cover grayscale transition-all duration-500 hover:grayscale-0"
                  />
                </div>
              </figure>
            ))}
          </div>

          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="font-condensed mt-8 block bg-primary px-6 py-4 text-center text-sm font-semibold uppercase tracking-[0.22em] text-primary-foreground transition-opacity hover:opacity-90"
            style={{ boxShadow: "var(--shadow-gold)" }}
          >
            Reservar no WhatsApp
          </a>
        </section>
      )}
    </main>
  );
}
