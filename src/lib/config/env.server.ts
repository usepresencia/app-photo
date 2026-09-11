import { z } from "zod";

// process.env deixa uma var opcional vazia no .env (ex.: `FOO=`, como
// está no .env.example) virar string vazia, não undefined —
// .optional() sozinho não cobre esse caso e .min(1)/.email() rejeitam
// um campo que devia ser tratado como "ausente". Normaliza pra
// undefined antes de validar.
function optionalNonEmpty<T extends z.ZodTypeAny>(inner: T) {
  return z.preprocess((v) => (v === "" ? undefined : v), inner.optional());
}

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Opcionais aqui de propósito: a ausência das três é um estado válido
  // (modo mock em dev/test). A RepositoryFactory decide o que fazer com
  // isso — ver src/api/infrastructure/repositories/RepositoryFactory.ts.
  FIREBASE_PROJECT_ID: optionalNonEmpty(z.string().min(1)),
  FIREBASE_CLIENT_EMAIL: optionalNonEmpty(z.string().email()),
  FIREBASE_PRIVATE_KEY: optionalNonEmpty(z.string().min(1)),
  // Cloud name do Cloudinary — usado só por PhotoRepositoryImpl pra
  // resolver cloudinaryPublicId em URL de entrega. Opcional aqui pela
  // mesma razão do Firebase: ausente, o app roda em modo mock (nenhuma
  // foto real do Firestore pra resolver ainda). CLOUDINARY_API_KEY/
  // API_SECRET não entram aqui — só o script de migração
  // (scripts/migrate-to-firestore.ts) usa, e ele lê .env.local
  // diretamente, sem passar pela validação do app.
  CLOUDINARY_CLOUD_NAME: optionalNonEmpty(z.string().min(1)),
  // Segredo compartilhado com o admin-photo — autentica POST
  // /api/revalidate. Opcional aqui pela mesma razão do Cloudinary: sem
  // admin ainda rodando contra este ambiente, não há quem chamar essa
  // rota, então validação não pode bloquear dev/test/CI.
  REVALIDATE_SECRET: optionalNonEmpty(z.string().min(1)),
});

export const env =
  process.env.SKIP_ENV_VALIDATION === "1"
    ? (process.env as unknown as z.infer<typeof schema>)
    : schema.parse(process.env);
