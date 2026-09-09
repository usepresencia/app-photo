import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { NicheGallery } from "./NicheGallery";
import type { Photo } from "@/actions/_mock/types";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const photos: Photo[] = Array.from({ length: 4 }, (_, i) => ({
  src: `/fotos/teste/nicho-${i}.webp`,
  width: 1200,
  height: 1600,
  blurDataURL: "data:image/webp;base64,AA",
  placementId: `placement-nicho-${i}`,
}));

describe("NicheGallery", () => {
  it("marca cada foto da galeria do nicho como editável", () => {
    const { container } = render(<NicheGallery photos={photos} nicheTitle="Família" />);
    const editables = container.querySelectorAll('[data-editable^="placement:"]');
    expect(editables).toHaveLength(4);
    expect(editables[0].getAttribute("data-editable")).toBe(`placement:${photos[0].placementId}`);
  });
});
