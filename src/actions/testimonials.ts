import type { TestimonialDTO } from "@/api/application/testimonial/TestimonialDTO";
import { GetTestimonialsUseCase } from "@/api/application/testimonial/GetTestimonialsUseCase";
import { RepositoryFactory } from "@/api/infrastructure/repositories/RepositoryFactory";

export interface Testimonial {
  id: string;
  name: string;
  text: string;
  rating: number;
  visible: boolean;
}

function toTestimonial(t: TestimonialDTO): Testimonial {
  return {
    id: t.id,
    name: t.authorName,
    text: t.text,
    rating: t.rating,
    visible: t.visible,
  };
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const [repo, isDraft] = await Promise.all([
    RepositoryFactory.testimonials(),
    RepositoryFactory.isDraftRequest(),
  ]);
  const dtos = await new GetTestimonialsUseCase(repo).execute({ isDraft });
  return dtos.map(toTestimonial);
}
