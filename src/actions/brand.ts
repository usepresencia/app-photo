export interface Brand {
  name: string;
  tagline: string;
  city: string;
  whatsapp: string;
  instagram: string;
}

const BRAND: Brand = {
  name: "Denise Galvão",
  tagline: "Fotografia & Marketing",
  city: "Estúdio & externo — São Paulo, SP",
  whatsapp: "https://wa.me/5511999999999", // TODO: substituir pelo número real da cliente
  instagram: "https://instagram.com", // TODO: substituir pelo perfil real da cliente
};

export async function getBrand(): Promise<Brand> {
  return BRAND;
}
