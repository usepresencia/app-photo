import type { Placement, PhotoSurface } from "@/api/domain/placement/Placement";
import type {
  FindBySurfaceOptions,
  PlacementRepository,
} from "@/api/domain/placement/PlacementRepository";
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

// where(surface) + where(refId) + orderBy(order) — três campos diferentes,
// precisa de índice composto (surface, refId, order) no Firestore real.
// Mesma situação de PackageRepositoryImpl (plano 2): sem Firestore de
// desenvolvimento configurado neste plano, verificação fica manual.
export class PlacementRepositoryImpl implements PlacementRepository {
  async findBySurface(surface: PhotoSurface, opts?: FindBySurfaceOptions): Promise<Placement[]> {
    let query: FirebaseFirestore.Query = db.collection(COLLECTION).where("surface", "==", surface);
    if (opts?.refId !== undefined) {
      query = query.where("refId", "==", opts.refId);
    }
    const snapshot = await query.orderBy("order", "asc").get();
    return snapshot.docs.map(toPlacement);
  }
}
