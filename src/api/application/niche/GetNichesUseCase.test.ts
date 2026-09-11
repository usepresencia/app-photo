import { describe, expect, it } from "vitest";
import { MockNicheRepository } from "@/api/infrastructure/repositories/mock/MockNicheRepository";
import { GetNichesUseCase } from "./GetNichesUseCase";

describe("GetNichesUseCase", () => {
  it("retorna os 7 nichos do repositório", async () => {
    const useCase = new GetNichesUseCase(new MockNicheRepository());
    const niches = await useCase.execute();
    expect(niches).toHaveLength(7);
  });
});
