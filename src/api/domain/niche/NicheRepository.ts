import type { Niche } from "./Niche";

export interface NicheRepository {
  findAll(): Promise<Niche[]>;
  findBySlug(slug: string): Promise<Niche | null>;
}
