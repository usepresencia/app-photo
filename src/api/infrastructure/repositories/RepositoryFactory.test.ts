import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.SKIP_ENV_VALIDATION;
  delete process.env.FIREBASE_PROJECT_ID;
  delete process.env.FIREBASE_CLIENT_EMAIL;
  delete process.env.FIREBASE_PRIVATE_KEY;
  delete process.env.NEXT_PHASE;
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.unstubAllEnvs();
});

// As classes precisam ser reimportadas dinamicamente junto com a fábrica,
// depois de vi.resetModules() — se viessem de um `import` estático no topo
// do arquivo, seriam uma instância de módulo diferente da que o
// RepositoryFactory reimportado por baixo dos panos usa, e todo
// `toBeInstanceOf` falharia mesmo com o comportamento correto.
async function importFresh() {
  const [{ RepositoryFactory }, { MockNicheRepository }, { NicheRepositoryImpl }] =
    await Promise.all([
      import("./RepositoryFactory"),
      import("./mock/MockNicheRepository"),
      import("./NicheRepositoryImpl"),
    ]);
  return { RepositoryFactory, MockNicheRepository, NicheRepositoryImpl };
}

describe("RepositoryFactory.niches", () => {
  it("usa o mock quando não há credenciais do Firebase, fora de produção", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const { RepositoryFactory, MockNicheRepository } = await importFresh();
    expect(RepositoryFactory.niches()).toBeInstanceOf(MockNicheRepository);
  });

  // Regressão: `next build` roda com NODE_ENV=production sem credenciais
  // reais (CI não tem segredos do Firebase). Sem essa distinção, o build
  // tentaria falar com Firestore de verdade e quebraria em CI.
  it("usa o mock durante `next build` (NODE_ENV=production, NEXT_PHASE=phase-production-build), mesmo sem credenciais", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.NEXT_PHASE = "phase-production-build";
    const { RepositoryFactory, MockNicheRepository } = await importFresh();
    expect(RepositoryFactory.niches()).toBeInstanceOf(MockNicheRepository);
  });

  it("usa o repositório real em produção servindo tráfego, quando há credenciais", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.FIREBASE_PROJECT_ID = "meu-projeto";
    process.env.FIREBASE_CLIENT_EMAIL = "conta@meu-projeto.iam.gserviceaccount.com";
    process.env.FIREBASE_PRIVATE_KEY = "chave";
    const { RepositoryFactory, NicheRepositoryImpl } = await importFresh();
    expect(RepositoryFactory.niches()).toBeInstanceOf(NicheRepositoryImpl);
  });
});
