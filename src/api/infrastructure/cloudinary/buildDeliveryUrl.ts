// URL base, sem transformação — next-image-loader.ts injeta
// f_auto,q_auto,w_<width> por request. Sem version (v123/) nem extensão
// explícita: o Cloudinary aceita a URL "nua" com f_auto e resolve o
// formato mais recente do asset sozinho.
export function buildDeliveryUrl(publicId: string, cloudName: string): string {
  return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
}
