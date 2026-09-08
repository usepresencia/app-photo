import { PHASE_PRODUCTION_BUILD } from "next/constants";
import type { NicheRepository } from "@/api/domain/niche/NicheRepository";
import type { PackageRepository } from "@/api/domain/package/PackageRepository";
import type { PhotoRepository } from "@/api/domain/photo/PhotoRepository";
import type { PlacementRepository } from "@/api/domain/placement/PlacementRepository";
import type { ProfileRepository } from "@/api/domain/profile/ProfileRepository";
import { env } from "@/lib/config/env.server";
import { NicheRepositoryImpl } from "./NicheRepositoryImpl";
import { MockNicheRepository } from "./mock/MockNicheRepository";
import { PackageRepositoryImpl } from "./PackageRepositoryImpl";
import { MockPackageRepository } from "./mock/MockPackageRepository";
import { PhotoRepositoryImpl } from "./PhotoRepositoryImpl";
import { MockPhotoRepository } from "./mock/MockPhotoRepository";
import { PlacementRepositoryImpl } from "./PlacementRepositoryImpl";
import { MockPlacementRepository } from "./mock/MockPlacementRepository";
import { ProfileRepositoryImpl } from "./ProfileRepositoryImpl";
import { MockProfileRepository } from "./mock/MockProfileRepository";

function hasFirebaseCredentials(): boolean {
  return Boolean(env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY);
}

// `next build` roda com NODE_ENV=production mesmo sem credenciais reais
// (CI não tem segredos do Firebase) — NODE_ENV sozinho não distingue
// "gerando o build" de "servindo tráfego real". NEXT_PHASE distingue: só a
// segunda precisa falhar alto na ausência de credenciais.
function isProductionRuntime(): boolean {
  return env.NODE_ENV === "production" && process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD;
}

// Nome deliberadamente sem prefixo "use": eslint-plugin-react-hooks trata
// qualquer função "use*" como Hook e barra chamá-la fora de componente.
function shouldUseMock(): boolean {
  if (isProductionRuntime()) return false;
  return !hasFirebaseCredentials();
}

export const RepositoryFactory = {
  niches: (): NicheRepository =>
    shouldUseMock() ? new MockNicheRepository() : new NicheRepositoryImpl(),
  packages: (): PackageRepository =>
    shouldUseMock() ? new MockPackageRepository() : new PackageRepositoryImpl(),
  photos: (): PhotoRepository =>
    shouldUseMock() ? new MockPhotoRepository() : new PhotoRepositoryImpl(),
  placements: (): PlacementRepository =>
    shouldUseMock() ? new MockPlacementRepository() : new PlacementRepositoryImpl(),
  profile: (): ProfileRepository =>
    shouldUseMock() ? new MockProfileRepository() : new ProfileRepositoryImpl(),
};
