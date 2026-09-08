import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Opcionais aqui de propósito: a ausência das três é um estado válido
  // (modo mock em dev/test). A RepositoryFactory decide o que fazer com
  // isso — ver src/api/infrastructure/repositories/RepositoryFactory.ts.
  FIREBASE_PROJECT_ID: z.string().min(1).optional(),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional(),
  FIREBASE_PRIVATE_KEY: z.string().min(1).optional(),
});

export const env =
  process.env.SKIP_ENV_VALIDATION === "1"
    ? (process.env as unknown as z.infer<typeof schema>)
    : schema.parse(process.env);
