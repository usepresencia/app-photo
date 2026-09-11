import type { ProfileRepository } from "@/api/domain/profile/ProfileRepository";
import type { ProfileDTO } from "./ProfileDTO";

export class GetProfileUseCase {
  constructor(private readonly repo: ProfileRepository) {}

  async execute(): Promise<ProfileDTO> {
    const profile = await this.repo.get();
    if (!profile) {
      throw new Error(
        'Documento "profile/main" não encontrado no Firestore — é um documento único e obrigatório; sua ausência indica um problema de seed/configuração, não um estado válido em produção.',
      );
    }
    return { ...profile };
  }
}
