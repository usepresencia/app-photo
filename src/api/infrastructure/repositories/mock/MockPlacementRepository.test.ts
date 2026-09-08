import { describe, expect, it } from "vitest";
import { MockPlacementRepository } from "./MockPlacementRepository";

describe("MockPlacementRepository", () => {
  it("retorna os placements de hero ordenados", async () => {
    const repo = new MockPlacementRepository();
    const placements = await repo.findBySurface("hero");
    expect(placements.length).toBeGreaterThan(0);
    expect(placements.map((p) => p.order)).toEqual(
      [...placements].sort((a, b) => a.order - b.order).map((p) => p.order),
    );
  });

  it("retorna os 4 placements de quem-sou, com role distinto cada", async () => {
    const repo = new MockPlacementRepository();
    const placements = await repo.findBySurface("quem-sou");
    expect(placements).toHaveLength(4);
    expect(new Set(placements.map((p) => p.role)).size).toBe(4);
  });

  it("filtra galeria de nicho por refId", async () => {
    const repo = new MockPlacementRepository();
    const gestante = await repo.findBySurface("niche", { refId: "gestante" });
    const familia = await repo.findBySurface("niche", { refId: "familia" });
    expect(gestante.length).toBeGreaterThan(0);
    expect(familia.length).toBeGreaterThan(0);
    expect(gestante.every((p) => p.refId === "gestante")).toBe(true);
  });

  it("retorna array vazio para um refId sem placements", async () => {
    const repo = new MockPlacementRepository();
    const placements = await repo.findBySurface("niche", { refId: "nao-existe" });
    expect(placements).toEqual([]);
  });
});
