import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("next.config headers", () => {
  it("restringe frame-ancestors a 'self' sem NEXT_PUBLIC_ADMIN_PHOTO_URL", async () => {
    delete process.env.NEXT_PUBLIC_ADMIN_PHOTO_URL;
    const { default: config } = await import("./next.config");
    const [{ headers }] = await config.headers!();
    const csp = headers.find((h) => h.key === "Content-Security-Policy");
    expect(csp?.value).toBe("frame-ancestors 'self'");
  });

  it("libera a origem do admin-photo quando a env var está definida", async () => {
    process.env.NEXT_PUBLIC_ADMIN_PHOTO_URL = "http://localhost:3001";
    const { default: config } = await import("./next.config");
    const [{ headers }] = await config.headers!();
    const csp = headers.find((h) => h.key === "Content-Security-Policy");
    expect(csp?.value).toBe("frame-ancestors 'self' http://localhost:3001");
  });

  it("inclui os cabeçalhos de segurança básicos", async () => {
    const { default: config } = await import("./next.config");
    const [{ headers }] = await config.headers!();
    const keys = headers.map((h) => h.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "X-Content-Type-Options",
        "Referrer-Policy",
        "Permissions-Policy",
        "Strict-Transport-Security",
      ]),
    );
    expect(keys).not.toContain("X-Frame-Options");
  });
});
