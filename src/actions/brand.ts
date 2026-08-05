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
  city: "Toledo, Paraná",
  whatsapp: "https://wa.me/5545991250446",
  instagram: "https://instagram.com/eu.defotografia",
};

export async function getBrand(): Promise<Brand> {
  return BRAND;
}
