export interface Package {
  name: string;
  price: string;
  items: string[];
  featured?: boolean;
}

// Fonte: "Ensaios Fotográficos - VALORES.pdf" (documento real da cliente).
const PACKAGES_BY_NICHE: Record<string, Package[]> = {
  "retratos-profissionais": [
    {
      name: "Pacote Básico",
      price: "R$ 280",
      items: [
        "1 hora de sessão",
        "Até 2 trocas de look",
        "10 fotos editadas em alta qualidade (formato digital)",
        "Direção e posicionamento durante toda a sessão",
      ],
    },
    {
      name: "Pacote Essencial",
      price: "R$ 500",
      items: [
        "Até 2 horas de sessão",
        "Até 3 trocas de look",
        "20 fotos editadas em alta qualidade (formato digital)",
        "Direção e posicionamento completos",
      ],
      featured: true,
    },
  ],
  gestante: [
    {
      name: "Pacote Básico",
      price: "R$ 280",
      items: [
        "1 hora de sessão",
        "Até 3 trocas de look",
        "10 fotos editadas em alta qualidade (formato digital)",
        "Direção e posicionamento durante toda a sessão",
        "Acesso a looks disponíveis (vestidos para gestante)",
      ],
    },
    {
      name: "Pacote Essencial",
      price: "R$ 500",
      items: [
        "2 horas de sessão",
        "Até 3 ou 4 trocas de look",
        "20 fotos editadas em alta qualidade (formato digital)",
        "Direção e posicionamento completos",
        "Acesso a looks disponíveis (vestidos para gestante)",
      ],
      featured: true,
    },
  ],
  familia: [
    {
      name: "Pacote Básico",
      price: "R$ 280",
      items: [
        "1 hora de sessão",
        "Até 3 trocas de look",
        "10 fotos editadas em alta qualidade (formato digital)",
        "Direção e posicionamento durante toda a sessão",
      ],
    },
    {
      name: "Pacote Essencial",
      price: "R$ 500",
      items: [
        "2 horas de sessão",
        "Até 3 ou 4 trocas de look",
        "20 fotos editadas em alta qualidade (formato digital)",
        "Direção e posicionamento completos",
      ],
      featured: true,
    },
  ],
  comercial: [
    {
      name: "Comercial",
      price: "R$ 350",
      items: [
        "Até 1 hora e 30 minutos de sessão",
        "De 5 a 10 trocas de looks/produtos",
        "50 a 80 fotos editadas (correção de luz e cor) em alta qualidade",
        "Produção em ambiente externo ou no local do cliente",
        "Entrega rápida: até 3 dias úteis",
      ],
    },
    {
      name: "Corporativo",
      price: "R$ 450",
      items: [
        "1 hora e 30 minutos de sessão",
        "Até 3 ou 4 trocas de look",
        "20 fotos editadas com tratamento profissional",
        "Realização no ambiente da empresa ou em estúdio",
        "Indicado para equipes de 5 a 10 pessoas",
      ],
      featured: true,
    },
  ],
  "casamento-civil": [
    {
      name: "Pré Wedding",
      price: "R$ 450",
      items: [
        "Sessão externa em local escolhido pelo casal",
        "Até 2 horas de duração",
        "30 fotos editadas em alta qualidade (formato digital)",
        "5 fotos reveladas",
      ],
    },
    {
      name: "Cerimônia Civil + Pós-Cerimônia",
      price: "R$ 500",
      items: [
        "Cobertura integral da cerimônia no cartório",
        "Fotos do casal e familiares",
        "+ 20 fotos editadas somente do casal (pós-cerimônia)",
        "Todas as fotos entregues com edição (formato digital – pendrive)",
      ],
      featured: true,
    },
    {
      name: "Pacote Completo",
      price: "R$ 1.500",
      items: [
        "Pré wedding + Cerimônia Civil + Pós-cerimônia do casal",
        "Storymaker: vídeos curtos + 1 vídeo editado completo",
        "Todas as fotos entregues com edição (formato digital – pendrive)",
        "20 fotos reveladas + caixa personalizada",
        "Brinde especial",
      ],
    },
  ],
  "aniversario-e-eventos": [
    {
      name: "Eventos e Aniversário Infantil",
      price: "R$ 500",
      items: [
        "Cobertura de até 2 horas no local",
        "Todas as fotos entregues com edição (formato digital)",
        "Registros de detalhes, aniversariante, convidados, parabéns e família",
        "Entrega de prévias no mesmo dia",
        "Entrega completa em até 5 dias úteis",
      ],
      featured: true,
    },
    {
      name: "Adicional Storymaker",
      price: "R$ 250",
      items: ["1 vídeo completo editado", "Entrega dos takes originais sem edição"],
    },
    {
      name: "Eventos Maiores (Casamentos e Debutantes)",
      price: "Sob consulta",
      items: [
        "Orçamento personalizado conforme a celebração",
        "Necessário preenchimento de formulário para proposta detalhada",
        "Acima de 30 convidados: cobertura com 2 fotógrafas",
      ],
    },
  ],
  "making-of-da-noiva": [], // aguarda doc da cliente
};

export async function getPackagesForNiche(slug: string): Promise<Package[]> {
  return PACKAGES_BY_NICHE[slug] ?? [];
}
