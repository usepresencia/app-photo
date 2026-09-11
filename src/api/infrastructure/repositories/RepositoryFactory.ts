import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { cookies } from "next/headers";
import type { NicheRepository } from "@/api/domain/niche/NicheRepository";
import type { PackageRepository } from "@/api/domain/package/PackageRepository";
import type { PhotoRepository } from "@/api/domain/photo/PhotoRepository";
import type { PlacementRepository } from "@/api/domain/placement/PlacementRepository";
import type { ProfileRepository } from "@/api/domain/profile/ProfileRepository";
import type { TestimonialRepository } from "@/api/domain/testimonial/TestimonialRepository";
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
import { TestimonialRepositoryImpl } from "./TestimonialRepositoryImpl";
import { MockTestimonialRepository } from "./mock/MockTestimonialRepository";
import { DRAFT_COOKIE_NAME, isDraftCookieValue } from "./draftMode";

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

// Lê o cookie de modo rascunho uma vez por chamada — setado só pela
// rota /api/preview/enter, nunca por um visitante real. Só chamado
// quando shouldUseMock() é falso (mock nunca precisa saber disso, e
// cookies() exige um contexto de requisição real).
async function resolveIsDraft(): Promise<boolean> {
  const store = await cookies();
  return isDraftCookieValue(store.get(DRAFT_COOKIE_NAME)?.value);
}

export const RepositoryFactory = {
  niches: async (): Promise<NicheRepository> => {
    if (shouldUseMock()) return new MockNicheRepository();
    return new NicheRepositoryImpl(await resolveIsDraft());
  },
  packages: async (): Promise<PackageRepository> => {
    if (shouldUseMock()) return new MockPackageRepository();
    return new PackageRepositoryImpl(await resolveIsDraft());
  },
  photos: async (): Promise<PhotoRepository> => {
    if (shouldUseMock()) return new MockPhotoRepository();
    return new PhotoRepositoryImpl(await resolveIsDraft());
  },
  placements: async (): Promise<PlacementRepository> => {
    if (shouldUseMock()) return new MockPlacementRepository();
    return new PlacementRepositoryImpl(await resolveIsDraft());
  },
  profile: async (): Promise<ProfileRepository> => {
    if (shouldUseMock()) return new MockProfileRepository();
    return new ProfileRepositoryImpl(await resolveIsDraft());
  },
  testimonials: async (): Promise<TestimonialRepository> => {
    if (shouldUseMock()) return new MockTestimonialRepository();
    return new TestimonialRepositoryImpl(await resolveIsDraft());
  },
  // Exposto à parte (não só pra escolher o repo) porque getTestimonials()
  // precisa da mesma informação pra decidir se filtra por `visible` — só
  // no modo live isso importa; no rascunho, o admin precisa ver (e poder
  // mostrar de novo) avaliações ocultas.
  isDraftRequest: async (): Promise<boolean> => {
    if (shouldUseMock()) return false;
    return resolveIsDraft();
  },
};
