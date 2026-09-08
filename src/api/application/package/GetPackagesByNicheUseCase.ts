import type { PackageRepository } from "@/api/domain/package/PackageRepository";
import type { PackageDTO } from "./PackageDTO";

export class GetPackagesByNicheUseCase {
  constructor(private readonly repo: PackageRepository) {}

  async execute(nicheSlug: string): Promise<PackageDTO[]> {
    const packages = await this.repo.findByNicheSlug(nicheSlug);
    return packages.map((p) => ({ ...p }));
  }
}
