import type { NicheRepository } from "@/api/domain/niche/NicheRepository";
import type { NicheDTO } from "./NicheDTO";

export class GetNicheBySlugUseCase {
  constructor(private readonly repo: NicheRepository) {}

  async execute(slug: string): Promise<NicheDTO | null> {
    const niche = await this.repo.findBySlug(slug);
    return niche ? { ...niche } : null;
  }
}
