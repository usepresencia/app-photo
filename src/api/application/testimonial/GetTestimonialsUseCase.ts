import type { TestimonialRepository } from "@/api/domain/testimonial/TestimonialRepository";
import type { TestimonialDTO } from "./TestimonialDTO";

export class GetTestimonialsUseCase {
  constructor(private readonly repo: TestimonialRepository) {}

  // isDraft vem de fora (RepositoryFactory.isDraftRequest()) em vez de o
  // use case decidir sozinho: quem está em modo rascunho (o admin) precisa
  // ver e poder tornar a mostrar avaliações ocultas; um visitante real só
  // vê as marcadas como visible.
  async execute(opts: { isDraft: boolean }): Promise<TestimonialDTO[]> {
    const testimonials = await this.repo.findAll();
    const chosen = opts.isDraft ? testimonials : testimonials.filter((t) => t.visible);
    return chosen.map((t) => ({ ...t }));
  }
}
