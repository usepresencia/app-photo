import { NextResponse } from "next/server";
import { env } from "@/lib/config/env.server";
import { DRAFT_COOKIE_NAME } from "@/api/infrastructure/repositories/draftMode";
import { SITE_URL } from "@/lib/config/site";

// Único lugar que ativa o modo rascunho — valida o segredo já
// compartilhado com o webhook de revalidação (REVALIDATE_SECRET), não
// introduz um segredo novo. A partir daqui, toda navegação dentro do
// mesmo iframe (mesma origem) carrega o cookie automaticamente.
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const next = url.searchParams.get("next") ?? "/";

  if (!env.REVALIDATE_SECRET || token !== env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  // Em produção, por trás do Traefik/Docker standalone, a origem de
  // request.url às vezes resolve pro bind interno do container
  // (0.0.0.0:PORT) em vez do domínio público — quebra o redirect (e por
  // tabela o iframe do preview, que depende dele). SITE_URL é a origem
  // real conhecida, sem depender de cabeçalho de proxy nenhum. Em dev/test
  // (sem proxy na frente), request.url já reflete localhost corretamente
  // — trocar por SITE_URL ali quebraria o preview local.
  const origin = env.NODE_ENV === "production" ? SITE_URL : request.url;
  const response = NextResponse.redirect(new URL(next, origin));
  response.cookies.set(DRAFT_COOKIE_NAME, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return response;
}
