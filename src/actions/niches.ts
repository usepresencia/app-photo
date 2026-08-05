import photosByCategory from "./_mock/photos.json";
import type { Photo } from "./_mock/types";

export interface Niche {
  slug: string;
  title: string;
  subtitle: string;
  image: Photo;
  intro: string;
  description: string[];
  highlights: string[];
  gallery: Photo[];
}

const photos = photosByCategory as Record<string, Photo[]>;

function nichePhotos(...categories: string[]): Photo[] {
  return categories.flatMap((c) => photos[c] ?? []);
}

const NICHES: Niche[] = [
  {
    slug: "retratos-profissionais",
    title: "Retratos Profissionais",
    subtitle: "Retratos para marca e carreira",
    image: nichePhotos("profissional")[0],
    intro:
      "Retratos que funcionam no LinkedIn, no site e no material da sua marca — com direção de pose e luz de estúdio controlada.",
    description: [
      "Começamos com uma conversa rápida sobre onde as imagens serão usadas: perfil, site institucional, imprensa ou redes sociais. A partir daí eu monto a luz e a direção certa para o seu rosto.",
      "Durante o ensaio eu conduzo pose por pose — você não precisa saber posar. O resultado é um material sóbrio, atual e coerente com a sua profissão.",
    ],
    highlights: ["Estúdio com luz contínua", "Direção de pose completa", "Fundo neutro ou preto"],
    gallery: nichePhotos("profissional", "corporativo", "pessoal"),
  },
  {
    slug: "making-of-da-noiva",
    title: "Making-of da Noiva",
    subtitle: "Preparação antes do grande dia",
    image: nichePhotos("making-of-noiva")[0],
    intro: "", // aguarda doc da cliente
    description: [],
    highlights: [],
    gallery: nichePhotos("making-of-noiva"),
  },
  {
    slug: "aniversario-e-eventos",
    title: "Aniversário e Eventos",
    subtitle: "Festa, detalhes e convidados",
    image: nichePhotos("evento-aniversario")[0],
    intro:
      "Cobertura da festa do começo ao fim: decoração antes dos convidados, o momento do parabéns e os retratos espontâneos.",
    description: [
      "Chego antes para registrar a decoração ainda intacta e acompanho a festa em fotojornalismo, sem interromper o que está acontecendo.",
      "Faço também retratos rápidos com a família e os convidados principais, sempre respeitando o ritmo do evento.",
    ],
    highlights: ["Registro da decoração", "Cobertura documental", "Retratos com convidados"],
    gallery: nichePhotos("evento-aniversario"),
  },
  {
    slug: "casamento-civil",
    title: "Casamento Civil",
    subtitle: "Pré-wedding / pós-cerimônia",
    image: nichePhotos("casamento-civil")[0],
    intro: "", // aguarda doc da cliente
    description: [],
    highlights: [],
    gallery: nichePhotos("casamento-civil"),
  },
  {
    slug: "comercial",
    title: "Comercial",
    subtitle: "Produto e marca em foco",
    image: nichePhotos("comercial")[0],
    intro: "", // aguarda doc da cliente
    description: [],
    highlights: [],
    gallery: nichePhotos("comercial"),
  },
  {
    slug: "familia",
    title: "Família",
    subtitle: "Retratos de quem é seu",
    image: nichePhotos("familia")[0],
    intro:
      "Fotos de família sem pose forçada: brincadeira, colo e as manias de cada um viram registro.",
    description: [
      "Trabalho com dinâmicas simples para as crianças se soltarem — caminhar, abraçar, contar segredo. As melhores imagens quase sempre aparecem entre uma pose e outra.",
      "Pode ser no estúdio ou em uma locação externa (parque, casa, praia). Famílias com pets são muito bem-vindas.",
    ],
    highlights: ["Estúdio ou locação externa", "Dinâmicas para crianças", "Pets bem-vindos"],
    gallery: nichePhotos("familia"),
  },
  {
    slug: "gestante",
    title: "Gestante",
    subtitle: "Ensaio de espera",
    image: nichePhotos("gestante")[0],
    intro:
      "Um ensaio calmo para registrar a barriga, o companheiro e a expectativa — no estúdio ou em uma locação com luz natural.",
    description: [
      "O ideal é fotografar entre a 30ª e a 36ª semana, quando a barriga já está evidente e o corpo ainda responde bem ao ritmo do ensaio. Fazemos pausas sempre que preciso.",
      "Você pode trazer companheiro, filhos mais velhos e peças afetivas. A estética segue monocromática, com foco em pele, mãos e silhueta.",
    ],
    highlights: [
      "Ritmo tranquilo com pausas",
      "Acompanhante e filhos inclusos",
      "Tecidos e véus do estúdio",
    ],
    gallery: nichePhotos("gestante"),
  },
];

export async function getNiches(): Promise<Niche[]> {
  return NICHES;
}

export async function getNicheBySlug(slug: string): Promise<Niche | null> {
  return NICHES.find((n) => n.slug === slug) ?? null;
}
