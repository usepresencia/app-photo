import type { Niche } from "@/api/domain/niche/Niche";
import type { NicheRepository } from "@/api/domain/niche/NicheRepository";
import { unstable_cache } from "next/cache";
import { db } from "../firebase/admin";

const COLLECTION = "niches";

function toNiche(
  doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot,
): Niche {
  const data = doc.data();
  if (!data) throw new Error(`Documento "${doc.id}" da coleção "${COLLECTION}" está vazio`);
  return {
    slug: doc.id,
    title: data.title,
    subtitle: data.subtitle,
    intro: data.intro,
    description: data.description,
    highlights: data.highlights,
    closingLine: data.closingLine,
    showAsEventTeaser: data.showAsEventTeaser,
    order: data.order,
    eventOrder: data.eventOrder ?? null,
  };
}

// db.collection(...).get() não é fetch() — unstable_cache é o jeito
// certo de dar tag a uma leitura assim (confirmado contra
// node_modules/next/dist/docs, "Caching (Previous Model)": este projeto
// não tem cacheComponents ligado). admin-photo chama
// POST /api/revalidate → revalidateTag("niches", "max") quando escreve.
const findAllNiches = unstable_cache(
  async (): Promise<Niche[]> => {
    const snapshot = await db.collection(COLLECTION).orderBy("order", "asc").get();
    return snapshot.docs.map(toNiche);
  },
  ["niches", "findAll"],
  { tags: ["niches"] },
);

const findNicheBySlug = unstable_cache(
  async (slug: string): Promise<Niche | null> => {
    const doc = await db.collection(COLLECTION).doc(slug).get();
    if (!doc.exists) return null;
    return toNiche(doc);
  },
  ["niches", "findBySlug"],
  { tags: ["niches"] },
);

// slug é o próprio ID do documento — findBySlug vira um doc().get() direto,
// sem query.
export class NicheRepositoryImpl implements NicheRepository {
  findAll(): Promise<Niche[]> {
    return findAllNiches();
  }

  findBySlug(slug: string): Promise<Niche | null> {
    return findNicheBySlug(slug);
  }
}
