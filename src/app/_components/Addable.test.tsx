import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Addable } from "./Addable";

describe("Addable", () => {
  it("marca o elemento com data-addable no formato tipo:contexto (JSON)", () => {
    const { container } = render(
      <Addable type="package" context={{ nicheSlug: "familia" }}>
        <span>+</span>
      </Addable>,
    );
    expect(container.firstElementChild?.getAttribute("data-addable")).toBe(
      'package:{"nicheSlug":"familia"}',
    );
  });

  it("sem context, o atributo fica com o tipo e nada depois do ':'", () => {
    const { container } = render(
      <Addable type="niche">
        <span>+</span>
      </Addable>,
    );
    expect(container.firstElementChild?.getAttribute("data-addable")).toBe("niche:");
  });

  it("repassa className", () => {
    const { container } = render(
      <Addable type="niche" className="shrink-0">
        <span>+</span>
      </Addable>,
    );
    expect(container.firstElementChild?.className).toContain("shrink-0");
  });
});
