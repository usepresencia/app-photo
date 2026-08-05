import { describe, expect, it } from "vitest";
import { buildWhatsappLink } from "./whatsapp";

describe("buildWhatsappLink", () => {
  it("codifica a mensagem como query string", () => {
    const link = buildWhatsappLink("https://wa.me/5511999999999", "Olá, Denise!");
    expect(link).toBe("https://wa.me/5511999999999?text=Ol%C3%A1%2C%20Denise!");
  });
});
