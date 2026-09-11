import type { MetadataRoute } from "next";
import { getNiches } from "@/actions/niches";
import { SITE_URL } from "@/lib/config/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const niches = await getNiches();
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    ...niches.map((n) => ({
      url: `${SITE_URL}/ensaios/${n.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
