import type { Photo } from "@/api/domain/photo/Photo";
import type { PhotoRepository } from "@/api/domain/photo/PhotoRepository";
import { FieldPath } from "firebase-admin/firestore";
import { unstable_cache } from "next/cache";
import { env } from "@/lib/config/env.server";
import { buildDeliveryUrl } from "../cloudinary/buildDeliveryUrl";
import { db } from "../firebase/admin";

const COLLECTION = "photos";
const DRAFT_COLLECTION = "photos_draft";

const findPhotosByIds = unstable_cache(
  async (ids: string[]): Promise<Photo[]> => {
    if (ids.length === 0) return [];
    if (!env.CLOUDINARY_CLOUD_NAME) {
      throw new Error(
        "CLOUDINARY_CLOUD_NAME não configurado — necessário pra resolver fotos reais do Firestore.",
      );
    }
    const cloudName = env.CLOUDINARY_CLOUD_NAME;
    const snapshot = await db.collection(COLLECTION).where(FieldPath.documentId(), "in", ids).get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        src: buildDeliveryUrl(data.cloudinaryPublicId, cloudName),
        width: data.width,
        height: data.height,
        blurDataURL: data.blurDataURL,
      };
    });
  },
  ["photos", "findByIds"],
  { tags: ["placements"] },
);

// Modo rascunho: mesma query (in-list já é single-clause, sem orderBy),
// sem cache, filtrando tombstone.
async function findDraftPhotosByIds(ids: string[]): Promise<Photo[]> {
  if (ids.length === 0) return [];
  if (!env.CLOUDINARY_CLOUD_NAME) {
    throw new Error(
      "CLOUDINARY_CLOUD_NAME não configurado — necessário pra resolver fotos reais do Firestore.",
    );
  }
  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  const snapshot = await db
    .collection(DRAFT_COLLECTION)
    .where(FieldPath.documentId(), "in", ids)
    .get();
  return snapshot.docs
    .filter((doc) => !doc.data()._deleted)
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        src: buildDeliveryUrl(data.cloudinaryPublicId, cloudName),
        width: data.width,
        height: data.height,
        blurDataURL: data.blurDataURL,
      };
    });
}

export class PhotoRepositoryImpl implements PhotoRepository {
  constructor(private readonly isDraft: boolean = false) {}

  findByIds(ids: string[]): Promise<Photo[]> {
    return this.isDraft ? findDraftPhotosByIds(ids) : findPhotosByIds(ids);
  }
}
