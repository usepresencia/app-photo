import type { PhotoSurface } from "@/api/domain/placement/Placement";

export interface RawPhoto {
  slug: string;
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
}

export interface DerivedFoto {
  id: string;
  localPath: string;
  width: number;
  height: number;
  blurDataURL: string;
}

export interface DerivedPlacement {
  photoId: string;
  surface: PhotoSurface;
  refId: string | null;
  role: string | null;
  order: number;
}

// Reimplementação verbatim de gallery.ts/niches.ts de antes do plano 3
// remover ("categoria()"/"intercalar()"/"isHorizontal()" — commit
// 7eadcb8^; "NICHE_PHOTO_CATEGORIES"/"nichePhotos()" — commit 052d7f9^).
// Não é reinvenção: é a mesma lógica, rodando uma última vez, transformando
// photos.json real em Placement concretos — depois disso, o algoritmo não
// existe em nenhum lugar do código, só aqui, e só até este script rodar.
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

const ABOUT_ROLES = ["capa", "polaroid-1", "altar", "polaroid-2"];

const NICHE_PHOTO_CATEGORIES: Record<string, string[]> = {
  "retratos-profissionais": ["profissional", "corporativo", "pessoal"],
  "making-of-da-noiva": ["making-of-noiva"],
  "aniversario-e-eventos": ["evento-aniversario"],
  "casamento-civil": ["casamento-civil"],
  comercial: ["comercial"],
  familia: ["familia"],
  gestante: ["gestante"],
};

function categoria(photos: Record<string, RawPhoto[]>, slug: string): RawPhoto[] {
  const pool = photos[slug] ?? [];
  return slug === "familia" ? pool.slice(ABOUT_FAMILY_COUNT) : pool;
}

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

function isHorizontal(photo: RawPhoto): boolean {
  return photo.width > photo.height;
}

export function deriveFotos(photos: Record<string, RawPhoto[]>): DerivedFoto[] {
  return Object.values(photos)
    .flat()
    .map((photo) => ({
      id: photo.slug,
      localPath: photo.src,
      width: photo.width,
      height: photo.height,
      blurDataURL: photo.blurDataURL,
    }));
}

export function derivePlacements(photos: Record<string, RawPhoto[]>): DerivedPlacement[] {
  const placements: DerivedPlacement[] = [];

  const heroPools = HERO_CATEGORIES.map((slug) => categoria(photos, slug).filter(isHorizontal));
  intercalar(heroPools, HERO_SIZE).forEach((photo, order) => {
    placements.push({ photoId: photo.slug, surface: "hero", refId: null, role: null, order });
  });

  (photos.familia ?? []).slice(0, ABOUT_FAMILY_COUNT).forEach((photo, order) => {
    placements.push({
      photoId: photo.slug,
      surface: "quem-sou",
      refId: null,
      role: ABOUT_ROLES[order],
      order,
    });
  });

  const galleryPools = GALLERY_CATEGORIES.map(({ slug, label }) =>
    categoria(photos, slug).map((photo) => ({ ...photo, label })),
  );
  intercalar(galleryPools, GALLERY_SIZE).forEach((photo, order) => {
    placements.push({
      photoId: photo.slug,
      surface: "home-gallery",
      refId: null,
      role: photo.label,
      order,
    });
  });

  for (const [nicheSlug, categorias] of Object.entries(NICHE_PHOTO_CATEGORIES)) {
    const galeria = categorias.flatMap((c) => photos[c] ?? []);
    galeria.forEach((photo, order) => {
      placements.push({
        photoId: photo.slug,
        surface: "niche",
        refId: nicheSlug,
        role: null,
        order,
      });
    });
  }

  return placements;
}
