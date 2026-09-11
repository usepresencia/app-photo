import { describe, expect, it } from "vitest";
import { getProfile } from "./profile";

describe("getProfile", () => {
  it("retorna os textos da seção Quem sou", async () => {
    const profile = await getProfile();
    expect(profile.capaCaption).toBeTruthy();
    expect(profile.profissao.titulo).toBeTruthy();
    expect(profile.profissao.eyebrow).toBeTruthy();
    expect(profile.profissao.paragrafos.length).toBeGreaterThan(0);
    expect(profile.familia.titulo).toBeTruthy();
    expect(profile.familia.paragrafos.length).toBeGreaterThan(0);
    expect(profile.familia.legendaFoto).toBeTruthy();
  });
});
