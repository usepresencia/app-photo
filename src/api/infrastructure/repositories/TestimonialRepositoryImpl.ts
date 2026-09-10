import type { Testimonial } from "@/api/domain/testimonial/Testimonial";
import type { TestimonialRepository } from "@/api/domain/testimonial/TestimonialRepository";
import { unstable_cache } from "next/cache";
import { db } from "../firebase/admin";

const COLLECTION = "testimonials";
const DRAFT_COLLECTION = "testimonials_draft";

function toTestimonial(
  doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot,
): Testimonial {
  const data = doc.data();
  if (!data) throw new Error(`Documento "${doc.id}" da coleção "${COLLECTION}" está vazio`);
  return {
    id: doc.id,
    authorName: data.authorName,
    text: data.text,
    rating: data.rating,
    relativeTime: data.relativeTime,
    order: data.order,
    visible: data.visible,
  };
}

const findAllTestimonials = unstable_cache(
  async (): Promise<Testimonial[]> => {
    const snapshot = await db.collection(COLLECTION).orderBy("order", "asc").get();
    return snapshot.docs.map(toTestimonial);
  },
  ["testimonials", "findAll"],
  { tags: ["testimonials"] },
);

async function findAllDraftTestimonials(): Promise<Testimonial[]> {
  const snapshot = await db.collection(DRAFT_COLLECTION).orderBy("order", "asc").get();
  return snapshot.docs.filter((doc) => !doc.data()._deleted).map(toTestimonial);
}

export class TestimonialRepositoryImpl implements TestimonialRepository {
  constructor(private readonly isDraft: boolean = false) {}

  findAll(): Promise<Testimonial[]> {
    return this.isDraft ? findAllDraftTestimonials() : findAllTestimonials();
  }
}
