import type { Profile } from "@/api/domain/profile/Profile";
import type { ProfileRepository } from "@/api/domain/profile/ProfileRepository";
import { unstable_cache } from "next/cache";
import { db } from "../firebase/admin";

const COLLECTION = "profile";
const DOCUMENT_ID = "main";

// Documento único e fixo — diferente de niches (slug como ID) e de
// packages/placements (query com where/orderBy), aqui não há nenhuma
// variação possível de "qual documento": é sempre profile/main. Sem
// índice composto, sem paginação. unstable_cache dá tag pra essa
// leitura — admin-photo chama POST /api/revalidate →
// revalidateTag("profile", "max") quando escreve.
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

export class ProfileRepositoryImpl implements ProfileRepository {
  get(): Promise<Profile | null> {
    return getProfileDocument();
  }
}
