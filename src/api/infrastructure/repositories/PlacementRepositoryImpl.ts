import type { Placement, PhotoSurface } from "@/api/domain/placement/Placement";
import type {
  FindBySurfaceOptions,
  PlacementRepository,
} from "@/api/domain/placement/PlacementRepository";
import { unstable_cache } from "next/cache";
import { db } from "../firebase/admin";

const COLLECTION = "placements";

function toPlacement(doc: FirebaseFirestore.QueryDocumentSnapshot): Placement {
  const data = doc.data();
  return {
    id: doc.id,
    photoId: data.photoId,
    surface: data.surface,
    refId: data.refId ?? null,
    role: data.role ?? null,
    order: data.order,
  };
}

// where(surface) [+ where(refId)] + orderBy(order) — duas formas de
// query diferentes (com e sem refId), cada uma com seu próprio índice
// composto em firestore.indexes.json (plano 10). unstable_cache dá tag
// pra ambas via uma única função — a chave inclui o valor de refId,
// então "com" e "sem" refId nunca colidem no cache.
const findPlacementsBySurface = unstable_cache(
  async (surface: PhotoSurface, refId?: string): Promise<Placement[]> => {
    let query: FirebaseFirestore.Query = db.collection(COLLECTION).where("surface", "==", surface);
    if (refId !== undefined) {
      query = query.where("refId", "==", refId);
    }
    const snapshot = await query.orderBy("order", "asc").get();
    return snapshot.docs.map(toPlacement);
  },
  ["placements", "findBySurface"],
  { tags: ["placements"] },
);

export class PlacementRepositoryImpl implements PlacementRepository {
  findBySurface(surface: PhotoSurface, opts?: FindBySurfaceOptions): Promise<Placement[]> {
    return findPlacementsBySurface(surface, opts?.refId);
  }
}
