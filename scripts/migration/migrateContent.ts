import type { Niche } from "@/api/domain/niche/Niche";
import type { Package } from "@/api/domain/package/Package";
import type { Profile } from "@/api/domain/profile/Profile";
import { MockNicheRepository } from "@/api/infrastructure/repositories/mock/MockNicheRepository";
import { MockPackageRepository } from "@/api/infrastructure/repositories/mock/MockPackageRepository";
import { MockProfileRepository } from "@/api/infrastructure/repositories/mock/MockProfileRepository";

// MockNicheRepository/MockPackageRepository/MockProfileRepository já são
// transcrição fiel do conteúdo real (planos 1, 2 e 4 documentam isso nos
// próprios arquivos) — não existe um segundo lugar "mais real" pra buscar
// esse texto. Migrar é copiar do mock pro Firestore de produção.
export async function collectNiches(): Promise<Niche[]> {
  return new MockNicheRepository().findAll();
}

export async function collectPackages(niches: Niche[]): Promise<Package[]> {
  const repo = new MockPackageRepository();
  const listas = await Promise.all(niches.map((n) => repo.findByNicheSlug(n.slug)));
  return listas.flat();
}

export async function collectProfile(): Promise<Profile> {
  const profile = await new MockProfileRepository().get();
  if (!profile)
    throw new Error("MockProfileRepository não devolveu profile — não deveria acontecer.");
  return profile;
}
