export interface Niche {
  slug: string;
  title: string;
  subtitle: string;
  intro: string;
  description: string[];
  highlights: string[];
  closingLine: string;
  /** Substitui a antiga entidade EventFormat — ver spec, seção "Achado". */
  showAsEventTeaser: boolean;
  /** Ordem em Niches.tsx (todos os nichos). */
  order: number;
  /** Ordem em Events.tsx (só os com showAsEventTeaser); null nos demais. */
  eventOrder: number | null;
}
