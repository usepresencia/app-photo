import type { Niche } from "@/api/domain/niche/Niche";
import type { NicheRepository } from "@/api/domain/niche/NicheRepository";
import { unstable_cache } from "next/cache";
import { db } from "../firebase/admin";

const COLLECTION = "niches";
const DRAFT_COLLECTION = "niches_draft";

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
// certo de dar tag a uma leitura assim. admin-photo chama
// POST /api/revalidate → revalidateTag("niches", "max") só quando
// publica (não mais a cada save — ver
// admin-photo/docs/superpowers/specs/2026-09-09-rascunho-publicar-design.md).
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

// Modo rascunho lê "niches_draft" direto do Firestore, sem
// unstable_cache — tráfego de preview é baixo, prioriza corretude
// sobre performance. Filtra tombstones em JS (mesmo critério do
// admin-photo).
async function findAllDraftNiches(): Promise<Niche[]> {
  const snapshot = await db.collection(DRAFT_COLLECTION).orderBy("order", "asc").get();
  return snapshot.docs.filter((doc) => !doc.data()._deleted).map(toNiche);
}

async function findDraftNicheBySlug(slug: string): Promise<Niche | null> {
  const doc = await db.collection(DRAFT_COLLECTION).doc(slug).get();
  if (!doc.exists || doc.data()?._deleted) return null;
  return toNiche(doc);
}

// slug é o próprio ID do documento — findBySlug vira um doc().get() direto,
// sem query.
export class NicheRepositoryImpl implements NicheRepository {
  constructor(private readonly isDraft: boolean = false) {}

  findAll(): Promise<Niche[]> {
    return this.isDraft ? findAllDraftNiches() : findAllNiches();
  }

  findBySlug(slug: string): Promise<Niche | null> {
    return this.isDraft ? findDraftNicheBySlug(slug) : findNicheBySlug(slug);
  }
}
