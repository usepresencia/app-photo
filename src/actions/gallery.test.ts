import { describe, expect, it } from "vitest";
import { getAboutPhotos, getHeroPhotos } from "./gallery";

describe("getAboutPhotos", () => {
  it("retorna as 4 fotos de Quem sou, na ordem capa/polaroid-1/altar/polaroid-2", async () => {
    const { family } = await getAboutPhotos();
    expect(family).toHaveLength(4);
    for (const photo of family) {
      expect(photo.src).toMatch(/^\/fotos\//);
    }
  });
});

describe("getHeroPhotos", () => {
  it("retorna apenas fotos horizontais", async () => {
    const photos = await getHeroPhotos();
    expect(photos.length).toBeGreaterThan(0);
    for (const photo of photos) {
      expect(photo.width).toBeGreaterThan(photo.height);
    }
  });

  it("retorna as fotos na ordem dos placements", async () => {
    const photos = await getHeroPhotos();
    expect(photos.length).toBeGreaterThan(0);
    for (const photo of photos) {
      expect(photo.src).toMatch(/^\/fotos\//);
    }
  });

  it("não usa as fotos reservadas para a seção Quem sou", async () => {
    const [hero, { family }] = await Promise.all([getHeroPhotos(), getAboutPhotos()]);
    const reservadas = new Set(family.map((photo) => photo.src));
    for (const photo of hero) {
      expect(reservadas.has(photo.src)).toBe(false);
    }
  });
});
