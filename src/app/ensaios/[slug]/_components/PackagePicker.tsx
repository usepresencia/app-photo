"use client";

import { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import type { Package } from "@/actions/packages";
import type { Photo } from "@/actions/_mock/types";
import { NicheGallery } from "./NicheGallery";

export function PackagePicker({
  packages,
  nicheTitle,
  nicheGallery,
  whatsappBase,
}: {
  packages: Package[];
  nicheTitle: string;
  nicheGallery: Photo[];
  whatsappBase: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const pack = packages.find((p) => p.name === selected);

  const whatsapp = `${whatsappBase}?text=${encodeURIComponent(
    `Olá, Denise! Tenho interesse no ensaio de ${nicheTitle}${pack ? `, pacote ${pack.name} (${pack.price})` : ""}.`,
  )}`;

  return (
    <section className="mx-auto w-full max-w-3xl px-5 pb-10 pt-4">
      <div className="flex items-center gap-3">
        <span className="section-index">01</span>
        <span className="gold-rule flex-1" />
      </div>
      {!pack && (
        <>
          <h2 className="display-xl mt-8 text-4xl text-foreground">Escolha o pacote</h2>
          <div className="album-stage mt-5">
            <div className="album-page-prev">
              <div className="grid gap-3 sm:grid-cols-3">
                {packages.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setSelected(p.name)}
                    className="relative overflow-hidden border border-gold/20 p-5 text-left transition-colors hover:border-gold/50"
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
                    <h3 className="display-xl relative z-10 text-2xl text-foreground">{p.name}</h3>
                    <span className="font-display relative z-10 mt-1 block text-2xl text-gold">
                      {p.price}
                    </span>
                    <span className="font-condensed relative z-10 mt-3 block text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground">
                      Ver o que inclui
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {pack && (
        <div key={pack.name} className="album-stage album-page-next mt-8 space-y-8">
          <div
            className="relative overflow-hidden border border-gold/20 p-6"
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
            <div className="relative z-10 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Trocar pacote"
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-background/50 text-gold backdrop-blur-sm transition-colors hover:border-gold"
              >
                <FaArrowLeft className="size-4" />
              </button>
              <div className="flex-1">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4">
                  <h3 className="display-xl text-3xl text-foreground">{pack.name}</h3>
                  <span className="font-display shrink-0 text-3xl text-gold">{pack.price}</span>
                </div>
                <p className="font-condensed mt-1 text-[0.62rem] uppercase tracking-[0.3em] text-muted-foreground">
                  Ensaio de {nicheTitle}
                </p>
              </div>
            </div>
            <ul className="relative z-10 mt-5 space-y-2">
              {pack.items.map((i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <span aria-hidden="true" className="text-gold">
                    •
                  </span>
                  {i}
                </li>
              ))}
            </ul>
          </div>

          <NicheGallery photos={nicheGallery} nicheTitle={nicheTitle} />

          <div className="px-6 py-10 text-center sm:px-10">
            <h3 className="display-xl text-3xl text-foreground sm:text-4xl">
              Se inspirou
              <br />
              nesse ensaio?
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Podemos criar uma experiência exclusiva para você!
            </p>
          </div>

          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="gradient-border-gold font-condensed mx-auto block w-fit rounded-full px-10 py-3 text-center text-sm font-semibold uppercase tracking-[0.22em] text-gold transition-opacity hover:opacity-90"
            style={{
              boxShadow:
                "0 10px 25px -8px color-mix(in oklab, var(--gold) 55%, transparent), 0 4px 10px -4px color-mix(in oklab, var(--gold) 35%, transparent)",
            }}
          >
            Agendar
          </a>
        </div>
      )}
    </section>
  );
}
