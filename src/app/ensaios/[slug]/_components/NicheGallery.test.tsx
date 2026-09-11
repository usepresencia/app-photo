import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { NicheGallery } from "./NicheGallery";
import type { LabeledPhoto } from "@/actions/_shared/getPhotosBySurface";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

function photo(i: number, label = ""): LabeledPhoto {
  return {
    src: `/fotos/teste/nicho-${i}.webp`,
    width: 1200,
    height: 1600,
    blurDataURL: "data:image/webp;base64,AA",
    placementId: `placement-nicho-${i}`,
    label,
  };
}

describe("NicheGallery", () => {
  it("marca cada foto da galeria do nicho como editável", () => {
    const photos = [photo(0), photo(1), photo(2), photo(3)];
    const { container } = render(
      <NicheGallery photos={photos} nicheTitle="Família" nicheSlug="familia" />,
    );
    const editables = container.querySelectorAll('[data-editable^="placement:"]');
    expect(editables).toHaveLength(4);
    expect(editables[0].getAttribute("data-editable")).toBe(`placement:${photos[0].placementId}`);
  });

  it("marca o título da galeria com um Addable de tipo placement (surface niche + refId)", () => {
    const photos = [photo(0), photo(1), photo(2), photo(3)];
    const { container } = render(
      <NicheGallery photos={photos} nicheTitle="Família" nicheSlug="familia" />,
    );
    const addable = container.querySelector('[data-addable^="placement:"]');
    expect(addable?.getAttribute("data-addable")).toBe(
      'placement:{"surface":"niche","refId":"familia"}',
    );
  });

  it("mostra a legenda só quando a foto tem label", () => {
    const photos = [photo(0, "Ensaio de família"), photo(1)];
    const { container } = render(
      <NicheGallery photos={photos} nicheTitle="Família" nicheSlug="familia" />,
    );
    const captions = container.querySelectorAll("figcaption");
    expect(captions).toHaveLength(1);
    expect(captions[0].textContent).toBe("Ensaio de família");
  });
});
