export interface Package {
  id: string;
  nicheSlug: string;
  name: string;
  price: string;
  description: string;
  items: string[];
  featured: boolean;
  order: number;
}
