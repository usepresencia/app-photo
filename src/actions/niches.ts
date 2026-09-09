import type { Photo } from "./_mock/types";
import type { NicheDTO } from "@/api/application/niche/NicheDTO";
import { GetNichesUseCase } from "@/api/application/niche/GetNichesUseCase";
import { GetNicheBySlugUseCase } from "@/api/application/niche/GetNicheBySlugUseCase";
import { RepositoryFactory } from "@/api/infrastructure/repositories/RepositoryFactory";
import { getPhotosBySurface, toPhoto } from "./_shared/getPhotosBySurface";

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

// image é gallery[0] — a mesma foto, não uma capa exclusiva. Assim
// sempre foi (ver plano 1); um role "capa" separado tiraria uma foto da
// galeria da própria página do nicho, mudando quantas fotos ela mostra.
async function withPhotos(dto: NicheDTO): Promise<Niche> {
  const photos = await getPhotosBySurface("niche", { refId: dto.slug });
  const gallery = photos.map(toPhoto);
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
  return Promise.all(dtos.map(withPhotos));
}

export async function getNicheBySlug(slug: string): Promise<Niche | null> {
  const dto = await new GetNicheBySlugUseCase(RepositoryFactory.niches()).execute(slug);
  return dto ? withPhotos(dto) : null;
}

export async function getEventNiches(): Promise<Niche[]> {
  const dtos = await new GetNichesUseCase(RepositoryFactory.niches()).execute();
  const eventDtos = dtos
    .filter((n) => n.showAsEventTeaser)
    .sort((a, b) => (a.eventOrder ?? 0) - (b.eventOrder ?? 0));
  return Promise.all(eventDtos.map(withPhotos));
}
