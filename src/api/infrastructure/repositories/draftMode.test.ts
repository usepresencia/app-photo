import { describe, expect, it } from "vitest";
import { isDraftCookieValue } from "./draftMode";

describe("isDraftCookieValue", () => {
  it('true só quando o valor é exatamente "1"', () => {
    expect(isDraftCookieValue("1")).toBe(true);
  });

  it("false quando ausente, vazio, ou qualquer outro valor", () => {
    expect(isDraftCookieValue(undefined)).toBe(false);
    expect(isDraftCookieValue("")).toBe(false);
    expect(isDraftCookieValue("0")).toBe(false);
    expect(isDraftCookieValue("true")).toBe(false);
  });
});
