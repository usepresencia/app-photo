import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { Gallery } from "./Gallery";
import type { LabeledPhoto } from "@/actions/_shared/getPhotosBySurface";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const photos: LabeledPhoto[] = Array.from({ length: 6 }, (_, i) => ({
  src: `/fotos/teste/galeria-${i}.webp`,
  width: 1200,
  height: 1600,
  blurDataURL: "data:image/webp;base64,AA",
  placementId: `placement-galeria-${i}`,
  label: "galeria",
}));

describe("Gallery", () => {
  it("marca cada foto da página atual do álbum como editável", () => {
    const { container } = render(<Gallery photos={photos} />);
    const editables = container.querySelectorAll('[data-editable^="placement:"]');
    expect(editables).toHaveLength(6);
    expect(editables[0].getAttribute("data-editable")).toBe(`placement:${photos[0].placementId}`);
  });

  it("marca a última página do álbum com um Addable de tipo placement (home-gallery)", () => {
    const { container } = render(<Gallery photos={photos} />);
    const addable = container.querySelector('[data-addable^="placement:"]');
    expect(addable?.getAttribute("data-addable")).toBe('placement:{"surface":"home-gallery"}');
  });
});
