export type PhotoSurface = "hero" | "quem-sou" | "home-gallery" | "niche" | "package";

export interface Placement {
  id: string;
  photoId: string;
  surface: PhotoSurface;
  /** slug do nicho ou id do pacote — null em hero/quem-sou/home-gallery. */
  refId: string | null;
  /** papel da foto na superfície (ex.: "capa", "polaroid-1"; label de
   *  categoria em home-gallery) — null onde não se aplica. */
  role: string | null;
  order: number;
}
