import photosByCategory from "./_mock/photos.json";
import type { Photo } from "./_mock/types";

const photos = photosByCategory as Record<string, Photo[]>;

// As primeiras fotos de família são exclusivas da seção "Quem sou". Galeria e
// hero começam depois delas para não repetir na vitrine os registros pessoais.
const ABOUT_FAMILY_COUNT = 4;

const GALLERY_SIZE = 18;
const HERO_SIZE = 12;

const GALLERY_CATEGORIES = [
  { slug: "familia", label: "família" },
  { slug: "gestante", label: "gestante" },
  { slug: "profissional", label: "profissional" },
  { slug: "evento-aniversario", label: "aniversário" },
  { slug: "casamento-civil", label: "casamento" },
];

const HERO_CATEGORIES = ["familia", "gestante", "evento-aniversario"];

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

function isHorizontal(photo: Photo): boolean {
  return photo.width > photo.height;
}

export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  const pools = GALLERY_CATEGORIES.map(({ slug, label }) =>
    categoria(slug).map((photo) => ({ ...photo, label })),
  );
  return intercalar(pools, GALLERY_SIZE);
}

export async function getAboutPhotos(): Promise<{ family: Photo[] }> {
  return {
    family: photos.familia.slice(0, ABOUT_FAMILY_COUNT),
  };
}

export async function getHeroPhotos(): Promise<Photo[]> {
  const pools = HERO_CATEGORIES.map((slug) => categoria(slug).filter(isHorizontal));
  return intercalar(pools, HERO_SIZE);
}
