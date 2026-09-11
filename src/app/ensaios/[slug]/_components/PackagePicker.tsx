"use client";

import { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import type { Package } from "@/actions/packages";
import type { LabeledPhoto } from "@/actions/_shared/getPhotosBySurface";
import { Addable } from "@/app/_components/Addable";
import { EditableText } from "@/app/_components/EditableText";
import { RoseTexture } from "@/lib/_components/RoseTexture";
import { NicheGallery } from "./NicheGallery";

export function PackagePicker({
  packages,
  nicheSlug,
  nicheTitle,
  nicheGallery,
  whatsappBase,
}: {
  packages: Package[];
  nicheSlug: string;
  nicheTitle: string;
  nicheGallery: LabeledPhoto[];
  whatsappBase: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pack = packages.find((p) => p.id === selectedId);

  const whatsapp = `${whatsappBase}?text=${encodeURIComponent(
    `Olá, Denise! Tenho interesse no ensaio de ${nicheTitle}${pack ? `, pacote ${pack.name} (${pack.price})` : ""}.`,
  )}`;

  return (
    <section className="mx-auto w-full max-w-3xl px-5 pb-10 pt-4">
      <div className="flex items-center gap-3">
        <span className="section-index">01</span>
        <span className="rose-rule flex-1" />
      </div>
      {!pack && (
        <>
          <h2 className="display-xl mt-8 text-4xl text-foreground">Escolha o pacote</h2>
          <div className="album-stage mt-5">
            <div className="album-page-prev">
              <div className="grid gap-3 sm:grid-cols-3">
                {packages.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className="relative block h-full w-full overflow-hidden border border-rose/20 p-5 text-left transition-colors hover:border-rose/50"
                    style={{ boxShadow: "var(--shadow-rose)" }}
                  >
                    <RoseTexture variant="dots" />
                    <EditableText
                      type="package"
                      id={p.id}
                      field="name"
                      as="h3"
                      className="display-xl relative z-10 text-2xl text-foreground"
                    >
                      {p.name}
                    </EditableText>
                    <EditableText
                      type="package"
                      id={p.id}
                      field="price"
                      className="font-condensed relative z-10 mt-1 block text-2xl font-normal text-rose"
                    >
                      {p.price}
                    </EditableText>
                    <span className="font-condensed relative z-10 mt-3 block text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground">
                      Ver o que inclui
                    </span>
                  </button>
                ))}
                <Addable
                  type="package"
                  context={{ nicheSlug }}
                  className="block h-full min-h-24 text-4xl font-light"
                >
                  +
                </Addable>
              </div>
            </div>
          </div>
        </>
      )}

      {pack && (
        <div key={pack.id} className="album-stage album-page-next mt-8 space-y-8">
          <div
            className="relative overflow-hidden border border-rose/20 p-6"
            style={{ boxShadow: "var(--shadow-rose)" }}
          >
            <RoseTexture variant="dots" />
            <div className="relative z-10 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label="Trocar pacote"
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-rose/40 bg-background/50 text-rose backdrop-blur-sm transition-colors hover:border-rose"
              >
                <FaArrowLeft className="size-4" />
              </button>
              <div className="flex-1">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4">
                  <EditableText
                    type="package"
                    id={pack.id}
                    field="name"
                    as="h3"
                    className="display-xl text-3xl text-foreground"
                  >
                    {pack.name}
                  </EditableText>
                  <EditableText
                    type="package"
                    id={pack.id}
                    field="price"
                    className="font-condensed shrink-0 text-3xl font-normal text-rose"
                  >
                    {pack.price}
                  </EditableText>
                </div>
                <p className="font-condensed mt-1 text-[0.62rem] uppercase tracking-[0.3em] text-muted-foreground">
                  Ensaio de {nicheTitle}
                </p>
              </div>
            </div>
            {pack.description && (
              <EditableText
                type="package"
                id={pack.id}
                field="description"
                as="p"
                className="relative z-10 mt-4 text-sm leading-relaxed text-muted-foreground"
              >
                {pack.description}
              </EditableText>
            )}
            <ul className="relative z-10 mt-5 space-y-2">
              {pack.items.map((i, idx) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <span aria-hidden="true" className="text-rose">
                    •
                  </span>
                  <EditableText type="package" id={pack.id} field={`items.${idx}`}>
                    {i}
                  </EditableText>
                </li>
              ))}
            </ul>
          </div>

          <NicheGallery photos={nicheGallery} nicheTitle={nicheTitle} nicheSlug={nicheSlug} />

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
            className="gradient-border-rose font-condensed mx-auto block w-fit rounded-full px-10 py-3 text-center text-sm font-semibold uppercase tracking-[0.22em] text-rose transition-opacity hover:opacity-90"
            style={{
              boxShadow:
                "0 10px 25px -8px color-mix(in oklab, var(--rose) 55%, transparent), 0 4px 10px -4px color-mix(in oklab, var(--rose) 35%, transparent)",
            }}
          >
            Agendar
          </a>
        </div>
      )}
    </section>
  );
}
