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
  it("marca cada card de pacote como editável (tipo package)", () => {
    const { container } = render(
      <PackagePicker
        packages={packages}
        nicheTitle="Família"
        nicheGallery={[]}
        whatsappBase="https://wa.me/5511999999999"
      />,
    );
    const editables = container.querySelectorAll('[data-editable^="package:"]');
    expect(editables).toHaveLength(2);
    expect(editables[0].getAttribute("data-editable")).toBe("package:pacote-1");
    expect(editables[1].getAttribute("data-editable")).toBe("package:pacote-2");
  });
});
