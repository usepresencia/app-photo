import type { Metadata } from "next";
import { getBrand } from "@/actions/brand";

// Sem isso, o Next prerenderiza esta página como estática no build (não
// há segmento dinâmico nem uso de cookies()/headers() que force isso
// sozinho) — e como o build do Docker roda sem credenciais reais do
// Firebase (só passadas em runtime via env do container), a página
// ficaria congelada pra sempre com os dados mock do build, ignorando
// qualquer revalidação de tag depois. Ver Hero/About/Niches/Testimonials,
// que leem o mesmo Firestore via Server Components abaixo desta página.
export const dynamic = "force-dynamic";
import { getGalleryPhotos } from "@/actions/gallery";
import { Hero } from "./_components/Hero";
import { About } from "./_components/About";
import { Gallery } from "./_components/Gallery";
import { Niches } from "./_components/Niches";
import { Events } from "./_components/Events";
import { Testimonials } from "./_components/Testimonials";

const title = "Denise Galvão | Fotografia de ensaios e eventos";
const description =
  "Valorize sua imagem com um ensaio pensado nos mínimos detalhes, unindo direção estratégica, estética e autenticidade. Cada sessão é conduzida de forma personalizada, respeitando seu estilo, objetivo e essência.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: "website" },
  // "summary" (e não "summary_large_image") porque a imagem de
  // compartilhamento é o próprio logo quadrado (src/app/opengraph-image.png),
  // que aparece como miniatura ao lado do texto. Declarar o card grande com
  // uma imagem quadrada faz o WhatsApp esticá-la num banner com tarjas.
  twitter: { card: "summary" },
};

export default async function HomePage() {
  const [brand, galleryPhotos] = await Promise.all([getBrand(), getGalleryPhotos()]);

  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <About />
      <Gallery photos={galleryPhotos} />
      <Niches />
      <Events whatsapp={brand.whatsapp} />
      <Testimonials />
    </main>
  );
}
