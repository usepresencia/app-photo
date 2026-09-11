/**
 * Loader custom do next/image (ver next.config.ts, images.loaderFile).
 * Pra URLs do Cloudinary, injeta a transformação de entrega
 * (f_auto,q_<q>,w_<width>) logo após /upload/, delegando resize e
 * negociação de formato ao Cloudinary em vez do otimizador embutido do
 * Next. Qualquer outra URL (paths locais do mock/dev) passa sem alteração —
 * mesmo padrão do lp-jhuli-souza.
 */
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (!src.includes("res.cloudinary.com") || !src.includes("/upload/")) {
    return src;
  }
  const transform = `f_auto,q_${quality ?? "auto"},w_${width}`;
  return src.replace("/upload/", `/upload/${transform}/`);
}
