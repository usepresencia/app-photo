import { PHASE_PRODUCTION_BUILD } from "next/constants";
import type { NicheRepository } from "@/api/domain/niche/NicheRepository";
import { env } from "@/lib/config/env.server";
import { NicheRepositoryImpl } from "./NicheRepositoryImpl";
import { MockNicheRepository } from "./mock/MockNicheRepository";

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
};
