import type { Placement } from "@/api/domain/placement/Placement";
import type {
  FindBySurfaceOptions,
  PlacementRepository,
} from "@/api/domain/placement/PlacementRepository";
import { MOCK_NICHE_SLUGS } from "./nicheSlugs";

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
    placement({ photoId, surface: "hero", refId: null, caption: null, order }),
  ),
  placement({
    photoId: "quemsou-capa",
    surface: "quem-sou",
    refId: null,
    caption: "capa",
    order: 0,
  }),
  placement({
    photoId: "quemsou-polaroid-1",
    surface: "quem-sou",
    refId: null,
    caption: "polaroid-1",
    order: 1,
  }),
  placement({
    photoId: "quemsou-altar",
    surface: "quem-sou",
    refId: null,
    caption: "altar",
    order: 2,
  }),
  placement({
    photoId: "quemsou-polaroid-2",
    surface: "quem-sou",
    refId: null,
    caption: "polaroid-2",
    order: 3,
  }),
  ...["galeria-1", "galeria-2", "gestante-1", "familia-1", "galeria-3", "gestante-2"].map(
    (photoId, order) =>
      placement({
        photoId,
        surface: "home-gallery",
        refId: null,
        caption: galleryLabel(photoId),
        order,
      }),
  ),
  // 2 fotos por nicho — ver nicheSlugs.ts pra por quê a cobertura dos 7
  // slugs reais precisa ser completa (getEventNiches usa 3 dos 7).
  ...MOCK_NICHE_SLUGS.flatMap((slug) =>
    [`${slug}-1`, `${slug}-2`].map((photoId, order) =>
      placement({ photoId, surface: "niche", refId: slug, caption: null, order }),
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
