import { describe, expect, it } from "vitest";
import { getEventNiches, getNicheBySlug, getNiches } from "./niches";

describe("getNiches", () => {
  it("retorna os 7 nichos com slugs únicos", async () => {
    const niches = await getNiches();
    expect(niches).toHaveLength(7);
    expect(new Set(niches.map((n) => n.slug)).size).toBe(7);
  });

  it("deixa intro/description/highlights vazios só nos nichos que aguardam doc da cliente", async () => {
    const niches = await getNiches();
    const pending = ["making-of-da-noiva"];
    for (const niche of niches) {
      const isPending = pending.includes(niche.slug);
      expect(niche.intro === "").toBe(isPending);
      expect(niche.description.length === 0).toBe(isPending);
      expect(niche.highlights.length === 0).toBe(isPending);
    }
  });
});

describe("getNicheBySlug", () => {
  it("retorna o nicho correspondente ao slug", async () => {
    const niche = await getNicheBySlug("familia");
    expect(niche?.title).toBe("Família");
  });

  it("retorna null para um slug inexistente", async () => {
    const niche = await getNicheBySlug("nao-existe");
    expect(niche).toBeNull();
  });
});

describe("getEventNiches", () => {
  it("retorna só os 3 nichos marcados como evento, cada um com foto associada", async () => {
    const events = await getEventNiches();
    expect(events.map((e) => e.slug)).toEqual([
      "casamento-civil",
      "aniversario-e-eventos",
      "making-of-da-noiva",
    ]);
    for (const event of events) {
      expect(event.image.src).toMatch(/^\/fotos\//);
    }
  });
});
