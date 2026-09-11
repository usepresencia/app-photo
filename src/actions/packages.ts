import type { PackageDTO } from "@/api/application/package/PackageDTO";
import { GetPackagesByNicheUseCase } from "@/api/application/package/GetPackagesByNicheUseCase";
import { RepositoryFactory } from "@/api/infrastructure/repositories/RepositoryFactory";

export interface Package {
  id: string;
  name: string;
  price: string;
  description: string;
  items: string[];
  featured: boolean;
}

function toPackage(dto: PackageDTO): Package {
  return {
    id: dto.id,
    name: dto.name,
    price: dto.price,
    description: dto.description,
    items: dto.items,
    featured: dto.featured,
  };
}

export async function getPackagesForNiche(slug: string): Promise<Package[]> {
  const dtos = await new GetPackagesByNicheUseCase(await RepositoryFactory.packages()).execute(
    slug,
  );
  return dtos.map(toPackage);
}
