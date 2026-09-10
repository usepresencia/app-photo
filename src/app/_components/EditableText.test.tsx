import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { EditableText } from "./EditableText";

describe("EditableText", () => {
  it("gera o atributo data-editable-text no formato type:id:field", () => {
    const { container } = render(
      <EditableText type="niche" id="familia" field="title">
        Família
      </EditableText>,
    );
    const el = container.querySelector("[data-editable-text]");
    expect(el?.getAttribute("data-editable-text")).toBe("niche:familia:title");
    expect(el?.textContent).toBe("Família");
  });

  it("usa a tag pedida em 'as', span por padrão", () => {
    const { container } = render(
      <EditableText type="package" id="familia-0" field="name" as="h3">
        Essencial
      </EditableText>,
    );
    expect(container.querySelector("h3[data-editable-text]")).not.toBeNull();
  });

  it("repassa className pro elemento renderizado", () => {
    const { container } = render(
      <EditableText type="profile" id="main" field="capaCaption" className="text-rose">
        Legenda
      </EditableText>,
    );
    expect(container.querySelector(".text-rose")).not.toBeNull();
  });
});
