import type { Testimonial } from "./Testimonial";

export interface TestimonialRepository {
  findAll(): Promise<Testimonial[]>;
}
