export type PhotoSurface = "hero" | "quem-sou" | "home-gallery" | "niche" | "package";

export interface Placement {
  id: string;
  photoId: string;
  surface: PhotoSurface;
  /** slug do nicho ou id do pacote — null em hero/quem-sou/home-gallery. */
  refId: string | null;
  /** legenda da foto na superfície (ex.: "capa", "polaroid-1"; texto
   *  exibido em home-gallery/niche/quem-sou) — null onde não se aplica. */
  caption: string | null;
  order: number;
}
