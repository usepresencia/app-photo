import { describe, expect, it } from "vitest";
import { MockNicheRepository } from "@/api/infrastructure/repositories/mock/MockNicheRepository";
import { GetNicheBySlugUseCase } from "./GetNicheBySlugUseCase";

describe("GetNicheBySlugUseCase", () => {
  it("retorna o nicho correspondente ao slug", async () => {
    const useCase = new GetNicheBySlugUseCase(new MockNicheRepository());
    const niche = await useCase.execute("gestante");
    expect(niche?.title).toBe("Gestante");
  });

  it("retorna null para um slug inexistente", async () => {
    const useCase = new GetNicheBySlugUseCase(new MockNicheRepository());
    const niche = await useCase.execute("nao-existe");
    expect(niche).toBeNull();
  });
});
