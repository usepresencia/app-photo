import type { Package } from "@/api/domain/package/Package";
import type { PackageRepository } from "@/api/domain/package/PackageRepository";
import { unstable_cache } from "next/cache";
import { db } from "../firebase/admin";

const COLLECTION = "packages";

function toPackage(doc: FirebaseFirestore.QueryDocumentSnapshot): Package {
  const data = doc.data();
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

// db.collection(...).get() não é fetch() — unstable_cache é o jeito
// certo de dar tag a uma leitura assim (mesma confirmação do plano 7).
// admin-photo chama POST /api/revalidate → revalidateTag("packages",
// "max") quando escreve.
const findPackagesByNicheSlug = unstable_cache(
  async (nicheSlug: string): Promise<Package[]> => {
    const snapshot = await db
      .collection(COLLECTION)
      .where("nicheSlug", "==", nicheSlug)
      .orderBy("order", "asc")
      .get();
    return snapshot.docs.map(toPackage);
  },
  ["packages", "findByNicheSlug"],
  { tags: ["packages"] },
);

// Diferente de niches: pacote não tem um identificador natural fora do
// Firestore, então o ID do documento é gerado (a migração usa o mesmo
// formato do MockPackageRepository: "<nicheSlug>-<índice>"), não o slug.
// findByNicheSlug é uma query (where + orderBy), não um doc().get() —
// exige o índice composto (nicheSlug asc, order asc) em
// firestore.indexes.json; sem ele, a query falha em runtime real.
export class PackageRepositoryImpl implements PackageRepository {
  findByNicheSlug(nicheSlug: string): Promise<Package[]> {
    return findPackagesByNicheSlug(nicheSlug);
  }
}
