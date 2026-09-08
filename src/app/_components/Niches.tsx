import Image from "next/image";
import Link from "next/link";
import { Section } from "@/lib/_components/Section";
import { getNiches } from "@/actions/niches";

export async function Niches() {
  const niches = await getNiches();
  return (
    <Section id="ensaios" index="03" title="Ensaios para cada momento">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Arraste para o lado e toque no ensaio para ver a descrição completa, os pacotes e a galeria.
      </p>

      <div className="no-scrollbar -mx-5 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3">
        {niches.map((n) => (
          <Link
            key={n.slug}
            href={`/ensaios/${n.slug}`}
            className="group relative w-[78%] max-w-sm shrink-0 snap-center overflow-hidden border border-border bg-surface transition-colors hover:border-gold active:border-gold"
          >
            <div className="relative aspect-4/5 overflow-hidden">
              <Image
                src={n.image.src}
                alt={`Ensaio de ${n.title}`}
                fill
                sizes="(min-width: 640px) 380px, 78vw"
                placeholder="blur"
                blurDataURL={n.image.blurDataURL}
                className="object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-[1.04] group-active:grayscale-0 group-active:scale-[1.04]"
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/85 to-transparent p-5 pt-12">
              <h3 className="display-xl text-3xl text-foreground">{n.title}</h3>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="font-condensed text-[0.6rem] uppercase tracking-[0.32em] text-muted-foreground">
                  {n.subtitle}
                </span>
                <span
                  className="gradient-border-gold font-condensed block w-fit shrink-0 rounded-full px-4 py-2 text-[0.6rem] uppercase tracking-[0.25em] text-gold sm:px-6"
                  style={{
                    boxShadow:
                      "0 10px 25px -8px color-mix(in oklab, var(--gold) 55%, transparent), 0 4px 10px -4px color-mix(in oklab, var(--gold) 35%, transparent)",
                  }}
                >
                  <span className="sm:hidden">Ver</span>
                  <span className="hidden sm:inline">Ver detalhes</span>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}
