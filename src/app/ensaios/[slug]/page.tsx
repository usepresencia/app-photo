import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNicheBySlug } from "@/actions/niches";
import { getPackagesForNiche } from "@/actions/packages";
import { getBrand } from "@/actions/brand";
import { EditableText } from "@/app/_components/EditableText";
import { RoseTexture } from "@/lib/_components/RoseTexture";
import { OG_IMAGE } from "@/lib/config/site";
import { NicheHero } from "./_components/NicheHero";
import { PackagePicker } from "./_components/PackagePicker";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const niche = await getNicheBySlug(slug);
  if (!niche) return { title: "Ensaio não encontrado", robots: { index: false } };

  const title = `${niche.title} | Denise Galvão Fotografia`;
  const description = niche.intro || niche.subtitle;
  return {
    title,
    description,
    openGraph: { title, description, type: "article", images: [OG_IMAGE] },
    // Mesmo motivo da home: a imagem herdada é o logo quadrado, que rende
    // miniatura e não banner. Ver comentário em src/app/page.tsx.
    twitter: { card: "summary" },
  };
}

export default async function NichePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [niche, packages, brand] = await Promise.all([
    getNicheBySlug(slug),
    getPackagesForNiche(slug),
    getBrand(),
  ]);
  if (!niche) notFound();

  const landscapeGallery = niche.gallery.filter((photo) => photo.width > photo.height);
  const portraitGallery = niche.gallery.filter((photo) => photo.height > photo.width);
  const landscapePhotos = landscapeGallery.length > 0 ? landscapeGallery : niche.gallery;
  const portraitPhotos = portraitGallery.length > 0 ? portraitGallery : niche.gallery;

  return (
    <main className="min-h-screen bg-background">
      <NicheHero
        slug={niche.slug}
        title={niche.title}
        subtitle={niche.subtitle}
        landscapePhotos={landscapePhotos}
        portraitPhotos={portraitPhotos}
      />

      <section className="mx-auto w-full max-w-3xl space-y-8 px-5 pb-4 pt-10">
        {niche.intro && (
          <div className="relative overflow-hidden border-l-2 border-rose p-6 pl-5">
            <RoseTexture variant="mask" fade="edge" />
            <EditableText
              type="niche"
              id={niche.slug}
              field="intro"
              as="p"
              className="relative text-sm leading-relaxed text-foreground"
            >
              {niche.intro}
            </EditableText>
          </div>
        )}
        {niche.description.length > 0 && (
          <div className="space-y-4">
            {niche.description.map((p, i) => (
              <EditableText
                key={p}
                type="niche"
                id={niche.slug}
                field={`description.${i}`}
                as="p"
                className="text-sm leading-relaxed text-muted-foreground"
              >
                {p}
              </EditableText>
            ))}
          </div>
        )}
        {niche.highlights.length > 0 && (
          <ul className="grid gap-2 sm:grid-cols-3">
            {niche.highlights.map((h, i) => (
              <li key={h} className="relative overflow-hidden px-4 py-3 text-center">
                <RoseTexture variant="mask" fade="center" />
                <EditableText
                  type="niche"
                  id={niche.slug}
                  field={`highlights.${i}`}
                  className="font-condensed relative text-[0.7rem] uppercase tracking-[0.2em] text-foreground"
                >
                  {h}
                </EditableText>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PackagePicker
        packages={packages}
        nicheSlug={niche.slug}
        nicheTitle={niche.title}
        nicheGallery={niche.gallery}
        whatsappBase={brand.whatsapp}
      />
    </main>
  );
}
