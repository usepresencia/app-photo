import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { PackagePicker } from "./PackagePicker";
import type { Package } from "@/actions/packages";

const packages: Package[] = [
  {
    id: "pacote-1",
    name: "Essencial",
    price: "R$ 500",
    description: "",
    items: [],
    featured: false,
  },
  { id: "pacote-2", name: "Completo", price: "R$ 900", description: "", items: [], featured: true },
];

describe("PackagePicker", () => {
  it("marca nome e preço de cada card de pacote como editáveis (tipo package)", () => {
    const { container } = render(
      <PackagePicker
        packages={packages}
        nicheSlug="familia"
        nicheTitle="Família"
        nicheGallery={[]}
        whatsappBase="https://wa.me/5511999999999"
      />,
    );
    const editables = container.querySelectorAll('[data-editable-text^="package:"]');
    expect(editables).toHaveLength(4);
    const values = Array.from(editables).map((el) => el.getAttribute("data-editable-text"));
    expect(values).toContain("package:pacote-1:name");
    expect(values).toContain("package:pacote-1:price");
    expect(values).toContain("package:pacote-2:name");
    expect(values).toContain("package:pacote-2:price");
  });

  it("marca o fim da grade de pacotes com um Addable de tipo package (contexto: nicheSlug)", () => {
    const { container } = render(
      <PackagePicker
        packages={packages}
        nicheSlug="familia"
        nicheTitle="Família"
        nicheGallery={[]}
        whatsappBase="https://wa.me/5511999999999"
      />,
    );
    const addable = container.querySelector('[data-addable^="package:"]');
    expect(addable?.getAttribute("data-addable")).toBe('package:{"nicheSlug":"familia"}');
  });
});
