import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { Niches } from "./Niches";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

describe("Niches", () => {
  it("marca cada card de nicho como editável (tipo niche)", async () => {
    const { container } = render(await Niches());
    const editables = container.querySelectorAll('[data-editable^="niche:"]');
    expect(editables.length).toBeGreaterThan(0);
    const values = Array.from(editables).map((el) => el.getAttribute("data-editable"));
    expect(values).toContain("niche:familia");
  });

  it("marca o fim do carrossel com um Addable de tipo niche", async () => {
    const { container } = render(await Niches());
    const addable = container.querySelector('[data-addable^="niche:"]');
    expect(addable).not.toBeNull();
  });
});
