import photosByCategory from "./_mock/photos.json";
import type { Photo } from "./_mock/types";

const photos = photosByCategory as Record<string, Photo[]>;

const GALLERY_CATEGORIES = [
  "familia",
  "gestante",
  "profissional",
  "evento-aniversario",
  "casamento-civil",
];

export async function getGalleryPhotos(): Promise<Photo[]> {
  return GALLERY_CATEGORIES.flatMap((category) => photos[category] ?? []).slice(0, 18);
}

export async function getAboutPhotos(): Promise<{ family: Photo[]; work: Photo[] }> {
  return {
    family: photos.familia.slice(0, 3),
    work: photos.profissional.slice(0, 3),
  };
}

function isHorizontal(photo: Photo): boolean {
  return photo.width > photo.height;
}

export async function getHeroPhotos(): Promise<Photo[]> {
  return [
    ...photos.familia.filter(isHorizontal).slice(0, 4),
    ...photos.gestante.filter(isHorizontal).slice(0, 4),
    ...photos["evento-aniversario"].filter(isHorizontal).slice(0, 4),
  ];
}
