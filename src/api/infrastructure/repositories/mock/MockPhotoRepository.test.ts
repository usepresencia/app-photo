import { describe, expect, it } from "vitest";
import { MockPhotoRepository } from "./MockPhotoRepository";

describe("MockPhotoRepository", () => {
  it("retorna array vazio para uma lista de ids vazia, sem consultar nada", async () => {
    const repo = new MockPhotoRepository();
    const photos = await repo.findByIds([]);
    expect(photos).toEqual([]);
  });

  it("retorna só as fotos com id presente no conjunto pedido", async () => {
    const repo = new MockPhotoRepository();
    const photos = await repo.findByIds(["hero-1", "hero-3"]);
    expect(photos.map((p) => p.id).sort()).toEqual(["hero-1", "hero-3"]);
  });

  it("ignora ids que não existem no mock, sem erro", async () => {
    const repo = new MockPhotoRepository();
    const photos = await repo.findByIds(["hero-1", "nao-existe"]);
    expect(photos.map((p) => p.id)).toEqual(["hero-1"]);
  });

  it("cobre os 7 slugs reais de nicho, 2 fotos cada", async () => {
    const repo = new MockPhotoRepository();
    const slugs = [
      "retratos-profissionais",
      "gestante",
      "familia",
      "comercial",
      "casamento-civil",
      "aniversario-e-eventos",
      "making-of-da-noiva",
    ];
    for (const slug of slugs) {
      const photos = await repo.findByIds([`${slug}-1`, `${slug}-2`]);
      expect(photos).toHaveLength(2);
    }
  });
});
