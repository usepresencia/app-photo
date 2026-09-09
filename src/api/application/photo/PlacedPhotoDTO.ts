export interface PlacedPhotoDTO {
  id: string;
  placementId: string;
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
  role: string | null;
}
