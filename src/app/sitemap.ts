import type { MetadataRoute } from "next";
import { getNiches } from "@/actions/niches";

const BASE_URL = "https://denisegalvao.com.br"; // TODO: substituir pelo domínio real

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const niches = await getNiches();
  return [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
    ...niches.map((n) => ({
      url: `${BASE_URL}/ensaios/${n.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
