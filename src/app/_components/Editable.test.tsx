import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Editable } from "./Editable";

describe("Editable", () => {
  it("marca o elemento com data-editable no formato tipo:id", () => {
    const { container } = render(
      <Editable type="niche" id="familia">
        <p>conteúdo</p>
      </Editable>,
    );
    expect(container.firstElementChild?.getAttribute("data-editable")).toBe("niche:familia");
  });

  it("repassa className pro elemento raiz, sem perder o data-editable", () => {
    const { container } = render(
      <Editable type="package" id="p1" className="col-span-6">
        <p>conteúdo</p>
      </Editable>,
    );
    const el = container.firstElementChild;
    expect(el?.className).toContain("col-span-6");
    expect(el?.getAttribute("data-editable")).toBe("package:p1");
  });

  it("renderiza os filhos normalmente", () => {
    const { getByText } = render(
      <Editable type="profile" id="main">
        <span>texto do perfil</span>
      </Editable>,
    );
    expect(getByText("texto do perfil")).toBeTruthy();
  });
});
