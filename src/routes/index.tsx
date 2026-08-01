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
    </main>

  );
}
