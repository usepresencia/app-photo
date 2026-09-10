import type { Placement, PhotoSurface } from "@/api/domain/placement/Placement";
import type {
  FindBySurfaceOptions,
  PlacementRepository,
} from "@/api/domain/placement/PlacementRepository";
import { unstable_cache } from "next/cache";
import { db } from "../firebase/admin";

const COLLECTION = "placements";
const DRAFT_COLLECTION = "placements_draft";

function toPlacement(
  doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot,
): Placement {
  const data = doc.data();
  if (!data) throw new Error(`Documento "${doc.id}" da coleção "placements" está vazio`);
  return {
    id: doc.id,
    photoId: data.photoId,
    surface: data.surface,
    refId: data.refId ?? null,
    caption: data.caption ?? null,
    order: data.order,
  };
}

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

// Modo rascunho: só os wheres de igualdade (sem orderBy combinado) —
// evita precisar de um índice composto novo pra "placements_draft".
// Ordena/filtra tombstone em JS.
async function findDraftPlacementsBySurface(
  surface: PhotoSurface,
  refId?: string,
): Promise<Placement[]> {
  let query: FirebaseFirestore.Query = db
    .collection(DRAFT_COLLECTION)
    .where("surface", "==", surface);
  if (refId !== undefined) {
    query = query.where("refId", "==", refId);
  }
  const snapshot = await query.get();
  return snapshot.docs
    .filter((doc) => !doc.data()._deleted)
    .map(toPlacement)
    .sort((a, b) => a.order - b.order);
}

export class PlacementRepositoryImpl implements PlacementRepository {
  constructor(private readonly isDraft: boolean = false) {}

  findBySurface(surface: PhotoSurface, opts?: FindBySurfaceOptions): Promise<Placement[]> {
    return this.isDraft
      ? findDraftPlacementsBySurface(surface, opts?.refId)
      : findPlacementsBySurface(surface, opts?.refId);
  }
}
