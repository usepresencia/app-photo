import type { Photo } from "../_mock/types";
import type { PlacedPhotoDTO } from "@/api/application/photo/PlacedPhotoDTO";
import type { FindBySurfaceOptions } from "@/api/domain/placement/PlacementRepository";
import type { PhotoSurface } from "@/api/domain/placement/Placement";
import { GetPhotosBySurfaceUseCase } from "@/api/application/photo/GetPhotosBySurfaceUseCase";
import { RepositoryFactory } from "@/api/infrastructure/repositories/RepositoryFactory";

// Wiring do caso de uso repetido em gallery.ts (hero/quem-sou) e niches.ts
// (niche) — centralizado aqui pra mudar num lugar só se o construtor
// ganhar mais uma dependência.
export async function getPhotosBySurface(
  surface: PhotoSurface,
  opts?: FindBySurfaceOptions,
): Promise<PlacedPhotoDTO[]> {
  return new GetPhotosBySurfaceUseCase(
    await RepositoryFactory.placements(),
    await RepositoryFactory.photos(),
  ).execute(surface, opts);
}

// PlacedPhotoDTO tem id e caption — nenhum dos dois existe no Photo
// público (só src, width, height, blurDataURL). Um destructuring
// `{ id, caption, ...photo }` pareceria mais direto, mas
// @typescript-eslint/no-unused-vars deste projeto acusa campos
// descartados assim mesmo como rest-siblings — sem ignoreRestSiblings
// configurado.
export function toPhoto(p: PlacedPhotoDTO): Photo {
  return {
    src: p.src,
    width: p.width,
    height: p.height,
    blurDataURL: p.blurDataURL,
    placementId: p.placementId,
  };
}

// Generaliza o que já era GalleryPhoto (antes só em gallery.ts, só pra a
// extinta home-gallery) — niche e quem-sou são as superfícies com visual
// de polaroide que restaram, ambas precisam da legenda vinda de caption.
export interface LabeledPhoto extends Photo {
  label: string;
}

export function toLabeledPhoto(p: PlacedPhotoDTO): LabeledPhoto {
  return { ...toPhoto(p), label: p.caption ?? "" };
}
