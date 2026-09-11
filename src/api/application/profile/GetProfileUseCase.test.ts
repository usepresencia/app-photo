import { describe, expect, it } from "vitest";
import type { ProfileRepository } from "@/api/domain/profile/ProfileRepository";
import { MockProfileRepository } from "@/api/infrastructure/repositories/mock/MockProfileRepository";
import { GetProfileUseCase } from "./GetProfileUseCase";

describe("GetProfileUseCase", () => {
  it("retorna o profile", async () => {
    const useCase = new GetProfileUseCase(new MockProfileRepository());
    const profile = await useCase.execute();
    expect(profile.capaCaption).toBe("Há vários anos marcando momentos");
    expect(profile.familia.legendaFoto).toBeTruthy();
  });

  it("lança erro se o documento não existir", async () => {
    const repoSemDado: ProfileRepository = { get: async () => null };
    const useCase = new GetProfileUseCase(repoSemDado);
    await expect(useCase.execute()).rejects.toThrow();
  });
});
