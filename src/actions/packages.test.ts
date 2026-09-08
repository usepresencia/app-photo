import { describe, expect, it } from "vitest";
import { getPackagesForNiche } from "./packages";

describe("getPackagesForNiche", () => {
  it("retorna pacotes reais para cada nicho precificado, com no máximo um featured", async () => {
    const slugs = [
      "retratos-profissionais",
      "gestante",
      "familia",
      "comercial",
      "casamento-civil",
      "aniversario-e-eventos",
    ];
    for (const slug of slugs) {
      const packages = await getPackagesForNiche(slug);
      expect(packages.length).toBeGreaterThan(0);
      expect(packages.filter((p) => p.featured).length).toBeLessThanOrEqual(1);
      expect(new Set(packages.map((p) => p.id)).size).toBe(packages.length);
    }
  });

  it("retorna array vazio para making-of-da-noiva (aguarda doc da cliente)", async () => {
    const packages = await getPackagesForNiche("making-of-da-noiva");
    expect(packages).toEqual([]);
  });

  it("retorna array vazio para um slug desconhecido", async () => {
    const packages = await getPackagesForNiche("nao-existe");
    expect(packages).toEqual([]);
  });
});
