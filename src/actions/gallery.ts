import type { Photo } from "./_mock/types";
import {
  getPhotosBySurface,
  toLabeledPhoto,
  toPhoto,
  type LabeledPhoto,
} from "./_shared/getPhotosBySurface";

export async function getAboutPhotos(): Promise<{ family: LabeledPhoto[] }> {
  const photos = await getPhotosBySurface("quem-sou");
  return { family: photos.map(toLabeledPhoto) };
}

export async function getHeroPhotos(): Promise<Photo[]> {
  const photos = await getPhotosBySurface("hero");
  return photos.map(toPhoto);
}
