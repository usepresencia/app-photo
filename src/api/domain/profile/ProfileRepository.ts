import type { Profile } from "./Profile";

// Documento único (spec: "Profile — documento único, seção Quem sou") —
// sem findAll/delete, só get. null representa a ausência do documento
// "profile/main" no Firestore (falha de seed/configuração); o mock
// sempre devolve algo, então esse caminho só é exercitado contra o
// Firestore real.
export interface ProfileRepository {
  get(): Promise<Profile | null>;
}
