import type { Photo } from "@/api/domain/photo/Photo";
import type { PhotoRepository } from "@/api/domain/photo/PhotoRepository";

// Conjunto pequeno e sintético — não tenta espelhar as 87 fotos reais
// (isso é trabalho do script de migração, plano 5). Nomeado por
// propósito ("hero-1", "quemsou-capa") pra ficar legível nos testes e no
// MockPlacementRepository, que referencia estes IDs.
export const MOCK_PHOTOS: Photo[] = [
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `hero-${i + 1}`,
    src: `/fotos/mock/hero-${i + 1}.webp`,
    width: 1600,
    height: 1067,
    blurDataURL: "data:image/webp;base64,AA",
  })),
  {
    id: "quemsou-capa",
    src: "/fotos/mock/quemsou-capa.webp",
    width: 935,
    height: 1280,
    blurDataURL: "data:image/webp;base64,AA",
  },
  {
    id: "quemsou-polaroid-1",
    src: "/fotos/mock/quemsou-polaroid-1.webp",
    width: 1179,
    height: 2096,
    blurDataURL: "data:image/webp;base64,AA",
  },
  {
    id: "quemsou-altar",
    src: "/fotos/mock/quemsou-altar.webp",
    width: 1600,
    height: 1067,
    blurDataURL: "data:image/webp;base64,AA",
  },
  {
    id: "quemsou-polaroid-2",
    src: "/fotos/mock/quemsou-polaroid-2.webp",
    width: 1600,
    height: 2397,
    blurDataURL: "data:image/webp;base64,AA",
  },
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `galeria-${i + 1}`,
    src: `/fotos/mock/galeria-${i + 1}.webp`,
    width: 1600,
    height: 1200,
    blurDataURL: "data:image/webp;base64,AA",
  })),
  // Uma foto por nicho, pros 7 slugs reais de niches.ts — Niches.tsx (a
  // home inteira) renderiza niche.image.src pros 7 cards; faltando
  // qualquer um, a página quebra em runtime com o mock, não só um teste.
  ...[
    "retratos-profissionais",
    "gestante",
    "familia",
    "comercial",
    "casamento-civil",
    "aniversario-e-eventos",
    "making-of-da-noiva",
  ].flatMap((slug) =>
    Array.from({ length: 2 }, (_, i) => ({
      id: `${slug}-${i + 1}`,
      src: `/fotos/mock/${slug}-${i + 1}.webp`,
      width: 1600,
      height: 1200,
      blurDataURL: "data:image/webp;base64,AA",
    })),
  ),
];

export class MockPhotoRepository implements PhotoRepository {
  async findByIds(ids: string[]): Promise<Photo[]> {
    if (ids.length === 0) return [];
    const set = new Set(ids);
    return MOCK_PHOTOS.filter((photo) => set.has(photo.id));
  }
}
