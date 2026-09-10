import { describe, expect, it } from "vitest";
import { MockTestimonialRepository } from "./MockTestimonialRepository";

describe("MockTestimonialRepository", () => {
  it("findAll retorna os 3 seeds, ordenados por order", async () => {
    const repo = new MockTestimonialRepository();
    const all = await repo.findAll();
    expect(all).toHaveLength(3);
    expect(all.map((t) => t.authorName)).toEqual(["Marina R.", "Carlos e Bia", "Luiza M."]);
  });

  it("todos os seeds vêm com visible:true", async () => {
    const repo = new MockTestimonialRepository();
    const all = await repo.findAll();
    expect(all.every((t) => t.visible)).toBe(true);
  });
});
