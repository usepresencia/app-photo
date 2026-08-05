import { describe, expect, it } from "vitest";
import { getPackages } from "./packages";

describe("getPackages", () => {
  it("retorna os 3 pacotes, com exatamente um marcado como featured", async () => {
    const packages = await getPackages();
    expect(packages).toHaveLength(3);
    expect(packages.filter((p) => p.featured)).toHaveLength(1);
  });
});
