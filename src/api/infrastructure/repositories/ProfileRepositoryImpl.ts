import type { Profile } from "@/api/domain/profile/Profile";
import type { ProfileRepository } from "@/api/domain/profile/ProfileRepository";
import { unstable_cache } from "next/cache";
import { db } from "../firebase/admin";

const COLLECTION = "profile";
const DRAFT_COLLECTION = "profile_draft";
const DOCUMENT_ID = "main";

const getProfileDocument = unstable_cache(
  async (): Promise<Profile | null> => {
    const doc = await db.collection(COLLECTION).doc(DOCUMENT_ID).get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (!data) return null;
    return {
      capaCaption: data.capaCaption,
      profissao: data.profissao,
      familia: data.familia,
    };
  },
  ["profile", "get"],
  { tags: ["profile"] },
);

// Modo rascunho: sem tombstone (profile não tem conceito de exclusão),
// sem cache.
async function getDraftProfileDocument(): Promise<Profile | null> {
  const doc = await db.collection(DRAFT_COLLECTION).doc(DOCUMENT_ID).get();
  if (!doc.exists) return null;
  const data = doc.data();
  if (!data) return null;
  return {
    capaCaption: data.capaCaption,
    profissao: data.profissao,
    familia: data.familia,
  };
}

export class ProfileRepositoryImpl implements ProfileRepository {
  constructor(private readonly isDraft: boolean = false) {}

  get(): Promise<Profile | null> {
    return this.isDraft ? getDraftProfileDocument() : getProfileDocument();
  }
}
