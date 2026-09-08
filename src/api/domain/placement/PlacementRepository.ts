import type { Placement, PhotoSurface } from "./Placement";

export interface FindBySurfaceOptions {
  refId?: string;
}

export interface PlacementRepository {
  /** Já devolve ordenado por `order` ascendente. */
  findBySurface(surface: PhotoSurface, opts?: FindBySurfaceOptions): Promise<Placement[]>;
}
