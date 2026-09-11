export interface Niche {
  slug: string;
  title: string;
  subtitle: string;
  intro: string;
  description: string[];
  highlights: string[];
  closingLine: string;
  /** Marca os nichos que também aparecem como "formato de evento" na
   * seção de Eventos da home, além de na listagem completa de nichos. */
  showAsEventTeaser: boolean;
  /** Ordem em Niches.tsx (todos os nichos). */
  order: number;
  /** Ordem em Events.tsx (só os com showAsEventTeaser); null nos demais. */
  eventOrder: number | null;
}
