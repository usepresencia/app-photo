import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV, REVALIDATE_SECRET: "segredo-teste" };
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("GET /api/preview/enter", () => {
  it("com token certo, redireciona pra 'next' e seta o cookie de rascunho", async () => {
    const { GET } = await import("./route");
    const request = new Request(
      "http://localhost:3000/api/preview/enter?token=segredo-teste&next=/ensaios/familia",
    );
    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/ensaios/familia");
    expect(response.headers.get("set-cookie")).toContain("preview_draft=1");
  });

  it("sem 'next', redireciona pra '/'", async () => {
    const { GET } = await import("./route");
    const request = new Request("http://localhost:3000/api/preview/enter?token=segredo-teste");
    const response = await GET(request);
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("com token errado, retorna 401 sem setar cookie", async () => {
    const { GET } = await import("./route");
    const request = new Request("http://localhost:3000/api/preview/enter?token=errado");
    const response = await GET(request);
    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("sem token, retorna 401", async () => {
    const { GET } = await import("./route");
    const request = new Request("http://localhost:3000/api/preview/enter");
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("em produção, redireciona pra SITE_URL em vez da origem de request.url", async () => {
    process.env = { ...process.env, NODE_ENV: "production" };
    vi.resetModules();
    const { GET } = await import("./route");
    // Simula o cenário real: por trás do Traefik/Docker standalone, a
    // origem de request.url pode ser o bind interno do container em vez
    // do domínio público — o redirect não pode depender dela em produção.
    const request = new Request(
      "http://0.0.0.0:3000/api/preview/enter?token=segredo-teste&next=/ensaios/familia",
    );
    const response = await GET(request);
    expect(response.headers.get("location")).toBe("https://denisegalvao.com.br/ensaios/familia");
  });
});
