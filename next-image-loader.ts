/**
 * Loader custom do next/image (ver next.config.ts, images.loaderFile).
 * Pra URLs do Cloudinary, injeta a transformação de entrega
 * (f_auto,q_<q>,c_limit,w_<width>) logo após /upload/, delegando resize e
 * negociação de formato ao Cloudinary em vez do otimizador embutido do
 * Next. Qualquer outra URL (paths locais do mock/dev) passa sem alteração —
 * mesmo padrão do lp-jhuli-souza.
 *
 * c_limit é essencial: o next/image sempre inclui os breakpoints maiores
 * do deviceSizes (ex.: 3840) no srcSet, mesmo quando a foto original é
 * bem menor. Sem c_limit, um w_ maior que o original faz o Cloudinary
 * fazer upscale mantendo proporção — numa foto em retrato estreita isso
 * facilmente ultrapassa o limite de 25 megapixels do plano (erro 400,
 * imagem quebrada no navegador). c_limit nunca amplia além do tamanho
 * original, só limita o teto do que é pedido.
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
  const transform = `f_auto,q_${quality ?? "auto"},c_limit,w_${width}`;
  return src.replace("/upload/", `/upload/${transform}/`);
}
