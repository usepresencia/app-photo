import type { PhotoRepository } from "@/api/domain/photo/PhotoRepository";
import type {
  FindBySurfaceOptions,
  PlacementRepository,
} from "@/api/domain/placement/PlacementRepository";
import type { PhotoSurface } from "@/api/domain/placement/Placement";
import type { PlacedPhotoDTO } from "./PlacedPhotoDTO";

export class GetPhotosBySurfaceUseCase {
  constructor(
    private readonly placements: PlacementRepository,
    private readonly photos: PhotoRepository,
  ) {}

  async execute(surface: PhotoSurface, opts?: FindBySurfaceOptions): Promise<PlacedPhotoDTO[]> {
    const placements = await this.placements.findBySurface(surface, opts);
    if (placements.length === 0) return [];

    const photos = await this.photos.findByIds(placements.map((p) => p.photoId));
    const byId = new Map(photos.map((photo) => [photo.id, photo]));

    const result: PlacedPhotoDTO[] = [];
    for (const placement of placements) {
      const photo = byId.get(placement.photoId);
      if (!photo) continue; // placement órfão (foto apagada) — ignora, não quebra a página
      result.push({ ...photo, placementId: placement.id, role: placement.role });
    }
    return result;
  }
}
