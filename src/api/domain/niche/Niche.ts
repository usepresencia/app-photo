export interface Niche {
  slug: string;
  title: string;
  subtitle: string;
  intro: string;
  description: string[];
  highlights: string[];
  closingLine: string;
  /** Move o nicho para a seção de Eventos da home: marcado, aparece como
   * "formato de evento" ali e sai do carrossel de ensaios — as duas
   * listas são exclusivas. Continua tendo página própria em
   * /ensaios/[slug] nos dois casos. */
  showAsEventTeaser: boolean;
  /** Ordem no carrossel de ensaios (só os sem showAsEventTeaser). */
  order: number;
  /** Ordem em Events.tsx (só os com showAsEventTeaser); null nos demais. */
  eventOrder: number | null;
}
