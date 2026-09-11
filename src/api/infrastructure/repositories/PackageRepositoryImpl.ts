import type { Package } from "@/api/domain/package/Package";
import type { PackageRepository } from "@/api/domain/package/PackageRepository";
import { db } from "../firebase/admin";
import { makeReadRepo } from "./makeReadRepo";

const COLLECTION = "packages";
const DRAFT_COLLECTION = "packages_draft";

function toPackage(
  doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot,
): Package {
  const data = doc.data();
  if (!data) throw new Error(`Documento "${doc.id}" da coleção "${COLLECTION}" está vazio`);
  return {
    id: doc.id,
    nicheSlug: data.nicheSlug,
    name: data.name,
    price: data.price,
    description: data.description,
    items: data.items,
    featured: data.featured,
    order: data.order,
  };
}

async function findLivePackagesByNicheSlug(nicheSlug: string): Promise<Package[]> {
  const snapshot = await db
    .collection(COLLECTION)
    .where("nicheSlug", "==", nicheSlug)
    .orderBy("order", "asc")
    .get();
  return snapshot.docs.map(toPackage);
}

// Modo rascunho: só o where de igualdade (sem orderBy combinado) —
// evita precisar de um índice composto novo pra "packages_draft".
// Ordena/filtra tombstone em JS (14 documentos, trivial).
async function findDraftPackagesByNicheSlug(nicheSlug: string): Promise<Package[]> {
  const snapshot = await db.collection(DRAFT_COLLECTION).where("nicheSlug", "==", nicheSlug).get();
  return snapshot.docs
    .filter((doc) => !doc.data()._deleted)
    .map(toPackage)
    .sort((a, b) => a.order - b.order);
}

const readPackagesByNicheSlug = makeReadRepo(
  ["packages", "findByNicheSlug"],
  ["packages"],
  findLivePackagesByNicheSlug,
  findDraftPackagesByNicheSlug,
);

export class PackageRepositoryImpl implements PackageRepository {
  constructor(private readonly isDraft: boolean = false) {}

  findByNicheSlug(nicheSlug: string): Promise<Package[]> {
    return readPackagesByNicheSlug(this.isDraft, nicheSlug);
  }
}
