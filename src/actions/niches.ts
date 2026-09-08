import photosByCategory from "./_mock/photos.json";
import type { Photo } from "./_mock/types";
import type { NicheDTO } from "@/api/application/niche/NicheDTO";
import { GetNichesUseCase } from "@/api/application/niche/GetNichesUseCase";
import { GetNicheBySlugUseCase } from "@/api/application/niche/GetNicheBySlugUseCase";
import { RepositoryFactory } from "@/api/infrastructure/repositories/RepositoryFactory";

export interface Niche {
  slug: string;
  title: string;
  subtitle: string;
  image: Photo;
  intro: string;
  description: string[];
  highlights: string[];
  closingLine: string;
  gallery: Photo[];
}

const photos = photosByCategory as Record<string, Photo[]>;

// Mapa temporário slug → categorias de foto. O texto do nicho já vem do
// Firestore (via GetNichesUseCase); a foto continua vindo do pipeline local
// até o plano 3 (spec, seção "Modelo de conteúdo" — Photo/Placement) migrar
// isso também. Nenhum comportamento visível muda enquanto isso não acontece.
const NICHE_PHOTO_CATEGORIES: Record<string, string[]> = {
  "retratos-profissionais": ["profissional", "corporativo", "pessoal"],
  "making-of-da-noiva": ["making-of-noiva"],
  "aniversario-e-eventos": ["evento-aniversario"],
  "casamento-civil": ["casamento-civil"],
  comercial: ["comercial"],
  familia: ["familia"],
  gestante: ["gestante"],
};

function nichePhotos(slug: string): Photo[] {
  const categories = NICHE_PHOTO_CATEGORIES[slug] ?? [];
  return categories.flatMap((c) => photos[c] ?? []);
}

function withPhotos(dto: NicheDTO): Niche {
  const gallery = nichePhotos(dto.slug);
  return {
    slug: dto.slug,
    title: dto.title,
    subtitle: dto.subtitle,
    intro: dto.intro,
    description: dto.description,
    highlights: dto.highlights,
    closingLine: dto.closingLine,
    gallery,
    image: gallery[0],
  };
}

export async function getNiches(): Promise<Niche[]> {
  const dtos = await new GetNichesUseCase(RepositoryFactory.niches()).execute();
  return dtos.map(withPhotos);
}

export async function getNicheBySlug(slug: string): Promise<Niche | null> {
  const dto = await new GetNicheBySlugUseCase(RepositoryFactory.niches()).execute(slug);
  return dto ? withPhotos(dto) : null;
}

// Substitui getEventFormats() de events.ts (removido nesta task) — a seção
// "Eventos" da home agora é uma vitrine filtrada de Niche, não uma cópia
// manual. Ver spec, "Achado que muda o modelo".
export async function getEventNiches(): Promise<Niche[]> {
  const dtos = await new GetNichesUseCase(RepositoryFactory.niches()).execute();
  return dtos
    .filter((n) => n.showAsEventTeaser)
    .sort((a, b) => (a.eventOrder ?? 0) - (b.eventOrder ?? 0))
    .map(withPhotos);
}
