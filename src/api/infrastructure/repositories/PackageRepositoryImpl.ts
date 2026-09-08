import type { Package } from "@/api/domain/package/Package";
import type { PackageRepository } from "@/api/domain/package/PackageRepository";
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

// Diferente de niches: pacote não tem um identificador natural fora do
// Firestore, então o ID do documento é gerado (a migração usa o mesmo
// formato do MockPackageRepository: "<nicheSlug>-<índice>"), não o slug.
// findByNicheSlug é uma query (where + orderBy), não um doc().get() —
// exige um índice composto (nicheSlug asc, order asc) no Firestore; sem
// ele, a query falha em runtime real. Ver Task 2, Step 5 do plano.
export class PackageRepositoryImpl implements PackageRepository {
  async findByNicheSlug(nicheSlug: string): Promise<Package[]> {
    const snapshot = await db
      .collection(COLLECTION)
      .where("nicheSlug", "==", nicheSlug)
      .orderBy("order", "asc")
      .get();
    return snapshot.docs.map(toPackage);
  }
}
