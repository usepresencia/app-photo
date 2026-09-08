export interface NicheDTO {
  slug: string;
  title: string;
  subtitle: string;
  intro: string;
  description: string[];
  highlights: string[];
  closingLine: string;
  showAsEventTeaser: boolean;
  order: number;
  eventOrder: number | null;
}
