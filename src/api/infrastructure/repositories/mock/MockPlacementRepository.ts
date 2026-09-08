import type { Placement } from "@/api/domain/placement/Placement";
import type {
  FindBySurfaceOptions,
  PlacementRepository,
} from "@/api/domain/placement/PlacementRepository";

let nextId = 1;
function placement(p: Omit<Placement, "id">): Placement {
  return { id: `mock-placement-${nextId++}`, ...p };
}

function galleryLabel(photoId: string): string {
  if (photoId.startsWith("gestante")) return "gestante";
  if (photoId.startsWith("familia")) return "família";
  return "galeria";
}

const PLACEMENTS: Placement[] = [
  ...["hero-1", "hero-2", "hero-3", "hero-4"].map((photoId, order) =>
    placement({ photoId, surface: "hero", refId: null, role: null, order }),
  ),
  placement({ photoId: "quemsou-capa", surface: "quem-sou", refId: null, role: "capa", order: 0 }),
  placement({
    photoId: "quemsou-polaroid-1",
    surface: "quem-sou",
    refId: null,
    role: "polaroid-1",
    order: 1,
  }),
  placement({
    photoId: "quemsou-altar",
    surface: "quem-sou",
    refId: null,
    role: "altar",
    order: 2,
  }),
  placement({
    photoId: "quemsou-polaroid-2",
    surface: "quem-sou",
    refId: null,
    role: "polaroid-2",
    order: 3,
  }),
  ...["galeria-1", "galeria-2", "gestante-1", "familia-1", "galeria-3", "gestante-2"].map(
    (photoId, order) =>
      placement({
        photoId,
        surface: "home-gallery",
        refId: null,
        role: galleryLabel(photoId),
        order,
      }),
  ),
  // 2 fotos por nicho, pros 7 slugs reais — cobertura completa: Niches.tsx
  // (home) e getEventNiches (3 dos 7) precisam de niche.image em todos.
  ...[
    "retratos-profissionais",
    "gestante",
    "familia",
    "comercial",
    "casamento-civil",
    "aniversario-e-eventos",
    "making-of-da-noiva",
  ].flatMap((slug) =>
    [`${slug}-1`, `${slug}-2`].map((photoId, order) =>
      placement({ photoId, surface: "niche", refId: slug, role: null, order }),
    ),
  ),
];

export class MockPlacementRepository implements PlacementRepository {
  async findBySurface(
    surface: Placement["surface"],
    opts?: FindBySurfaceOptions,
  ): Promise<Placement[]> {
    return PLACEMENTS.filter(
      (p) => p.surface === surface && (opts?.refId === undefined || p.refId === opts.refId),
    ).sort((a, b) => a.order - b.order);
  }
}
