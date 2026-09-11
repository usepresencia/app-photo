import type { Package } from "./Package";

export interface PackageRepository {
  findByNicheSlug(nicheSlug: string): Promise<Package[]>;
}
