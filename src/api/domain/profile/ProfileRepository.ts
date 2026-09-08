import type { Profile } from "./Profile";

// Documento único (spec: "Profile — documento único, seção Quem sou") —
// sem findAll/delete, só get. null é o estado válido só antes da
// migração (plano 5) rodar com Firestore real; o mock sempre devolve algo.
export interface ProfileRepository {
  get(): Promise<Profile | null>;
}
