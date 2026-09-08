import type { Niche } from "@/api/domain/niche/Niche";
import type { NicheRepository } from "@/api/domain/niche/NicheRepository";
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

// slug é o próprio ID do documento — findBySlug vira um doc().get() direto,
// sem query.
export class NicheRepositoryImpl implements NicheRepository {
  async findAll(): Promise<Niche[]> {
    const snapshot = await db.collection(COLLECTION).orderBy("order", "asc").get();
    return snapshot.docs.map(toNiche);
  }

  async findBySlug(slug: string): Promise<Niche | null> {
    const doc = await db.collection(COLLECTION).doc(slug).get();
    if (!doc.exists) return null;
    return toNiche(doc);
  }
}
