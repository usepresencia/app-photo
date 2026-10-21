import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Section } from "./Section";

describe("Section", () => {
  it("mostra o índice e a régua mesmo sem eyebrow/title — About usa isso pra ter cabeçalho próprio (flip-aware)", () => {
    const { container } = render(
      <Section id="quem-sou" index="01">
        <p>conteúdo</p>
      </Section>,
    );
    expect(container.querySelector(".section-index")?.textContent).toBe("01");
  });

  it("não mostra cabeçalho nenhum quando index, eyebrow e title estão ausentes", () => {
    const { container } = render(
      <Section id="algo">
        <p>conteúdo</p>
      </Section>,
    );
    expect(container.querySelector("header")).toBeNull();
  });

  it("continua mostrando eyebrow e title quando passados (comportamento existente)", () => {
    const { container } = render(
      <Section index="02" eyebrow="Eyebrow" title="Título">
        <p>conteúdo</p>
      </Section>,
    );
    expect(container.textContent).toContain("Eyebrow");
    expect(container.textContent).toContain("Título");
  });
});
