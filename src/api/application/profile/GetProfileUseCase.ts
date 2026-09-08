import type { ProfileRepository } from "@/api/domain/profile/ProfileRepository";
import type { ProfileDTO } from "./ProfileDTO";

export class GetProfileUseCase {
  constructor(private readonly repo: ProfileRepository) {}

  async execute(): Promise<ProfileDTO> {
    const profile = await this.repo.get();
    if (!profile) {
      throw new Error(
        'Documento "profile/main" não encontrado — rode a migração (plano 5) antes de servir tráfego real.',
      );
    }
    return { ...profile };
  }
}
