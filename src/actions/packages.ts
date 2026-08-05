export interface Package {
  name: string;
  price: string;
  items: string[];
  featured?: boolean;
}

const PACKAGES: Package[] = [
  {
    name: "Pacote Básico",
    price: "R$ 390",
    items: ["30 minutos de ensaio", "1 troca de look", "10 fotos tratadas", "Entrega em 7 dias"],
  },
  {
    name: "Pacote Essencial",
    price: "R$ 690",
    items: [
      "1 hora de ensaio",
      "2 trocas de look",
      "25 fotos tratadas",
      "Estúdio ou locação externa",
    ],
    featured: true,
  },
  {
    name: "Pacote Completo",
    price: "R$ 1.190",
    items: [
      "2 horas de ensaio",
      "Trocas de look ilimitadas",
      "60 fotos tratadas",
      "Making of em vídeo",
      "Álbum digital",
    ],
  },
];

export async function getPackages(): Promise<Package[]> {
  return PACKAGES;
}
