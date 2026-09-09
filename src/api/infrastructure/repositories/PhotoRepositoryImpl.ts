import type { Photo } from "@/api/domain/photo/Photo";
import type { PhotoRepository } from "@/api/domain/photo/PhotoRepository";
import { FieldPath } from "firebase-admin/firestore";
import { env } from "@/lib/config/env.server";
import { buildDeliveryUrl } from "../cloudinary/buildDeliveryUrl";
import { db } from "../firebase/admin";

const COLLECTION = "photos";

// Firestore recusa `in` com array vazio, e limita a 30 valores — nenhuma
// superfície de hoje passa disso (ver Global Constraints do plano).
export class PhotoRepositoryImpl implements PhotoRepository {
  async findByIds(ids: string[]): Promise<Photo[]> {
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
  }
}
