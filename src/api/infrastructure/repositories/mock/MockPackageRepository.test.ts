import { describe, expect, it } from "vitest";
import { MockPackageRepository } from "./MockPackageRepository";

describe("MockPackageRepository", () => {
  it("retorna os pacotes do nicho pedido, ordenados, com no máximo um featured", async () => {
    const repo = new MockPackageRepository();
    const slugs = [
      "retratos-profissionais",
      "gestante",
      "familia",
      "comercial",
      "casamento-civil",
      "aniversario-e-eventos",
    ];
    for (const slug of slugs) {
      const packages = await repo.findByNicheSlug(slug);
      expect(packages.length).toBeGreaterThan(0);
      expect(packages.every((p) => p.nicheSlug === slug)).toBe(true);
      expect(packages.map((p) => p.order)).toEqual(packages.map((_, i) => i));
      expect(packages.filter((p) => p.featured).length).toBeLessThanOrEqual(1);
    }
  });

  it("retorna array vazio para making-of-da-noiva (aguarda doc da cliente)", async () => {
    const repo = new MockPackageRepository();
    const packages = await repo.findByNicheSlug("making-of-da-noiva");
    expect(packages).toEqual([]);
  });

  it("retorna array vazio para um nicho desconhecido", async () => {
    const repo = new MockPackageRepository();
    const packages = await repo.findByNicheSlug("nao-existe");
    expect(packages).toEqual([]);
  });

  it("cada pacote tem id único", async () => {
    const repo = new MockPackageRepository();
    const all = (
      await Promise.all(
        [
          "retratos-profissionais",
          "gestante",
          "familia",
          "comercial",
          "casamento-civil",
          "aniversario-e-eventos",
        ].map((slug) => repo.findByNicheSlug(slug)),
      )
    ).flat();
    expect(all).toHaveLength(14);
    expect(new Set(all.map((p) => p.id)).size).toBe(14);
  });
});
