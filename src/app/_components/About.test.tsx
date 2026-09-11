import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { About } from "./About";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

describe("About", () => {
  it("marca a capa, os dois polaroids e a foto do altar como editáveis (tipo placement)", async () => {
    const { container } = render(await About());
    const placementEditables = container.querySelectorAll('[data-editable^="placement:"]');
    // capa + 2 polaroids (Row) + altar = 4 fotos editáveis
    expect(placementEditables).toHaveLength(4);
  });

  it("marca os campos de perfil como editáveis individualmente (tipo profile, id main)", async () => {
    const { container } = render(await About());
    const values = Array.from(
      container.querySelectorAll('[data-editable-text^="profile:main:"]'),
    ).map((el) => el.getAttribute("data-editable-text"));
    expect(values).toContain("profile:main:capaCaption");
    expect(values).toContain("profile:main:profissao.titulo");
    expect(values).toContain("profile:main:profissao.eyebrow");
    expect(values.some((v) => v?.startsWith("profile:main:profissao.paragrafos."))).toBe(true);
    expect(values).toContain("profile:main:familia.titulo");
    expect(values.some((v) => v?.startsWith("profile:main:familia.paragrafos."))).toBe(true);
    expect(values).toContain("profile:main:familia.legendaFoto");
  });

  it("usa a legenda do banco nos dois polaroids do Row, não texto fixo", async () => {
    const { container } = render(await About());
    const captions = Array.from(container.querySelectorAll("figcaption")).map(
      (el) => el.textContent,
    );
    expect(captions).toContain("polaroid-1");
    expect(captions).toContain("polaroid-2");
    expect(captions).not.toContain("Minha base, minha família");
    expect(captions).not.toContain("Amo esportes radicais e amo adrenalina");
  });
});
