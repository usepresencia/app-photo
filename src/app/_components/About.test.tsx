import { describe, expect, it, vi } from "vitest";
import { render, fireEvent, within } from "@testing-library/react";
import { About } from "./About";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

describe("About", () => {
  it("por padrão mostra só a capa editável — o verso (polaroids, altar, textos) ainda não está na tela", async () => {
    const { container } = render(await About());
    const placementEditables = container.querySelectorAll('[data-editable^="placement:"]');
    expect(placementEditables).toHaveLength(1);
    const textValues = Array.from(
      container.querySelectorAll('[data-editable-text^="profile:main:"]'),
    ).map((el) => el.getAttribute("data-editable-text"));
    expect(textValues).toEqual(["profile:main:capaCaption"]);
  });

  it('o botão "Ver mais" não fica dentro do placement editável da capa — senão o PreviewOverlay intercepta o clique antes de virar a página', async () => {
    const { container } = render(await About());
    const editableCapa = container.querySelector('[data-editable^="placement:"]');
    const verMaisButton = within(container).getByText("Ver mais");
    expect(editableCapa?.contains(verMaisButton)).toBe(false);
  });

  it('ao clicar em "Ver mais" revela os dois polaroids e a foto do altar como editáveis', async () => {
    const { container } = render(await About());
    fireEvent.click(within(container).getByText("Ver mais"));
    const placementEditables = container.querySelectorAll('[data-editable^="placement:"]');
    expect(placementEditables).toHaveLength(3);
  });

  it('ao clicar em "Ver mais" revela os campos de perfil (profissão e família) como editáveis individualmente (tipo profile, id main)', async () => {
    const { container } = render(await About());
    fireEvent.click(within(container).getByText("Ver mais"));
    const values = Array.from(
      container.querySelectorAll('[data-editable-text^="profile:main:"]'),
    ).map((el) => el.getAttribute("data-editable-text"));
    expect(values).toContain("profile:main:profissao.titulo");
    expect(values).toContain("profile:main:profissao.eyebrow");
    expect(values.some((v) => v?.startsWith("profile:main:profissao.paragrafos."))).toBe(true);
    expect(values).toContain("profile:main:familia.titulo");
    expect(values.some((v) => v?.startsWith("profile:main:familia.paragrafos."))).toBe(true);
    expect(values).toContain("profile:main:familia.legendaFoto");
  });

  it("usa a legenda do banco nos dois polaroids do Row, não texto fixo", async () => {
    const { container } = render(await About());
    fireEvent.click(within(container).getByText("Ver mais"));
    const captions = Array.from(container.querySelectorAll("figcaption")).map(
      (el) => el.textContent,
    );
    expect(captions).toContain("polaroid-1");
    expect(captions).toContain("polaroid-2");
    expect(captions).not.toContain("Minha base, minha família");
    expect(captions).not.toContain("Amo esportes radicais e amo adrenalina");
  });

  it('o verso tem um botão "Voltar" que esconde os textos e volta a mostrar só a capa', async () => {
    const { container } = render(await About());
    fireEvent.click(within(container).getByText("Ver mais"));
    fireEvent.click(within(container).getByLabelText("Voltar"));
    expect(container.querySelectorAll('[data-editable^="placement:"]')).toHaveLength(1);
    const textValues = Array.from(
      container.querySelectorAll('[data-editable-text^="profile:main:"]'),
    ).map((el) => el.getAttribute("data-editable-text"));
    expect(textValues).toEqual(["profile:main:capaCaption"]);
  });

  it('por padrão mostra o eyebrow "Quem sou" junto do título', async () => {
    const { container } = render(await About());
    expect(within(container).queryByText("Quem sou")).not.toBeNull();
    expect(within(container).getByText("Denise Galvão")).toBeTruthy();
  });

  it('no verso ("Ver mais"), esconde "Quem sou" e mostra o botão de voltar junto ao título "Denise Galvão"', async () => {
    const { container } = render(await About());
    fireEvent.click(within(container).getByText("Ver mais"));
    expect(within(container).queryByText("Quem sou")).toBeNull();
    const titulo = within(container).getByText("Denise Galvão");
    const voltar = within(container).getByLabelText("Voltar");
    // "junto ao título": mesmo pai direto do <h2>, não solto em outro lugar da seção.
    expect(voltar.parentElement).toBe(titulo.parentElement);
  });
});
