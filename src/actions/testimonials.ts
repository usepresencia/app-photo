export interface Testimonial {
  name: string;
  text: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Marina R.",
    text: "A Denise deixou todo mundo à vontade. As fotos da família ficaram naturais, sem pose forçada.",
  },
  {
    name: "Carlos e Bia",
    text: "Fotografou nosso casamento civil e o pré-wedding. Entregou antes do prazo e cada foto conta uma história.",
  },
  {
    name: "Luiza M.",
    text: "Precisava de retratos profissionais para o LinkedIn e saí com um material que uso até hoje.",
  },
];

export async function getTestimonials(): Promise<Testimonial[]> {
  return TESTIMONIALS;
}
