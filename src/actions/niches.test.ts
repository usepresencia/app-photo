import { describe, expect, it } from "vitest";
import { getEventNiches, getNicheBySlug, getNiches, getNonEventNiches } from "./niches";

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

describe("getNonEventNiches", () => {
  it("retorna só os nichos não marcados como evento, na ordem do carrossel", async () => {
    const niches = await getNonEventNiches();
    expect(niches.map((n) => n.slug)).toEqual([
      "retratos-profissionais",
      "comercial",
      "familia",
      "gestante",
    ]);
  });

  it("não repete nenhum nicho com getEventNiches — as duas listas particionam o total", async () => {
    const [all, events, nonEvents] = await Promise.all([
      getNiches(),
      getEventNiches(),
      getNonEventNiches(),
    ]);
    const overlap = nonEvents.filter((n) => events.some((e) => e.slug === n.slug));
    expect(overlap).toEqual([]);
    expect(events.length + nonEvents.length).toBe(all.length);
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
