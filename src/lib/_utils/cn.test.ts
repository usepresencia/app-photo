import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("resolve conflitos de classes Tailwind mantendo a última", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("ignora valores falsy", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });
});
