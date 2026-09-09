import { describe, expect, it } from "vitest";
import { signParams } from "./cloudinaryUpload";

describe("signParams", () => {
  it("gera a assinatura sha1 esperada pra um conjunto conhecido de parâmetros", () => {
    const signature = signParams({ public_id: "teste", timestamp: 1700000000 }, "segredo");
    expect(signature).toBe("af92d24964b692ffb516c87002d1de5036ffcd30");
  });

  it("ordena as chaves antes de assinar, independente da ordem de entrada", () => {
    const a = signParams({ timestamp: 1700000000, public_id: "teste" }, "segredo");
    const b = signParams({ public_id: "teste", timestamp: 1700000000 }, "segredo");
    expect(a).toBe(b);
  });
});
