import type { Photo } from "./_mock/types";
import type { PlacedPhotoDTO } from "@/api/application/photo/PlacedPhotoDTO";
import { GetPhotosBySurfaceUseCase } from "@/api/application/photo/GetPhotosBySurfaceUseCase";
import { RepositoryFactory } from "@/api/infrastructure/repositories/RepositoryFactory";

function toPhoto(p: PlacedPhotoDTO): Photo {
  return { src: p.src, width: p.width, height: p.height, blurDataURL: p.blurDataURL };
}

export interface GalleryPhoto extends Photo {
  label: string;
}

export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  const photos = await new GetPhotosBySurfaceUseCase(
    RepositoryFactory.placements(),
    RepositoryFactory.photos(),
  ).execute("home-gallery");
  return photos.map((p) => ({ ...toPhoto(p), label: p.role ?? "" }));
}

export async function getAboutPhotos(): Promise<{ family: Photo[] }> {
  const photos = await new GetPhotosBySurfaceUseCase(
    RepositoryFactory.placements(),
    RepositoryFactory.photos(),
  ).execute("quem-sou");
  return { family: photos.map(toPhoto) };
}

export async function getHeroPhotos(): Promise<Photo[]> {
  const photos = await new GetPhotosBySurfaceUseCase(
    RepositoryFactory.placements(),
    RepositoryFactory.photos(),
  ).execute("hero");
  return photos.map(toPhoto);
}
