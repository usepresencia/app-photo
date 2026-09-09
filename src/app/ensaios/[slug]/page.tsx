import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNicheBySlug } from "@/actions/niches";
import { getPackagesForNiche } from "@/actions/packages";
import { getBrand } from "@/actions/brand";
import { Editable } from "@/app/_components/Editable";
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
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image" },
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

      <Editable type="niche" id={niche.slug}>
        <section className="mx-auto w-full max-w-3xl space-y-8 px-5 pb-4 pt-10">
          {niche.intro && (
            <div className="relative overflow-hidden border-l-2 border-gold p-6 pl-5">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gold/10 backdrop-blur-sm"
                style={{
                  boxShadow: "var(--shadow-gold)",
                  maskImage:
                    "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent), linear-gradient(to right, black 70%, transparent)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent), linear-gradient(to right, black 70%, transparent)",
                  maskComposite: "intersect",
                  WebkitMaskComposite: "source-in",
                }}
              />
              <p className="relative text-sm leading-relaxed text-foreground">{niche.intro}</p>
            </div>
          )}
          {niche.description.length > 0 && (
            <div className="space-y-4">
              {niche.description.map((p) => (
                <p key={p} className="text-sm leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
            </div>
          )}
          {niche.highlights.length > 0 && (
            <ul className="grid gap-2 sm:grid-cols-3">
              {niche.highlights.map((h) => (
                <li key={h} className="relative overflow-hidden px-4 py-3 text-center">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gold/10 backdrop-blur-sm"
                    style={{
                      boxShadow: "var(--shadow-gold)",
                      maskImage:
                        "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent), linear-gradient(to right, transparent, black 30%, black 70%, transparent)",
                      WebkitMaskImage:
                        "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent), linear-gradient(to right, transparent, black 30%, black 70%, transparent)",
                      maskComposite: "intersect",
                      WebkitMaskComposite: "source-in",
                    }}
                  />
                  <span className="font-condensed relative text-[0.7rem] uppercase tracking-[0.2em] text-foreground">
                    {h}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </Editable>

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
