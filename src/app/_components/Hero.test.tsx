import { describe, expect, it, vi } from "vitest";
import { render, within } from "@testing-library/react";
import { Hero } from "./Hero";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

// Logo é um Server Component assíncrono próprio (busca getBrand()) — fora
// do pipeline de RSC do Next, um render comum não dá conta de um filho
// async que não seja o componente raiz já resolvido via `await Hero()`.
vi.mock("@/lib/_components/Logo", () => ({
  Logo: () => <div />,
}));

describe("Hero", () => {
  it('o CTA secundário aponta para "ensaios", não mais para a galeria removida', async () => {
    const { container } = render(await Hero());
    const link = within(container).getByText("Ver ensaios").closest("a");
    expect(link?.getAttribute("href")).toBe("#ensaios");
  });
});
