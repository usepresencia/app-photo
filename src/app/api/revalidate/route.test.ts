import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

describe("POST /api/revalidate", () => {
  it("recusa sem Authorization válido", async () => {
    process.env.REVALIDATE_SECRET = "segredo";
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { Authorization: "Bearer errado" },
      body: JSON.stringify({ tag: "niches" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("chama revalidateTag com o Authorization certo", async () => {
    process.env.REVALIDATE_SECRET = "segredo";
    const { revalidateTag } = await import("next/cache");
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { Authorization: "Bearer segredo", "Content-Type": "application/json" },
      body: JSON.stringify({ tag: "niches" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("niches", "max");
  });
});
