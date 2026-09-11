import type { Photo } from "./_mock/types";
import type { NicheDTO } from "@/api/application/niche/NicheDTO";
import { GetNichesUseCase } from "@/api/application/niche/GetNichesUseCase";
import { GetNicheBySlugUseCase } from "@/api/application/niche/GetNicheBySlugUseCase";
import { RepositoryFactory } from "@/api/infrastructure/repositories/RepositoryFactory";
import {
  getPhotosBySurface,
  toLabeledPhoto,
  type LabeledPhoto,
} from "./_shared/getPhotosBySurface";

export interface Niche {
  slug: string;
  title: string;
  subtitle: string;
  image: Photo;
  intro: string;
  description: string[];
  highlights: string[];
  closingLine: string;
  gallery: LabeledPhoto[];
}

// image é gallery[0] — a mesma foto, não uma capa exclusiva. Assim
// sempre foi (ver plano 1); um caption "capa" separado tiraria uma foto
// da galeria da própria página do nicho, mudando quantas fotos ela mostra.
async function withPhotos(dto: NicheDTO): Promise<Niche> {
  const photos = await getPhotosBySurface("niche", { refId: dto.slug });
  const gallery = photos.map(toLabeledPhoto);
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
  const dtos = await new GetNichesUseCase(await RepositoryFactory.niches()).execute();
  return Promise.all(dtos.map(withPhotos));
}

export async function getNicheBySlug(slug: string): Promise<Niche | null> {
  const dto = await new GetNicheBySlugUseCase(await RepositoryFactory.niches()).execute(slug);
  return dto ? withPhotos(dto) : null;
}

// Complemento exato de getEventNiches(): um nicho marcado como evento
// aparece SÓ na seção Eventos, fora do carrossel de ensaios. getNiches()
// segue devolvendo todos de propósito — o sitemap precisa deles, já que
// nicho de evento continua tendo página própria em /ensaios/[slug].
export async function getNonEventNiches(): Promise<Niche[]> {
  const dtos = await new GetNichesUseCase(await RepositoryFactory.niches()).execute();
  const carouselDtos = dtos.filter((n) => !n.showAsEventTeaser).sort((a, b) => a.order - b.order);
  return Promise.all(carouselDtos.map(withPhotos));
}

export async function getEventNiches(): Promise<Niche[]> {
  const dtos = await new GetNichesUseCase(await RepositoryFactory.niches()).execute();
  const eventDtos = dtos
    .filter((n) => n.showAsEventTeaser)
    .sort((a, b) => (a.eventOrder ?? 0) - (b.eventOrder ?? 0));
  return Promise.all(eventDtos.map(withPhotos));
}
