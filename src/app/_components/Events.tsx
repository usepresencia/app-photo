import Image from "next/image";
import Link from "next/link";
import { Section } from "@/lib/_components/Section";
import { getEventNiches } from "@/actions/niches";
import { ContactForm } from "./Contact";

export async function Events({ whatsapp }: { whatsapp: string }) {
  const events = await getEventNiches();
  return (
    <Section id="contato" index="04" eyebrow="Eventos" title="Formatos de cobertura">
      <div className="space-y-3">
        {events.map((e) => (
          <Link
            key={e.slug}
            href={`/ensaios/${e.slug}`}
            className="group relative block h-44 overflow-hidden border border-border transition-colors hover:border-gold active:border-gold"
          >
            <Image
              src={e.image.src}
              alt={`Cobertura de ${e.title}`}
              fill
              sizes="(min-width: 640px) 700px, 100vw"
              placeholder="blur"
              blurDataURL={e.image.blurDataURL}
              className="object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-[1.04] group-active:grayscale-0 group-active:scale-[1.04]"
            />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/70 to-transparent" />
            <div className="relative flex h-full flex-col justify-end p-5">
              <h3 className="display-xl text-3xl text-foreground">{e.title}</h3>
              <p className="font-condensed mt-1 text-[0.65rem] uppercase tracking-[0.28em] text-muted-foreground">
                {e.subtitle}
              </p>
            </div>
          </Link>
        ))}
      </div>
      <p className="font-condensed mt-8 text-center text-[0.7rem] font-semibold uppercase tracking-[0.42em] text-muted-foreground">
        Personalize seu evento comigo
      </p>
      <div className="mt-4">
        <ContactForm whatsapp={whatsapp} />
      </div>
    </Section>
  );
}
