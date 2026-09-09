import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.SKIP_ENV_VALIDATION;
  // import() dinâmico é cacheado pelo module graph do Vitest — sem isso, os
  // três testes reusariam o mesmo `env` avaliado no primeiro import().
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("env.server", () => {
  it("aceita ausência das três variáveis do Firebase", async () => {
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;
    const { env } = await import("./env.server");
    expect(env.FIREBASE_PROJECT_ID).toBeUndefined();
    expect(env.FIREBASE_CLIENT_EMAIL).toBeUndefined();
    expect(env.FIREBASE_PRIVATE_KEY).toBeUndefined();
  });

  it("rejeita FIREBASE_CLIENT_EMAIL com formato inválido quando presente", async () => {
    process.env.FIREBASE_CLIENT_EMAIL = "nao-e-um-email";
    await expect(import("./env.server")).rejects.toThrow();
  });

  it("aceita as três variáveis quando bem formadas", async () => {
    process.env.FIREBASE_PROJECT_ID = "meu-projeto";
    process.env.FIREBASE_CLIENT_EMAIL = "conta@meu-projeto.iam.gserviceaccount.com";
    process.env.FIREBASE_PRIVATE_KEY = "chave";
    const { env } = await import("./env.server");
    expect(env.FIREBASE_PROJECT_ID).toBe("meu-projeto");
  });

  it("aceita CLOUDINARY_CLOUD_NAME ausente ou presente", async () => {
    delete process.env.CLOUDINARY_CLOUD_NAME;
    const semVar = await import("./env.server");
    expect(semVar.env.CLOUDINARY_CLOUD_NAME).toBeUndefined();

    vi.resetModules();
    process.env.CLOUDINARY_CLOUD_NAME = "minha-conta";
    const comVar = await import("./env.server");
    expect(comVar.env.CLOUDINARY_CLOUD_NAME).toBe("minha-conta");
  });

  it("não lança quando uma var opcional está vazia no .env (string vazia, não ausente)", async () => {
    process.env.FIREBASE_PROJECT_ID = "";
    process.env.FIREBASE_CLIENT_EMAIL = "";
    process.env.FIREBASE_PRIVATE_KEY = "";
    process.env.CLOUDINARY_CLOUD_NAME = "";
    process.env.REVALIDATE_SECRET = "";
    const { env } = await import("./env.server");
    expect(env.FIREBASE_PROJECT_ID).toBeUndefined();
    expect(env.FIREBASE_CLIENT_EMAIL).toBeUndefined();
    expect(env.FIREBASE_PRIVATE_KEY).toBeUndefined();
    expect(env.CLOUDINARY_CLOUD_NAME).toBeUndefined();
    expect(env.REVALIDATE_SECRET).toBeUndefined();
  });
});
