import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.SKIP_ENV_VALIDATION;
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("env.client", () => {
  it("aceita ausência de NEXT_PUBLIC_ADMIN_PHOTO_URL", async () => {
    delete process.env.NEXT_PUBLIC_ADMIN_PHOTO_URL;
    const { clientEnv } = await import("./env.client");
    expect(clientEnv.NEXT_PUBLIC_ADMIN_PHOTO_URL).toBeUndefined();
  });

  it("rejeita um valor que não é uma URL", async () => {
    process.env.NEXT_PUBLIC_ADMIN_PHOTO_URL = "nao-e-url";
    await expect(import("./env.client")).rejects.toThrow();
  });

  it("aceita uma URL válida", async () => {
    process.env.NEXT_PUBLIC_ADMIN_PHOTO_URL = "http://localhost:3001";
    const { clientEnv } = await import("./env.client");
    expect(clientEnv.NEXT_PUBLIC_ADMIN_PHOTO_URL).toBe("http://localhost:3001");
  });
});
