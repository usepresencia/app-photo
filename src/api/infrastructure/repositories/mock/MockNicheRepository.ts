import type { Niche } from "@/api/domain/niche/Niche";
import type { NicheRepository } from "@/api/domain/niche/NicheRepository";

// Dado local (dev/test/CI sem Firebase) com os mesmos textos e ordem
// usados no seed real do Firestore.
const NICHES: Niche[] = [
  {
    slug: "retratos-profissionais",
    title: "Retratos Profissionais",
    subtitle: "Retratos para marca e carreira",
    intro:
      "Retratos que funcionam no LinkedIn, no site e no material da sua marca, com direção de pose e luz de estúdio controlada.",
    description: [
      "Começamos com uma conversa rápida sobre onde as imagens serão usadas: perfil, site institucional, imprensa ou redes sociais. A partir daí eu monto a luz e a direção certa para o seu rosto.",
      "Durante o ensaio eu conduzo pose por pose: você não precisa saber posar. O resultado é um material sóbrio, atual e coerente com a sua profissão.",
    ],
    highlights: ["Estúdio com luz contínua", "Direção de pose completa", "Fundo neutro ou preto"],
    closingLine: "Transforme sua imagem em uma ferramenta poderosa de comunicação e presença.",
    showAsEventTeaser: false,
    order: 0,
    eventOrder: null,
  },
  {
    slug: "making-of-da-noiva",
    title: "Making-of da Noiva",
    subtitle: "Preparação antes do grande dia",
    intro: "", // aguarda doc da cliente
    description: [],
    highlights: [],
    closingLine: "", // aguarda doc da cliente
    showAsEventTeaser: true,
    order: 1,
    eventOrder: 2,
  },
  {
    slug: "aniversario-e-eventos",
    title: "Aniversário e Eventos",
    subtitle: "Festa, detalhes e convidados",
    intro:
      "Cobertura da festa do começo ao fim: decoração antes dos convidados, o momento do parabéns e os retratos espontâneos.",
    description: [
      "Chego antes para registrar a decoração ainda intacta e acompanho a festa em fotojornalismo, sem interromper o que está acontecendo.",
      "Faço também retratos rápidos com a família e os convidados principais, sempre respeitando o ritmo do evento.",
    ],
    highlights: ["Registro da decoração", "Cobertura documental", "Retratos com convidados"],
    closingLine:
      "Cada evento é único e merece ser lembrado com a mesma intensidade com que foi vivido.",
    showAsEventTeaser: true,
    order: 2,
    eventOrder: 1,
  },
  {
    slug: "casamento-civil",
    title: "Casamento Civil",
    subtitle: "Pré-wedding / pós-cerimônia",
    intro:
      "Viva cada etapa do seu casamento com intensidade e significado, enquanto cada detalhe é registrado com sensibilidade, elegância e direção profissional. Do pré-wedding ao grande “sim”, criamos memórias que contam a sua história de forma autêntica e atemporal.",
    description: [
      "Cada momento é conduzido com orientação completa, captando emoções reais, conexões e a essência do casal, com um olhar atento aos detalhes que tornam esse dia único.",
      "A cobertura da cerimônia civil é feita no Cartório de Toledo; consulte valores de deslocamento para locais fora da região.",
    ],
    highlights: [
      "Pré-wedding em local escolhido pelo casal",
      "Cobertura completa da cerimônia civil",
      "Adicional Storymaker em vídeo",
    ],
    closingLine:
      "Mais do que fotografias, entregamos lembranças que contam a sua história com emoção, beleza e verdade.",
    showAsEventTeaser: true,
    order: 3,
    eventOrder: 0,
  },
  {
    slug: "comercial",
    title: "Comercial",
    subtitle: "Produto e marca em foco",
    intro:
      "Fortaleça a imagem da sua marca com fotografias estratégicas, pensadas para transmitir profissionalismo, identidade e conexão com o seu público. Cada ensaio é conduzido com olhar técnico e direcionamento criativo, alinhado aos objetivos do seu negócio.",
    description: [
      "As sessões são planejadas de acordo com o posicionamento da marca, com orientação completa de poses, enquadramentos e estética visual, garantindo imagens que valorizam seus produtos, equipe e presença no mercado.",
      "Os ensaios podem contar com modelos indicados pela empresa ou sugeridos pela fotógrafa. Empresas que buscam constância têm condições especiais para planos mensais, e o segmento corporativo conta com descontos exclusivos para contratos integrados com marketing.",
    ],
    highlights: [
      "Produção externa ou no local do cliente",
      "Modelos da empresa ou indicados pela fotógrafa",
      "Descontos para planos mensais e contratos integrados",
    ],
    closingLine: "Invista em uma imagem que comunica, posiciona e gera valor para o seu negócio.",
    showAsEventTeaser: false,
    order: 4,
    eventOrder: null,
  },
  {
    slug: "familia",
    title: "Família",
    subtitle: "Retratos de quem é seu",
    intro:
      "Fotos de família sem pose forçada: brincadeira, colo e as manias de cada um viram registro.",
    description: [
      "Trabalho com dinâmicas simples para as crianças se soltarem: caminhar, abraçar, contar segredo. As melhores imagens quase sempre aparecem entre uma pose e outra.",
      "Pode ser no estúdio ou em uma locação externa (parque, casa, praia). Famílias com pets são muito bem-vindas.",
    ],
    highlights: ["Estúdio ou locação externa", "Dinâmicas para crianças", "Pets bem-vindos"],
    closingLine: "Mais do que fotos, entregamos memórias cheias de afeto, conexão e significado.",
    showAsEventTeaser: false,
    order: 5,
    eventOrder: null,
  },
  {
    slug: "gestante",
    title: "Gestante",
    subtitle: "Ensaio de espera",
    intro:
      "Um ensaio calmo para registrar a barriga, o companheiro e a expectativa, no estúdio ou em uma locação com luz natural.",
    description: [
      "O ideal é fotografar entre a 30ª e a 36ª semana, quando a barriga já está evidente e o corpo ainda responde bem ao ritmo do ensaio. Fazemos pausas sempre que preciso.",
      "Você pode trazer companheiro, filhos mais velhos e peças afetivas. A estética segue monocromática, com foco em pele, mãos e silhueta.",
    ],
    highlights: [
      "Ritmo tranquilo com pausas",
      "Acompanhante e filhos inclusos",
      "Tecidos e véus do estúdio",
    ],
    closingLine: "Mais do que fotos, entregamos memórias cheias de afeto, conexão e significado.",
    showAsEventTeaser: false,
    order: 6,
    eventOrder: null,
  },
];

export class MockNicheRepository implements NicheRepository {
  async findAll(): Promise<Niche[]> {
    return [...NICHES].sort((a, b) => a.order - b.order);
  }

  async findBySlug(slug: string): Promise<Niche | null> {
    return NICHES.find((n) => n.slug === slug) ?? null;
  }
}
