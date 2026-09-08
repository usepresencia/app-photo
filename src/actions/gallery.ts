import photosByCategory from "./_mock/photos.json";
import type { Photo } from "./_mock/types";
import type { PlacedPhotoDTO } from "@/api/application/photo/PlacedPhotoDTO";
import { GetPhotosBySurfaceUseCase } from "@/api/application/photo/GetPhotosBySurfaceUseCase";
import { RepositoryFactory } from "@/api/infrastructure/repositories/RepositoryFactory";

const photos = photosByCategory as Record<string, Photo[]>;

function toPhoto(p: PlacedPhotoDTO): Photo {
  return { src: p.src, width: p.width, height: p.height, blurDataURL: p.blurDataURL };
}

// As primeiras fotos de família são exclusivas da seção "Quem sou". Galeria e
// hero começam depois delas para não repetir na vitrine os registros pessoais.
const ABOUT_FAMILY_COUNT = 4;

const GALLERY_SIZE = 18;

const GALLERY_CATEGORIES = [
  { slug: "familia", label: "família" },
  { slug: "gestante", label: "gestante" },
  { slug: "profissional", label: "profissional" },
  { slug: "evento-aniversario", label: "aniversário" },
  { slug: "casamento-civil", label: "casamento" },
];

export interface GalleryPhoto extends Photo {
  label: string;
}

/** Fotos de uma categoria, já sem as que a seção "Quem sou" reserva. */
function categoria(slug: string): Photo[] {
  const pool = photos[slug] ?? [];
  return slug === "familia" ? pool.slice(ABOUT_FAMILY_COUNT) : pool;
}

/**
 * Intercala as categorias por rodadas, para que os primeiros itens — a primeira
 * página do álbum, os primeiros quadros do filme — já venham variados em vez de
 * abrir com uma sequência inteira da mesma categoria.
 */
function intercalar<T>(pools: T[][], limite: number): T[] {
  const ordenado: T[] = [];
  for (let rodada = 0; ordenado.length < limite; rodada++) {
    const rodadaAtual = pools
      .map((pool) => pool[rodada])
      .filter((item): item is T => Boolean(item));
    if (rodadaAtual.length === 0) break;
    ordenado.push(...rodadaAtual);
  }
  return ordenado.slice(0, limite);
}

export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  const pools = GALLERY_CATEGORIES.map(({ slug, label }) =>
    categoria(slug).map((photo) => ({ ...photo, label })),
  );
  return intercalar(pools, GALLERY_SIZE);
}

export async function getAboutPhotos(): Promise<{ family: Photo[] }> {
  const photos = await new GetPhotosBySurfaceUseCase(
    RepositoryFactory.placements(),
    RepositoryFactory.photos(),
  ).execute("quem-sou");
  return { family: photos.map(toPhoto) };
}

export async function getHeroPhotos(): Promise<Photo[]> {
  const photos = await new GetPhotosBySurfaceUseCase(
    RepositoryFactory.placements(),
    RepositoryFactory.photos(),
  ).execute("hero");
  return photos.map(toPhoto);
}
