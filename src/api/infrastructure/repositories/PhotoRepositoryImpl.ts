import type { Photo } from "@/api/domain/photo/Photo";
import type { PhotoRepository } from "@/api/domain/photo/PhotoRepository";
import { FieldPath } from "firebase-admin/firestore";
import { env } from "@/lib/config/env.server";
import { buildDeliveryUrl } from "../cloudinary/buildDeliveryUrl";
import { db } from "../firebase/admin";
import { makeReadRepo } from "./makeReadRepo";

const COLLECTION = "photos";
const DRAFT_COLLECTION = "photos_draft";

function toPhoto(
  doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot,
  cloudName: string,
): Photo {
  const data = doc.data();
  if (!data) throw new Error(`Documento "${doc.id}" da coleção "${COLLECTION}" está vazio`);
  return {
    id: doc.id,
    src: buildDeliveryUrl(data.cloudinaryPublicId, cloudName),
    width: data.width,
    height: data.height,
    blurDataURL: data.blurDataURL,
  };
}

async function findLivePhotosByIds(ids: string[]): Promise<Photo[]> {
  if (ids.length === 0) return [];
  if (!env.CLOUDINARY_CLOUD_NAME) {
    throw new Error(
      "CLOUDINARY_CLOUD_NAME não configurado — necessário pra resolver fotos reais do Firestore.",
    );
  }
  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  const snapshot = await db.collection(COLLECTION).where(FieldPath.documentId(), "in", ids).get();
  return snapshot.docs.map((doc) => toPhoto(doc, cloudName));
}

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
  return snapshot.docs.filter((doc) => !doc.data()._deleted).map((doc) => toPhoto(doc, cloudName));
}

const readPhotosByIds = makeReadRepo(
  ["photos", "findByIds"],
  ["placements"],
  findLivePhotosByIds,
  findDraftPhotosByIds,
);

export class PhotoRepositoryImpl implements PhotoRepository {
  constructor(private readonly isDraft: boolean = false) {}

  findByIds(ids: string[]): Promise<Photo[]> {
    return readPhotosByIds(this.isDraft, ids);
  }
}
