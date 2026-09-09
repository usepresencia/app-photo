import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { NicheHero } from "./NicheHero";
import type { Photo } from "@/actions/_mock/types";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

function foto(placementId: string): Photo {
  return {
    src: `/fotos/teste/${placementId}.webp`,
    width: 1600,
    height: 1067,
    blurDataURL: "data:image/webp;base64,AA",
    placementId,
  };
}

describe("NicheHero", () => {
  it("marca título e subtítulo como editáveis (tipo niche)", () => {
    const { container } = render(
      <NicheHero
        slug="familia"
        title="Família"
        subtitle="Ensaios em família"
        landscapePhotos={[foto("p1")]}
        portraitPhotos={[foto("p2")]}
      />,
    );
    const editable = container.querySelector('[data-editable="niche:familia"]');
    expect(editable).not.toBeNull();
    expect(editable?.textContent).toContain("Família");
    expect(editable?.textContent).toContain("Ensaios em família");
  });

  it("marca a foto exibida no slideshow como editável (tipo placement)", () => {
    const { container } = render(
      <NicheHero
        slug="familia"
        title="Família"
        subtitle="Ensaios em família"
        landscapePhotos={[foto("p1")]}
        portraitPhotos={[foto("p2")]}
      />,
    );
    const placementEditables = container.querySelectorAll('[data-editable^="placement:"]');
    // um slide visível por breakpoint (mobile "portrait" + desktop "landscape")
    expect(placementEditables).toHaveLength(2);
  });
});
