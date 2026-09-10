import { describe, expect, it } from "vitest";
import type { PlacedPhotoDTO } from "@/api/application/photo/PlacedPhotoDTO";
import { toLabeledPhoto } from "./getPhotosBySurface";

function dto(overrides: Partial<PlacedPhotoDTO> = {}): PlacedPhotoDTO {
  return {
    id: "foto-1",
    placementId: "placement-1",
    src: "/fotos/foto-1.webp",
    width: 1200,
    height: 1600,
    blurDataURL: "data:image/webp;base64,AA",
    caption: null,
    ...overrides,
  };
}

describe("toLabeledPhoto", () => {
  it("usa caption como label quando presente", () => {
    const photo = toLabeledPhoto(dto({ caption: "Minha base, minha família" }));
    expect(photo.label).toBe("Minha base, minha família");
  });

  it("usa string vazia como label quando caption é null", () => {
    const photo = toLabeledPhoto(dto({ caption: null }));
    expect(photo.label).toBe("");
  });

  it("preserva os campos de Photo (src/width/height/blurDataURL/placementId)", () => {
    const photo = toLabeledPhoto(
      dto({ src: "/x.webp", width: 10, height: 20, blurDataURL: "b", placementId: "p-1" }),
    );
    expect(photo).toMatchObject({
      src: "/x.webp",
      width: 10,
      height: 20,
      blurDataURL: "b",
      placementId: "p-1",
    });
  });
});
