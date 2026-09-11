import { RepositoryFactory } from "@/api/infrastructure/repositories/RepositoryFactory";

export interface Testimonial {
  id: string;
  name: string;
  text: string;
  rating: number;
  visible: boolean;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const repo = await RepositoryFactory.testimonials();
  const [all, isDraft] = await Promise.all([repo.findAll(), RepositoryFactory.isDraftRequest()]);
  const chosen = isDraft ? all : all.filter((t) => t.visible);
  return chosen.map((t) => ({
    id: t.id,
    name: t.authorName,
    text: t.text,
    rating: t.rating,
    visible: t.visible,
  }));
}
