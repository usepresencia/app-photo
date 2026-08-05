import { describe, expect, it } from "vitest";
import { getAboutPhotos, getGalleryPhotos, getHeroPhotos } from "./gallery";

describe("getGalleryPhotos", () => {
  it("retorna no máximo 18 fotos, todas do diretório /fotos", async () => {
    const photos = await getGalleryPhotos();
    expect(photos.length).toBeGreaterThan(0);
    expect(photos.length).toBeLessThanOrEqual(18);
    for (const photo of photos) {
      expect(photo.src).toMatch(/^\/fotos\//);
    }
  });
});

describe("getAboutPhotos", () => {
  it("retorna 3 fotos de família e 3 de profissão", async () => {
    const { family, work } = await getAboutPhotos();
    expect(family).toHaveLength(3);
    expect(work).toHaveLength(3);
  });
});

describe("getHeroPhotos", () => {
  it("retorna 12 fotos combinando família, gestante e evento-aniversário", async () => {
    const photos = await getHeroPhotos();
    expect(photos).toHaveLength(12);
  });
});
