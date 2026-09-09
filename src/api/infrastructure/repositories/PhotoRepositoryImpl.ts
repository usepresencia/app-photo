import type { Photo } from "@/api/domain/photo/Photo";
import type { PhotoRepository } from "@/api/domain/photo/PhotoRepository";
import { FieldPath } from "firebase-admin/firestore";
import { unstable_cache } from "next/cache";
import { env } from "@/lib/config/env.server";
import { buildDeliveryUrl } from "../cloudinary/buildDeliveryUrl";
import { db } from "../firebase/admin";

const COLLECTION = "photos";

// Firestore recusa `in` com array vazio, e limita a 30 valores — a maior
// galeria real de nicho tem 20 fotos (retratos-profissionais), nenhuma
// superfície passa do limite (ver spec, "Contrato Firestore de
// produção"). Mesma tag "placements" do PlacementRepositoryImpl — Photo
// não muda depois de criada (plano 9, sem update), então cachear aqui é
// só performance; a tag compartilhada existe pra invalidar as duas
// leituras juntas com um webhook só, não por necessidade de
// correção (uma lista de IDs nova já é uma chave de cache nova sozinha).
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

export class PhotoRepositoryImpl implements PhotoRepository {
  findByIds(ids: string[]): Promise<Photo[]> {
    return findPhotosByIds(ids);
  }
}
