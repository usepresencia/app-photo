import { GetProfileUseCase } from "@/api/application/profile/GetProfileUseCase";
import { RepositoryFactory } from "@/api/infrastructure/repositories/RepositoryFactory";

export interface Profile {
  capaCaption: string;
  profissao: {
    titulo: string;
    eyebrow: string;
    paragrafos: string[];
  };
  familia: {
    titulo: string;
    paragrafos: string[];
    legendaFoto: string;
  };
}

export async function getProfile(): Promise<Profile> {
  const dto = await new GetProfileUseCase(RepositoryFactory.profile()).execute();
  return { ...dto };
}
