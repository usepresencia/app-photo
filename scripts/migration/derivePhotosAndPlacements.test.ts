import { describe, expect, it } from "vitest";
import photosByCategory from "@/actions/_mock/photos.json";
import { deriveFotos, derivePlacements, type RawPhoto } from "./derivePhotosAndPlacements";

const photos = photosByCategory as Record<string, RawPhoto[]>;

const NICHE_SLUGS = [
  "retratos-profissionais",
  "making-of-da-noiva",
  "aniversario-e-eventos",
  "casamento-civil",
  "comercial",
  "familia",
  "gestante",
];

describe("deriveFotos", () => {
  it("deriva as 87 fotos reais, uma por slug, sem duplicar", () => {
    const fotos = deriveFotos(photos);
    expect(fotos).toHaveLength(87);
    expect(new Set(fotos.map((f) => f.id)).size).toBe(87);
  });
});

describe("derivePlacements", () => {
  it("hero: só fotos horizontais, no máximo 12", () => {
    const placements = derivePlacements(photos).filter((p) => p.surface === "hero");
    expect(placements.length).toBeGreaterThan(0);
    expect(placements.length).toBeLessThanOrEqual(12);
  });

  it("quem-sou: exatamente 4 placements, captions capa/polaroid-1/altar/polaroid-2 em ordem", () => {
    const placements = derivePlacements(photos)
      .filter((p) => p.surface === "quem-sou")
      .sort((a, b) => a.order - b.order);
    expect(placements.map((p) => p.caption)).toEqual(["capa", "polaroid-1", "altar", "polaroid-2"]);
  });

  it("home-gallery: no máximo 18, cada um com caption preenchido", () => {
    const placements = derivePlacements(photos).filter((p) => p.surface === "home-gallery");
    expect(placements.length).toBeGreaterThan(0);
    expect(placements.length).toBeLessThanOrEqual(18);
    for (const p of placements) expect(p.caption).toBeTruthy();
  });

  it("nicho: cada um dos 7 slugs reais tem pelo menos 1 placement", () => {
    const placements = derivePlacements(photos).filter((p) => p.surface === "niche");
    for (const slug of NICHE_SLUGS) {
      expect(placements.filter((p) => p.refId === slug).length).toBeGreaterThan(0);
    }
  });

  it("retratos-profissionais tem 20 fotos na galeria (profissional+corporativo+pessoal)", () => {
    const placements = derivePlacements(photos).filter((p) => p.refId === "retratos-profissionais");
    expect(placements).toHaveLength(20);
  });

  it("nenhum placement referencia uma foto que deriveFotos não produziu", () => {
    const fotoIds = new Set(deriveFotos(photos).map((f) => f.id));
    for (const placement of derivePlacements(photos)) {
      expect(fotoIds.has(placement.photoId)).toBe(true);
    }
  });
});
