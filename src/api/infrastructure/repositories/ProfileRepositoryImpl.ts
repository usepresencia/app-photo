import type { Profile } from "@/api/domain/profile/Profile";
import type { ProfileRepository } from "@/api/domain/profile/ProfileRepository";
import { db } from "../firebase/admin";
import { makeReadRepo } from "./makeReadRepo";

const COLLECTION = "profile";
const DRAFT_COLLECTION = "profile_draft";
const DOCUMENT_ID = "main";

async function getLiveProfileDocument(): Promise<Profile | null> {
  const doc = await db.collection(COLLECTION).doc(DOCUMENT_ID).get();
  if (!doc.exists) return null;
  const data = doc.data();
  if (!data) return null;
  return {
    capaCaption: data.capaCaption,
    profissao: data.profissao,
    familia: data.familia,
  };
}

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

const readProfile = makeReadRepo(
  ["profile", "get"],
  ["profile"],
  getLiveProfileDocument,
  getDraftProfileDocument,
);

export class ProfileRepositoryImpl implements ProfileRepository {
  constructor(private readonly isDraft: boolean = false) {}

  get(): Promise<Profile | null> {
    return readProfile(this.isDraft);
  }
}
