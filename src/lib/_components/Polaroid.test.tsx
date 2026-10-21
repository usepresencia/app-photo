import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { Polaroid } from "./Polaroid";
import type { Photo } from "@/actions/_mock/types";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const photo: Photo = {
  src: "/fotos/teste/polaroid.webp",
  width: 1200,
  height: 1600,
  blurDataURL: "data:image/webp;base64,AA",
  placementId: "placement-teste",
};

describe("Polaroid", () => {
  it("aceita um nó React como legenda, não só texto puro — permite envolver em EditableText", () => {
    const { container } = render(
      <Polaroid
        photo={photo}
        alt="Foto de teste"
        caption={<span data-editable-text="profile:main:legenda">texto editável</span>}
      />,
    );
    const editableSpan = container.querySelector('[data-editable-text="profile:main:legenda"]');
    expect(editableSpan?.textContent).toBe("texto editável");
  });

  it("não renderiza figcaption quando nenhuma legenda é passada", () => {
    const { container } = render(<Polaroid photo={photo} alt="Foto de teste" />);
    expect(container.querySelector("figcaption")).toBeNull();
  });
});
