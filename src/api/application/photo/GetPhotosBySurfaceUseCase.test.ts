import { describe, expect, it } from "vitest";
import { MockPhotoRepository } from "@/api/infrastructure/repositories/mock/MockPhotoRepository";
import { MockPlacementRepository } from "@/api/infrastructure/repositories/mock/MockPlacementRepository";
import { GetPhotosBySurfaceUseCase } from "./GetPhotosBySurfaceUseCase";

function useCase() {
  return new GetPhotosBySurfaceUseCase(new MockPlacementRepository(), new MockPhotoRepository());
}

describe("GetPhotosBySurfaceUseCase", () => {
  it("resolve o placement pra foto de verdade, na ordem certa", async () => {
    const photos = await useCase().execute("hero");
    expect(photos.map((p) => p.id)).toEqual(["hero-1", "hero-2", "hero-3", "hero-4"]);
  });

  it("inclui o role de cada foto", async () => {
    const photos = await useCase().execute("quem-sou");
    expect(photos.map((p) => p.role)).toEqual(["capa", "polaroid-1", "altar", "polaroid-2"]);
  });

  it("filtra por refId quando informado", async () => {
    const photos = await useCase().execute("niche", { refId: "familia" });
    expect(photos.every((p) => p.id.startsWith("familia"))).toBe(true);
  });

  it("retorna array vazio quando a superfície não tem placement", async () => {
    const photos = await useCase().execute("package", { refId: "nao-existe" });
    expect(photos).toEqual([]);
  });

  it("inclui o id do placement (não o da foto) em cada resultado", async () => {
    const photos = await useCase().execute("hero");
    for (const photo of photos) {
      expect(photo.placementId).toMatch(/^mock-placement-\d+$/);
    }
    // ids de placement são únicos por resultado, mesmo quando duas fotos
    // diferentes aparecem na mesma superfície.
    expect(new Set(photos.map((p) => p.placementId)).size).toBe(photos.length);
  });
});
