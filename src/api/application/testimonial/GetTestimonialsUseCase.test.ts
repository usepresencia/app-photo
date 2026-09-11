import { describe, expect, it } from "vitest";
import type { TestimonialRepository } from "@/api/domain/testimonial/TestimonialRepository";
import { MockTestimonialRepository } from "@/api/infrastructure/repositories/mock/MockTestimonialRepository";
import { GetTestimonialsUseCase } from "./GetTestimonialsUseCase";

function repoWith(visible: boolean): TestimonialRepository {
  return {
    findAll: async () => [
      {
        id: "hidden-1",
        authorName: "Alguém",
        text: "Depoimento oculto",
        rating: 4,
        relativeTime: "há 1 mês",
        order: 0,
        visible,
      },
    ],
  };
}

describe("GetTestimonialsUseCase", () => {
  it("retorna os 3 depoimentos do repositório", async () => {
    const useCase = new GetTestimonialsUseCase(new MockTestimonialRepository());
    const testimonials = await useCase.execute({ isDraft: false });
    expect(testimonials).toHaveLength(3);
  });

  it("no modo live, filtra depoimentos não visíveis", async () => {
    const useCase = new GetTestimonialsUseCase(repoWith(false));
    const testimonials = await useCase.execute({ isDraft: false });
    expect(testimonials).toEqual([]);
  });

  it("no modo rascunho, inclui depoimentos não visíveis", async () => {
    const useCase = new GetTestimonialsUseCase(repoWith(false));
    const testimonials = await useCase.execute({ isDraft: true });
    expect(testimonials).toHaveLength(1);
    expect(testimonials[0].visible).toBe(false);
  });
});
