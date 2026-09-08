import { describe, expect, it } from "vitest";
import { getAboutPhotos, getGalleryPhotos, getHeroPhotos } from "./gallery";

describe("getGalleryPhotos", () => {
  it("retorna 18 fotos, todas do diretório /fotos e com legenda", async () => {
    const photos = await getGalleryPhotos();
    expect(photos).toHaveLength(18);
    for (const photo of photos) {
      expect(photo.src).toMatch(/^\/fotos\//);
      expect(photo.label).toBeTruthy();
    }
  });

  it("mostra trabalhos de várias categorias, não só de uma", async () => {
    const photos = await getGalleryPhotos();
    const categorias = new Set(photos.map((photo) => photo.label));
    expect(categorias.size).toBeGreaterThan(1);
  });

  it("não repete as fotos reservadas para a seção Quem sou", async () => {
    const [galeria, { family }] = await Promise.all([getGalleryPhotos(), getAboutPhotos()]);
    const usadasNoAbout = new Set(family.map((photo) => photo.src));
    for (const photo of galeria) {
      expect(usadasNoAbout.has(photo.src)).toBe(false);
    }
  });
});

describe("getAboutPhotos", () => {
  it("retorna 4 fotos de família", async () => {
    const { family } = await getAboutPhotos();
    expect(family).toHaveLength(4);
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
