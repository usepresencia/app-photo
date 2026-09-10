import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { Niches } from "./Niches";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

describe("Niches", () => {
  it("marca título e subtítulo de cada card como editáveis (tipo niche)", async () => {
    const { container } = render(await Niches());
    const editables = container.querySelectorAll('[data-editable-text^="niche:"]');
    expect(editables.length).toBeGreaterThan(0);
    const values = Array.from(editables).map((el) => el.getAttribute("data-editable-text"));
    expect(values).toContain("niche:familia:title");
    expect(values).toContain("niche:familia:subtitle");
  });

  it("marca o fim do carrossel com um Addable de tipo niche", async () => {
    const { container } = render(await Niches());
    const addable = container.querySelector('[data-addable^="niche:"]');
    expect(addable).not.toBeNull();
  });
});
