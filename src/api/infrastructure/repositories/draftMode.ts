// Nome do cookie que ativa o modo rascunho — setado só pela rota
// /api/preview/enter (ver route.ts), nunca por um visitante real. Ver
// admin-photo/docs/superpowers/specs/2026-09-09-rascunho-publicar-design.md.
export const DRAFT_COOKIE_NAME = "preview_draft";

export function isDraftCookieValue(value: string | undefined): boolean {
  return value === "1";
}
