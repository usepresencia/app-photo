import { revalidateTag } from "next/cache";
import { env } from "@/lib/config/env.server";

export async function POST(request: Request): Promise<Response> {
  const auth = request.headers.get("Authorization");
  if (!env.REVALIDATE_SECRET || auth !== `Bearer ${env.REVALIDATE_SECRET}`) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { tag?: string } | null;
  if (!body?.tag) {
    return Response.json({ error: "MISSING_TAG" }, { status: 400 });
  }

  // Next 16 exige um perfil de cacheLife como segundo argumento — precisa
  // ser o MESMO perfil que a leitura pública declarou ao cachear (via
  // "use cache" + cacheLife(perfil)). Nenhuma leitura declara tag/perfil
  // ainda (ver Nota de escopo abaixo) — "max" é o placeholder até os
  // planos 7-10 decidirem o perfil real de cada superfície.
  revalidateTag(body.tag, "max");
  return Response.json({ revalidated: true, tag: body.tag });
}
