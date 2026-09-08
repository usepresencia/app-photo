import type { NicheRepository } from "@/api/domain/niche/NicheRepository";
import type { NicheDTO } from "./NicheDTO";

export class GetNichesUseCase {
  constructor(private readonly repo: NicheRepository) {}

  async execute(): Promise<NicheDTO[]> {
    const niches = await this.repo.findAll();
    return niches.map((n) => ({ ...n }));
  }
}
