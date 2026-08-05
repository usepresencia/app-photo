export function buildWhatsappLink(baseUrl: string, message: string): string {
  return `${baseUrl}?text=${encodeURIComponent(message)}`;
}
