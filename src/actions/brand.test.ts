import { describe, expect, it } from "vitest";
import { getBrand } from "./brand";

describe("getBrand", () => {
  it("retorna os dados de contato placeholder com whatsapp e instagram definidos", async () => {
    const brand = await getBrand();
    expect(brand.name).toBe("Denise Galvão");
    expect(brand.whatsapp).toMatch(/^https:\/\/wa\.me\//);
    expect(brand.instagram).toMatch(/^https:\/\//);
  });
});
