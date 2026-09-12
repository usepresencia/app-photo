import type { Testimonial } from "@/api/domain/testimonial/Testimonial";
import type { TestimonialRepository } from "@/api/domain/testimonial/TestimonialRepository";
import { db } from "../firebase/admin";
import { makeReadRepo } from "./makeReadRepo";
import type { DocumentSnapshot, QueryDocumentSnapshot } from "firebase-admin/firestore";

const COLLECTION = "testimonials";
const DRAFT_COLLECTION = "testimonials_draft";

function toTestimonial(doc: QueryDocumentSnapshot | DocumentSnapshot): Testimonial {
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

async function findAllLiveTestimonials(): Promise<Testimonial[]> {
  const snapshot = await db.collection(COLLECTION).orderBy("order", "asc").get();
  return snapshot.docs.map(toTestimonial);
}

async function findAllDraftTestimonials(): Promise<Testimonial[]> {
  const snapshot = await db.collection(DRAFT_COLLECTION).orderBy("order", "asc").get();
  return snapshot.docs.filter((doc) => !doc.data()._deleted).map(toTestimonial);
}

const readAllTestimonials = makeReadRepo(
  ["testimonials", "findAll"],
  ["testimonials"],
  findAllLiveTestimonials,
  findAllDraftTestimonials,
);

export class TestimonialRepositoryImpl implements TestimonialRepository {
  constructor(private readonly isDraft: boolean = false) {}

  findAll(): Promise<Testimonial[]> {
    return readAllTestimonials(this.isDraft);
  }
}
