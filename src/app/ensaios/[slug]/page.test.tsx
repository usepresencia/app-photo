import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import NichePage from "./page";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

describe("NichePage", () => {
  it("marca intro/descrição/destaques do nicho como editáveis individualmente (tipo niche)", async () => {
    const jsx = await NichePage({ params: Promise.resolve({ slug: "familia" }) });
    const { container } = render(jsx);
    const intro = container.querySelector('[data-editable-text="niche:familia:intro"]');
    expect(intro).not.toBeNull();
    const description = container.querySelectorAll(
      '[data-editable-text^="niche:familia:description."]',
    );
    expect(description.length).toBeGreaterThan(0);
    const highlights = container.querySelectorAll(
      '[data-editable-text^="niche:familia:highlights."]',
    );
    expect(highlights.length).toBeGreaterThan(0);
  });
});
