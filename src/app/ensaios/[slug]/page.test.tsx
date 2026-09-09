import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import NichePage from "./page";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

describe("NichePage", () => {
  it("marca o bloco de intro/descrição/destaques como editável (tipo niche)", async () => {
    const jsx = await NichePage({ params: Promise.resolve({ slug: "familia" }) });
    const { container } = render(jsx);
    const editable = container.querySelector('[data-editable="niche:familia"]');
    expect(editable).not.toBeNull();
  });
});
