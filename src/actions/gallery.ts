import type { Photo } from "./_mock/types";
import { getPhotosBySurface, toPhoto } from "./_shared/getPhotosBySurface";

export interface GalleryPhoto extends Photo {
  label: string;
}

export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  const photos = await getPhotosBySurface("home-gallery");
  return photos.map((p) => ({ ...toPhoto(p), label: p.role ?? "" }));
}

export async function getAboutPhotos(): Promise<{ family: Photo[] }> {
  const photos = await getPhotosBySurface("quem-sou");
  return { family: photos.map(toPhoto) };
}

export async function getHeroPhotos(): Promise<Photo[]> {
  const photos = await getPhotosBySurface("hero");
  return photos.map(toPhoto);
}
