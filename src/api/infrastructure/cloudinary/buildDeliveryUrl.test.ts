import { describe, expect, it } from "vitest";
import { buildDeliveryUrl } from "./buildDeliveryUrl";

describe("buildDeliveryUrl", () => {
  it("monta a URL base de entrega a partir do public_id", () => {
    expect(buildDeliveryUrl("profissional-01", "minha-conta")).toBe(
      "https://res.cloudinary.com/minha-conta/image/upload/profissional-01",
    );
  });
});
