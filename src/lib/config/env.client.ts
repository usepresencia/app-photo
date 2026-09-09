import { z } from "zod";

const schema = z.object({
  // URL pública do admin-photo — única origem que PreviewOverlay confia
  // pra ativar o modo de edição (ver PreviewOverlay.tsx). Opcional: sem
  // ela, o site funciona normal pra qualquer visitante — só o preview do
  // admin não teria como se conectar (ver spec do preview com edição
  // inline, docs/superpowers/specs/2026-09-09-admin-preview-edicao-inline-design.md).
  NEXT_PUBLIC_ADMIN_PHOTO_URL: z.string().url().optional(),
});

export const clientEnv =
  process.env.SKIP_ENV_VALIDATION === "1"
    ? (process.env as unknown as z.infer<typeof schema>)
    : schema.parse({
        NEXT_PUBLIC_ADMIN_PHOTO_URL: process.env.NEXT_PUBLIC_ADMIN_PHOTO_URL,
      });
