import { describe, expect, it } from "vitest";
import { MockProfileRepository } from "./MockProfileRepository";

describe("MockProfileRepository", () => {
  it("retorna o profile com os textos da seção Quem sou", async () => {
    const repo = new MockProfileRepository();
    const profile = await repo.get();
    expect(profile).not.toBeNull();
    expect(profile?.capaCaption).toBe("Há vários anos marcando momentos");
    expect(profile?.profissao.titulo).toBe("Profissão");
    expect(profile?.profissao.paragrafos).toHaveLength(3);
    expect(profile?.familia.titulo).toBe("Família");
    expect(profile?.familia.paragrafos).toHaveLength(3);
    expect(profile?.familia.legendaFoto).toBeTruthy();
  });
});
