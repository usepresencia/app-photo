export const BRAND = {
  name: "Denise Galvão",
  tagline: "Fotografia",
  city: "Estúdio & externo — São Paulo, SP",
  whatsapp: "https://wa.me/5511999999999",
  instagram: "https://instagram.com",
};

const u = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;

export const heroStrips = [
  [
    u("photo-1519741497674-611481863552", 400),
    u("photo-1492725764893-90b379c2b6e7", 400),
    u("photo-1529636798458-92182e662485", 400),
    u("photo-1521341057461-6eb5f40b07ab", 400),
  ],
  [
    u("photo-1511285560929-80b456fea0bc", 400),
    u("photo-1534528741775-53994a69daeb", 400),
    u("photo-1554080353-a576cf803bda", 400),
    u("photo-1516726817505-f5ed825624d8", 400),
  ],
  [
    u("photo-1524863479829-916d8e77f114", 400),
    u("photo-1606216794074-735e91aa2c92", 400),
    u("photo-1530103862676-de8c9debad1d", 400),
    u("photo-1503454537195-1dcabb73ffb9", 400),
  ],
];

export const aboutFamily = [
  u("photo-1476234251651-f353703a034d", 500),
  u("photo-1511895426328-dc8714191300", 500),
  u("photo-1609220136736-443140cffec6", 500),
];

export const aboutWork = [
  u("photo-1554048612-b6a482bc67e5", 500),
  u("photo-1452587925148-ce544e77e70d", 500),
  u("photo-1516035069371-29a1b244cc32", 500),
];

export const gallery = [
  u("photo-1519741497674-611481863552"),
  u("photo-1529636798458-92182e662485"),
  u("photo-1492725764893-90b379c2b6e7"),
  u("photo-1511285560929-80b456fea0bc"),
  u("photo-1534528741775-53994a69daeb"),
  u("photo-1554080353-a576cf803bda"),
  u("photo-1524863479829-916d8e77f114"),
  u("photo-1606216794074-735e91aa2c92"),
  u("photo-1530103862676-de8c9debad1d"),
  u("photo-1503454537195-1dcabb73ffb9"),
  u("photo-1521341057461-6eb5f40b07ab"),
  u("photo-1516726817505-f5ed825624d8"),
  u("photo-1476234251651-f353703a034d"),
  u("photo-1511895426328-dc8714191300"),
  u("photo-1519225421980-715cb0215aed"),
  u("photo-1465495976277-4387d4b0b4c6"),
  u("photo-1519227355453-8f982e425321"),
  u("photo-1522673607200-164d1b6ce486"),
];

export const niches = [
  {
    slug: "pessoal-profissional",
    title: "Pessoal / Profissional",
    subtitle: "Retratos para marca e carreira",
    image: u("photo-1573497019940-1c28c88b4f3e", 500),
    intro:
      "Retratos que funcionam no LinkedIn, no site e no material da sua marca — com direção de pose e luz de estúdio controlada.",
    description: [
      "Começamos com uma conversa rápida sobre onde as imagens serão usadas: perfil, site institucional, imprensa ou redes sociais. A partir daí eu monto a luz e a direção certa para o seu rosto.",
      "Durante o ensaio eu conduzo pose por pose — você não precisa saber posar. O resultado é um material sóbrio, atual e coerente com a sua profissão.",
    ],
    highlights: ["Estúdio com luz contínua", "Direção de pose completa", "Fundo neutro ou preto"],
    gallery: [
      u("photo-1573497019940-1c28c88b4f3e", 700),
      u("photo-1519345182560-3f2917c472ef", 700),
      u("photo-1500648767791-00dcc994a43e", 700),
      u("photo-1521341057461-6eb5f40b07ab", 700),
    ],
  },
  {
    slug: "gestante",
    title: "Gestante",
    subtitle: "Ensaio de espera",
    image: u("photo-1555252333-9f8e92e65df9", 500),
    intro:
      "Um ensaio calmo para registrar a barriga, o companheiro e a expectativa — no estúdio ou em uma locação com luz natural.",
    description: [
      "O ideal é fotografar entre a 30ª e a 36ª semana, quando a barriga já está evidente e o corpo ainda responde bem ao ritmo do ensaio. Fazemos pausas sempre que preciso.",
      "Você pode trazer companheiro, filhos mais velhos e peças afetivas. A estética segue monocromática, com foco em pele, mãos e silhueta.",
    ],
    highlights: ["Ritmo tranquilo com pausas", "Acompanhante e filhos inclusos", "Tecidos e véus do estúdio"],
    gallery: [
      u("photo-1555252333-9f8e92e65df9", 700),
      u("photo-1519689680058-324335c77eba", 700),
      u("photo-1476234251651-f353703a034d", 700),
      u("photo-1511895426328-dc8714191300", 700),
    ],
  },
  {
    slug: "familia",
    title: "Família",
    subtitle: "Retratos de quem é seu",
    image: u("photo-1476234251651-f353703a034d", 500),
    intro:
      "Fotos de família sem pose forçada: brincadeira, colo e as manias de cada um viram registro.",
    description: [
      "Trabalho com dinâmicas simples para as crianças se soltarem — caminhar, abraçar, contar segredo. As melhores imagens quase sempre aparecem entre uma pose e outra.",
      "Pode ser no estúdio ou em uma locação externa (parque, casa, praia). Famílias com pets são muito bem-vindas.",
    ],
    highlights: ["Estúdio ou locação externa", "Dinâmicas para crianças", "Pets bem-vindos"],
    gallery: [
      u("photo-1476234251651-f353703a034d", 700),
      u("photo-1511895426328-dc8714191300", 700),
      u("photo-1609220136736-443140cffec6", 700),
      u("photo-1529636798458-92182e662485", 700),
    ],
  },
  {
    slug: "aniversario",
    title: "Aniversário",
    subtitle: "Festa, detalhes e convidados",
    image: u("photo-1464349095431-e9a21285b5f3", 500),
    intro:
      "Cobertura da festa do começo ao fim: decoração antes dos convidados, o momento do parabéns e os retratos espontâneos.",
    description: [
      "Chego antes para registrar a decoração ainda intacta e acompanho a festa em fotojornalismo, sem interromper o que está acontecendo.",
      "Faço também retratos rápidos com a família e os convidados principais, sempre respeitando o ritmo do evento.",
    ],
    highlights: ["Registro da decoração", "Cobertura documental", "Retratos com convidados"],
    gallery: [
      u("photo-1464349095431-e9a21285b5f3", 700),
      u("photo-1470229722913-7ea0d1e6dfc0", 700),
      u("photo-1519225421980-715cb0215aed", 700),
      u("photo-1522673607200-164d1b6ce486", 700),
    ],
  },
];


export const packages = [
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

export const events = [
  {
    title: "Casamento civil",
    subtitle: "Pré-wedding / pós-cerimônia",
    image: u("photo-1519741497674-611481863552", 700),
  },
  {
    title: "Aniversário infantil",
    subtitle: "Festa, detalhes e convidados",
    image: u("photo-1464349095431-e9a21285b5f3", 700),
  },
  {
    title: "Festa",
    subtitle: "Casamento / Debutante",
    image: u("photo-1470229722913-7ea0d1e6dfc0", 700),
  },
];

export const testimonials = [
  {
    name: "Marina R.",
    text: "A Denise deixou todo mundo à vontade. As fotos da família ficaram naturais, sem pose forçada.",
  },
  {
    name: "Carlos e Bia",
    text: "Fotografou nosso casamento civil e o pré-wedding. Entregou antes do prazo e cada foto conta uma história.",
  },
  {
    name: "Luiza M.",
    text: "Precisava de retratos profissionais para o LinkedIn e saí com um material que uso até hoje.",
  },
];
