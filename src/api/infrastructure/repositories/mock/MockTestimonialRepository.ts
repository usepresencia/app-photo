import type { Testimonial } from "@/api/domain/testimonial/Testimonial";
import type { TestimonialRepository } from "@/api/domain/testimonial/TestimonialRepository";

// Dado local (dev/test/CI sem Firebase). Mesmo seed do
// MockTestimonialRepository do admin-photo, pra manter os dois repos
// consistentes em dev.
const TESTIMONIALS: Testimonial[] = [
  {
    id: "seed-1",
    authorName: "Marina R.",
    text: "A Denise deixou todo mundo à vontade. As fotos da família ficaram naturais, sem pose forçada.",
    rating: 5,
    relativeTime: "há 3 meses",
    order: 0,
    visible: true,
  },
  {
    id: "seed-2",
    authorName: "Carlos e Bia",
    text: "Fotografou nosso casamento civil e o pré-wedding. Entregou antes do prazo e cada foto conta uma história.",
    rating: 5,
    relativeTime: "há 6 meses",
    order: 1,
    visible: true,
  },
  {
    id: "seed-3",
    authorName: "Luiza M.",
    text: "Precisava de retratos profissionais para o LinkedIn e saí com um material que uso até hoje.",
    rating: 5,
    relativeTime: "há 1 ano",
    order: 2,
    visible: true,
  },
];

export class MockTestimonialRepository implements TestimonialRepository {
  async findAll(): Promise<Testimonial[]> {
    return [...TESTIMONIALS].sort((a, b) => a.order - b.order);
  }
}
