import { RepositoryFactory } from "@/api/infrastructure/repositories/RepositoryFactory";

export interface Testimonial {
  id: string;
  name: string;
  text: string;
  rating: number;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const repo = await RepositoryFactory.testimonials();
  const all = await repo.findAll();
  return all
    .filter((t) => t.visible)
    .map((t) => ({ id: t.id, name: t.authorName, text: t.text, rating: t.rating }));
}
