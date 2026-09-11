import type { Niche } from "@/api/domain/niche/Niche";
import type { NicheRepository } from "@/api/domain/niche/NicheRepository";
import { db } from "../firebase/admin";
import { makeReadRepo } from "./makeReadRepo";

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
// publica, não a cada save (rascunho/publicação é assíncrono do
// ponto de vista deste repo — ele só lê a tag quando mandarem).
async function findAllLiveNiches(): Promise<Niche[]> {
  const snapshot = await db.collection(COLLECTION).orderBy("order", "asc").get();
  return snapshot.docs.map(toNiche);
}

async function findLiveNicheBySlug(slug: string): Promise<Niche | null> {
  const doc = await db.collection(COLLECTION).doc(slug).get();
  if (!doc.exists) return null;
  return toNiche(doc);
}

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

const readAllNiches = makeReadRepo(
  ["niches", "findAll"],
  ["niches"],
  findAllLiveNiches,
  findAllDraftNiches,
);

const readNicheBySlug = makeReadRepo(
  ["niches", "findBySlug"],
  ["niches"],
  findLiveNicheBySlug,
  findDraftNicheBySlug,
);

// slug é o próprio ID do documento — findBySlug vira um doc().get() direto,
// sem query.
export class NicheRepositoryImpl implements NicheRepository {
  constructor(private readonly isDraft: boolean = false) {}

  findAll(): Promise<Niche[]> {
    return readAllNiches(this.isDraft);
  }

  findBySlug(slug: string): Promise<Niche | null> {
    return readNicheBySlug(this.isDraft, slug);
  }
}
