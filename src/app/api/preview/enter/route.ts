import { NextResponse } from "next/server";
import { env } from "@/lib/config/env.server";
import { DRAFT_COOKIE_NAME } from "@/api/infrastructure/repositories/draftMode";

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

  const response = NextResponse.redirect(new URL(next, request.url));
  response.cookies.set(DRAFT_COOKIE_NAME, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return response;
}
