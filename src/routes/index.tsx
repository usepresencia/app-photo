import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/site/Hero";
import { About, Gallery, Niches } from "@/components/site/Sections";
import { Contact, Events, Location, Testimonials } from "@/components/site/Sections2";
import { BRAND } from "@/components/site/data";

const title = "Denise Galvão | Fotografia de ensaios e eventos";
const description =
  "Fotografia autoral em preto e branco: ensaios em estúdio e externos, gestante, família, retratos profissionais e cobertura de eventos.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background pb-20">
      <Hero />
      <About />
      <Gallery />
      <Niches />
      <Events />
      <Contact />
      <Testimonials />
      <Location />

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <a
            href="#galeria"
            className="font-condensed flex-1 border border-border py-2.5 text-center text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-foreground"
          >
            Galeria
          </a>
          <a
            href={BRAND.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="font-condensed flex-1 bg-primary py-2.5 text-center text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-primary-foreground"
          >
            WhatsApp
          </a>
        </div>
      </nav>
    </main>
  );
}
