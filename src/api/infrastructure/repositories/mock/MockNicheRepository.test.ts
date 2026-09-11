import { describe, expect, it } from "vitest";
import { MockNicheRepository } from "./MockNicheRepository";

describe("MockNicheRepository", () => {
  it("retorna os 7 nichos ordenados por order", async () => {
    const repo = new MockNicheRepository();
    const niches = await repo.findAll();
    expect(niches).toHaveLength(7);
    expect(niches.map((n) => n.order)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("retorna o nicho correspondente ao slug", async () => {
    const repo = new MockNicheRepository();
    const niche = await repo.findBySlug("familia");
    expect(niche?.title).toBe("Família");
  });

  it("retorna null para um slug inexistente", async () => {
    const repo = new MockNicheRepository();
    const niche = await repo.findBySlug("nao-existe");
    expect(niche).toBeNull();
  });

  it("marca exatamente os 3 nichos de evento, na ordem de Events.tsx", async () => {
    const repo = new MockNicheRepository();
    const niches = await repo.findAll();
    const events = niches
      .filter((n) => n.showAsEventTeaser)
      .sort((a, b) => (a.eventOrder ?? 0) - (b.eventOrder ?? 0));
    expect(events.map((n) => n.slug)).toEqual([
      "casamento-civil",
      "aniversario-e-eventos",
      "making-of-da-noiva",
    ]);
  });
});
