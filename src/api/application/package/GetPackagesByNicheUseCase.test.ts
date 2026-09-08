import { describe, expect, it } from "vitest";
import { MockPackageRepository } from "@/api/infrastructure/repositories/mock/MockPackageRepository";
import { GetPackagesByNicheUseCase } from "./GetPackagesByNicheUseCase";

describe("GetPackagesByNicheUseCase", () => {
  it("retorna os pacotes do nicho pedido", async () => {
    const useCase = new GetPackagesByNicheUseCase(new MockPackageRepository());
    const packages = await useCase.execute("gestante");
    expect(packages).toHaveLength(2);
    expect(packages.map((p) => p.name)).toEqual(["Pacote Básico", "Pacote Essencial"]);
  });

  it("retorna array vazio para um nicho sem pacotes", async () => {
    const useCase = new GetPackagesByNicheUseCase(new MockPackageRepository());
    const packages = await useCase.execute("making-of-da-noiva");
    expect(packages).toEqual([]);
  });
});
