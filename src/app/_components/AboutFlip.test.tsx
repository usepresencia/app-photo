import { describe, expect, it } from "vitest";
import { render, fireEvent, within } from "@testing-library/react";
import { AboutFlip, FlipButton } from "./AboutFlip";

// front/back aqui são elementos (ReactNode) prontos, exatamente como quem
// usa de verdade (About.tsx) precisa passar: uma Server Component não pode
// passar função como prop pra um Client Component — só os botões-folha
// (FlipButton, e o botão de voltar do próprio cabeçalho) são "use client"
// de fato, e pegam a ação via contexto, não via callback recebido de fora.
function renderFlip() {
  return render(
    <AboutFlip
      eyebrow="Quem sou"
      title="Denise Galvão"
      front={
        <div>
          <span>FRENTE</span>
          <FlipButton>Quem sou eu</FlipButton>
        </div>
      }
      back={<div>VERSO</div>}
    />,
  );
}

describe("AboutFlip", () => {
  it("por padrão mostra a frente, o eyebrow e o título — sem o verso", () => {
    const { container } = renderFlip();
    expect(within(container).queryByText("FRENTE")).not.toBeNull();
    expect(within(container).queryByText("VERSO")).toBeNull();
    expect(within(container).queryByText("Quem sou")).not.toBeNull();
    expect(within(container).queryByText("Denise Galvão")).not.toBeNull();
  });

  it("vira para o verso ao clicar no FlipButton, escondendo a frente", () => {
    const { container } = renderFlip();
    fireEvent.click(within(container).getByText("Quem sou eu"));
    expect(within(container).queryByText("VERSO")).not.toBeNull();
    expect(within(container).queryByText("FRENTE")).toBeNull();
  });

  it('no verso, esconde o eyebrow e mostra um botão "Voltar" — o título continua visível', () => {
    const { container } = renderFlip();
    fireEvent.click(within(container).getByText("Quem sou eu"));
    expect(within(container).queryByText("Quem sou")).toBeNull();
    expect(within(container).queryByText("Denise Galvão")).not.toBeNull();
    expect(within(container).getByLabelText("Voltar")).not.toBeNull();
  });

  it('volta para a frente e reexibe o eyebrow ao clicar em "Voltar"', () => {
    const { container } = renderFlip();
    fireEvent.click(within(container).getByText("Quem sou eu"));
    fireEvent.click(within(container).getByLabelText("Voltar"));
    expect(within(container).queryByText("FRENTE")).not.toBeNull();
    expect(within(container).queryByText("VERSO")).toBeNull();
    expect(within(container).queryByText("Quem sou")).not.toBeNull();
  });

  it("deixa um espaço (mb-5) depois do título, igual ao header que o Section usa em toda outra seção", () => {
    const { container } = renderFlip();
    const titulo = within(container).getByText("Denise Galvão");
    // O bloco que leva o mb-5 é o ancestral mais próximo que não é o
    // próprio <h2> — reproduz o `mb-5` do <header> do Section.tsx, que
    // era o único lugar que criava esse respiro antes do cabeçalho virar
    // flip-aware.
    const headerBlock = titulo.closest("div")?.parentElement;
    expect(headerBlock?.className).toContain("mb-5");
  });
});
