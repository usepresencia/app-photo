import type { Photo } from "./_mock/types";
import type { NicheDTO } from "@/api/application/niche/NicheDTO";
import type { PlacedPhotoDTO } from "@/api/application/photo/PlacedPhotoDTO";
import { GetNichesUseCase } from "@/api/application/niche/GetNichesUseCase";
import { GetNicheBySlugUseCase } from "@/api/application/niche/GetNicheBySlugUseCase";
import { GetPhotosBySurfaceUseCase } from "@/api/application/photo/GetPhotosBySurfaceUseCase";
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

// Cópia local do mesmo helper que a Task 3 adicionou em gallery.ts —
// arquivo diferente, sem um lugar compartilhado óbvio pra uma função de
// 4 campos; duplicar é mais simples que criar um módulo só pra isso.
function toPhoto(p: PlacedPhotoDTO): Photo {
  return { src: p.src, width: p.width, height: p.height, blurDataURL: p.blurDataURL };
}

// image é gallery[0] — a mesma foto, não uma capa exclusiva. Assim
// sempre foi (ver plano 1); um role "capa" separado tiraria uma foto da
// galeria da própria página do nicho, mudando quantas fotos ela mostra.
async function withPhotos(dto: NicheDTO): Promise<Niche> {
  const photos = await new GetPhotosBySurfaceUseCase(
    RepositoryFactory.placements(),
    RepositoryFactory.photos(),
  ).execute("niche", { refId: dto.slug });
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
