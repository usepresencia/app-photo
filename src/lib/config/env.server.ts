import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Opcionais aqui de propósito: a ausência das três é um estado válido
  // (modo mock em dev/test). A RepositoryFactory decide o que fazer com
  // isso — ver src/api/infrastructure/repositories/RepositoryFactory.ts.
  FIREBASE_PROJECT_ID: z.string().min(1).optional(),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional(),
  FIREBASE_PRIVATE_KEY: z.string().min(1).optional(),
  // Cloud name do Cloudinary — usado só por PhotoRepositoryImpl pra
  // resolver cloudinaryPublicId em URL de entrega. Opcional aqui pela
  // mesma razão do Firebase: ausente, o app roda em modo mock (nenhuma
  // foto real do Firestore pra resolver ainda). CLOUDINARY_API_KEY/
  // API_SECRET não entram aqui — só o script de migração
  // (scripts/migrate-to-firestore.ts) usa, e ele lê .env.local
  // diretamente, sem passar pela validação do app.
  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  // Segredo compartilhado com o admin-photo — autentica POST
  // /api/revalidate. Opcional aqui pela mesma razão do Cloudinary: sem
  // admin ainda rodando contra este ambiente, não há quem chamar essa
  // rota, então validação não pode bloquear dev/test/CI.
  REVALIDATE_SECRET: z.string().min(1).optional(),
});

export const env =
  process.env.SKIP_ENV_VALIDATION === "1"
    ? (process.env as unknown as z.infer<typeof schema>)
    : schema.parse(process.env);
