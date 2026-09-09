// Os 7 slugs reais de nicho (mesmos de MockNicheRepository.NICHES) — usado
// por MockPhotoRepository e MockPlacementRepository pra gerar cobertura
// sintética completa: Niches.tsx (a home inteira) renderiza niche.image.src
// pros 7 cards, faltando qualquer um a página quebra em runtime com o mock.
export const MOCK_NICHE_SLUGS = [
  "retratos-profissionais",
  "gestante",
  "familia",
  "comercial",
  "casamento-civil",
  "aniversario-e-eventos",
  "making-of-da-noiva",
] as const;
