import { describe, expect, it } from "vitest";
import { getTestimonials } from "./testimonials";

describe("getTestimonials", () => {
  it("retorna 3 depoimentos, cada um com nome, texto e nota preenchidos", async () => {
    const testimonials = await getTestimonials();
    expect(testimonials).toHaveLength(3);
    for (const t of testimonials) {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.text.length).toBeGreaterThan(0);
      expect(t.rating).toBeGreaterThanOrEqual(1);
      expect(t.rating).toBeLessThanOrEqual(5);
    }
  });
});
