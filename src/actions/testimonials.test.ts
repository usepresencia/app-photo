import { describe, expect, it } from "vitest";
import { getTestimonials } from "./testimonials";

describe("getTestimonials", () => {
  it("retorna 3 depoimentos, cada um com nome e texto preenchidos", async () => {
    const testimonials = await getTestimonials();
    expect(testimonials).toHaveLength(3);
    for (const t of testimonials) {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.text.length).toBeGreaterThan(0);
    }
  });
});
